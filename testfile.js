// test-db.js
const mariadb = require('mariadb');

const pool = mariadb.createPool('mariadb://root:help@localhost:3306/GISMarketplace');

pool.getConnection()
  .then(conn => {
    console.log("✅ Connected successfully!");
    conn.release();
    pool.end();
  })
  .catch(err => {
    console.error("❌ Connection failed:");
    console.error(err.message);
    console.error(err.code); // e.g., ER_ACCESS_DENIED_ERROR
    pool.end();
  });