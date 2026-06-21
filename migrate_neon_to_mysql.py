"""
migrate_neon_to_mysql.py

Copies every table (schema + data) from a Postgres database (e.g. Neon)
into a local MySQL database.

WHAT IT DOES
------------
1. Connects to Postgres, lists all tables in the given schema (default: public).
2. For each table, reads column definitions + primary key info.
3. Creates an equivalent table in MySQL (dropping it first if it already
   exists and DROP_EXISTING = True).
4. Copies all rows across in batches, converting:
     - JSON / JSONB        -> JSON string
     - boolean              -> 0 / 1
     - Postgres arrays      -> JSON array string
     - everything else      -> passed through as-is
5. Skips foreign key constraints entirely (so insert order never matters).
   If you need FKs, add them manually afterwards.

SETUP
-----
pip install psycopg2-binary pymysql --break-system-packages

Then edit the PG_CONFIG and MYSQL_CONFIG blocks below and run:

    python migrate_neon_to_mysql.py

NOTES
-----
- Get your Neon connection string from the Neon dashboard -> Connection Details.
  It looks like: postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
  You can either fill in PG_CONFIG fields individually, or just paste the
  whole string into PG_DSN below and leave PG_CONFIG as None.
- This is a one-way, one-time copy (Postgres -> MySQL). Re-running it with
  DROP_EXISTING=True will wipe and re-copy every table again, so it's safe
  to re-run whenever you want a fresh snapshot.
"""

import json
import sys
from decimal import Decimal

import psycopg2
import psycopg2.extras
import pymysql

# ─────────────────────────────────────────────────────────────────────────
# 1. CONFIGURE THIS SECTION
# ─────────────────────────────────────────────────────────────────────────

# Option A: paste your full Neon connection string here (easiest)
PG_DSN = "postgresql://neondb_owner:npg_pWG3oauCk4Nl@ep-aged-smoke-aop94i2u-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Option B: leave PG_DSN as None and fill this in instead
PG_CONFIG = None
# PG_CONFIG = {
#     "host": "ep-xxxxxxx.neon.tech",
#     "dbname": "dbname",
#     "user": "user",
#     "password": "password",
#     "port": 5432,
#     "sslmode": "require",
# }

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "help",
    "database": "gismarketplace",  # must already exist: CREATE DATABASE gismarketplace;
    "port": 3306,
}

PG_SCHEMA = "public"
DROP_EXISTING = True   # drop + recreate MySQL tables if they already exist
BATCH_SIZE = 500        # rows inserted per batch
TABLES_TO_SKIP = []     # e.g. ["some_huge_log_table"]

# ─────────────────────────────────────────────────────────────────────────
# 2. TYPE MAPPING (Postgres -> MySQL)
# ─────────────────────────────────────────────────────────────────────────

def pg_type_to_mysql(data_type: str, char_len, num_precision, num_scale) -> str:
    data_type = data_type.lower()

    if data_type in ("integer",):
        return "INT"
    if data_type in ("bigint",):
        return "BIGINT"
    if data_type in ("smallint",):
        return "SMALLINT"
    if data_type in ("boolean",):
        return "TINYINT(1)"
    if data_type in ("character varying", "varchar"):
        return f"VARCHAR({char_len})" if char_len else "VARCHAR(255)"
    if data_type in ("character", "char"):
        return f"CHAR({char_len})" if char_len else "CHAR(1)"
    if data_type in ("text",):
        return "TEXT"
    if data_type in ("uuid",):
        return "CHAR(36)"
    if data_type in ("timestamp without time zone", "timestamp with time zone", "timestamp"):
        return "DATETIME"
    if data_type in ("date",):
        return "DATE"
    if data_type in ("time without time zone", "time with time zone", "time"):
        return "TIME"
    if data_type in ("numeric", "decimal"):
        if num_precision and num_scale is not None:
            return f"DECIMAL({num_precision},{num_scale})"
        return "DECIMAL(20,4)"
    if data_type in ("double precision", "real"):
        return "DOUBLE"
    if data_type in ("json", "jsonb"):
        return "JSON"
    if data_type in ("array",):
        return "JSON"  # store Postgres arrays as JSON arrays in MySQL
    # fallback - safe default
    return "TEXT"


def convert_value(value):
    """Convert a single Postgres value into something pymysql can insert."""
    if value is None:
        return None
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    if isinstance(value, Decimal):
        return value
    # psycopg2 may return memoryview for bytea - convert to bytes
    if isinstance(value, memoryview):
        return bytes(value)
    return value


# ─────────────────────────────────────────────────────────────────────────
# 3. MIGRATION LOGIC
# ─────────────────────────────────────────────────────────────────────────

def get_pg_connection():
    if PG_CONFIG:
        return psycopg2.connect(**PG_CONFIG)
    return psycopg2.connect(PG_DSN)


def get_mysql_connection():
    return pymysql.connect(**MYSQL_CONFIG, charset="utf8mb4")


def list_tables(pg_cur):
    pg_cur.execute(
        """
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = %s AND table_type = 'BASE TABLE'
        ORDER BY table_name;
        """,
        (PG_SCHEMA,),
    )
    return [row[0] for row in pg_cur.fetchall()]


def get_columns(pg_cur, table_name):
    pg_cur.execute(
        """
        SELECT column_name, data_type, character_maximum_length,
               numeric_precision, numeric_scale, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ordinal_position;
        """,
        (PG_SCHEMA, table_name),
    )
    return pg_cur.fetchall()


def get_primary_key(pg_cur, table_name):
    pg_cur.execute(
        """
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = %s::regclass AND i.indisprimary;
        """,
        (f'{PG_SCHEMA}."{table_name}"',),
    )
    return [row[0] for row in pg_cur.fetchall()]


def build_create_table_sql(table_name, columns, primary_keys):
    col_defs = []
    for (col_name, data_type, char_len, num_prec, num_scale, is_nullable, col_default) in columns:
        mysql_type = pg_type_to_mysql(data_type, char_len, num_prec, num_scale)
        nullable = "NULL" if is_nullable == "YES" and col_name not in primary_keys else "NOT NULL"

        auto_increment = ""
        if col_default and "nextval" in str(col_default) and mysql_type in ("INT", "BIGINT", "SMALLINT"):
            auto_increment = " AUTO_INCREMENT"

        col_defs.append(f"`{col_name}` {mysql_type} {nullable}{auto_increment}")

    if primary_keys:
        pk_cols = ", ".join(f"`{c}`" for c in primary_keys)
        col_defs.append(f"PRIMARY KEY ({pk_cols})")

    cols_sql = ",\n  ".join(col_defs)
    return f"CREATE TABLE `{table_name}` (\n  {cols_sql}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"


def migrate_table(pg_conn, mysql_conn, table_name):
    pg_cur = pg_conn.cursor()
    columns = get_columns(pg_cur, table_name)
    if not columns:
        print(f"  ⚠ no columns found for {table_name}, skipping")
        return

    col_names = [c[0] for c in columns]
    primary_keys = get_primary_key(pg_cur, table_name)

    mysql_cur = mysql_conn.cursor()

    create_sql = build_create_table_sql(table_name, columns, primary_keys)
    mysql_cur.execute(create_sql)
    mysql_conn.commit()
    print(f"  ✓ created table `{table_name}`")

    # Stream rows from Postgres using a named (server-side) cursor to avoid
    # loading huge tables fully into memory.
    read_cur = pg_conn.cursor(name=f"stream_{table_name}", cursor_factory=psycopg2.extras.RealDictCursor)
    read_cur.execute(f'SELECT * FROM "{PG_SCHEMA}"."{table_name}";')

    placeholders = ", ".join(["%s"] * len(col_names))
    col_list_sql = ", ".join(f"`{c}`" for c in col_names)
    insert_sql = f"INSERT INTO `{table_name}` ({col_list_sql}) VALUES ({placeholders});"

    total_rows = 0
    while True:
        rows = read_cur.fetchmany(BATCH_SIZE)
        if not rows:
            break
        batch = [tuple(convert_value(row[c]) for c in col_names) for row in rows]
        mysql_cur.executemany(insert_sql, batch)
        mysql_conn.commit()
        total_rows += len(batch)

    read_cur.close()
    print(f"  ✓ copied {total_rows} row(s) into `{table_name}`")


def drop_all_tables(mysql_conn, table_names):
    """Drop every target table first, in one pass.

    This must happen BEFORE any table is recreated - otherwise a table that
    hasn't been dropped yet may still hold a foreign key pointing at a table
    we're about to rebuild, and MySQL will refuse the CREATE TABLE if the
    column types don't match exactly (error 3780).
    """
    cur = mysql_conn.cursor()
    for table_name in table_names:
        cur.execute(f"DROP TABLE IF EXISTS `{table_name}`;")
    mysql_conn.commit()


def main():
    print("Connecting to Postgres (Neon)...")
    pg_conn = get_pg_connection()
    print("Connecting to MySQL (local)...")
    mysql_conn = get_mysql_connection()

    mysql_cur = mysql_conn.cursor()
    mysql_cur.execute("SET FOREIGN_KEY_CHECKS=0;")

    pg_cur = pg_conn.cursor()
    tables = [t for t in list_tables(pg_cur) if t not in TABLES_TO_SKIP]

    print(f"Found {len(tables)} table(s): {', '.join(tables)}\n")

    if DROP_EXISTING:
        print("Dropping existing tables (if any)...")
        drop_all_tables(mysql_conn, tables)
        print("  ✓ done\n")

    for table_name in tables:
        print(f"Migrating `{table_name}`...")
        try:
            migrate_table(pg_conn, mysql_conn, table_name)
        except Exception as e:
            mysql_conn.rollback()
            print(f"  ✗ failed on `{table_name}`: {e}")

    mysql_cur.execute("SET FOREIGN_KEY_CHECKS=1;")
    mysql_conn.commit()

    pg_conn.close()
    mysql_conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()