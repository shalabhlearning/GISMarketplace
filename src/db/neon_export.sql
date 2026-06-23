--
-- PostgreSQL database dump
--

\restrict Tohma5c0Fnlr8ojoK25eafGPxPDJwsaPSavlK8tpAhIFy0drw0mkDNmp0T8wF4o

-- Dumped from database version 17.10 (21f7c76)
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: sync_provider_skills_search(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_provider_skills_search() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.skills IS NULL THEN
    NEW.skills_search := NULL;
  ELSE
    NEW.skills_search := (
      SELECT string_agg(val, ' ')
      FROM jsonb_array_elements_text(NEW.skills) val
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sync_service_tags_search(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_service_tags_search() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.tags IS NULL THEN
    NEW.tags_search := NULL;
  ELSE
    NEW.tags_search := (
      SELECT string_agg(val, ' ')
      FROM jsonb_array_elements_text(NEW.tags) val
    );
  END IF;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_notifications (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    project_id character(36) NOT NULL,
    provider_id character(36) NOT NULL,
    match_score numeric(5,4),
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: buyerprofile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buyerprofile (
    buyer_id character(36) NOT NULL,
    organization_name character varying(255) NOT NULL,
    industry character varying(100),
    preferred_services jsonb,
    budget_range character varying(50),
    location public.geometry(Point,4326) DEFAULT public.st_setsrid(public.st_makepoint((0)::double precision, (0)::double precision), 4326) NOT NULL,
    rating numeric(3,2) DEFAULT 0.00,
    subscription_status character varying(20) DEFAULT 'inactive'::character varying NOT NULL
);


--
-- Name: contract; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract (
    contract_id character(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    proposal_id character(36) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status character varying(20) DEFAULT 'in_progress'::character varying NOT NULL,
    completion_report text,
    CONSTRAINT contract_status_check CHECK (((status)::text = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'disputed'::character varying])::text[])))
);


--
-- Name: creditledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creditledger (
    id character(36) NOT NULL,
    provider_id character(36),
    credits integer,
    type character varying(10),
    reason character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT creditledger_type_check CHECK (((type)::text = ANY ((ARRAY['credit'::character varying, 'debit'::character varying])::text[])))
);


--
-- Name: payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment (
    payment_id character(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    contract_id character(36) NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    transaction_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);


--
-- Name: projectrequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projectrequest (
    project_id character(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    buyer_id character(36) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    budget numeric(10,2),
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    embedding_vector bytea,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    start_date date,
    end_date date,
    submission_deadline timestamp with time zone,
    visibility character varying(20) DEFAULT 'public'::character varying NOT NULL,
    contact_person character varying(255),
    contact_email character varying(255),
    attachments jsonb,
    awarded_to integer,
    ai_processed boolean DEFAULT false,
    ai_summary jsonb,
    ai_skills jsonb,
    ai_processed_at timestamp with time zone,
    ai_version character varying(20) DEFAULT 'v1.0'::character varying,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    CONSTRAINT projectrequest_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_review'::character varying, 'contracted'::character varying, 'closed'::character varying])::text[]))),
    CONSTRAINT projectrequest_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[])))
);


--
-- Name: proposal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal (
    proposal_id character(36) NOT NULL,
    project_id character(36) NOT NULL,
    provider_id character(36) NOT NULL,
    bid_amount numeric(10,2) NOT NULL,
    proposal_message text NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    credits_used integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    technical text,
    delivery text,
    milestones jsonb,
    case_studies jsonb,
    references_json jsonb,
    attachments jsonb,
    CONSTRAINT proposal_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'withdrawn'::character varying])::text[])))
);


--
-- Name: proposal_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_drafts (
    draft_id character(36) NOT NULL,
    project_id character(36) NOT NULL,
    provider_id character(36) NOT NULL,
    bid_amount numeric(10,2),
    technical text,
    delivery text,
    milestones jsonb,
    case_studies jsonb,
    references_json jsonb,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: providerprofile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providerprofile (
    provider_id character(36) NOT NULL,
    organization_name character varying(255) NOT NULL,
    skills jsonb,
    experience_years smallint,
    portfolio_url character varying(2048),
    hourly_rate numeric(10,2) DEFAULT 0 NOT NULL,
    location public.geometry(Point,4326) DEFAULT public.st_setsrid(public.st_makepoint((0)::double precision, (0)::double precision), 4326) NOT NULL,
    rating numeric(3,2) DEFAULT 0.00,
    skills_search text,
    subscription_status character varying(20) DEFAULT 'none'::character varying,
    subscription_plan_id integer,
    subscription_start date,
    subscription_end date,
    CONSTRAINT providerprofile_subscription_status_check CHECK (((subscription_status)::text = ANY ((ARRAY['none'::character varying, 'active'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review (
    review_id character(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    contract_id character(36) NOT NULL,
    reviewer_id character(36) NOT NULL,
    reviewee_id character(36) NOT NULL,
    rating smallint NOT NULL,
    comments text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT review_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: rfp_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rfp_drafts (
    draft_id character varying(255) NOT NULL,
    buyer_id character varying(255),
    title text,
    description text,
    budget numeric(10,2),
    currency character varying(10),
    start_date date,
    end_date date,
    submission_deadline timestamp with time zone,
    visibility character varying(20),
    contact_person text,
    contact_email text,
    credits integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rfp_provider_match; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rfp_provider_match (
    id character(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    project_id character(36) NOT NULL,
    provider_id character(36) NOT NULL,
    match_score numeric(5,4) NOT NULL,
    reason jsonb,
    created_at timestamp with time zone DEFAULT now(),
    is_checklist boolean DEFAULT false NOT NULL,
    checklist_added_at timestamp with time zone,
    notified boolean DEFAULT false NOT NULL,
    notified_at timestamp with time zone
);


--
-- Name: servicecategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicecategory (
    category_id integer NOT NULL,
    parent_category_id integer,
    category_name character varying(100) NOT NULL,
    description text,
    embedding_vector bytea
);


--
-- Name: servicecategory_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicecategory_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicecategory_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicecategory_category_id_seq OWNED BY public.servicecategory.category_id;


--
-- Name: servicelisting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicelisting (
    service_id character(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    provider_id character(36) NOT NULL,
    category_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    price_type character varying(10) NOT NULL,
    base_price numeric(10,2) NOT NULL,
    tags jsonb,
    embedding_vector bytea,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    tags_search text,
    CONSTRAINT servicelisting_price_type_check CHECK (((price_type)::text = ANY ((ARRAY['fixed'::character varying, 'hourly'::character varying])::text[]))),
    CONSTRAINT servicelisting_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'draft'::character varying])::text[])))
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    session_token character varying(255) NOT NULL,
    user_id character(36) NOT NULL,
    expires timestamp with time zone NOT NULL
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: subscriptionplan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptionplan (
    id integer NOT NULL,
    name character varying(50),
    monthly_price numeric(10,2),
    monthly_credits integer,
    is_active boolean DEFAULT true
);


--
-- Name: subscriptionplan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscriptionplan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptionplan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscriptionplan_id_seq OWNED BY public.subscriptionplan.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    user_id character(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    email character varying(255),
    password_hash character varying(255) NOT NULL,
    user_type character varying(20) NOT NULL,
    join_date timestamp with time zone DEFAULT now() NOT NULL,
    last_login timestamp with time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    phone_number character varying(20),
    CONSTRAINT user_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[]))),
    CONSTRAINT user_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['buyer'::character varying, 'provider'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: servicecategory category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicecategory ALTER COLUMN category_id SET DEFAULT nextval('public.servicecategory_category_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: subscriptionplan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptionplan ALTER COLUMN id SET DEFAULT nextval('public.subscriptionplan_id_seq'::regclass);


--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_notifications (id, type, project_id, provider_id, match_score, message, is_read, created_at) FROM stdin;
897c3558-97a6-40d6-b6bf-d70fc3a9b59c	new_provider_match	693a5e71-9e3d-4149-a5a9-cae4e7602451	af00454a-668d-4ba7-bbbf-55cc00053c92	0.5000	Testing is a new match (50%) for "wda".	f	2026-06-21 09:54:54.938064+00
4bc820e7-1e06-4aa1-b869-2925a6db3565	new_provider_match	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	af00454a-668d-4ba7-bbbf-55cc00053c92	0.5000	Testing is a new match (50%) for "dwad".	f	2026-06-21 09:54:55.352602+00
a19d01e8-6243-4258-a0cb-78f64d0744d6	new_provider_match	e8d67486-6a7e-4018-b313-f461a73cfd70	af00454a-668d-4ba7-bbbf-55cc00053c92	1.0000	Testing is a new match (100%) for "test2".	f	2026-06-21 09:54:55.758796+00
\.


--
-- Data for Name: buyerprofile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.buyerprofile (buyer_id, organization_name, industry, preferred_services, budget_range, location, rating, subscription_status) FROM stdin;
061b6e0c-583b-4f56-8855-fb20d208b095	tyest1	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
08872940-b0fe-429c-89c0-accbea2e2ece	Rahul	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
594ef980-f1a9-4e95-b064-ac1a4fd95a80	Testing Org1	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
609c3eac-5d2d-470d-b188-f85f8fd86096	test4	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
6bcbaf21-2e74-4d31-89ff-03d8136dadd2	test1234	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
7168149a-dde8-448d-bcfa-dee4212b0eda	Test9	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
9c76396b-fef9-43a2-b6fa-005baaa21e28	test99	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
a6c8090f-de27-11f0-8727-001a7dda7113	GIS-Point	LiDAR / Remote Sensing	["Surveying", "LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6cc505d-de27-11f0-8727-001a7dda7113	LiDAR.CO.UK	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6cc7b4c-de27-11f0-8727-001a7dda7113	LOGXON GmbH & Co. KG	LiDAR / Remote Sensing	["Surveying", "LiDAR Services", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d16ab5-de27-11f0-8727-001a7dda7113	Blom International Operations (BIO)	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d19109-de27-11f0-8727-001a7dda7113	DEPHOS Group	LiDAR / Remote Sensing	["LiDAR Services", "Point Cloud Processing", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d1b87f-de27-11f0-8727-001a7dda7113	LiDAR Scotland	LiDAR / Remote Sensing	["LiDAR Services", "Point Cloud Processing", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d1ea37-de27-11f0-8727-001a7dda7113	Leica Geosystems (Hexagon AB)	Surveying	["Surveying", "Point Cloud Processing", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d213b5-de27-11f0-8727-001a7dda7113	Fugro	Geospatial / GIS	["Point Cloud Processing"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d236b6-de27-11f0-8727-001a7dda7113	MGGP Aero	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d25881-de27-11f0-8727-001a7dda7113	KOREC	LiDAR / Remote Sensing	["Surveying", "LiDAR Services", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d280a9-de27-11f0-8727-001a7dda7113	Laserscanning Europe GmbH	LiDAR / Remote Sensing	["LiDAR Services", "Point Cloud Processing", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d2a67d-de27-11f0-8727-001a7dda7113	Exwayz	LiDAR / Remote Sensing	["LiDAR Services", "Geospatial Software", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d2cd25-de27-11f0-8727-001a7dda7113	Outsight	LiDAR / Remote Sensing	["LiDAR Services", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d2efec-de27-11f0-8727-001a7dda7113	Routescene	LiDAR / Remote Sensing	["LiDAR Services", "Geospatial Software", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d31ff9-de27-11f0-8727-001a7dda7113	Terrasolid	LiDAR / Remote Sensing	["Surveying", "LiDAR Services", "Point Cloud Processing", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d34d8a-de27-11f0-8727-001a7dda7113	3Deling	Geospatial / GIS	["Point Cloud Processing"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d3916c-de27-11f0-8727-001a7dda7113	Cyclomedia	LiDAR / Remote Sensing	["LiDAR Services", "Point Cloud Processing", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d3b9a5-de27-11f0-8727-001a7dda7113	DT Mapping	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d3e0bc-de27-11f0-8727-001a7dda7113	Générations Robots	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d40388-de27-11f0-8727-001a7dda7113	GeoSLAM Limited	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d42ecf-de27-11f0-8727-001a7dda7113	Microdrones GmbH	LiDAR / Remote Sensing	["Surveying", "LiDAR Services", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d464e7-de27-11f0-8727-001a7dda7113	NM Group	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d48dc3-de27-11f0-8727-001a7dda7113	YellowScan SAS	LiDAR / Remote Sensing	["LiDAR Services", "Geospatial Software", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d4b606-de27-11f0-8727-001a7dda7113	FiveRivers	LiDAR / Remote Sensing	["Surveying", "LiDAR Services", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d4dc2b-de27-11f0-8727-001a7dda7113	QeBIM	BIM / Construction	["Point Cloud Processing", "BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d50171-de27-11f0-8727-001a7dda7113	Energyline Ltd	LiDAR / Remote Sensing	["LiDAR Services", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d52514-de27-11f0-8727-001a7dda7113	YellowScan	LiDAR / Remote Sensing	["LiDAR Services", "Geospatial Software", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d545bf-de27-11f0-8727-001a7dda7113	CADDEN	LiDAR / Remote Sensing	["Surveying", "LiDAR Services", "Point Cloud Processing"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d56452-de27-11f0-8727-001a7dda7113	BIM SOLUTIONS	BIM / Construction	["LiDAR Services", "BIM Services", "UAV / Drone Mapping"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d58313-de27-11f0-8727-001a7dda7113	XenomatiX	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d5a402-de27-11f0-8727-001a7dda7113	Eurosense	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d5ca13-de27-11f0-8727-001a7dda7113	Blickfeld	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d5e91d-de27-11f0-8727-001a7dda7113	BIMfaktoria	BIM / Construction	["Point Cloud Processing", "BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d60737-de27-11f0-8727-001a7dda7113	Laserdata GmbH	LiDAR / Remote Sensing	["LiDAR Services", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d6272c-de27-11f0-8727-001a7dda7113	Airborne LiDAR Mapping A/S	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d645ec-de27-11f0-8727-001a7dda7113	Readaar	Geospatial / GIS	["Point Cloud Processing"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d662d7-de27-11f0-8727-001a7dda7113	greehill	LiDAR / Remote Sensing	["LiDAR Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d67ffc-de27-11f0-8727-001a7dda7113	Artificial Modelling	BIM / Construction	["Point Cloud Processing", "BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d69fa3-de27-11f0-8727-001a7dda7113	Harmony AT	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d6c000-de27-11f0-8727-001a7dda7113	QeBIM Services	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d6efd3-de27-11f0-8727-001a7dda7113	Advenser	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d717f0-de27-11f0-8727-001a7dda7113	Tesla CAD UK	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d73a5a-de27-11f0-8727-001a7dda7113	Bimplan	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d75aa4-de27-11f0-8727-001a7dda7113	Bureau Bouwtechniek NV	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d7799e-de27-11f0-8727-001a7dda7113	BIM Consulting	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d797bf-de27-11f0-8727-001a7dda7113	BIMLY	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d7b59c-de27-11f0-8727-001a7dda7113	ATI Project	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d85eef-de27-11f0-8727-001a7dda7113	DPS Group Global is a global consulting, engineering, and construction management company with an office in Europe. The company uses Virtual Design and Construction (VDC) methodologies alongside BIM technologies to serve high-tech industries.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d88800-de27-11f0-8727-001a7dda7113	BIM Facility AG is a BIM company mentioned among the "Top Building Information Modeling Solutions Providers" in Europe. The company provides BIM services and is based in Switzerland.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d8e67f-de27-11f0-8727-001a7dda7113	Powerkh is a UK-based company that offers MEP (Mechanical, Electrical, and Plumbing) BIM services. It has offices in Ukraine and the USA and provides a variety of BIM outsourcing services, including content creation and 3D modeling.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d90951-de27-11f0-8727-001a7dda7113	QeBIM Services is a BIM service provider based in the UK, offering BIM modeling services in Europe. The company specializes in architectural, structural, and MEP modeling.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d929fe-de27-11f0-8727-001a7dda7113	Harmony AT is a German company located in Kundert. It offers BIM modeling services for clients in Europe.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d94d0f-de27-11f0-8727-001a7dda7113	Small BIM Modeling Companies	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d98c2b-de27-11f0-8727-001a7dda7113	bimspot is an Austrian startup founded in 2018 that provides a SaaS platform for BIM-oriented collaboration. Its technology allows for the development of digital building models independent of specific software choices.	BIM / Construction	["BIM Services", "Geospatial Software"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d9b626-de27-11f0-8727-001a7dda7113	BIM-Lab Ltd - MEP consultancy is a specialized MEP BIM consultancy located in London, UK. It focuses on mechanical, electrical, and plumbing services for construction projects.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d9d914-de27-11f0-8727-001a7dda7113	BIMdesign Consulting is based in Spain and offers BIM project execution for both architectural design and MEP installations. It also provides BIM implementation and training for individuals and companies.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6d9f9b7-de27-11f0-8727-001a7dda7113	BIM Consulting, s.r.o. is a Czech company located in Prague. It offers BIM management consulting to institutions and companies, covering process digitization, project monitoring, data management, and standardization.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6da1a9d-de27-11f0-8727-001a7dda7113	Digital Engineering Works (DEWorks) is a UK-based company specializing in BIM content creation. It provides services to clients within the UK and Europe.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6db28ae-de27-11f0-8727-001a7dda7113	Sagiton is a BIM modeling company located in Poland. It offers BIM services to clients in Europe and focuses on digital construction.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6db549c-de27-11f0-8727-001a7dda7113	Bimpact Designs is a BIM outsourcing company that works with clients in Europe. It specializes in architectural, structural, and MEP BIM services and provides solutions for construction projects.	BIM / Construction	["BIM Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6db7d31-de27-11f0-8727-001a7dda7113	Innoviz Technologies	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6dba3db-de27-11f0-8727-001a7dda7113	Quanergy	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6dbc515-de27-11f0-8727-001a7dda7113	Velodyne	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6dbf206-de27-11f0-8727-001a7dda7113	Cepton, Inc.	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6dc310f-de27-11f0-8727-001a7dda7113	Hesai Technology	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6dc60cb-de27-11f0-8727-001a7dda7113	Ouster	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6dc852e-de27-11f0-8727-001a7dda7113	RoboSense	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
a6dca664-de27-11f0-8727-001a7dda7113	Geosat	Geospatial / GIS	["Geospatial Services"]	\N	0101000020E610000061545227A0BD53409CA223B9FC973440	0.00	inactive
aa2d0b5c-2ae4-4ecd-b631-8c7a5c13d6ce	test11	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
c288424d-c135-426e-afa5-a72040ae6476	test90	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
c6469221-6022-46ec-8c1c-d7d090ffe820	testS	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
d22237b2-6124-4fa2-a61b-625d95dbb955	test8	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
d5eeb1b2-e2b6-4a48-9203-ddff5f58131d	Rahul	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
d6c6eea3-28e2-49e8-8ec7-ef2c9a2be62d	test8	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
ece3ba8a-c1c5-4d2e-8bbf-ea78e1612d49	Test10	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
efc35bfb-6565-4bd4-ab4b-8a15669bb6ed	Test7	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
cf6ec6f0-f1e7-49ab-8e77-319986aba191	mainuser	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
83e66b9a-5db0-48f7-a05b-b20eb323a1af	mainbuyer2	\N	\N	\N	0101000020E610000000000000000000000000000000000000	0.00	inactive
\.


--
-- Data for Name: contract; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contract (contract_id, proposal_id, start_date, end_date, status, completion_report) FROM stdin;
\.


--
-- Data for Name: creditledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.creditledger (id, provider_id, credits, type, reason, created_at) FROM stdin;
836de0a0-8f2a-47e1-8ae6-947177258580	beda06ee-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:03.631992+00
c6744dc5-9309-4b41-a9d6-f4b9dc97286f	beda07aa-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:03.795076+00
7fd004ac-7b04-469a-939f-517075edb726	beda083d-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:03.953823+00
d85ab504-d198-4099-a1a8-a6de58b19cd2	beda08d0-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:04.118047+00
7c7b2a9b-8307-41f9-a639-42a097dace32	beda0960-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:04.280886+00
0f390eea-bd87-4873-9978-678acdcb9918	beda09f7-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:04.444126+00
5e95c452-8f92-49ee-b1aa-46522c0edf96	beda0a93-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:04.602853+00
615b55ff-4478-46a0-b781-ad147267a95c	beda0b2a-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:04.783857+00
fedefd7f-ca9f-431a-9c07-4effca235273	beda0bc3-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:04.942746+00
606243d7-8631-43f2-b750-a921ebdc242a	beda0c78-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:05.102583+00
65d08809-e182-48ab-bda8-45e143da9cec	beda0d10-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:05.264945+00
9dd08866-89a7-4ca4-a091-99156aa13eea	beda0db0-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:05.857061+00
a56e9b88-18a4-4fcd-ac7f-db16eb35e34a	beda0e47-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:06.311085+00
dbe1a366-680f-4734-a78a-f8090ed7c963	beda0ede-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:06.797068+00
ac100bc7-d46c-4b58-b682-47bb1c101450	beda0f85-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:07.220544+00
a96d573d-cec5-4968-806f-6047ce14e0f6	beda102e-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:07.65275+00
dde8c936-0e8e-4716-9602-cb6f00c8d919	beda10c7-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:07.890065+00
9112dbfd-d112-4d43-94ca-7562bb83b9c2	beda1155-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:08.290955+00
e49051d9-3fe9-450e-a810-4d46513aff61	beda11e8-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:08.641565+00
435c232b-2b19-4cf8-be98-3446e43e506a	beda127b-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:08.813908+00
b0d43f52-b59c-4da6-8e37-7c9a3ec62387	beda130f-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:09.308748+00
f2fc5a2f-a151-483b-b970-d0dd734c57b3	beda13a3-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:09.476239+00
1fc9fe0a-6673-4c5f-9db1-0c9d59687438	beda143b-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:09.639204+00
92264fff-7cbe-41a5-8543-b16145a6bc03	beda14cb-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:09.801158+00
9ae393fc-13d3-4f05-84b4-4d7ad052f218	beda155c-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:09.962877+00
13449c47-5afd-4699-a06e-30a72f25f52d	beda15ed-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:10.124446+00
a8a4865c-f890-4c64-91b4-d7ede7705dbd	beda1687-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:10.29277+00
bbfbb7f1-2366-4c93-b6fd-61802833a2fc	beda171d-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:10.456659+00
0720f9ee-8e36-4bae-9efb-bb30b46f59b8	beda17ac-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:10.641733+00
77ca6ff5-f727-471a-878e-83ccd456dbf9	beda183a-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:10.813809+00
bc8964fd-1d3e-4cbf-868f-409a1aaeed0a	beda18cc-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:10.977595+00
c39be759-d7bd-4f04-993f-4a011110e21b	beda195c-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:11.14052+00
a041bd7d-229e-45a6-93db-7366cbdd5135	bf2c43ea-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:11.299276+00
8ecd8b1a-0f56-4962-9401-5681d28903aa	bf2c492f-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:11.462223+00
c3d41c0c-3b6a-44ee-b6eb-9e7c99b9ded2	bf2c4a21-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:11.740696+00
95b1a447-2ab3-46a4-b484-334ecc1d41c4	bf2c4ad0-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:11.983573+00
c0974656-3933-4447-a21a-d7c031127361	bf2c4b59-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:12.239281+00
a22d10f8-d287-41ea-adda-655db96f6c2a	bf2c4be5-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:12.438297+00
c21af762-ee36-4293-a41d-43ded3078494	bf2c4c6e-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:12.596984+00
37465c50-c37d-4e61-881e-b1c9335740ba	bf2c4cf7-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:12.75925+00
6d148a7a-837b-4fae-8f1a-caf481bfa645	bf2c4daf-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:12.921127+00
6251b707-f7d1-4b77-85fc-87f84fff742b	bf2c4e44-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:13.090652+00
d7ef679c-77e1-4ab8-8ffb-5e340b53a407	bf2c4ec9-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:13.251611+00
f6520640-491f-489d-afbb-5b93648dafd9	bf2c4f54-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:13.658596+00
b5467582-8a91-4eae-bfce-11a163b23dc5	bf2c4fd4-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:13.904861+00
4c757927-6e23-4225-9d1a-9f39aef7df67	bf2c5055-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:14.298314+00
f2663c21-7412-4ab0-b8d0-865ecde4b354	bf2c50d9-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:14.699771+00
0fecd22e-8949-44c1-b8a0-705777ec1020	bf2c515e-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:15.123162+00
b72c96bc-1bc6-4a13-a49e-880f8d68e854	bf2c51eb-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:15.405879+00
95d8bcdb-82dc-438c-a416-af3edaf5d39a	bf2c5279-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:15.79899+00
f5f445ce-04b8-46a2-8ebe-4191ce8b1640	bf2c5301-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:16.138637+00
e9ebab77-e108-47cf-a1af-c3be33753e15	bf2c53fc-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:16.593026+00
18e7d7f9-f216-49c2-9761-baa3f4d5e408	bf2c549e-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:16.822173+00
7a9e4049-c9de-4f5d-81b3-8d242d58d346	bf2c5573-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:17.396581+00
e99260b9-ae7e-4083-a697-cd9acf536c65	bf2c5613-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:17.55845+00
8bc9d0b1-c9ca-4aa2-95e0-5bf9d348d53c	bf2c56ea-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:17.719709+00
0b9c5433-05c4-423b-97e8-38248fa2d660	bf2c5814-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:17.891624+00
41a74758-092f-4077-8aae-751b6ce649d3	bf2c58b0-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:18.054286+00
c421789a-8b73-40e6-9978-5f215221bcaa	bf2c5944-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:18.213636+00
4ad97c02-4c67-435b-a0b5-d8f6c447b887	bf2c59de-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:18.372398+00
f5fdf823-4a1f-4aa1-912a-0a5331376560	bf2c5a79-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:18.531249+00
2c816c5c-8a19-4694-a993-45a8bf886fe8	bf2c5b1b-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:18.690116+00
1eed7560-5107-4bca-a342-c860451c6c8f	bf2c5bbd-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:18.84897+00
70f0cabe-a419-42b8-a362-9ccb741c9109	bf2c5c59-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:19.011058+00
577b938e-9dee-42e7-a4fb-78da3819fcec	bf2c5cf2-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:19.169748+00
b0ea53ad-53ca-4232-9064-add72ac0478a	bf2c5d88-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:19.32882+00
42f8eeb9-76c8-4d10-adf1-01bb29779713	bf2c5e20-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:19.487764+00
e998270c-e469-406a-a028-4081c6ac4b95	bf2c5eb0-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:19.650722+00
a0980374-c08a-4c9c-a516-a78e6b09fe87	bf2c5f45-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:19.818852+00
8f1caaac-835d-4e88-8003-f8b9b91f64c5	bf2c5fd3-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:19.981759+00
bd65706c-ec12-4448-95f5-b21724da6578	bf2c606b-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:20.162826+00
2ed05687-78a6-46d1-b11f-00b12e4fe60d	bf2c60fd-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:20.33065+00
801909fe-a85d-429a-9fde-db2599032f70	bf2c6192-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:20.489565+00
ba2d964c-f7aa-4820-814d-948e72cf9dc8	bf2c6226-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:20.652248+00
4a7b7263-0250-4b7f-8061-596cd4156860	bf2c62ba-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:20.823324+00
95c2844b-57c8-4d10-b8de-e0edc18e8035	b2946d1f-3f9a-4357-a091-cdf12d10e66f	100	credit	Initial credits	2026-05-27 07:36:07.551883+00
9c57cad2-0bab-4715-a9e8-bbc67baa03c8	d1591b24-c466-4eb1-90c4-230f00b5e6ac	100	credit	Initial credits	2026-05-31 07:17:19.306991+00
0a305730-bf9d-42f5-9283-8ad9ab231a12	d1591b24-c466-4eb1-90c4-230f00b5e6ac	200	credit	Initial Credits	2026-05-31 07:26:44.073239+00
0b6f4c12-41eb-4291-882c-f99c4f52c5b3	d1591b24-c466-4eb1-90c4-230f00b5e6ac	20	debit	Proposal submission for project 432996e6-2ac4-4fc6-803d-0d554b8c0377	2026-05-31 09:01:03.817279+00
2a29d5ca-d3f5-4e58-8f62-3f33c2325cfe	af00454a-668d-4ba7-bbbf-55cc00053c92	100	credit	Initial credits	2026-06-21 09:54:54.2403+00
a217eff7-6a87-4a8f-ba94-2c6699a6b5df	bf2c6353-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:21.534182+00
d1ad387b-cc60-40ea-91bf-df14d6f594b6	bf2c63ec-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:21.699647+00
291d1767-0871-492b-b79e-848478437242	bf2c6483-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:21.861889+00
2255c0bb-150d-4137-8273-95e3762ae7e5	bf2c6a9b-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:22.020435+00
89f3075c-0cca-40b8-b2de-c613001280a1	bf2c6bd1-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:22.195232+00
1402d0fd-8cfb-4fb6-8d10-872869782760	bf2c6ca2-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:22.367846+00
6138c0d0-5df6-43fe-8b1f-9ecb722b89b7	bfa4a53d-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:22.526361+00
31c69121-8b00-47b9-b643-144d28b82875	c0098bfc-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:22.689493+00
e52558cf-2221-4c05-abaa-66ff58acab70	c0099465-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:18:22.848364+00
d5078d5a-d35a-43c5-bb79-f44dba89fc84	bed9f8b5-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:01.475828+00
ba15c052-fb7f-42dc-8a4c-1efc3bacca1f	bed9f96c-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:01.683194+00
79075fff-5484-45b0-bedf-0d0a2902e251	bed9fa0d-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:01.841949+00
6ebb74d2-5ceb-4b39-af73-6eea5493584d	bed9fc87-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:02.003259+00
816af96b-86a7-4538-8b33-52fc89880fe1	bed9fd2a-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:02.16219+00
5cb65898-c815-4dfe-af6b-1eb3bf482a3b	bed9fdc7-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:02.330018+00
b671f753-4e72-4432-a9e8-2039477cb754	bed9fe6a-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:02.489311+00
d4f85427-6e33-4a96-bf66-babe1facb5cf	bed9ff17-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:02.652087+00
439184e7-58e9-4200-9f1d-7d86139d628b	beda001b-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:02.815688+00
1e85d3b8-6f3c-44fe-87a4-16ce719b38f5	beda0132-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:02.974013+00
0ad7a0e8-1ab6-49d9-a221-062a81cebe3f	beda04de-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:03.133036+00
77b6ad79-e7c2-42c7-89f5-7e7f422e737a	beda05bd-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:03.296895+00
06269650-f559-469f-ae7b-f69a3fdea0a5	beda065c-58f7-11f1-b9ae-cecd02c24f20	200	credit	Initial credits	2026-05-27 07:19:03.459779+00
\.


--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment (payment_id, contract_id, amount, payment_status, transaction_date) FROM stdin;
\.


--
-- Data for Name: projectrequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projectrequest (project_id, buyer_id, title, description, budget, status, embedding_vector, created_at, start_date, end_date, submission_deadline, visibility, contact_person, contact_email, attachments, awarded_to, ai_processed, ai_summary, ai_skills, ai_processed_at, ai_version, currency) FROM stdin;
432996e6-2ac4-4fc6-803d-0d554b8c0377	83e66b9a-5db0-48f7-a05b-b20eb323a1af	testing	testing	7897987.00	contracted	\N	2026-05-31 08:07:04.802651+00	2026-05-31	2026-09-27	2026-05-31 13:36:00+00	public	dwda	buyer21@gmail.com	["/uploads/proposals/1780214824777-177126227_Terms_of_Reference_-_BNSS_Upgarde_Portal_-_27.04.26.pdf"]	\N	t	{"timeline": {"duration": "9 months", "end_date": "Month 9", "start_date": "Month 1"}, "confidence": 0.8, "budget_info": "Payment milestones tied to acceptance of deliverables", "key_contact": "Sonia Fernanda Ceballos", "deliverables": ["Inception Report", "User Experience (UX/UI) Design Package", "Detailed System Architecture and Technical Design", "Core Platform Enhancements", "Reporting and Analytics Module", "System Testing and Quality Assurance", "Training and Capacity Building", "Production Deployment and Handover"], "scope_of_work": ["Conducting detailed requirements validation and functional analysis", "Designing user-centered interfaces and dashboards", "Developing and configuring all required modules", "Implementing automated validation rules, audit trails, and notification systems", "Ensuring system scalability, maintainability, and interoperability"], "project_overview": "Expansion of the Belize National Statistical System (BNSS) Portal", "risks_constraints": ["Ensuring scalability and performance", "Ensuring security and role-based access control", "Ensuring interoperability via APIs"], "evaluation_criteria": ["Technical proposal", "Financial proposal", "Vendor qualifications and experience"], "technical_requirements": ["Data discovery, filtering, and exploration", "Data visualization and dashboards", "Geospatial and mapping capabilities", "Metadata and data quality management", "Backend, data submission, and institutional workflows"]}	{"confidence": 0.95, "required_skills": ["ArcGIS Pro", "QGIS", "Spatial Analysis", "Data Visualization", "Data Mining", "Machine Learning", "Cloud Computing", "Database Management"], "required_services": ["GIS Mapping", "Geospatial Consulting", "3D City Modeling", "3D Modeling", "BIM Integration", "Digital Elevation Models", "LiDAR Classification", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Satellite Image Processing", "Spatial Data Analysis", "Terrain Analysis", "UAV Mapping"]}	2026-05-31 08:59:55.517901+00	v1.0	INR
28fc35a9-06b1-40ba-87bb-33fcb948aa9f	83e66b9a-5db0-48f7-a05b-b20eb323a1af	fesfsf	frswfew	8797856.00	open	\N	2026-05-31 08:16:46.851971+00	2026-05-31	2026-07-19	2026-06-01 13:45:00+00	public	wdada	buyer21@gmail.com	[]	\N	f	\N	\N	\N	v1.0	GBP
47331576-7e69-43e7-af29-86ade3ae1265	83e66b9a-5db0-48f7-a05b-b20eb323a1af	fhesiu	uheidhasuid	342342.00	open	\N	2026-05-31 08:40:34.333244+00	2026-05-31	2026-08-30	2026-06-01 14:10:00+00	public	hiagdi	buyer21@gmail.com	["https://vvtrstxhto2dqdcy.public.blob.vercel-storage.com/proposals/1780216833997-GIS_Marketplace_Sample_RFP.pdf"]	\N	f	\N	\N	\N	v1.0	USD
81f686b5-6bca-49b8-b1b9-039270b2114f	83e66b9a-5db0-48f7-a05b-b20eb323a1af	dwddwdwd	dwdw	489798.00	open	\N	2026-05-31 08:43:28.76552+00	2026-05-31	2026-06-05	2026-06-01 14:13:00+00	public	bhjb	buyer21@gmail.com	["https://vvtrstxhto2dqdcy.public.blob.vercel-storage.com/proposals/1780217008507-Utility_Power_RFP.pdf"]	\N	f	\N	\N	\N	v1.0	USD
693a5e71-9e3d-4149-a5a9-cae4e7602451	83e66b9a-5db0-48f7-a05b-b20eb323a1af	wda	dwad	22343.00	open	\N	2026-05-31 08:24:58.007904+00	2026-05-31	2026-06-04	2026-06-02 13:54:00+00	public	edad	buyer21@gmail.com	["/uploads/proposals/1780215897981-GIS_Marketplace_Sample_RFP.pdf"]	\N	t	\N	{"confidence": 0.9, "required_skills": ["ArcGIS Pro", "QGIS", "Spatial Analysis", "Image Classification"], "required_services": ["GIS Mapping", "Remote Sensing", "Satellite Image Processing", "Spatial Data Analysis"]}	2026-05-31 08:50:01.160195+00	v1.0	USD
7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	83e66b9a-5db0-48f7-a05b-b20eb323a1af	dwad	cwa	79878.00	open	\N	2026-05-31 08:51:40.624482+00	2026-05-31	2026-06-06	2026-06-02 14:21:00+00	public	ddwd	buyer21@gmail.com	["https://vvtrstxhto2dqdcy.public.blob.vercel-storage.com/proposals/1780217499553-GIS_Marketplace_Sample_RFP.pdf"]	\N	t	\N	{"confidence": 0.9, "required_skills": ["ArcGIS Pro", "QGIS", "Spatial Analysis", "Image Classification"], "required_services": ["GIS Mapping", "Remote Sensing", "Satellite Image Processing", "Spatial Data Analysis"]}	2026-05-31 08:52:05.239545+00	v1.0	USD
991b0785-b3f7-4976-a5ab-e122f18ab7d4	83e66b9a-5db0-48f7-a05b-b20eb323a1af	rfp123	rfp1233	787878.00	open	\N	2026-05-31 07:46:14.550117+00	2026-05-31	2026-07-21	2026-06-01 13:15:00+00	public	sar	buyer21@gmail.com	[]	\N	f	\N	\N	\N	v1.0	USD
9d4d884c-4189-465d-a3cf-7af41239b4ca	83e66b9a-5db0-48f7-a05b-b20eb323a1af	resd	reasd	3123123.00	open	\N	2026-05-31 07:47:01.773841+00	2026-05-31	2026-08-11	2026-06-01 13:16:00+00	public	dwad	buyer21@gmail.com	[]	\N	f	\N	\N	\N	v1.0	USD
78fc9b54-6736-40e7-9e89-e4e28f42499a	83e66b9a-5db0-48f7-a05b-b20eb323a1af	dwawdad	dawdadw	498798.00	open	\N	2026-05-31 08:47:02.199606+00	2026-05-31	2026-06-05	2026-06-02 14:15:00+00	public	Sar	buyer21@gmail.com	["https://vvtrstxhto2dqdcy.public.blob.vercel-storage.com/proposals/1780217221532-Agriculture_Forestry_RFP.pdf"]	\N	t	{"timeline": {"duration": "176 days", "end_date": "2027-01-30", "start_date": "2026-08-10"}, "confidence": 0.8, "budget_info": {"budget_range": {"max": 280000, "min": 140000}}, "key_contact": "", "deliverables": ["integrated geospatial analytics platform", "crop health monitoring dashboards", "forest cover change maps", "irrigation recommendation engine", "ML prediction models"], "scope_of_work": ["integration of satellite imagery", "drone data", "weather feeds", "soil datasets", "IoT sensor inputs"], "project_overview": "Precision Agriculture and Forest Monitoring Geospatial Analytics Platform", "risks_constraints": [], "evaluation_criteria": ["remote sensing expertise", "AI/ML innovation", "technical methodology", "project cost", "training and support"], "technical_requirements": ["remote sensing expertise", "NDVI and multispectral imagery processing", "drone orthomosaic generation", "machine learning for vegetation analysis", "offline mobile GIS synchronization"]}	{"required_skills": ["Geospatial Analysis"], "required_services": ["GIS"]}	2026-06-21 11:07:23.901207+00	v1.0	USD
e8d67486-6a7e-4018-b313-f461a73cfd70	cf6ec6f0-f1e7-49ab-8e77-319986aba191	test2	testing3	232323.00	open	\N	2026-05-31 10:15:30.464721+00	2026-05-31	2026-08-25	2026-06-01 15:45:00+00	public	wdw	buyer20@gmail.com	["https://vvtrstxhto2dqdcy.public.blob.vercel-storage.com/proposals/1780222530082-agriculture_forestry_rfp__1_.pdf"]	\N	t	{"timeline": {"duration": "9 months", "end_date": "2027-03-31", "start_date": "2026-07-01"}, "confidence": 0.8, "budget_info": {"currency": "USD", "budget_range": {"max": 600000, "min": 250000}}, "key_contact": "", "deliverables": ["Land classification maps", "Vegetation health reports", "GIS dashboards", "Data processing workflows"], "scope_of_work": ["Crop productivity mapping", "Forest inventory analysis", "Vegetation health assessment", "Remote sensing-based land monitoring"], "project_overview": "Precision Agriculture and Forestry Geospatial Intelligence Program", "risks_constraints": [], "evaluation_criteria": ["Remote sensing", "LiDAR", "UAV analytics", "Precision agriculture", "Forestry GIS"], "technical_requirements": ["Drone/UAV data processing", "Satellite analytics", "NDVI and vegetation indices", "LiDAR processing", "Geospatial machine learning"]}	{"confidence": 0.9, "required_skills": ["LiDAR Processing", "UAV Mapping", "Satellite Image Processing", "Spatial Data Analysis"], "required_services": ["Remote Sensing", "GIS Mapping", "Geospatial Consulting"]}	2026-06-15 16:29:16.299915+00	v1.0	USD
092ca230-bdca-474b-94f6-945d82ddfddd	83e66b9a-5db0-48f7-a05b-b20eb323a1af	TestRFP3	testing	123456.00	open	\N	2026-05-31 09:52:54.253395+00	2026-05-31	2026-09-30	2026-06-01 15:22:00+00	public	test	buyer21@gmail.com	["https://vvtrstxhto2dqdcy.public.blob.vercel-storage.com/proposals/1780221173961-agriculture_forestry_rfp__1_.pdf"]	\N	t	{"timeline": {"duration": "9 months", "end_date": "2027-03-31", "start_date": "2026-07-01"}, "confidence": 0.8, "budget_info": {"currency": "USD", "budget_range": {"max": 600000, "min": 250000}}, "key_contact": "", "deliverables": ["Land classification maps", "Vegetation health reports", "GIS dashboards", "Data processing workflows"], "scope_of_work": ["Crop productivity mapping", "Forest inventory analysis", "Vegetation health assessment", "Remote sensing-based land monitoring"], "project_overview": "Precision Agriculture and Forestry Geospatial Intelligence Program", "risks_constraints": [], "evaluation_criteria": ["Remote sensing", "LiDAR", "UAV analytics", "Precision agriculture", "Forestry GIS"], "technical_requirements": ["Drone/UAV data processing", "Satellite analytics", "NDVI and vegetation indices", "LiDAR processing", "Geospatial machine learning"]}	{"required_skills": ["Geospatial Analysis"], "required_services": ["GIS"]}	2026-06-08 06:27:51.200318+00	v1.0	INR
\.


--
-- Data for Name: proposal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposal (proposal_id, project_id, provider_id, bid_amount, proposal_message, status, credits_used, created_at, technical, delivery, milestones, case_studies, references_json, attachments) FROM stdin;
7cd6182c-af1f-48ac-8aa0-29c63b060f40	432996e6-2ac4-4fc6-803d-0d554b8c0377	d1591b24-c466-4eb1-90c4-230f00b5e6ac	234242.98	{"technical":"rfwfwefw","delivery":"fwefw","milestones":[],"caseStudies":[],"references":[]}	accepted	20	2026-05-31 09:01:03.715166+00	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: proposal_drafts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposal_drafts (draft_id, project_id, provider_id, bid_amount, technical, delivery, milestones, case_studies, references_json, updated_at) FROM stdin;
\.


--
-- Data for Name: providerprofile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.providerprofile (provider_id, organization_name, skills, experience_years, portfolio_url, hourly_rate, location, rating, skills_search, subscription_status, subscription_plan_id, subscription_start, subscription_end) FROM stdin;
0b5442e4-e580-4e19-a0c6-4201a807c824	TestingRegister	["GIS Mapping", "LiDAR Processing", "UAV Mapping", "3D City Modeling", "Satellite Image Processing"]	5	\N	50.00	0101000020E610000000000000000000000000000000000000	0.00	GIS Mapping LiDAR Processing UAV Mapping 3D City Modeling Satellite Image Processing	none	\N	\N	\N
1144a92e-ba5c-442e-9ff0-1e4f2dff4860	test80	\N	10	\N	10.00	0101000020E610000000000000000000000000000000000000	0.00	\N	none	\N	\N	\N
46b348da-6ce1-4cf6-af61-c477a1cbf123	Test3	\N	20	https://testsite1.com	50.00	0101000020E610000000000000000000000000000000000000	0.00	\N	none	\N	\N	\N
7e2b5874-ddc9-11f0-8727-001a7dda7113	Naksha Tech Private Limited	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	15	https://www.naksha-tech-private-limited.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.05	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e33587c-ddc9-11f0-8727-001a7dda7113	Geokno India	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	5	https://www.geokno-india.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e33820b-ddc9-11f0-8727-001a7dda7113	Aam Geo Spatial Tech PRIVATE LIMITED	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	6	https://www.aam-geo-spatial-tech-private-limited.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.78	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e33a7b4-ddc9-11f0-8727-001a7dda7113	ALAR Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "Terrain Analysis"]	9	https://www.alar-technologies.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.87	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis Terrain Analysis	none	\N	\N	\N
7e33ccc8-ddc9-11f0-8727-001a7dda7113	FOCUS GEOSPATIAL PRIVATE LIMITED	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	5	https://www.focus-geospatial-private-limited.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e341d4f-ddc9-11f0-8727-001a7dda7113	GeoCentroid Pvt Ltd	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	7	https://www.geocentroid-pvt-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.81	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e34412d-ddc9-11f0-8727-001a7dda7113	Goodland Geospatial & Consultants Pvt Ltd	["BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	10	https://www.goodland-geospatial-consultants-pvt-ltd.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.90	BIM Integration GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e34647a-ddc9-11f0-8727-001a7dda7113	Mappa Consulting Engineers	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "Terrain Analysis"]	15	https://www.mappa-consulting-engineers.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.05	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis Terrain Analysis	none	\N	\N	\N
7e348867-ddc9-11f0-8727-001a7dda7113	Matrix Geo Solution Ltd.	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	9	https://www.matrix-geo-solution-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.87	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e34ae0e-ddc9-11f0-8727-001a7dda7113	Lidar Tech Pvt Ltd	["GIS Mapping", "Geospatial Consulting", "LiDAR Classification", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	11	https://www.lidar-tech-pvt-ltd.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.93	GIS Mapping Geospatial Consulting LiDAR Classification LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e34d940-ddc9-11f0-8727-001a7dda7113	Genesys International Corporation limited	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	26	https://www.genesys-international-corporation-limited.com	150.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.38	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e351e3a-ddc9-11f0-8727-001a7dda7113	Marvel Geospatial Solutions Pvt Ltd	["BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	5	https://www.marvel-geospatial-solutions-pvt-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	BIM Integration GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e354bc0-ddc9-11f0-8727-001a7dda7113	BPC Consultant India Pvt. Ltd.	["3D City Modeling", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	13	https://www.bpc-consultant-india-pvt-ltd.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.99	3D City Modeling GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e357865-ddc9-11f0-8727-001a7dda7113	Airpix	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	13	https://www.airpix.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.99	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e359a1b-ddc9-11f0-8727-001a7dda7113	SISL, India	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	15	https://www.sisl-india.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.05	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e35bbb2-ddc9-11f0-8727-001a7dda7113	GeoVista Technologies Private Limited	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	14	https://www.geovista-technologies-private-limited.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.02	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e35dcc4-ddc9-11f0-8727-001a7dda7113	NeoGeoInfo Technologies Pvt Ltd	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	5	https://www.neogeoinfo-technologies-pvt-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e35fe43-ddc9-11f0-8727-001a7dda7113	Lidar Engineering and Infrastructure Pvt Ltd	["GIS Mapping", "Geospatial Consulting", "LiDAR Classification", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	15	https://www.lidar-engineering-and-infrastructure-pvt-ltd.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.05	GIS Mapping Geospatial Consulting LiDAR Classification LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e361ecf-ddc9-11f0-8727-001a7dda7113	Data Labs India Solutions Pvt Ltd	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	13	https://www.data-labs-india-solutions-pvt-ltd.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.99	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e363f68-ddc9-11f0-8727-001a7dda7113	Land Coordinates Technology (Lctss.in)	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	8	https://www.land-coordinates-technology-lctss-in.com	90.00	0101000020E6100000A5BDC117269F5340C3F5285C8F623140	3.78	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e36604b-ddc9-11f0-8727-001a7dda7113	RightData Labs Pvt Ltd	["Digital Elevation Models", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	9	https://www.rightdata-labs-pvt-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.87	Digital Elevation Models GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3684a5-ddc9-11f0-8727-001a7dda7113	LeadSquared	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	6	https://www.leadsquared.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.78	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e36a411-ddc9-11f0-8727-001a7dda7113	iSpatial Techno Solutions Pvt Ltd	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	8	https://www.ispatial-techno-solutions-pvt-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.84	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e36c538-ddc9-11f0-8727-001a7dda7113	Datarise Solutions	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	7	https://www.datarise-solutions.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.81	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e36e561-ddc9-11f0-8727-001a7dda7113	LumenData Solutions India Pvt Ltd	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	5	https://www.lumendata-solutions-india-pvt-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e3706bc-ddc9-11f0-8727-001a7dda7113	Atom Aviation Services Pvt Ltd.	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	7	https://www.atom-aviation-services-pvt-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.81	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e372884-ddc9-11f0-8727-001a7dda7113	3D Pointshot	["3D Modeling", "BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	12	https://www.3d-pointshot.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	3D Modeling BIM Integration GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e385d29-ddc9-11f0-8727-001a7dda7113	Infogeo	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	10	https://www.infogeo.com	120.00	0101000020E6100000E78C28ED0D6653405396218E75F12940	3.96	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e396228-ddc9-11f0-8727-001a7dda7113	Robomania India Private Limited	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	7	https://www.robomania-india-private-limited.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.81	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e398a41-ddc9-11f0-8727-001a7dda7113	Trigeo Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	10	https://www.trigeo-technologies.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.90	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e39acd5-ddc9-11f0-8727-001a7dda7113	Vivid Geospatial	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Satellite Image Processing", "Spatial Data Analysis"]	12	https://www.vivid-geospatial.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Satellite Image Processing Spatial Data Analysis	none	\N	\N	\N
7e39eaab-ddc9-11f0-8727-001a7dda7113	Ceinsys Tech	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Satellite Image Processing", "Spatial Data Analysis"]	5	https://www.ceinsys-tech.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Satellite Image Processing Spatial Data Analysis	none	\N	\N	\N
7e3a0948-ddc9-11f0-8727-001a7dda7113	Avakaza Geo-Science Research Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	11	https://www.avakaza-geo-science-research-technologies.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.93	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3a2715-ddc9-11f0-8727-001a7dda7113	Geo Adithya Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	6	https://www.geo-adithya-technologies.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.78	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3b9f9f-ddc9-11f0-8727-001a7dda7113	Geopage Consultants	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	14	https://www.geopage-consultants.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.02	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3bc3e6-ddc9-11f0-8727-001a7dda7113	Lepton Software	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	8	https://www.lepton-software.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.84	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3be8b4-ddc9-11f0-8727-001a7dda7113	Ansimap Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	12	https://www.ansimap-technologies.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3c0d7e-ddc9-11f0-8727-001a7dda7113	Production Modeling India Private Limited	["3D City Modeling", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	8	https://www.production-modeling-india-private-limited.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.84	3D City Modeling GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3c33ae-ddc9-11f0-8727-001a7dda7113	ORBX Technologies Private Limited	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	14	https://www.orbx-technologies-private-limited.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.02	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e3c5661-ddc9-11f0-8727-001a7dda7113	MapVista	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	11	https://www.mapvista.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.93	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3d0b1f-ddc9-11f0-8727-001a7dda7113	Mirai Aerospace Systems	["GIS Mapping", "Geospatial Consulting", "LiDAR Classification", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	13	https://www.mirai-aerospace-systems.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.99	GIS Mapping Geospatial Consulting LiDAR Classification LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e3d3017-ddc9-11f0-8727-001a7dda7113	AUS-Aarav Unmanned Systems	["3D City Modeling", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	8	https://www.aus-aarav-unmanned-systems.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.84	3D City Modeling GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3d5095-ddc9-11f0-8727-001a7dda7113	KGLOBE SOFTTECH INDIA	["3D City Modeling", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	13	https://www.kglobe-softtech-india.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.99	3D City Modeling GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3d70d1-ddc9-11f0-8727-001a7dda7113	Pixel Vision	["BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	13	https://www.pixel-vision.com	120.00	0101000020E6100000A5BDC117269F5340C3F5285C8F623140	3.99	BIM Integration GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3d907e-ddc9-11f0-8727-001a7dda7113	HDSENSE	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	10	https://www.hdsense.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.90	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3daf61-ddc9-11f0-8727-001a7dda7113	Eastern Aero Carto	["GIS Mapping", "Geospatial Consulting", "LiDAR Classification", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	5	https://www.eastern-aero-carto.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Classification LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e3dcef8-ddc9-11f0-8727-001a7dda7113	Deduce Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "Terrain Analysis"]	9	https://www.deduce-technologies.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.87	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis Terrain Analysis	none	\N	\N	\N
7e3dee5f-ddc9-11f0-8727-001a7dda7113	Arya Geospatial	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	13	https://www.arya-geospatial.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3e0dc1-ddc9-11f0-8727-001a7dda7113	EDGE 3D Technologies	["3D Modeling", "BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	6	https://www.edge-3d-technologies.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.78	3D Modeling BIM Integration GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3e2e3f-ddc9-11f0-8727-001a7dda7113	Asteria Aerospace	["BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Classification", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	11	https://www.asteria-aerospace.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.93	BIM Integration GIS Mapping Geospatial Consulting LiDAR Classification LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e3e4e3c-ddc9-11f0-8727-001a7dda7113	PepperTree.AI	["3D City Modeling", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	7	https://www.peppertree-ai.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.81	3D City Modeling GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3e93db-ddc9-11f0-8727-001a7dda7113	JKR Consulting	["3D City Modeling", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	9	https://www.jkr-consulting.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.87	3D City Modeling GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3eb46e-ddc9-11f0-8727-001a7dda7113	Heliware	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	5	https://www.heliware.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3ed474-ddc9-11f0-8727-001a7dda7113	GIS Consortium India Pvt Ltd	["3D City Modeling", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	12	https://www.gis-consortium-india-pvt-ltd.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	3D City Modeling GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3ef46f-ddc9-11f0-8727-001a7dda7113	RSI Softech	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	10	https://www.rsi-softech.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.90	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3f17aa-ddc9-11f0-8727-001a7dda7113	Coordinate Systems LLP	["Digital Elevation Models", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	12	https://www.coordinate-systems-llp.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	Digital Elevation Models GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3f3b1a-ddc9-11f0-8727-001a7dda7113	Aerodyne India	["GIS Mapping", "Geospatial Consulting", "LiDAR Classification", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "Terrain Analysis", "UAV Mapping"]	12	https://www.aerodyne-india.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	GIS Mapping Geospatial Consulting LiDAR Classification LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis Terrain Analysis UAV Mapping	none	\N	\N	\N
7e3f5b8c-ddc9-11f0-8727-001a7dda7113	Terrageo Technologies	["3D City Modeling", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	15	https://www.terrageo-technologies.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.05	3D City Modeling GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3f80e6-ddc9-11f0-8727-001a7dda7113	Mappatura Geospatial	["Digital Elevation Models", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	9	https://www.mappatura-geospatial.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.87	Digital Elevation Models GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3fa469-ddc9-11f0-8727-001a7dda7113	Techmapperz	["Digital Elevation Models", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	14	https://www.techmapperz.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.02	Digital Elevation Models GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3fcdb6-ddc9-11f0-8727-001a7dda7113	Senseimage Technologies	["Digital Elevation Models", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	9	https://www.senseimage-technologies.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.87	Digital Elevation Models GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e3ff1ce-ddc9-11f0-8727-001a7dda7113	Yellow SKYE	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	8	https://www.yellow-skye.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.84	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e401260-ddc9-11f0-8727-001a7dda7113	TreisTek	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "Terrain Analysis"]	12	https://www.treistek.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis Terrain Analysis	none	\N	\N	\N
7e403323-ddc9-11f0-8727-001a7dda7113	Earth On Mapping Consulting	["Digital Elevation Models", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	6	https://www.earth-on-mapping-consulting.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.78	Digital Elevation Models GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e40539a-ddc9-11f0-8727-001a7dda7113	Lucid Imaging Pvt Ltd	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	14	https://www.lucid-imaging-pvt-ltd.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.81	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e407460-ddc9-11f0-8727-001a7dda7113	Globe View Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	11	https://www.globe-view-technologies.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.93	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e4093ad-ddc9-11f0-8727-001a7dda7113	Larix Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	6	https://www.larix-technologies.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.78	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e40b30f-ddc9-11f0-8727-001a7dda7113	Ladera Technology	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	13	https://www.ladera-technology.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.99	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e40d214-ddc9-11f0-8727-001a7dda7113	VMAPStech India	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	5	https://www.vmapstech-india.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e40f100-ddc9-11f0-8727-001a7dda7113	GeovertX	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	6	https://www.geovertx.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.84	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e41101f-ddc9-11f0-8727-001a7dda7113	LGEOM	["BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	10	https://www.lgeom.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.90	BIM Integration GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e412fa1-ddc9-11f0-8727-001a7dda7113	Latlon Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	8	https://www.latlon-technologies.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.84	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e414e8d-ddc9-11f0-8727-001a7dda7113	Wildplant Terrestrial Solutions	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	6	https://www.wildplant-terrestrial-solutions.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.78	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e416da2-ddc9-11f0-8727-001a7dda7113	Flybi Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Satellite Image Processing", "Spatial Data Analysis"]	15	https://www.flybi-technologies.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.05	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Satellite Image Processing Spatial Data Analysis	none	\N	\N	\N
7e418cc6-ddc9-11f0-8727-001a7dda7113	Leons Digital Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	10	https://www.leons-digital-technologies.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.90	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e41ac04-ddc9-11f0-8727-001a7dda7113	DroneAcharya Aerial Innovations	["GIS Mapping", "Geospatial Consulting", "LiDAR Classification", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	14	https://www.droneacharya-aerial-innovations.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.02	GIS Mapping Geospatial Consulting LiDAR Classification LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e41cb4d-ddc9-11f0-8727-001a7dda7113	Aston BIM Creations	["3D Modeling", "BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	5	https://www.aston-bim-creations.com	90.00	0101000020E6100000ED9E3C2CD4765240A1D634EF38853240	3.81	3D Modeling BIM Integration GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e41ea58-ddc9-11f0-8727-001a7dda7113	Shayona Management Services	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "Terrain Analysis"]	7	https://www.shayona-management-services.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.81	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis Terrain Analysis	none	\N	\N	\N
7e42098b-ddc9-11f0-8727-001a7dda7113	Dronitech	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Satellite Image Processing", "Spatial Data Analysis"]	12	https://www.dronitech.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.96	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Satellite Image Processing Spatial Data Analysis	none	\N	\N	\N
7e422bf6-ddc9-11f0-8727-001a7dda7113	Lares Global Limited	["Digital Elevation Models", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	24	https://www.lares-global-limited.com	150.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.32	Digital Elevation Models GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e424bd1-ddc9-11f0-8727-001a7dda7113	Raynas Infra and Geometics	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	10	https://www.raynas-infra-and-geometics.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.90	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e427083-ddc9-11f0-8727-001a7dda7113	LRS Services	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Satellite Image Processing", "Spatial Data Analysis"]	5	https://www.lrs-services.com	90.00	0101000020E61000004C378941604D5340B003E78C289D3C40	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Satellite Image Processing Spatial Data Analysis	none	\N	\N	\N
7e428fd1-ddc9-11f0-8727-001a7dda7113	LDS Engineers	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	5	https://www.lds-engineers.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.75	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e42aec3-ddc9-11f0-8727-001a7dda7113	LaMinds	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "Terrain Analysis"]	8	https://www.laminds.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.05	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis Terrain Analysis	none	\N	\N	\N
7e42cdb6-ddc9-11f0-8727-001a7dda7113	Terra Align Geospatial Solutions	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	7	https://www.terra-align-geospatial-solutions.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.81	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e43150f-ddc9-11f0-8727-001a7dda7113	SKYMAP GEO-INFOMATIC	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	9	https://www.skymap-geo-infomatic.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.87	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e433525-ddc9-11f0-8727-001a7dda7113	AiRotor Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	6	https://www.airotor-technologies.com	90.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.78	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e435464-ddc9-11f0-8727-001a7dda7113	Lonar Technologies	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	11	https://www.lonar-technologies.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.93	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
7e43747f-ddc9-11f0-8727-001a7dda7113	Axesmap	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping"]	15	https://www.axesmap.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	4.05	GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping	none	\N	\N	\N
7e439361-ddc9-11f0-8727-001a7dda7113	LuminoGuru	["BIM Integration", "GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis"]	4	https://www.luminoguru.com	120.00	0101000020E610000061545227A0BD53409CA223B9FC973440	3.93	BIM Integration GIS Mapping Geospatial Consulting LiDAR Processing Photogrammetry Remote Sensing Spatial Data Analysis	none	\N	\N	\N
a23f7c25-7690-4acf-ae4a-096a5db9ec4d	DAKSHA AND COMPANY	\N	5	https://testsite2.com	50.00	0101000020E610000000000000000000000000000000000000	0.00	\N	none	\N	\N	\N
c11473bf-520b-46e1-a26c-68b4e2ce1376	Test1	\N	10	https:/test.com	50.00	0101000020E610000000000000000000000000000000000000	0.00	\N	none	\N	\N	\N
eb580aee-cc64-4485-bdbe-f5769fd9283b	Test2	\N	20	\N	16.00	0101000020E610000000000000000000000000000000000000	0.00	\N	none	\N	\N	\N
b2946d1f-3f9a-4357-a091-cdf12d10e66f	Testing22	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "LiDAR Classification", "Remote Sensing", "Photogrammetry"]	5	\N	52.00	0101000020E610000000000000000000000000000000000000	0.00	GIS Mapping Geospatial Consulting LiDAR Processing LiDAR Classification Remote Sensing Photogrammetry	none	\N	\N	\N
d1591b24-c466-4eb1-90c4-230f00b5e6ac	mainprovider	["GIS Mapping", "LiDAR Processing", "LiDAR Classification", "Geospatial Consulting", "Remote Sensing", "UAV Mapping", "Spatial Data Analysis", "Photogrammetry", "Terrain Analysis", "3D City Modeling", "BIM Integration", "3D Modeling"]	6	\N	80.00	0101000020E610000000000000000000000000000000000000	0.00	GIS Mapping LiDAR Processing LiDAR Classification Geospatial Consulting Remote Sensing UAV Mapping Spatial Data Analysis Photogrammetry Terrain Analysis 3D City Modeling BIM Integration 3D Modeling	none	\N	\N	\N
af00454a-668d-4ba7-bbbf-55cc00053c92	Testing	["GIS Mapping", "Geospatial Consulting", "LiDAR Processing", "LiDAR Classification", "Photogrammetry", "Remote Sensing", "Spatial Data Analysis", "UAV Mapping", "Terrain Analysis", "3D City Modeling", "BIM Integration", "3D Modeling", "Digital Elevation Models", "Satellite Image Processing"]	\N	\N	0.00	0101000020E610000000000000000000000000000000000000	0.00	GIS Mapping Geospatial Consulting LiDAR Processing LiDAR Classification Photogrammetry Remote Sensing Spatial Data Analysis UAV Mapping Terrain Analysis 3D City Modeling BIM Integration 3D Modeling Digital Elevation Models Satellite Image Processing	none	\N	\N	\N
\.


--
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review (review_id, contract_id, reviewer_id, reviewee_id, rating, comments, "timestamp") FROM stdin;
\.


--
-- Data for Name: rfp_drafts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rfp_drafts (draft_id, buyer_id, title, description, budget, currency, start_date, end_date, submission_deadline, visibility, contact_person, contact_email, credits, created_at) FROM stdin;
\.


--
-- Data for Name: rfp_provider_match; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rfp_provider_match (id, project_id, provider_id, match_score, reason, created_at, is_checklist, checklist_added_at, notified, notified_at) FROM stdin;
1354e4e3-cf88-4a99-81ea-c09c673cd316	432996e6-2ac4-4fc6-803d-0d554b8c0377	d1591b24-c466-4eb1-90c4-230f00b5e6ac	0.4400	{"matched_skills": ["gis mapping", "geospatial consulting", "3d city modeling", "3d modeling", "bim integration", "lidar classification", "lidar processing", "photogrammetry", "remote sensing", "spatial data analysis", "terrain analysis", "uav mapping"]}	2026-05-31 08:21:39.48571+00	f	\N	f	\N
a0909c5c-313b-484c-a0c0-5eddc2061775	432996e6-2ac4-4fc6-803d-0d554b8c0377	7e34ae0e-ddc9-11f0-8727-001a7dda7113	0.3600	{"matched_skills": ["gis mapping", "geospatial consulting", "lidar classification", "lidar processing", "photogrammetry", "remote sensing", "spatial data analysis", "uav mapping"]}	2026-05-31 08:21:40.297512+00	f	\N	f	\N
90abff02-f4a9-49c8-a5a4-bdd4a5428d36	432996e6-2ac4-4fc6-803d-0d554b8c0377	7e35fe43-ddc9-11f0-8727-001a7dda7113	0.3600	{"matched_skills": ["gis mapping", "geospatial consulting", "lidar classification", "lidar processing", "photogrammetry", "remote sensing", "spatial data analysis", "uav mapping"]}	2026-05-31 08:21:40.524529+00	f	\N	f	\N
60cbc632-076e-476a-a81e-2bb444257cab	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e2b5874-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:01.554228+00	f	\N	f	\N
458ad4b7-b74f-465c-9c01-bfd755412e0c	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e33587c-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:01.650923+00	f	\N	f	\N
4d467d32-b8dc-476c-8bb8-6220c1ef700e	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e33820b-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:01.729807+00	f	\N	f	\N
76b6a533-0b02-44c4-a388-dac2920a17b4	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e33a7b4-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:01.812891+00	f	\N	f	\N
ad032bf8-cd78-4ae3-8885-b91d3bda456d	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e33ccc8-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:01.910872+00	f	\N	f	\N
7b61d6d3-c092-4bf2-9cec-82044f4e0ab2	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e341d4f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:01.99841+00	f	\N	f	\N
02b90610-25ca-44e5-a3b8-bdf0b3a6881a	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e34412d-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.083005+00	f	\N	f	\N
d989abb8-abac-40ee-8c8b-66d4d1854d7b	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e34647a-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.161564+00	f	\N	f	\N
6b16d868-0977-461b-9379-89c62fb9244e	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e348867-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.237969+00	f	\N	f	\N
e7213128-d7d5-4843-8676-3fc9912a7f61	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e34ae0e-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.316018+00	f	\N	f	\N
41a31a1a-7951-485d-9e63-da416b698454	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e34d940-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.396623+00	f	\N	f	\N
75b9cace-dbb6-4341-9ae4-84f09b5450a9	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e351e3a-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.474897+00	f	\N	f	\N
4cac6b7f-641f-426d-9247-7e4eaad482db	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e354bc0-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.551084+00	f	\N	f	\N
ccad6607-3c0c-45b5-97ba-9b74305ea8a1	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e357865-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.629765+00	f	\N	f	\N
8e4ef4ee-932a-490a-bfa3-cf12a6da3743	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e359a1b-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.709723+00	f	\N	f	\N
894f71fd-e0c7-455e-82b9-c527af5e7d26	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e35bbb2-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.788986+00	f	\N	f	\N
8c7fb497-7139-4f09-bb07-41f77960af51	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e35dcc4-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.868534+00	f	\N	f	\N
7009b5b2-315f-42eb-b395-3e2621b82c11	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e35fe43-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:02.94709+00	f	\N	f	\N
f058e15b-e240-4540-8a7c-3aee5603b974	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e361ecf-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.027902+00	f	\N	f	\N
8cfa7103-702f-4673-98a8-044437bcb60a	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e363f68-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.110636+00	f	\N	f	\N
203f4080-0ef1-4316-8328-95e5885ab230	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e36604b-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.191067+00	f	\N	f	\N
cb5480a1-ca5a-4d75-b60b-7604980413bb	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3684a5-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.273737+00	f	\N	f	\N
2f9050e1-aeb5-4237-b7df-778f00040aee	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e36a411-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.349873+00	f	\N	f	\N
c9d5a0af-bfdd-4506-942a-054c8f6faf7e	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e36c538-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.428853+00	f	\N	f	\N
05f480ab-f3bf-4198-932c-cbb065eab30f	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e36e561-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.508026+00	f	\N	f	\N
cb4446f0-680c-429e-8428-51e0abdf631d	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3706bc-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.585477+00	f	\N	f	\N
4ad37919-b530-4c3d-b28f-04a847e211d0	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e372884-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.666102+00	f	\N	f	\N
7c4c38fd-3e4b-43e1-87ae-2d961f26e2a4	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e385d29-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.744415+00	f	\N	f	\N
18fd53d9-db2d-4eba-a9b5-17cb51bb8dff	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e396228-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.820469+00	f	\N	f	\N
e76fc5cf-12d9-4270-8c21-46dd76341325	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e398a41-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:03.903298+00	f	\N	f	\N
b39dfec7-4ba6-44e7-bff8-4795448c4a6d	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e39acd5-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:50:03.979546+00	f	\N	f	\N
2736862b-840d-4f29-82ea-0b1a01b89f9a	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e39eaab-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:50:04.058064+00	f	\N	f	\N
c6f96856-a29e-4faa-a4f1-aec8bb656ccd	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3a0948-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.134336+00	f	\N	f	\N
0f58ac60-9a66-435b-af67-0c110a422e21	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3a2715-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.212213+00	f	\N	f	\N
a261831b-7b7b-4ed1-a539-b14e56d54c68	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3b9f9f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.293146+00	f	\N	f	\N
14228003-4ab0-4267-900a-3dda514288c5	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3bc3e6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.380538+00	f	\N	f	\N
70edce02-9402-4d22-88ed-35a4b2446f74	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3be8b4-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.460589+00	f	\N	f	\N
7b1843b2-4850-4561-9941-0c680b18a153	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3c0d7e-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.538754+00	f	\N	f	\N
16ebf97f-751d-48b4-91de-c02d6b4f7a79	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3c33ae-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.615406+00	f	\N	f	\N
e42ac760-2613-4a2f-90f1-b2a527e94a8b	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3c5661-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.693262+00	f	\N	f	\N
d9ec5aec-5cbb-4d9c-85ab-3e4fc329c5ba	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3d0b1f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.769858+00	f	\N	f	\N
df5b3389-46ce-43b2-8496-1c22a1e5c5b5	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3d3017-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.84788+00	f	\N	f	\N
1b6aba6c-3d0f-4952-b06b-8ece56145d1a	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3d5095-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:04.924358+00	f	\N	f	\N
dc08d932-83b2-4710-bcf0-aa6089e7b14c	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3d70d1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.002342+00	f	\N	f	\N
1bdc5d71-f084-40f3-acd7-ab4ac4b0fa2d	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3d907e-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.083192+00	f	\N	f	\N
8fba8e78-7a13-4c59-96bd-3e6ab6c34d92	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3daf61-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.165908+00	f	\N	f	\N
a8ac841d-dff5-4d5e-b601-73004e695039	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3dcef8-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.259733+00	f	\N	f	\N
47c502e9-3a78-4642-adb2-9966faf7ee75	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3dee5f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.340403+00	f	\N	f	\N
fbd2a797-0822-444a-8ba8-cb0ba63a5084	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3e0dc1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.420607+00	f	\N	f	\N
c9a4f6d9-a91c-49a1-b6f0-14f4b90be32e	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3e2e3f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.501415+00	f	\N	f	\N
956cf454-6801-4b5a-9f3e-dee998a0c0bf	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3e4e3c-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.593098+00	f	\N	f	\N
5da67b3a-1eb1-4a1e-b0d1-73a2a495c692	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3e93db-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.675642+00	f	\N	f	\N
91426e6a-77f6-40af-bcad-555951982577	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3eb46e-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.756142+00	f	\N	f	\N
b581fa3c-7958-40b9-85af-2a3b580b57b0	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3ed474-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.834279+00	f	\N	f	\N
87c8edd0-1b63-4b9a-b7f6-e645448c8824	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3ef46f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.914687+00	f	\N	f	\N
d0f07b18-2710-4709-96a5-d4f630c3f7a9	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3f17aa-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:05.998402+00	f	\N	f	\N
b46488b5-370a-40dd-ad14-dc7f81d2e8b4	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3f3b1a-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.079222+00	f	\N	f	\N
782d6203-4982-462d-b53f-365693ed5fe1	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3f5b8c-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.160415+00	f	\N	f	\N
134bb9d2-7561-45fc-986f-967fa0714845	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3f80e6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.237638+00	f	\N	f	\N
f61fb8b4-35dc-4d29-a23b-1fedf85ea1fe	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3fa469-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.317483+00	f	\N	f	\N
dd55bb67-51ef-4a54-a786-19b8f383815d	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3fcdb6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.395622+00	f	\N	f	\N
de625b9b-a038-4a9b-b199-e268e5a1761f	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e3ff1ce-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.475173+00	f	\N	f	\N
263597c6-92e9-40b1-a83e-223153ff88bc	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e401260-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.553803+00	f	\N	f	\N
85ca94ba-dbab-42e8-a12c-37f6b2ba4c27	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e403323-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.632721+00	f	\N	f	\N
1ceb3da6-bb5e-4e9d-8dbe-960500270eae	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e40539a-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.712777+00	f	\N	f	\N
679de481-9733-463c-bd27-69c80a4f3cdd	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e407460-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.801305+00	f	\N	f	\N
fb53eba2-4991-4dff-a484-e7ccbc292213	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e4093ad-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.892024+00	f	\N	f	\N
7e163228-f2f8-40ac-90f8-6238ae1dd904	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e40b30f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:06.972799+00	f	\N	f	\N
41ceaaec-cbfa-4bbe-89fe-e0e123152acc	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e40d214-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.053658+00	f	\N	f	\N
6c5d73dc-b4cf-46b6-b33e-da9b58d7af36	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e40f100-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.131908+00	f	\N	f	\N
0b13a846-230a-4f2d-8b39-dba263ea7ee2	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e41101f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.212432+00	f	\N	f	\N
686fd7db-4603-4176-8e29-81304a1523be	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e412fa1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.291103+00	f	\N	f	\N
b79c575a-d3dc-453b-a93d-942796600cc6	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e414e8d-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.370952+00	f	\N	f	\N
fcfd3e1a-2e31-4881-a0f3-b4888e0d8177	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e416da2-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:50:07.449869+00	f	\N	f	\N
44a7808a-37ac-4c6a-8235-b4629b8ea0fe	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e418cc6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.529989+00	f	\N	f	\N
17fb99e1-f787-4245-a030-e1914db84162	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e41ac04-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.607976+00	f	\N	f	\N
84a606ca-259e-48f9-bcde-395f687e635d	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e41cb4d-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.684375+00	f	\N	f	\N
6b72b88a-772a-49f4-8013-f5ff54e2164c	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e41ea58-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.762938+00	f	\N	f	\N
6c743b88-7807-41a0-8cee-3ba7c6248619	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e42098b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:50:07.843779+00	f	\N	f	\N
c7e4e5c9-d14b-429f-9e43-6e0fcc321262	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e422bf6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:07.930888+00	f	\N	f	\N
24fe45ac-bd0e-4bd8-9cc3-7eb3ab0b5d2d	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e424bd1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.010742+00	f	\N	f	\N
806e86a9-3b23-4ec6-ac8c-274dc7363034	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e427083-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:50:08.089463+00	f	\N	f	\N
4dea13a1-4e09-471d-b0d3-26edc48af63f	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e428fd1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.168541+00	f	\N	f	\N
789f202b-cd9f-4719-80c4-adc3c80356fa	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e42aec3-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.246978+00	f	\N	f	\N
a6522364-92fa-481a-9fe0-9496f25dc577	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e42cdb6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.327871+00	f	\N	f	\N
d7e98df3-6b29-45c6-a6aa-6b8788110967	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e43150f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.405777+00	f	\N	f	\N
b3699216-a7ff-47bf-a272-46f553f6fe7d	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e433525-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.486867+00	f	\N	f	\N
a9e033ad-aee7-4904-ad8a-f4798bf4d3b6	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e435464-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.565148+00	f	\N	f	\N
b99de94f-a1b4-41fa-ab75-623c15136066	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e43747f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.643462+00	f	\N	f	\N
2d241825-5fd9-47a9-80e4-4d0628ba4215	693a5e71-9e3d-4149-a5a9-cae4e7602451	7e439361-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.723259+00	f	\N	f	\N
8e420106-b41c-4c7f-9bff-e1a691c7b5e8	693a5e71-9e3d-4149-a5a9-cae4e7602451	d1591b24-c466-4eb1-90c4-230f00b5e6ac	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:50:08.800855+00	f	\N	f	\N
7b06ebfd-96f0-4eda-8e2a-a5a0969d6071	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e2b5874-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:05.781321+00	f	\N	f	\N
0864e654-1f48-420e-a1ba-d036057b4ee4	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e33587c-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:05.941371+00	f	\N	f	\N
78b409f0-0b41-4b72-8ee4-a8448c6034f6	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e33820b-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.059498+00	f	\N	f	\N
ecc7f0b2-e7ce-4193-bc6d-310a956de558	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e33a7b4-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.193483+00	f	\N	f	\N
90f18ef0-5b0c-4007-a8ce-f258e6506206	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e33ccc8-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.271421+00	f	\N	f	\N
d12ee2a8-af00-4f4b-9872-70fe9d064647	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e341d4f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.356197+00	f	\N	f	\N
37a6eb70-b43f-4243-9292-d4ab388c8ec7	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e34412d-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.430238+00	f	\N	f	\N
8284c473-af40-46f1-8637-54f5128a1210	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e34647a-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.514953+00	f	\N	f	\N
eb586b16-4fd9-42f5-8e50-589a9ffe1466	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e348867-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.58899+00	f	\N	f	\N
1418de7b-fc9c-4165-968d-80f31aba3b90	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e34ae0e-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.674517+00	f	\N	f	\N
5108582e-436d-43bb-8225-1f1cd11b98a6	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e34d940-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.748574+00	f	\N	f	\N
4a0b9fee-741c-46e0-864e-228afaadd72b	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e351e3a-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.833231+00	f	\N	f	\N
1e308b0d-5001-405b-abf9-6156d5c9b5e4	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e354bc0-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.911268+00	f	\N	f	\N
4bbc1359-ee28-40de-bf46-233925d685c1	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e357865-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:06.996479+00	f	\N	f	\N
c343fc85-b383-461e-8b35-633260fd8d08	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e359a1b-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.075132+00	f	\N	f	\N
1ed807c1-6f38-4311-a025-196c8966f7df	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e35bbb2-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.159652+00	f	\N	f	\N
54a04b0d-58bb-4616-9167-5585050119d4	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e35dcc4-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.238205+00	f	\N	f	\N
b79f3535-86c4-4385-ac07-8a4d4836fa27	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e35fe43-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.323484+00	f	\N	f	\N
1b1e1612-d613-4260-800b-d3055a6898ef	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e361ecf-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.410008+00	f	\N	f	\N
020ba5aa-5921-48b5-ba27-a49bc1a901e2	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e363f68-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.4949+00	f	\N	f	\N
1eea844c-8192-47d2-ba84-9f602bd9f26c	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e36604b-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.569449+00	f	\N	f	\N
977295cb-f1bf-472c-b84e-3bbe63bf7079	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3684a5-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.65386+00	f	\N	f	\N
5297147f-cf44-49c4-816b-5c1ed125f0bf	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e36a411-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.728198+00	f	\N	f	\N
8ab2633f-9167-4efb-927d-c03bc552f8ac	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e36c538-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.81299+00	f	\N	f	\N
7784a61a-0ca7-4fa6-97ff-7639ae91745c	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e36e561-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.891045+00	f	\N	f	\N
66161046-3ba7-45fa-ba95-769c6ea14e99	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3706bc-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:07.976348+00	f	\N	f	\N
731c04c9-290d-472d-a082-190e27b4b726	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e372884-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.054776+00	f	\N	f	\N
6c372e4c-c12a-4a05-8f9b-5677f7136b55	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e385d29-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.139246+00	f	\N	f	\N
fe93d4e3-66b6-4601-a3c8-9b05432af90b	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e396228-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.218307+00	f	\N	f	\N
0c820137-3884-4238-9888-290081b8da8f	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e398a41-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.303295+00	f	\N	f	\N
52d06fff-f08b-466f-b101-fac676068f08	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e39acd5-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:52:08.381307+00	f	\N	f	\N
bdce960c-5097-4444-ae84-a1fd70dccc7a	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e39eaab-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:52:08.46634+00	f	\N	f	\N
83e782de-1466-4b9f-bf89-fa88865728ff	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3a0948-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.548915+00	f	\N	f	\N
0f4c8842-a714-427e-9663-95cabc1bdcb8	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3a2715-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.634328+00	f	\N	f	\N
cf7f5eb3-5f3a-4803-b203-3db873a6c856	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3b9f9f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.712511+00	f	\N	f	\N
933f5b13-d9ae-49a2-976f-0e7ade49decf	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3bc3e6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.797477+00	f	\N	f	\N
6ae42bde-e2f3-4722-a156-312d27c4f909	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3be8b4-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.875836+00	f	\N	f	\N
f9cad923-f143-4dbf-9048-7a30ae89b486	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3c0d7e-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:08.960562+00	f	\N	f	\N
1fbbb83c-d334-4958-9723-bd111bbd2831	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3c33ae-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.03876+00	f	\N	f	\N
1215095b-70d4-4079-a9da-86bcd4fb9d8b	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3c5661-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.12418+00	f	\N	f	\N
bea63945-fcec-48bc-9f79-04fb56da52b2	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3d0b1f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.202884+00	f	\N	f	\N
e0ddd52c-67e1-4fd5-b8f5-75a0f4039290	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3d3017-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.286827+00	f	\N	f	\N
b5ba66f6-27a3-4a4e-a713-a168fd765557	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3d5095-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.360952+00	f	\N	f	\N
dccce782-3548-449e-b0f8-a62e2fb967b7	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3d70d1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.446286+00	f	\N	f	\N
16df43f8-2b6c-4d37-82ca-59a56067eb46	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3d907e-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.524801+00	f	\N	f	\N
f75465a2-226c-4c1b-a6f4-fdd615e17c28	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3daf61-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.609567+00	f	\N	f	\N
188c0bb9-5f3e-495e-905f-784fdc5c186e	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3dcef8-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.696996+00	f	\N	f	\N
77eba4a5-27b2-4655-ae72-0e4c48f66b91	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3dee5f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.781343+00	f	\N	f	\N
81b8f72c-fb4e-4b63-8841-1457a132b5ae	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3e0dc1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.855577+00	f	\N	f	\N
28a487f3-d1d8-4bb3-af78-88d2efb00a53	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3e2e3f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:09.940083+00	f	\N	f	\N
942fa539-0715-4a49-8805-8e5a27d68fcf	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3e4e3c-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.014724+00	f	\N	f	\N
50a27aa6-009a-4da4-9c5a-41d475cfa329	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3e93db-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.099278+00	f	\N	f	\N
46d897bc-a3ae-4069-bffd-cd47362306f4	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3eb46e-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.177817+00	f	\N	f	\N
1ba2cd95-f355-45e9-949b-ca1f6257d0a7	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3ed474-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.262842+00	f	\N	f	\N
5afcfb04-5244-4274-b4a4-aea7be01110e	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3ef46f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.341158+00	f	\N	f	\N
829f5619-13c6-489e-a154-16264c6ee4e3	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3f17aa-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.425791+00	f	\N	f	\N
df6d6fa8-297c-4580-9f1c-9777f9139b25	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3f3b1a-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.499922+00	f	\N	f	\N
ebd2802e-b44b-4c02-a482-21347df04cbe	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3f5b8c-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.585057+00	f	\N	f	\N
d1955ed6-e201-496a-a55b-0e4396f0f71c	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3f80e6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.664068+00	f	\N	f	\N
0dce2d64-71c8-425b-a65e-612c48d004ba	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3fa469-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.748558+00	f	\N	f	\N
031938d6-8810-4102-b55d-696d9e467d87	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3fcdb6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.826796+00	f	\N	f	\N
230fa410-861f-4296-9092-04686d7c2b43	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e3ff1ce-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.913544+00	f	\N	f	\N
ebf2bc4e-6e5f-42d3-80b7-75e614d9851d	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e401260-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:10.99471+00	f	\N	f	\N
10dc3d19-2ae7-4b85-a9d8-cf870bfb2cef	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e403323-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.083964+00	f	\N	f	\N
c66cae8f-de81-4997-ac9b-3bdf60c7e2d7	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e40539a-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.16227+00	f	\N	f	\N
e7d81990-ac4e-4c2c-ab41-ba4d51455cc4	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e407460-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.246528+00	f	\N	f	\N
17c1961f-923b-4f8a-88f0-088d0d3b9971	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e4093ad-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.325449+00	f	\N	f	\N
7975f497-e4c5-4a1d-8010-c3393085e246	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e40b30f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.409967+00	f	\N	f	\N
d69ee116-e926-41c7-a02f-4ef5d52ae7ec	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e40d214-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.488591+00	f	\N	f	\N
ca7c3c6e-2a38-4f12-8f34-c0adf075189f	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e40f100-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.574206+00	f	\N	f	\N
d9aaa63d-bb4d-444a-8253-acb6563b346d	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e41101f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.6525+00	f	\N	f	\N
cf5cdc9c-ae14-4f4a-8cb8-364bed6a41ca	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e412fa1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.73732+00	f	\N	f	\N
8d23dad9-f453-49c8-9d03-22dc90e1eac1	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e414e8d-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.816082+00	f	\N	f	\N
2dae4c07-680c-4067-a659-304c6c1f86ca	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e416da2-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:52:11.899879+00	f	\N	f	\N
5c699235-a498-4036-8dfd-40619ea7d250	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e418cc6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:11.978416+00	f	\N	f	\N
542c61fb-974c-4b14-b7c2-ce2dc8f8d2ba	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e41ac04-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.063569+00	f	\N	f	\N
6a3d5a64-e0f8-4059-ae9e-fac9df41e370	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e41cb4d-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.160072+00	f	\N	f	\N
d8a188fa-6cd7-4eb0-a6fe-c0959c799856	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e41ea58-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.244541+00	f	\N	f	\N
bc58ca8c-068e-42bd-987a-9cb6254c6937	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e42098b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:52:12.318251+00	f	\N	f	\N
4b3d5474-2194-4314-8bc8-c4ead403ffa3	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e422bf6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.403704+00	f	\N	f	\N
2e220c12-375c-4ab1-9a67-1978bf8d88e3	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e424bd1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.481565+00	f	\N	f	\N
8e3e6ab0-32cb-41a1-bc58-89f4fc0aea9a	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e427083-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-05-31 08:52:12.567253+00	f	\N	f	\N
bf85a155-82f9-4634-a540-8e00633fd04f	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e428fd1-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.645288+00	f	\N	f	\N
22de27b0-90f2-474f-9b8b-3aa1ee5c367a	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e42aec3-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.729644+00	f	\N	f	\N
cb7b5a01-1df1-4589-b913-cd6f65224571	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e42cdb6-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.870276+00	f	\N	f	\N
c4401e33-a65b-4ce4-9ea3-91e5925ca5e6	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e43150f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:12.976983+00	f	\N	f	\N
8642652b-4d64-4996-b036-dfeb85163902	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e433525-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:13.059844+00	f	\N	f	\N
4cf45b03-7e61-4cf4-87a8-5134939af41d	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e435464-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:13.189264+00	f	\N	f	\N
96bb5ac1-738b-4074-b7c8-022112194adf	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e43747f-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:13.276718+00	f	\N	f	\N
333d0113-0fe7-4351-b00d-50f98f503878	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	7e439361-ddc9-11f0-8727-001a7dda7113	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:13.38389+00	f	\N	f	\N
d4485faf-f796-413b-98bd-c24a0cad25e9	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	d1591b24-c466-4eb1-90c4-230f00b5e6ac	0.3800	{"matched_skills": ["gis mapping", "remote sensing", "spatial data analysis"]}	2026-05-31 08:52:13.46637+00	f	\N	f	\N
6d94edcc-f248-4a10-8da7-2f47d5339d71	e8d67486-6a7e-4018-b313-f461a73cfd70	7e33587c-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:42.965028+00	f	\N	f	\N
d8d7ffda-d688-4599-99ee-b918dc5a1621	e8d67486-6a7e-4018-b313-f461a73cfd70	7e33a7b4-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.118629+00	f	\N	f	\N
5cf3cfb4-bbb0-4df0-b709-e5c53c5bd40c	e8d67486-6a7e-4018-b313-f461a73cfd70	7e33ccc8-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.19554+00	f	\N	f	\N
a3003f6a-b5cf-49f0-a805-9bc1bf3b3927	e8d67486-6a7e-4018-b313-f461a73cfd70	7e341d4f-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:43.272962+00	f	\N	f	\N
86f782a7-4b05-425c-8e5f-239e204ddf02	e8d67486-6a7e-4018-b313-f461a73cfd70	7e34412d-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.350895+00	f	\N	f	\N
66f03c48-6efc-4dc5-8373-e2bfba7ca95b	e8d67486-6a7e-4018-b313-f461a73cfd70	7e34647a-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.427507+00	f	\N	f	\N
283e5390-e116-48a0-aadc-1df3ce2b70ac	e8d67486-6a7e-4018-b313-f461a73cfd70	7e2b5874-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:42.882671+00	f	\N	f	\N
d62c9f87-e5d2-4c42-a3bc-9a0e6eed53fb	e8d67486-6a7e-4018-b313-f461a73cfd70	7e361ecf-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.290886+00	f	\N	f	\N
0b03b636-976a-4fdf-8dde-4506dc2d2f21	e8d67486-6a7e-4018-b313-f461a73cfd70	7e363f68-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.372191+00	f	\N	f	\N
f45562b2-265e-4517-aa34-d2135b7fc3c5	e8d67486-6a7e-4018-b313-f461a73cfd70	7e36604b-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.449939+00	f	\N	f	\N
bdb3e9ce-3972-499d-aa49-2ad565dcf853	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3684a5-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:44.531277+00	f	\N	f	\N
31ebc788-e6c5-4777-be35-485edf53cd45	e8d67486-6a7e-4018-b313-f461a73cfd70	7e36a411-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.608773+00	f	\N	f	\N
44611f7a-52e2-496f-8483-7fd019a52cd4	e8d67486-6a7e-4018-b313-f461a73cfd70	7e36c538-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.689873+00	f	\N	f	\N
d8af225c-3191-43ba-9d64-1e7be5622e36	e8d67486-6a7e-4018-b313-f461a73cfd70	7e36e561-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:44.775476+00	f	\N	f	\N
06e87866-51dd-4d1d-b4a1-f543e1bdd3a5	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3706bc-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.853531+00	f	\N	f	\N
289c2d42-7dd0-41a0-a8e6-c113d4cdb4db	e8d67486-6a7e-4018-b313-f461a73cfd70	7e372884-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.930308+00	f	\N	f	\N
d443022f-578f-463c-8bcf-0f676b22f63a	e8d67486-6a7e-4018-b313-f461a73cfd70	7e385d29-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.008503+00	f	\N	f	\N
f0cb89b4-551c-483b-9a95-ca6e45a7febf	e8d67486-6a7e-4018-b313-f461a73cfd70	7e396228-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.084655+00	f	\N	f	\N
b914f01c-f20c-4052-a9f8-b08d965a97e1	e8d67486-6a7e-4018-b313-f461a73cfd70	7e398a41-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.162182+00	f	\N	f	\N
38d33a8c-5c87-4e4d-ba23-fdc2a182b799	e8d67486-6a7e-4018-b313-f461a73cfd70	7e39eaab-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "satellite image processing", "spatial data analysis"]}	2026-05-31 10:15:45.316351+00	f	\N	f	\N
a6ab885b-2b40-4f84-b439-83cb256c3177	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3a0948-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.393675+00	f	\N	f	\N
37fb41b5-f5cf-4067-a243-ee158910a391	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3a2715-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.475332+00	f	\N	f	\N
c3ffc28a-5d66-4f0a-ab6a-df2bbd064ae2	e8d67486-6a7e-4018-b313-f461a73cfd70	7e348867-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.504895+00	f	\N	f	\N
69cb51d0-0040-451c-875f-7ada56c278f4	e8d67486-6a7e-4018-b313-f461a73cfd70	7e34ae0e-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:43.586416+00	f	\N	f	\N
0205eb7a-d47e-401b-952a-b1e3189e693d	e8d67486-6a7e-4018-b313-f461a73cfd70	7e34d940-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.663535+00	f	\N	f	\N
6be68d77-e48f-4b5e-8ed3-05f783c9f0ab	e8d67486-6a7e-4018-b313-f461a73cfd70	7e351e3a-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.740756+00	f	\N	f	\N
09759ecd-c158-41f2-b7fd-46996b6c99b3	e8d67486-6a7e-4018-b313-f461a73cfd70	7e354bc0-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.818662+00	f	\N	f	\N
0145a9c1-c2a6-4f2e-afd8-658665d31f78	e8d67486-6a7e-4018-b313-f461a73cfd70	7e357865-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.90057+00	f	\N	f	\N
fb555175-df08-4700-a6ac-5aa8a9a98b52	e8d67486-6a7e-4018-b313-f461a73cfd70	7e359a1b-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:43.976775+00	f	\N	f	\N
9ba06ef6-4d95-4245-ae7c-83f09519d9b0	e8d67486-6a7e-4018-b313-f461a73cfd70	7e35bbb2-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.059266+00	f	\N	f	\N
e2c4179b-7fea-43c4-8f68-51917e491114	e8d67486-6a7e-4018-b313-f461a73cfd70	7e35dcc4-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:44.135562+00	f	\N	f	\N
6adbd6bc-2e43-428d-a082-ef674bb1e1ce	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3dcef8-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.488209+00	f	\N	f	\N
9132091f-eb40-4902-acd5-eba8c2ea14ff	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3dee5f-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.567165+00	f	\N	f	\N
ddd7eac4-2153-44ee-b61a-5391a833019e	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3e0dc1-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.645952+00	f	\N	f	\N
639f2299-c3f6-4d5c-a2a3-a74a66fad6eb	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3e2e3f-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:46.725209+00	f	\N	f	\N
d2899961-c373-4a78-8e2d-2356ac735162	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3e4e3c-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.804038+00	f	\N	f	\N
a465657b-323b-45b4-9104-22c2acd0743b	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3e93db-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.881567+00	f	\N	f	\N
23704b93-715d-43d7-afbe-3b3168f26c93	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3eb46e-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.958286+00	f	\N	f	\N
6bdc6ec8-e703-4ba2-ba2e-374a9be765a0	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3ed474-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.039757+00	f	\N	f	\N
a2a2c31a-8f14-4e61-a0c5-2fb18f485077	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3ef46f-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.116433+00	f	\N	f	\N
d8d917a9-e193-40fb-b9dd-4801d5f0b9d1	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3f17aa-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.199265+00	f	\N	f	\N
df5d30a6-aa39-45e9-8d45-822fbd0d782b	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3f3b1a-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:47.27542+00	f	\N	f	\N
3daae83c-1b20-4060-a80d-04612123f62f	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3f5b8c-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.353191+00	f	\N	f	\N
2a8c3196-d048-4ab2-a884-674d1f824846	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3f80e6-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.430345+00	f	\N	f	\N
fbf1ed15-2d23-47ef-af83-f17ad920cdec	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3fa469-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.507437+00	f	\N	f	\N
041a1376-269e-4855-b655-5c16486c8c1e	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3fcdb6-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.58825+00	f	\N	f	\N
a5439baa-f3a9-4390-a9dd-9fa81ef5b781	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3be8b4-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.70701+00	f	\N	f	\N
1df54deb-03da-4a3b-9786-c12dd8a95055	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3c0d7e-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.789056+00	f	\N	f	\N
2d3842a8-079f-4b38-b409-2e4bf124d7c1	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3c33ae-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:45.866092+00	f	\N	f	\N
c773f4b8-586a-4878-b7ce-514be2d6b10e	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3c5661-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.94812+00	f	\N	f	\N
0116d204-23cd-4ff9-a729-2a58e211f61b	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3d0b1f-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:46.024792+00	f	\N	f	\N
b5e1b28c-9c08-4c02-aa5f-5bc463edc9e5	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3d3017-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.102265+00	f	\N	f	\N
d17a0744-0750-46bc-b4a1-907e09844fc8	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3d5095-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.179554+00	f	\N	f	\N
e7ccb964-14f8-4d34-ae22-7f88fae2ac7e	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3d70d1-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.256688+00	f	\N	f	\N
a934b00c-e82c-495c-972c-c53e06d20f3a	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3d907e-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:46.333601+00	f	\N	f	\N
146c85ea-2c4d-42ae-a00b-cc4a21ed125d	e8d67486-6a7e-4018-b313-f461a73cfd70	7e416da2-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "satellite image processing", "spatial data analysis"]}	2026-05-31 10:15:48.622367+00	f	\N	f	\N
0e00f7f8-c915-448f-9f0a-9bfa65d124ce	e8d67486-6a7e-4018-b313-f461a73cfd70	7e418cc6-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.700002+00	f	\N	f	\N
a0363c44-522e-480b-bedf-2711add09637	e8d67486-6a7e-4018-b313-f461a73cfd70	7e41ac04-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:48.782061+00	f	\N	f	\N
3a05da37-90dd-478a-ad10-0d0c782d82d3	e8d67486-6a7e-4018-b313-f461a73cfd70	7e41cb4d-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.859288+00	f	\N	f	\N
801f603c-4ead-44d4-8be0-7732d9c40074	e8d67486-6a7e-4018-b313-f461a73cfd70	7e41ea58-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.93574+00	f	\N	f	\N
9c7dd83b-2c09-46e0-88c4-90a944889976	e8d67486-6a7e-4018-b313-f461a73cfd70	7e42098b-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "satellite image processing", "spatial data analysis"]}	2026-05-31 10:15:49.012851+00	f	\N	f	\N
97682c6f-3ad8-4a1f-bf79-cd3b216062d2	e8d67486-6a7e-4018-b313-f461a73cfd70	7e422bf6-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.090576+00	f	\N	f	\N
1f7852c0-a993-47e0-aacf-0e1493878c38	e8d67486-6a7e-4018-b313-f461a73cfd70	7e424bd1-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.167183+00	f	\N	f	\N
c6dd3301-8161-44fa-9097-0d7e153ef8a4	e8d67486-6a7e-4018-b313-f461a73cfd70	7e427083-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "satellite image processing", "spatial data analysis"]}	2026-05-31 10:15:49.244714+00	f	\N	f	\N
f26c50d2-0ebc-48a5-95ea-d2d6f7e3cec3	e8d67486-6a7e-4018-b313-f461a73cfd70	7e428fd1-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.326113+00	f	\N	f	\N
7b5e5441-45a0-4358-badd-6f942d2baef9	e8d67486-6a7e-4018-b313-f461a73cfd70	7e42aec3-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.403848+00	f	\N	f	\N
9aee518d-8c54-462a-a283-9af27586a5e9	e8d67486-6a7e-4018-b313-f461a73cfd70	7e43150f-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.566796+00	f	\N	f	\N
9367cbd9-acd3-419e-a819-2ecb9cb6ebf3	e8d67486-6a7e-4018-b313-f461a73cfd70	7e433525-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.643948+00	f	\N	f	\N
dc59d5aa-b892-498f-8056-8d5c4859f833	e8d67486-6a7e-4018-b313-f461a73cfd70	7e435464-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.72164+00	f	\N	f	\N
7b098bcd-c30e-46a2-ae47-3d0f11dcec0f	e8d67486-6a7e-4018-b313-f461a73cfd70	7e43747f-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:49.798624+00	f	\N	f	\N
6e5ccda2-a0cd-421d-8eb6-e31b791f23dc	e8d67486-6a7e-4018-b313-f461a73cfd70	7e403323-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.832212+00	f	\N	f	\N
fd9e4a54-e843-4eff-a5f3-f48b44c6cce1	e8d67486-6a7e-4018-b313-f461a73cfd70	7e40539a-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:47.908802+00	f	\N	f	\N
1b8dadff-98cc-403c-a5b3-1a357814137c	e8d67486-6a7e-4018-b313-f461a73cfd70	7e407460-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.988071+00	f	\N	f	\N
3d3fcc62-d1c1-4049-a8c0-76e260bbd981	e8d67486-6a7e-4018-b313-f461a73cfd70	7e4093ad-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:48.068556+00	f	\N	f	\N
d8cbf63c-67d7-45ca-8480-2dcdeb311e9a	e8d67486-6a7e-4018-b313-f461a73cfd70	7e40b30f-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.14603+00	f	\N	f	\N
25274deb-7bc7-4577-b443-486e9a1aea84	e8d67486-6a7e-4018-b313-f461a73cfd70	7e40d214-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.223285+00	f	\N	f	\N
352e4bea-6e68-4887-bab5-b7b31973e1f0	e8d67486-6a7e-4018-b313-f461a73cfd70	7e41101f-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.386194+00	f	\N	f	\N
79ff74fb-deda-4690-b4d8-7904b29b76c1	e8d67486-6a7e-4018-b313-f461a73cfd70	7e412fa1-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.468539+00	f	\N	f	\N
32492625-7e35-4740-afb2-8c99746f94a3	e8d67486-6a7e-4018-b313-f461a73cfd70	7e414e8d-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.544994+00	f	\N	f	\N
544bde4f-dfb5-4f62-a37f-6af0fef09c72	e8d67486-6a7e-4018-b313-f461a73cfd70	d1591b24-c466-4eb1-90c4-230f00b5e6ac	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:50.030317+00	t	2026-06-19 09:08:04.513938+00	t	2026-06-19 09:08:08.360919+00
29b7ceaa-4595-40e1-877e-5433812a8c9a	e8d67486-6a7e-4018-b313-f461a73cfd70	0b5442e4-e580-4e19-a0c6-4201a807c824	0.5700	{"matched_skills": ["gis mapping", "lidar processing", "uav mapping", "satellite image processing"]}	2026-05-31 10:15:42.782881+00	f	\N	f	\N
9fb438a5-9d48-4f03-9251-82d25a0bee28	092ca230-bdca-474b-94f6-945d82ddfddd	7e33587c-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.120246+00	f	\N	f	\N
9117c13d-9c6d-4d33-af9e-6476ef4959b3	e8d67486-6a7e-4018-b313-f461a73cfd70	7e401260-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:47.75113+00	f	\N	f	\N
513750ea-97d7-44b1-b862-6ab3914c1f6b	092ca230-bdca-474b-94f6-945d82ddfddd	7e2b5874-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.034265+00	f	\N	f	\N
aab5de1a-4158-4d68-be9b-b398e1724c97	e8d67486-6a7e-4018-b313-f461a73cfd70	7e35fe43-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:44.213087+00	f	\N	f	\N
ca61533c-ef5c-4d5d-abc9-33eb8b5f8986	e8d67486-6a7e-4018-b313-f461a73cfd70	7e39acd5-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "satellite image processing", "spatial data analysis"]}	2026-05-31 10:15:45.239679+00	t	2026-06-20 05:14:24.430741+00	t	2026-06-20 05:14:25.80732+00
4db3a0d3-1cde-4648-ba9e-48be51981fd0	092ca230-bdca-474b-94f6-945d82ddfddd	7e33820b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.205022+00	f	\N	f	\N
3f5887eb-92e3-4b60-96ae-e38ad9119c89	092ca230-bdca-474b-94f6-945d82ddfddd	7e33a7b4-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.292333+00	f	\N	f	\N
3773e548-69de-4c9a-bb29-9a23b72cfe9d	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3bc3e6-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.629984+00	f	\N	f	\N
a0cb42e1-ebfa-4748-8078-eb0e335d4a14	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3daf61-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:46.411155+00	f	\N	f	\N
4f63b867-c4fe-46b6-9587-6b4180597dd8	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3ff1ce-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:47.669436+00	f	\N	f	\N
a43d428e-9007-47e0-b953-0f5e204e13d0	e8d67486-6a7e-4018-b313-f461a73cfd70	7e40f100-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:48.309665+00	f	\N	f	\N
6743553c-86eb-474a-8866-1f7a6643b9b9	e8d67486-6a7e-4018-b313-f461a73cfd70	7e42cdb6-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.485322+00	f	\N	f	\N
a40c33d3-29cc-42b2-af49-8311a62b7254	e8d67486-6a7e-4018-b313-f461a73cfd70	7e439361-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:49.875475+00	f	\N	f	\N
392e96f9-436a-45f2-9ed0-db9147399433	693a5e71-9e3d-4149-a5a9-cae4e7602451	af00454a-668d-4ba7-bbbf-55cc00053c92	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-06-21 09:54:54.633942+00	f	\N	f	\N
aa0976b3-0aa4-491a-b03b-37cff80e4a95	7ed2ec44-7d2f-4723-a819-15bf2fdbd73f	af00454a-668d-4ba7-bbbf-55cc00053c92	0.5000	{"matched_skills": ["gis mapping", "remote sensing", "satellite image processing", "spatial data analysis"]}	2026-06-21 09:54:55.048605+00	f	\N	f	\N
e8f10456-b31d-44a6-b732-0c0019bf04fe	e8d67486-6a7e-4018-b313-f461a73cfd70	b2946d1f-3f9a-4357-a091-cdf12d10e66f	0.5700	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing"]}	2026-05-31 10:15:49.952421+00	f	\N	f	\N
73bc098c-0678-4435-b998-62fdb8e87201	e8d67486-6a7e-4018-b313-f461a73cfd70	af00454a-668d-4ba7-bbbf-55cc00053c92	1.0000	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "satellite image processing", "spatial data analysis"]}	2026-06-21 09:54:55.452545+00	f	\N	f	\N
d98ba47d-8b8e-4a24-9737-0530c356bef0	092ca230-bdca-474b-94f6-945d82ddfddd	7e33ccc8-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.376829+00	f	\N	f	\N
ff8364e9-fe4c-4499-a7b6-4f9f12959daa	092ca230-bdca-474b-94f6-945d82ddfddd	7e341d4f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.46254+00	f	\N	f	\N
274bea68-a457-4598-a2c1-2abc9d37d1a7	092ca230-bdca-474b-94f6-945d82ddfddd	7e34412d-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.547479+00	f	\N	f	\N
4e0a3dc1-a538-42f8-a543-1ee197bae3c5	e8d67486-6a7e-4018-b313-f461a73cfd70	7e33820b-ddc9-11f0-8727-001a7dda7113	0.8600	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "uav mapping", "spatial data analysis"]}	2026-05-31 10:15:43.041217+00	f	\N	f	\N
a2220250-a529-440c-9c9e-eab372733a08	092ca230-bdca-474b-94f6-945d82ddfddd	0b5442e4-e580-4e19-a0c6-4201a807c824	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:53.931084+00	f	\N	f	\N
55f43473-f8c8-45aa-8df2-5e40aae3f230	e8d67486-6a7e-4018-b313-f461a73cfd70	7e3b9f9f-ddc9-11f0-8727-001a7dda7113	0.7100	{"matched_skills": ["remote sensing", "gis mapping", "geospatial consulting", "lidar processing", "spatial data analysis"]}	2026-05-31 10:15:45.552827+00	f	\N	f	\N
14bdea51-e46c-4680-bc26-632dd7ba750c	092ca230-bdca-474b-94f6-945d82ddfddd	7e34d940-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.89106+00	f	\N	f	\N
02debf15-6a1f-48a5-b169-14746f43f1fc	092ca230-bdca-474b-94f6-945d82ddfddd	7e351e3a-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.989165+00	f	\N	f	\N
6a56742e-e1c9-4382-a3a1-651d12690e28	092ca230-bdca-474b-94f6-945d82ddfddd	7e354bc0-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.077718+00	f	\N	f	\N
2204740c-3979-4ca3-8a26-a901f06963df	092ca230-bdca-474b-94f6-945d82ddfddd	7e357865-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.162576+00	f	\N	f	\N
db7336d9-2efc-413f-b9cc-16ae3f175720	092ca230-bdca-474b-94f6-945d82ddfddd	7e359a1b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.247903+00	f	\N	f	\N
d28b7305-ed55-4847-9f59-3c4a7f1e42e3	092ca230-bdca-474b-94f6-945d82ddfddd	7e35bbb2-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.332578+00	f	\N	f	\N
e7085614-b953-4a78-8661-e018b732a481	092ca230-bdca-474b-94f6-945d82ddfddd	7e35dcc4-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.415238+00	f	\N	f	\N
7f7e5279-fefa-45af-94ca-6d1f3c524c53	092ca230-bdca-474b-94f6-945d82ddfddd	7e35fe43-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.500403+00	f	\N	f	\N
95e08334-0e14-4168-bff4-082056eb3a9c	092ca230-bdca-474b-94f6-945d82ddfddd	7e361ecf-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.583931+00	f	\N	f	\N
9456362b-d352-4fcd-8a3d-1833dca43671	092ca230-bdca-474b-94f6-945d82ddfddd	7e363f68-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.670212+00	f	\N	f	\N
0aa4f7a2-71d2-446c-91ef-3cb50cfae783	092ca230-bdca-474b-94f6-945d82ddfddd	7e36604b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.756054+00	f	\N	f	\N
db06693e-9747-4893-b0db-8b582a8fa335	092ca230-bdca-474b-94f6-945d82ddfddd	7e3684a5-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.841878+00	f	\N	f	\N
414af678-1c32-4d25-bfb3-58d3f7d6159a	092ca230-bdca-474b-94f6-945d82ddfddd	7e36a411-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:55.927642+00	f	\N	f	\N
178e518b-bd5e-4c17-890a-faa8f807ffbd	092ca230-bdca-474b-94f6-945d82ddfddd	7e36c538-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.012611+00	f	\N	f	\N
ed329092-4ef0-4540-89ec-87c7b878d729	092ca230-bdca-474b-94f6-945d82ddfddd	7e36e561-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.104534+00	f	\N	f	\N
c00be51c-7f6b-43bc-8b1d-561d532b0daf	092ca230-bdca-474b-94f6-945d82ddfddd	7e3706bc-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.188729+00	f	\N	f	\N
a541e065-42b7-411b-879d-a7e3c4eb0014	092ca230-bdca-474b-94f6-945d82ddfddd	7e372884-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.274914+00	f	\N	f	\N
5de04839-9d58-4989-b433-551b2a21c026	092ca230-bdca-474b-94f6-945d82ddfddd	7e385d29-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.361157+00	f	\N	f	\N
e9879432-312a-4be6-9310-841fb67b22ea	092ca230-bdca-474b-94f6-945d82ddfddd	7e396228-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.446744+00	f	\N	f	\N
05388195-e11e-48e6-8a85-bb13927e6e8a	092ca230-bdca-474b-94f6-945d82ddfddd	7e398a41-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.531857+00	f	\N	f	\N
c006086b-a287-46ba-b3e1-e4b37eaf9224	092ca230-bdca-474b-94f6-945d82ddfddd	7e39acd5-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.617091+00	f	\N	f	\N
683ad762-0cb1-4ce3-9ac5-4e1443105300	092ca230-bdca-474b-94f6-945d82ddfddd	7e39eaab-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.702135+00	f	\N	f	\N
b75881a5-9753-4ad5-aebc-56122f2b0212	092ca230-bdca-474b-94f6-945d82ddfddd	7e3a0948-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.878359+00	f	\N	f	\N
d785352e-873c-413d-806d-efcaf9a6ae8e	092ca230-bdca-474b-94f6-945d82ddfddd	7e3a2715-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:56.993349+00	f	\N	f	\N
c65d9763-5320-48fb-b3c0-a72164e4eafa	092ca230-bdca-474b-94f6-945d82ddfddd	7e3b9f9f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.122987+00	f	\N	f	\N
05408764-26b9-4c12-bdbb-50fd2de123c6	092ca230-bdca-474b-94f6-945d82ddfddd	7e3bc3e6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.242697+00	f	\N	f	\N
e0de7376-bc88-49fd-aa34-9183aa1f0b98	092ca230-bdca-474b-94f6-945d82ddfddd	7e3c0d7e-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.499922+00	f	\N	f	\N
83cf131c-f74f-452b-87fb-427e9e799227	092ca230-bdca-474b-94f6-945d82ddfddd	7e3c33ae-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.624454+00	f	\N	f	\N
622e5260-1ca3-487b-b645-0313457015ee	092ca230-bdca-474b-94f6-945d82ddfddd	7e3c5661-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.712298+00	f	\N	f	\N
dd2da190-c24f-44f7-a00a-561885590c49	092ca230-bdca-474b-94f6-945d82ddfddd	7e3d0b1f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.797515+00	f	\N	f	\N
8a506a62-8e33-4bf7-90b3-3268ab762555	092ca230-bdca-474b-94f6-945d82ddfddd	7e3d3017-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.882657+00	f	\N	f	\N
aca60e0b-53a4-4a7e-a5cd-d3ecec61a9e0	092ca230-bdca-474b-94f6-945d82ddfddd	7e3d5095-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.968625+00	f	\N	f	\N
6a91f0fb-af52-42b2-83c7-05351f5ca758	092ca230-bdca-474b-94f6-945d82ddfddd	7e3d70d1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.05372+00	f	\N	f	\N
ed6af929-fa84-42fa-bd12-1f4354034f79	092ca230-bdca-474b-94f6-945d82ddfddd	7e3d907e-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.139985+00	f	\N	f	\N
d65378bc-f2e0-4047-8bb3-bbc70a3ed5fd	092ca230-bdca-474b-94f6-945d82ddfddd	7e348867-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.7202+00	f	\N	f	\N
18983795-7377-47a6-9ccc-4065ae1679a1	092ca230-bdca-474b-94f6-945d82ddfddd	7e34ae0e-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.804871+00	f	\N	f	\N
c06f27cb-da48-4147-be0c-c1d1de0a405a	092ca230-bdca-474b-94f6-945d82ddfddd	7e3e0dc1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.485502+00	f	\N	f	\N
444b423f-182e-4a20-b000-6339d1d5001d	092ca230-bdca-474b-94f6-945d82ddfddd	7e3e2e3f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.569809+00	f	\N	f	\N
30e168dd-389c-476f-aba7-5b2bda85515a	092ca230-bdca-474b-94f6-945d82ddfddd	7e3e4e3c-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.65372+00	f	\N	f	\N
efc439b2-f4d3-408a-a70a-f72fdbfec9d5	092ca230-bdca-474b-94f6-945d82ddfddd	7e3e93db-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.738722+00	f	\N	f	\N
f936b332-9b5f-4cc5-ad90-0d187e69e254	092ca230-bdca-474b-94f6-945d82ddfddd	7e3eb46e-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.825128+00	f	\N	f	\N
e1384937-6867-4e74-b462-dd5bc87ef8c9	092ca230-bdca-474b-94f6-945d82ddfddd	7e3ed474-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.90984+00	f	\N	f	\N
1b5b150b-8447-489c-abfe-4ae0d1e548e7	092ca230-bdca-474b-94f6-945d82ddfddd	7e3ef46f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.996059+00	f	\N	f	\N
a4f0c281-3618-4c64-8e87-da5de4f842c4	092ca230-bdca-474b-94f6-945d82ddfddd	7e3f17aa-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.080507+00	f	\N	f	\N
9137b9b9-2738-414d-8159-4391ee7f50cb	092ca230-bdca-474b-94f6-945d82ddfddd	7e3f3b1a-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.167681+00	f	\N	f	\N
628a2a65-be06-4c47-8782-cc5be7ecc796	092ca230-bdca-474b-94f6-945d82ddfddd	7e3f5b8c-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.252765+00	f	\N	f	\N
4e9b80b0-69a6-497c-ab4f-9d9f9360c5c6	092ca230-bdca-474b-94f6-945d82ddfddd	7e3f80e6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.337934+00	f	\N	f	\N
4a98d552-005a-4ffc-b4b4-66196106a0af	092ca230-bdca-474b-94f6-945d82ddfddd	7e3fa469-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.423242+00	f	\N	f	\N
b88a763a-7355-4974-97b2-53c66489504d	092ca230-bdca-474b-94f6-945d82ddfddd	7e3fcdb6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.509451+00	f	\N	f	\N
6183e37e-392f-4bae-b1ef-e9c50d4138da	092ca230-bdca-474b-94f6-945d82ddfddd	7e3ff1ce-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.595077+00	f	\N	f	\N
f0fbad80-444d-4932-a3b5-f355dd1f4fda	092ca230-bdca-474b-94f6-945d82ddfddd	7e401260-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.682078+00	f	\N	f	\N
8bb497b1-e3c3-4030-aa3d-9a6a29f150c9	092ca230-bdca-474b-94f6-945d82ddfddd	7e403323-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.768842+00	f	\N	f	\N
43860c1e-8d62-4ef9-853d-c2d596126500	092ca230-bdca-474b-94f6-945d82ddfddd	7e40539a-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.854855+00	f	\N	f	\N
273254ba-44af-4485-a1cc-eb6202e85926	092ca230-bdca-474b-94f6-945d82ddfddd	7e407460-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:59.939316+00	f	\N	f	\N
40f94f53-a62a-488a-b68b-3f16e3fb0201	092ca230-bdca-474b-94f6-945d82ddfddd	7e4093ad-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.025476+00	f	\N	f	\N
54759970-8268-43ec-8371-1d49da0edb9e	092ca230-bdca-474b-94f6-945d82ddfddd	7e40b30f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.109516+00	f	\N	f	\N
134d144e-2ce0-4d79-aa73-ba76fd72d505	092ca230-bdca-474b-94f6-945d82ddfddd	7e40d214-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.192823+00	f	\N	f	\N
6a048955-c014-452f-8ed5-601456c80b7f	092ca230-bdca-474b-94f6-945d82ddfddd	7e40f100-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.277221+00	f	\N	f	\N
162d12a7-9133-40f7-b7e0-f76a14bb6392	092ca230-bdca-474b-94f6-945d82ddfddd	7e41101f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.363198+00	f	\N	f	\N
c853af3c-722b-46c8-a56a-65ddc81e4a88	092ca230-bdca-474b-94f6-945d82ddfddd	7e412fa1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.448334+00	f	\N	f	\N
902b1580-1bb5-4917-9606-243ef51cabb1	092ca230-bdca-474b-94f6-945d82ddfddd	7e414e8d-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.534571+00	f	\N	f	\N
7bf07943-76e2-4031-b3cd-63b9cebdfcac	092ca230-bdca-474b-94f6-945d82ddfddd	7e416da2-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.619483+00	f	\N	f	\N
854c77e3-c79a-4186-9749-daff3de560ae	092ca230-bdca-474b-94f6-945d82ddfddd	7e41ac04-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.791038+00	f	\N	f	\N
94588f85-af72-497a-880c-fde75af78b9b	092ca230-bdca-474b-94f6-945d82ddfddd	7e41cb4d-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.876895+00	f	\N	f	\N
4ca01e38-c89a-47d8-91f7-31824af5aff2	092ca230-bdca-474b-94f6-945d82ddfddd	7e41ea58-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.960514+00	f	\N	f	\N
64a94bbf-5617-4959-8ab6-001af98acc1d	092ca230-bdca-474b-94f6-945d82ddfddd	7e42098b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.047103+00	f	\N	f	\N
bd5e3368-c1a4-4c2d-adcf-fe59a641a7bd	092ca230-bdca-474b-94f6-945d82ddfddd	7e422bf6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.131579+00	f	\N	f	\N
668e6f3b-e2f0-465c-ac77-244e0349d2b3	092ca230-bdca-474b-94f6-945d82ddfddd	7e424bd1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.217752+00	f	\N	f	\N
0ed9f774-fa40-48dd-9853-1b36b12ae2f8	092ca230-bdca-474b-94f6-945d82ddfddd	7e427083-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.302933+00	f	\N	f	\N
0974d6c0-1b7b-4b10-a0db-ce79d7df94cd	092ca230-bdca-474b-94f6-945d82ddfddd	7e428fd1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.390282+00	f	\N	f	\N
90f8ea21-972a-481f-ad67-ec0709dcb3c2	092ca230-bdca-474b-94f6-945d82ddfddd	7e3dcef8-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.311151+00	f	\N	f	\N
29091946-c759-4640-b471-a4f3bb9a104f	092ca230-bdca-474b-94f6-945d82ddfddd	7e3dee5f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.40011+00	f	\N	f	\N
01f3c810-945c-4454-94bc-5d243dbaf902	78fc9b54-6736-40e7-9e89-e4e28f42499a	0b5442e4-e580-4e19-a0c6-4201a807c824	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:23.732347+00	f	\N	f	\N
7761f675-fe97-4f5c-8359-c1999c5c4824	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e2b5874-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:23.831117+00	f	\N	f	\N
9c823558-ecce-4f43-b8aa-425fe94fd20f	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e33587c-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.103293+00	f	\N	f	\N
9b921ec6-59db-47a2-84be-fb6c92dff1cb	092ca230-bdca-474b-94f6-945d82ddfddd	7e34647a-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:54.631456+00	f	\N	f	\N
3472ceb2-c292-4057-8ec0-f66b522876ab	092ca230-bdca-474b-94f6-945d82ddfddd	7e3be8b4-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:57.372356+00	f	\N	f	\N
aa9f1dba-839c-4043-9adc-0a922572efac	092ca230-bdca-474b-94f6-945d82ddfddd	7e3daf61-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:31:58.224443+00	f	\N	f	\N
e01b2eba-d15a-4b29-b6a5-5fb1919d9ad6	092ca230-bdca-474b-94f6-945d82ddfddd	7e418cc6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:00.706012+00	f	\N	f	\N
6612144d-98a2-474d-8e69-e8b8adbb926b	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e33820b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.187827+00	f	\N	f	\N
5ea165fa-fc1d-42d8-ab64-e46a15e22dbb	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e33a7b4-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.286371+00	f	\N	f	\N
89930f01-becc-4df7-8d10-a9e5728241f4	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e33ccc8-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.370232+00	f	\N	f	\N
d8052fd1-9dcc-49a9-a124-36746c726c2a	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e341d4f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.465493+00	f	\N	f	\N
ac85327e-2452-41d7-90c1-fd6262b498df	092ca230-bdca-474b-94f6-945d82ddfddd	7e42aec3-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.47219+00	f	\N	f	\N
f0ab3fcc-b4ab-423e-aace-c1447e6aa9da	092ca230-bdca-474b-94f6-945d82ddfddd	7e42cdb6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.555923+00	f	\N	f	\N
f71ce708-b391-4ab3-897e-23e4b16c4ab5	092ca230-bdca-474b-94f6-945d82ddfddd	7e43150f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.639275+00	f	\N	f	\N
e22800ce-ba5f-44cf-9f51-2c942d0c3cca	092ca230-bdca-474b-94f6-945d82ddfddd	7e433525-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.722202+00	f	\N	f	\N
a1de6146-9628-47ed-b326-cfb59706fe46	092ca230-bdca-474b-94f6-945d82ddfddd	7e435464-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.80583+00	f	\N	f	\N
f8c37f5b-841e-40e1-b8cd-d20f8ac684d0	092ca230-bdca-474b-94f6-945d82ddfddd	7e43747f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.891229+00	f	\N	f	\N
db2f2f97-a742-4c7c-a02e-8161c17437dd	092ca230-bdca-474b-94f6-945d82ddfddd	7e439361-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:01.975733+00	f	\N	f	\N
7c5778bf-31be-4663-9a91-bb76c611e039	092ca230-bdca-474b-94f6-945d82ddfddd	b2946d1f-3f9a-4357-a091-cdf12d10e66f	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:02.062345+00	f	\N	f	\N
993ff034-d86e-4a13-b908-aaec81293258	092ca230-bdca-474b-94f6-945d82ddfddd	d1591b24-c466-4eb1-90c4-230f00b5e6ac	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:02.146375+00	f	\N	f	\N
d83ab26e-15c3-4b29-a0ac-3aa6a48351fa	092ca230-bdca-474b-94f6-945d82ddfddd	af00454a-668d-4ba7-bbbf-55cc00053c92	0.5000	{"matched_skills": ["gis"]}	2026-06-21 10:32:02.232269+00	f	\N	f	\N
718a445b-be98-4f34-b75c-f496b934ec36	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e34647a-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.647064+00	f	\N	f	\N
7dcd988e-9b6e-48ed-b38b-022d687dff70	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e348867-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.729721+00	f	\N	f	\N
d19ab6fd-ed53-4b61-af82-f8eb970fab63	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e34ae0e-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.823852+00	f	\N	f	\N
0b5b4032-3c64-4457-b622-e9152ce543b6	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e34d940-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.906653+00	f	\N	f	\N
0c098748-0910-481f-8dd5-0bbd31ae9bae	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e351e3a-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.006726+00	f	\N	f	\N
1be92a6f-efe4-4573-8285-8caafa559b2d	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e354bc0-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.090261+00	f	\N	f	\N
c8cf4d31-61c6-4792-b0c3-b4afcba2c0a6	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e357865-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.193456+00	f	\N	f	\N
788f2772-af75-4406-8a58-a87fed29f1ed	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e359a1b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.275721+00	f	\N	f	\N
5ebc7d02-5e63-4638-8b46-21cde37c839f	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e35bbb2-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.37157+00	f	\N	f	\N
c4968c43-4ecc-4afb-96b4-e92988f614c6	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e35dcc4-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.4533+00	f	\N	f	\N
113be2b6-22e5-4dfd-9dce-40753fb35f7b	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e35fe43-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.547706+00	f	\N	f	\N
cb8c6665-3ac5-453b-aceb-e2b1105488b6	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e361ecf-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.62961+00	f	\N	f	\N
70ccd372-1933-45fc-993b-32fa6ee4a673	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e363f68-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.726449+00	f	\N	f	\N
c473c110-9bbd-4b5b-90a3-660609909c5a	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e36604b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.809378+00	f	\N	f	\N
fe85ba9c-94e3-40b4-80df-db37fad57ff5	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3684a5-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.90745+00	f	\N	f	\N
6f086a01-2fb4-4a77-b8ea-8d546007cb76	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e36a411-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:25.99345+00	f	\N	f	\N
578bd8ac-a3d6-4472-8449-ae79cb7385d0	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e36c538-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.091611+00	f	\N	f	\N
a0611525-e075-4ecd-ab93-df610cb950b9	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e36e561-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.172741+00	f	\N	f	\N
5fcf9af5-2d22-4a76-8d83-e67c48b4d603	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3706bc-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.27142+00	f	\N	f	\N
c305659d-0051-4117-aac7-b7b2bbd4ae9c	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e372884-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.353598+00	f	\N	f	\N
91061457-da6d-4f2a-bc71-d6e23e22120f	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e385d29-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.451865+00	f	\N	f	\N
50fbbeaf-8212-4a84-ac90-8471e3db77ff	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e396228-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.533656+00	f	\N	f	\N
9072132a-dd67-4911-801c-235c5fb81cff	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e398a41-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.628484+00	f	\N	f	\N
99d2e722-1f48-4ba9-aa66-5f95c902612e	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e39acd5-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.709908+00	f	\N	f	\N
0509195a-c519-45d2-a6a1-31c509e8d134	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e39eaab-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.806062+00	f	\N	f	\N
2e7ef37a-378f-4660-b2ed-52483eb03140	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3a0948-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.887797+00	f	\N	f	\N
6beb81dc-4eae-4b27-9560-c49e1f29e845	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3a2715-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:26.982715+00	f	\N	f	\N
507e9614-9c8f-4192-b720-3738bc39da2d	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3b9f9f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:27.06818+00	f	\N	f	\N
74d81409-3788-44d8-ad0a-9eaa95c09c19	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3be8b4-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:27.340216+00	f	\N	f	\N
1111c107-bfa6-4b6e-836f-b2422169ed39	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3c0d7e-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:27.458154+00	f	\N	f	\N
4e107c6d-57d5-4b9a-a6af-af797c71c0c5	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3c33ae-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:27.581448+00	f	\N	f	\N
a9404244-f5fb-46d5-a4b4-a4d99b994420	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3c5661-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:27.708699+00	f	\N	f	\N
1d387486-97d9-4428-bb96-4e381b587461	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3d0b1f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.139183+00	f	\N	f	\N
738e9ba1-8b3c-4cb0-a6c3-a38256aa4ac5	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3d3017-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.234765+00	f	\N	f	\N
778d2313-a873-4ed2-870e-bf0ad11ca9cf	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3d5095-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.318357+00	f	\N	f	\N
5a264884-b8b6-481d-9204-0496352a677c	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3d70d1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.414662+00	f	\N	f	\N
02cb63f9-a0c4-453f-9001-5e3b143d78f6	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3daf61-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.596979+00	f	\N	f	\N
d671932f-4ceb-41ff-a056-bc85ef7f96dc	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3dcef8-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.678323+00	f	\N	f	\N
d1ab4a80-f9a3-4a5a-b862-0126f6ec34ff	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3dee5f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.774226+00	f	\N	f	\N
c9edfdc7-3d56-40c0-8477-f6cfe20ffe9f	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3e0dc1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.856226+00	f	\N	f	\N
84eeb9bd-e5f3-42a8-8887-5ee263774c0c	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3e2e3f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.951598+00	f	\N	f	\N
90a9d748-ee7e-45e8-a40b-93b2ec1bac52	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3e4e3c-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.03395+00	f	\N	f	\N
b2555ad5-5bb9-4138-a680-efb51acf8773	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3e93db-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.131002+00	f	\N	f	\N
b76c8213-ae5f-4a47-9c99-7061728dba06	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3eb46e-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.213795+00	f	\N	f	\N
82f5d31a-396d-4b3f-966d-7bb45db9305a	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3ed474-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.316659+00	f	\N	f	\N
90ad11b5-35af-4c6a-a237-dc966bd97586	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3ef46f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.399664+00	f	\N	f	\N
b0dfd205-4587-4be4-98d7-7ae9746856ae	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3f17aa-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.495843+00	f	\N	f	\N
9f250bc5-9726-4a18-a56d-9c254899cefd	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3f3b1a-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.580088+00	f	\N	f	\N
ea2e8c67-4dce-4519-8c0b-e19fe13ca4ec	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3f5b8c-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.675886+00	f	\N	f	\N
3a3b01e8-eb69-4dfc-9a14-8b42e5906d48	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3f80e6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.758569+00	f	\N	f	\N
ea641358-0d8c-4371-b518-12618acce533	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3fa469-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.853937+00	f	\N	f	\N
b158b047-f644-4ccd-b420-10aad37235f2	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3fcdb6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:29.936667+00	f	\N	f	\N
4fb99de6-c2b9-4e49-b10e-4fc25f0d1dcc	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3ff1ce-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.035653+00	f	\N	f	\N
10d1c852-90be-440b-964f-d3f491263ee7	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e401260-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.117391+00	f	\N	f	\N
eae1c174-a066-4e23-aae0-f4f45729df33	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e403323-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.212284+00	f	\N	f	\N
50d31309-58b0-415a-afc8-54483eec1605	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e40539a-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.31881+00	f	\N	f	\N
49eac3a3-0a49-4f1f-a442-620f57f284e2	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e407460-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.421797+00	f	\N	f	\N
33f1d8d2-d299-46b0-a445-79cedf89f9cf	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e4093ad-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.507512+00	f	\N	f	\N
62f87c06-64e0-4553-a93e-8667efdcd2fe	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e40b30f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.605762+00	f	\N	f	\N
a4ca11f2-fbda-4b06-9cfb-ccef3381e54b	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e40d214-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.68722+00	f	\N	f	\N
cbf76ac6-c0f7-4cfb-9ab3-18a446123708	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e40f100-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.782595+00	f	\N	f	\N
f6395d89-a577-4945-913f-491fea2273ce	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e41101f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.864506+00	f	\N	f	\N
74be242a-c719-455b-8650-6eb5e1f6f48e	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e412fa1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:30.962932+00	f	\N	f	\N
e7172e50-3fe7-49ac-ba62-9544f050921b	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e414e8d-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.049298+00	f	\N	f	\N
afbed5fd-a914-4980-88c0-c824695ad896	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e418cc6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.229434+00	f	\N	f	\N
2d207c62-7820-4538-87ed-efa584cd9343	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e41ac04-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.328955+00	f	\N	f	\N
fea67f5b-2c1f-4604-8a4f-05c383d28a83	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e41cb4d-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.413166+00	f	\N	f	\N
d41525f6-df0c-4bca-8d95-d9becd8982b1	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e41ea58-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.512018+00	f	\N	f	\N
f3ed94c7-2fd0-414c-a1f1-6a037c6dfc17	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e42098b-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.598982+00	f	\N	f	\N
919413d8-8c14-4d40-9369-16c6bf78d19e	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e422bf6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.693725+00	f	\N	f	\N
975afb82-ce1c-4cdd-a8e2-a45b39b22d02	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e424bd1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.775365+00	f	\N	f	\N
19526837-6ead-4dd8-8d65-7ca9a233522f	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e427083-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.87042+00	f	\N	f	\N
72ed1a29-6d88-4a92-8e69-f5d0d3b33c4b	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e34412d-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:24.547745+00	f	\N	f	\N
02b29cfc-f9b9-4684-b09b-d263f0897775	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3bc3e6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:27.217776+00	f	\N	f	\N
72fbaf59-c776-4a18-9cab-4068b359d70c	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e3d907e-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:28.498112+00	f	\N	f	\N
663ff8c2-65dd-4a9c-84de-075ea875cc79	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e416da2-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.147611+00	f	\N	f	\N
4eef5758-deac-42ac-a6d4-03a85798c42b	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e428fd1-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:31.953068+00	f	\N	f	\N
b530cd6e-a610-4654-9301-315dc22fad9f	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e42aec3-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.048128+00	f	\N	f	\N
f33e57ac-e6ed-4479-b213-6f6e10af6a9b	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e42cdb6-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.129273+00	f	\N	f	\N
297ed856-8cb7-491c-961a-c123a7380dc2	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e43150f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.224942+00	f	\N	f	\N
282ac2ef-e5b2-45f7-85b1-1144b28575e5	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e433525-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.308131+00	f	\N	f	\N
7b786cbf-b223-4c9d-8cb1-0a54b0cad46e	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e435464-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.404388+00	f	\N	f	\N
a49fe586-43ad-4363-acc8-9ef3ca20713c	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e43747f-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.485142+00	f	\N	f	\N
ef1bba10-c20f-4605-b45d-473f0d97baa6	78fc9b54-6736-40e7-9e89-e4e28f42499a	7e439361-ddc9-11f0-8727-001a7dda7113	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.583896+00	f	\N	f	\N
d1a7e3be-4f99-483d-92b7-94dfead94aec	78fc9b54-6736-40e7-9e89-e4e28f42499a	b2946d1f-3f9a-4357-a091-cdf12d10e66f	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.665+00	f	\N	f	\N
9f221e28-5c7a-43c6-9b8a-8269be04f5a6	78fc9b54-6736-40e7-9e89-e4e28f42499a	d1591b24-c466-4eb1-90c4-230f00b5e6ac	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.761794+00	f	\N	f	\N
0ed0192d-fa09-4044-bbc0-0718fdde6778	78fc9b54-6736-40e7-9e89-e4e28f42499a	af00454a-668d-4ba7-bbbf-55cc00053c92	0.5000	{"matched_skills": ["gis"]}	2026-06-21 11:07:32.843679+00	f	\N	f	\N
\.


--
-- Data for Name: servicecategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.servicecategory (category_id, parent_category_id, category_name, description, embedding_vector) FROM stdin;
\.


--
-- Data for Name: servicelisting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.servicelisting (service_id, provider_id, category_id, title, description, price_type, base_price, tags, embedding_vector, status, tags_search) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, session_token, user_id, expires) FROM stdin;
1	6f48eb64f813aba631ce73d95de9e9a8738f20b3b31f118a69a7076d74ba5039	b2946d1f-3f9a-4357-a091-cdf12d10e66f	2026-06-26 07:36:23.52+00
25	7610782614645eccd5640097696ebce94d54e830402c5cd85153c6d203205ff7	d1591b24-c466-4eb1-90c4-230f00b5e6ac	2026-06-30 09:06:57.814+00
28	84f547290361628d5a5ce949058da616b4b1aa90cf60c1f0007393d68d7b65f1	83e66b9a-5db0-48f7-a05b-b20eb323a1af	2026-06-30 09:51:53.739+00
31	7a5dc80f7aa8e1f1fd55d7557355378a3311bc80dbe2bdc72db13443f34aac8b	cf6ec6f0-f1e7-49ab-8e77-319986aba191	2026-06-30 10:14:35.922+00
36	3e8368efca8e157190213c8848d09505859d7973b03d184a60e8332567ad47a0	d2722a45-5d22-4c29-af62-3eb7096a10f5	2026-07-20 05:00:24.208+00
41	e62f41ddd874edb020f546fcb70968fc4007c712c581a3d72a3110e411307136	a4ce51b4-cc35-4b0e-9490-2dfa9f2aff80	2026-07-21 18:25:57.824+00
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: subscriptionplan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptionplan (id, name, monthly_price, monthly_credits, is_active) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (user_id, email, password_hash, user_type, join_date, last_login, status, phone_number) FROM stdin;
7e359a1b-ddc9-11f0-8727-001a7dda7113	user.7e359a1b@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e35bbb2-ddc9-11f0-8727-001a7dda7113	user.7e35bbb2@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e35dcc4-ddc9-11f0-8727-001a7dda7113	user.7e35dcc4@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e35fe43-ddc9-11f0-8727-001a7dda7113	user.7e35fe43@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e361ecf-ddc9-11f0-8727-001a7dda7113	user.7e361ecf@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e363f68-ddc9-11f0-8727-001a7dda7113	user.7e363f68@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e36604b-ddc9-11f0-8727-001a7dda7113	user.7e36604b@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3684a5-ddc9-11f0-8727-001a7dda7113	user.7e3684a5@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e36a411-ddc9-11f0-8727-001a7dda7113	user.7e36a411@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e36c538-ddc9-11f0-8727-001a7dda7113	user.7e36c538@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e36e561-ddc9-11f0-8727-001a7dda7113	user.7e36e561@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3706bc-ddc9-11f0-8727-001a7dda7113	user.7e3706bc@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e372884-ddc9-11f0-8727-001a7dda7113	user.7e372884@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e385d29-ddc9-11f0-8727-001a7dda7113	user.7e385d29@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e396228-ddc9-11f0-8727-001a7dda7113	user.7e396228@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e398a41-ddc9-11f0-8727-001a7dda7113	user.7e398a41@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e39eaab-ddc9-11f0-8727-001a7dda7113	user.7e39eaab@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3a0948-ddc9-11f0-8727-001a7dda7113	user.7e3a0948@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3a2715-ddc9-11f0-8727-001a7dda7113	user.7e3a2715@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3b9f9f-ddc9-11f0-8727-001a7dda7113	user.7e3b9f9f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3bc3e6-ddc9-11f0-8727-001a7dda7113	user.7e3bc3e6@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3be8b4-ddc9-11f0-8727-001a7dda7113	user.7e3be8b4@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3c0d7e-ddc9-11f0-8727-001a7dda7113	user.7e3c0d7e@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3c33ae-ddc9-11f0-8727-001a7dda7113	user.7e3c33ae@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3c5661-ddc9-11f0-8727-001a7dda7113	user.7e3c5661@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3d0b1f-ddc9-11f0-8727-001a7dda7113	user.7e3d0b1f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3d3017-ddc9-11f0-8727-001a7dda7113	user.7e3d3017@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3d5095-ddc9-11f0-8727-001a7dda7113	user.7e3d5095@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3d70d1-ddc9-11f0-8727-001a7dda7113	user.7e3d70d1@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3d907e-ddc9-11f0-8727-001a7dda7113	user.7e3d907e@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3daf61-ddc9-11f0-8727-001a7dda7113	user.7e3daf61@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3dcef8-ddc9-11f0-8727-001a7dda7113	user.7e3dcef8@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3dee5f-ddc9-11f0-8727-001a7dda7113	user.7e3dee5f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3e0dc1-ddc9-11f0-8727-001a7dda7113	user.7e3e0dc1@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3e2e3f-ddc9-11f0-8727-001a7dda7113	user.7e3e2e3f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3e4e3c-ddc9-11f0-8727-001a7dda7113	user.7e3e4e3c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3e93db-ddc9-11f0-8727-001a7dda7113	user.7e3e93db@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3eb46e-ddc9-11f0-8727-001a7dda7113	user.7e3eb46e@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3ed474-ddc9-11f0-8727-001a7dda7113	user.7e3ed474@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3ef46f-ddc9-11f0-8727-001a7dda7113	user.7e3ef46f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3f17aa-ddc9-11f0-8727-001a7dda7113	user.7e3f17aa@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3f3b1a-ddc9-11f0-8727-001a7dda7113	user.7e3f3b1a@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3f5b8c-ddc9-11f0-8727-001a7dda7113	user.7e3f5b8c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3f80e6-ddc9-11f0-8727-001a7dda7113	user.7e3f80e6@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3fa469-ddc9-11f0-8727-001a7dda7113	user.7e3fa469@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3fcdb6-ddc9-11f0-8727-001a7dda7113	user.7e3fcdb6@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e3ff1ce-ddc9-11f0-8727-001a7dda7113	user.7e3ff1ce@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e401260-ddc9-11f0-8727-001a7dda7113	user.7e401260@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e403323-ddc9-11f0-8727-001a7dda7113	user.7e403323@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e40539a-ddc9-11f0-8727-001a7dda7113	user.7e40539a@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e407460-ddc9-11f0-8727-001a7dda7113	user.7e407460@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e4093ad-ddc9-11f0-8727-001a7dda7113	user.7e4093ad@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e40b30f-ddc9-11f0-8727-001a7dda7113	user.7e40b30f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e40d214-ddc9-11f0-8727-001a7dda7113	user.7e40d214@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e40f100-ddc9-11f0-8727-001a7dda7113	user.7e40f100@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e41101f-ddc9-11f0-8727-001a7dda7113	user.7e41101f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e412fa1-ddc9-11f0-8727-001a7dda7113	user.7e412fa1@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e414e8d-ddc9-11f0-8727-001a7dda7113	user.7e414e8d@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e416da2-ddc9-11f0-8727-001a7dda7113	user.7e416da2@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e418cc6-ddc9-11f0-8727-001a7dda7113	user.7e418cc6@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e41ac04-ddc9-11f0-8727-001a7dda7113	user.7e41ac04@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e41cb4d-ddc9-11f0-8727-001a7dda7113	user.7e41cb4d@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e41ea58-ddc9-11f0-8727-001a7dda7113	user.7e41ea58@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e42098b-ddc9-11f0-8727-001a7dda7113	user.7e42098b@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e422bf6-ddc9-11f0-8727-001a7dda7113	user.7e422bf6@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e424bd1-ddc9-11f0-8727-001a7dda7113	user.7e424bd1@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e427083-ddc9-11f0-8727-001a7dda7113	user.7e427083@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e428fd1-ddc9-11f0-8727-001a7dda7113	user.7e428fd1@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e42aec3-ddc9-11f0-8727-001a7dda7113	user.7e42aec3@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e42cdb6-ddc9-11f0-8727-001a7dda7113	user.7e42cdb6@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e43150f-ddc9-11f0-8727-001a7dda7113	user.7e43150f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e433525-ddc9-11f0-8727-001a7dda7113	user.7e433525@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e435464-ddc9-11f0-8727-001a7dda7113	user.7e435464@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e43747f-ddc9-11f0-8727-001a7dda7113	user.7e43747f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e439361-ddc9-11f0-8727-001a7dda7113	user.7e439361@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
a23f7c25-7690-4acf-ae4a-096a5db9ec4d	user.a23f7c25@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
c11473bf-520b-46e1-a26c-68b4e2ce1376	user.c11473bf@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
eb580aee-cc64-4485-bdbe-f5769fd9283b	user.eb580aee@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
b2946d1f-3f9a-4357-a091-cdf12d10e66f	provider11@gmail.com	$2b$12$RDTx9hw8vhKaxawPeYBr9evpj/Nur24w6YLT72mAgjcyW3p677GUe	provider	2026-05-27 07:36:05.734869+00	2026-05-27 07:36:24.471083+00	active	9144448888
af00454a-668d-4ba7-bbbf-55cc00053c92	saranshg180@gmail.com	$2b$12$SdKb4Le2RhkOIFYNrBug7OBJ1Ik1WveyeGfG0WBY3W7bvOJ8VJmgi	provider	2026-06-21 09:54:53.790158+00	\N	active	+917017025630
a4ce51b4-cc35-4b0e-9490-2dfa9f2aff80	admin1@gmail.com	$2b$12$UDBG8KYSAaU3KxejGiB0guuyhG/im6G2ocN60LuhGoLGpMyt6.k.y	admin	2026-05-31 08:10:13.075511+00	2026-06-21 18:25:58.594189+00	active	+919999555598
83e66b9a-5db0-48f7-a05b-b20eb323a1af	buyer21@gmail.com	$2b$12$H91AZf1BvMMQmfWgps1N4OMcdQQaXdFSmcoC62QTX6AHOWk8YG8We	buyer	2026-05-31 07:42:07.394638+00	2026-05-31 09:51:54.51262+00	active	+919999888874
cf6ec6f0-f1e7-49ab-8e77-319986aba191	buyer20@gmail.com	$2b$12$cJJJYc59yEaMQZvc4.yJgedkid.Ib6crAkTMwjKD2RHjrdZvhmlW.	buyer	2026-05-31 07:15:53.466064+00	2026-05-31 10:14:36.763213+00	active	+919999222290
d2722a45-5d22-4c29-af62-3eb7096a10f5	rahulvatsalya1@gmail.com	$2b$12$3nKw64gXmV6nQ5h9CWfB.Ohbrj8VoDCzeK0/sHhWb7U4.sN53AdiG	provider	2026-06-20 04:59:35.414696+00	2026-06-20 05:00:25.006341+00	active	9717485454
d1591b24-c466-4eb1-90c4-230f00b5e6ac	provider20@gmail.com	$2b$12$n5Bi03xtBHH5EbRvyYq5YO0e5pEMWM8NM2rT2rp3dtLFOZQxrXmf.	provider	2026-05-31 07:17:18.333192+00	2026-05-31 09:06:58.228128+00	active	+919999333390
061b6e0c-583b-4f56-8855-fb20d208b095	user.061b6e0c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
08872940-b0fe-429c-89c0-accbea2e2ece	user.08872940@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
594ef980-f1a9-4e95-b064-ac1a4fd95a80	user.594ef980@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
609c3eac-5d2d-470d-b188-f85f8fd86096	user.609c3eac@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
6bcbaf21-2e74-4d31-89ff-03d8136dadd2	user.6bcbaf21@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
7168149a-dde8-448d-bcfa-dee4212b0eda	user.7168149a@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
9c76396b-fef9-43a2-b6fa-005baaa21e28	user.9c76396b@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6c8090f-de27-11f0-8727-001a7dda7113	user.a6c8090f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6cc505d-de27-11f0-8727-001a7dda7113	user.a6cc505d@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6cc7b4c-de27-11f0-8727-001a7dda7113	user.a6cc7b4c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d16ab5-de27-11f0-8727-001a7dda7113	user.a6d16ab5@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d19109-de27-11f0-8727-001a7dda7113	user.a6d19109@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d1b87f-de27-11f0-8727-001a7dda7113	user.a6d1b87f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d1ea37-de27-11f0-8727-001a7dda7113	user.a6d1ea37@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d213b5-de27-11f0-8727-001a7dda7113	user.a6d213b5@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d236b6-de27-11f0-8727-001a7dda7113	user.a6d236b6@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d25881-de27-11f0-8727-001a7dda7113	user.a6d25881@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d280a9-de27-11f0-8727-001a7dda7113	user.a6d280a9@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d2a67d-de27-11f0-8727-001a7dda7113	user.a6d2a67d@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d2cd25-de27-11f0-8727-001a7dda7113	user.a6d2cd25@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d2efec-de27-11f0-8727-001a7dda7113	user.a6d2efec@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d31ff9-de27-11f0-8727-001a7dda7113	user.a6d31ff9@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d34d8a-de27-11f0-8727-001a7dda7113	user.a6d34d8a@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d3916c-de27-11f0-8727-001a7dda7113	user.a6d3916c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d3b9a5-de27-11f0-8727-001a7dda7113	user.a6d3b9a5@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d3e0bc-de27-11f0-8727-001a7dda7113	user.a6d3e0bc@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d40388-de27-11f0-8727-001a7dda7113	user.a6d40388@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d42ecf-de27-11f0-8727-001a7dda7113	user.a6d42ecf@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d464e7-de27-11f0-8727-001a7dda7113	user.a6d464e7@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d48dc3-de27-11f0-8727-001a7dda7113	user.a6d48dc3@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d4b606-de27-11f0-8727-001a7dda7113	user.a6d4b606@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d4dc2b-de27-11f0-8727-001a7dda7113	user.a6d4dc2b@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d50171-de27-11f0-8727-001a7dda7113	user.a6d50171@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d52514-de27-11f0-8727-001a7dda7113	user.a6d52514@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d545bf-de27-11f0-8727-001a7dda7113	user.a6d545bf@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d56452-de27-11f0-8727-001a7dda7113	user.a6d56452@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d58313-de27-11f0-8727-001a7dda7113	user.a6d58313@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d5a402-de27-11f0-8727-001a7dda7113	user.a6d5a402@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d5ca13-de27-11f0-8727-001a7dda7113	user.a6d5ca13@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d5e91d-de27-11f0-8727-001a7dda7113	user.a6d5e91d@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d60737-de27-11f0-8727-001a7dda7113	user.a6d60737@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d6272c-de27-11f0-8727-001a7dda7113	user.a6d6272c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d645ec-de27-11f0-8727-001a7dda7113	user.a6d645ec@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d662d7-de27-11f0-8727-001a7dda7113	user.a6d662d7@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d67ffc-de27-11f0-8727-001a7dda7113	user.a6d67ffc@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d69fa3-de27-11f0-8727-001a7dda7113	user.a6d69fa3@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d6c000-de27-11f0-8727-001a7dda7113	user.a6d6c000@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d6efd3-de27-11f0-8727-001a7dda7113	user.a6d6efd3@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d717f0-de27-11f0-8727-001a7dda7113	user.a6d717f0@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d73a5a-de27-11f0-8727-001a7dda7113	user.a6d73a5a@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d75aa4-de27-11f0-8727-001a7dda7113	user.a6d75aa4@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d7799e-de27-11f0-8727-001a7dda7113	user.a6d7799e@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d797bf-de27-11f0-8727-001a7dda7113	user.a6d797bf@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d7b59c-de27-11f0-8727-001a7dda7113	user.a6d7b59c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d85eef-de27-11f0-8727-001a7dda7113	user.a6d85eef@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d88800-de27-11f0-8727-001a7dda7113	user.a6d88800@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d8e67f-de27-11f0-8727-001a7dda7113	user.a6d8e67f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d90951-de27-11f0-8727-001a7dda7113	user.a6d90951@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d929fe-de27-11f0-8727-001a7dda7113	user.a6d929fe@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d94d0f-de27-11f0-8727-001a7dda7113	user.a6d94d0f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d98c2b-de27-11f0-8727-001a7dda7113	user.a6d98c2b@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d9b626-de27-11f0-8727-001a7dda7113	user.a6d9b626@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d9d914-de27-11f0-8727-001a7dda7113	user.a6d9d914@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6d9f9b7-de27-11f0-8727-001a7dda7113	user.a6d9f9b7@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6da1a9d-de27-11f0-8727-001a7dda7113	user.a6da1a9d@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6db28ae-de27-11f0-8727-001a7dda7113	user.a6db28ae@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6db549c-de27-11f0-8727-001a7dda7113	user.a6db549c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6db7d31-de27-11f0-8727-001a7dda7113	user.a6db7d31@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6dba3db-de27-11f0-8727-001a7dda7113	user.a6dba3db@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6dbc515-de27-11f0-8727-001a7dda7113	user.a6dbc515@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6dbf206-de27-11f0-8727-001a7dda7113	user.a6dbf206@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6dc310f-de27-11f0-8727-001a7dda7113	user.a6dc310f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6dc60cb-de27-11f0-8727-001a7dda7113	user.a6dc60cb@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6dc852e-de27-11f0-8727-001a7dda7113	user.a6dc852e@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
a6dca664-de27-11f0-8727-001a7dda7113	user.a6dca664@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
aa2d0b5c-2ae4-4ecd-b631-8c7a5c13d6ce	user.aa2d0b5c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
c288424d-c135-426e-afa5-a72040ae6476	user.c288424d@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
c6469221-6022-46ec-8c1c-d7d090ffe820	user.c6469221@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
d22237b2-6124-4fa2-a61b-625d95dbb955	user.d22237b2@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
d5eeb1b2-e2b6-4a48-9203-ddff5f58131d	user.d5eeb1b2@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
d6c6eea3-28e2-49e8-8ec7-ef2c9a2be62d	user.d6c6eea3@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
ece3ba8a-c1c5-4d2e-8bbf-ea78e1612d49	user.ece3ba8a@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
efc35bfb-6565-4bd4-ab4b-8a15669bb6ed	user.efc35bfb@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	buyer	2026-05-27 13:03:03.053+00	\N	active	\N
0b5442e4-e580-4e19-a0c6-4201a807c824	user.0b5442e4@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
1144a92e-ba5c-442e-9ff0-1e4f2dff4860	user.1144a92e@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
46b348da-6ce1-4cf6-af61-c477a1cbf123	user.46b348da@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e2b5874-ddc9-11f0-8727-001a7dda7113	user.7e2b5874@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e33587c-ddc9-11f0-8727-001a7dda7113	user.7e33587c@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e33820b-ddc9-11f0-8727-001a7dda7113	user.7e33820b@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e33a7b4-ddc9-11f0-8727-001a7dda7113	user.7e33a7b4@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e33ccc8-ddc9-11f0-8727-001a7dda7113	user.7e33ccc8@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e341d4f-ddc9-11f0-8727-001a7dda7113	user.7e341d4f@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e34412d-ddc9-11f0-8727-001a7dda7113	user.7e34412d@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e34647a-ddc9-11f0-8727-001a7dda7113	user.7e34647a@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e348867-ddc9-11f0-8727-001a7dda7113	user.7e348867@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e34ae0e-ddc9-11f0-8727-001a7dda7113	user.7e34ae0e@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e34d940-ddc9-11f0-8727-001a7dda7113	user.7e34d940@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e351e3a-ddc9-11f0-8727-001a7dda7113	user.7e351e3a@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e354bc0-ddc9-11f0-8727-001a7dda7113	user.7e354bc0@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e357865-ddc9-11f0-8727-001a7dda7113	user.7e357865@gis-marketplace.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
7e39acd5-ddc9-11f0-8727-001a7dda7113	shalabhlearning@gmail.com	$2b$12$YxhWstYzn7O8qUFEGxqHrOGov/hmnqmlCc7ZBOsZPOOPiWeT1JVCa	provider	2026-05-27 13:03:03.053+00	\N	active	\N
\.


--
-- Name: servicecategory_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.servicecategory_category_id_seq', 1, false);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 41, true);


--
-- Name: subscriptionplan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscriptionplan_id_seq', 1, false);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: buyerprofile buyerprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyerprofile
    ADD CONSTRAINT buyerprofile_pkey PRIMARY KEY (buyer_id);


--
-- Name: contract contract_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT contract_pkey PRIMARY KEY (contract_id);


--
-- Name: contract contract_proposal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT contract_proposal_id_key UNIQUE (proposal_id);


--
-- Name: creditledger creditledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditledger
    ADD CONSTRAINT creditledger_pkey PRIMARY KEY (id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- Name: projectrequest projectrequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projectrequest
    ADD CONSTRAINT projectrequest_pkey PRIMARY KEY (project_id);


--
-- Name: proposal_drafts proposal_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_drafts
    ADD CONSTRAINT proposal_drafts_pkey PRIMARY KEY (draft_id);


--
-- Name: proposal_drafts proposal_drafts_project_id_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_drafts
    ADD CONSTRAINT proposal_drafts_project_id_provider_id_key UNIQUE (project_id, provider_id);


--
-- Name: proposal proposal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal
    ADD CONSTRAINT proposal_pkey PRIMARY KEY (proposal_id);


--
-- Name: providerprofile providerprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providerprofile
    ADD CONSTRAINT providerprofile_pkey PRIMARY KEY (provider_id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (review_id);


--
-- Name: rfp_drafts rfp_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfp_drafts
    ADD CONSTRAINT rfp_drafts_pkey PRIMARY KEY (draft_id);


--
-- Name: rfp_provider_match rfp_provider_match_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfp_provider_match
    ADD CONSTRAINT rfp_provider_match_pkey PRIMARY KEY (id);


--
-- Name: rfp_provider_match rfp_provider_match_project_id_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfp_provider_match
    ADD CONSTRAINT rfp_provider_match_project_id_provider_id_key UNIQUE (project_id, provider_id);


--
-- Name: servicecategory servicecategory_category_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicecategory
    ADD CONSTRAINT servicecategory_category_name_key UNIQUE (category_name);


--
-- Name: servicecategory servicecategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicecategory
    ADD CONSTRAINT servicecategory_pkey PRIMARY KEY (category_id);


--
-- Name: servicelisting servicelisting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicelisting
    ADD CONSTRAINT servicelisting_pkey PRIMARY KEY (service_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_session_token_key UNIQUE (session_token);


--
-- Name: subscriptionplan subscriptionplan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptionplan
    ADD CONSTRAINT subscriptionplan_pkey PRIMARY KEY (id);


--
-- Name: admin_notifications uq_notif_project_provider; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT uq_notif_project_provider UNIQUE (project_id, provider_id);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_phone_number_key UNIQUE (phone_number);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- Name: idx_admin_notif_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_notif_created ON public.admin_notifications USING btree (created_at DESC);


--
-- Name: idx_admin_notif_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_notif_project ON public.admin_notifications USING btree (project_id);


--
-- Name: idx_admin_notif_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_notif_read ON public.admin_notifications USING btree (is_read);


--
-- Name: idx_ai_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_processed ON public.projectrequest USING btree (ai_processed);


--
-- Name: idx_buyer_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyer_location ON public.buyerprofile USING gist (location);


--
-- Name: idx_listing_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_category ON public.servicelisting USING btree (category_id);


--
-- Name: idx_listing_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_provider ON public.servicelisting USING btree (provider_id);


--
-- Name: idx_listing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_status ON public.servicelisting USING btree (status);


--
-- Name: idx_project_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_buyer ON public.projectrequest USING btree (buyer_id);


--
-- Name: idx_project_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_created ON public.projectrequest USING btree (created_at DESC);


--
-- Name: idx_project_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_search ON public.projectrequest USING gin (to_tsvector('english'::regconfig, (((title)::text || ' '::text) || description)));


--
-- Name: idx_project_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_status ON public.projectrequest USING btree (status);


--
-- Name: idx_proposal_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposal_project ON public.proposal USING btree (project_id);


--
-- Name: idx_proposal_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposal_provider ON public.proposal USING btree (provider_id);


--
-- Name: idx_proposal_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposal_status ON public.proposal USING btree (status);


--
-- Name: idx_provider_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_location ON public.providerprofile USING gist (location);


--
-- Name: idx_provider_matches; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_matches ON public.rfp_provider_match USING btree (provider_id);


--
-- Name: idx_provider_skills_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_skills_fts ON public.providerprofile USING gin (to_tsvector('english'::regconfig, COALESCE(skills_search, ''::text)));


--
-- Name: idx_rfp_matches; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rfp_matches ON public.rfp_provider_match USING btree (project_id);


--
-- Name: idx_rpm_checklist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rpm_checklist ON public.rfp_provider_match USING btree (project_id, is_checklist) WHERE (is_checklist = true);


--
-- Name: idx_rpm_notified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rpm_notified ON public.rfp_provider_match USING btree (project_id, notified) WHERE (notified = false);


--
-- Name: idx_service_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_search ON public.servicelisting USING gin (to_tsvector('english'::regconfig, (((title)::text || ' '::text) || description)));


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);


--
-- Name: providerprofile trg_provider_skills_search; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_provider_skills_search BEFORE INSERT OR UPDATE OF skills ON public.providerprofile FOR EACH ROW EXECUTE FUNCTION public.sync_provider_skills_search();


--
-- Name: servicelisting trg_service_tags_search; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_service_tags_search BEFORE INSERT OR UPDATE OF tags ON public.servicelisting FOR EACH ROW EXECUTE FUNCTION public.sync_service_tags_search();


--
-- Name: buyerprofile buyerprofile_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyerprofile
    ADD CONSTRAINT buyerprofile_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: contract contract_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT contract_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposal(proposal_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: admin_notifications fk_notif_project; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT fk_notif_project FOREIGN KEY (project_id) REFERENCES public.projectrequest(project_id) ON DELETE CASCADE;


--
-- Name: admin_notifications fk_notif_provider; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT fk_notif_provider FOREIGN KEY (provider_id) REFERENCES public.providerprofile(provider_id) ON DELETE CASCADE;


--
-- Name: payment payment_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contract(contract_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: projectrequest projectrequest_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projectrequest
    ADD CONSTRAINT projectrequest_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyerprofile(buyer_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal_drafts proposal_drafts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_drafts
    ADD CONSTRAINT proposal_drafts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projectrequest(project_id) ON DELETE CASCADE;


--
-- Name: proposal_drafts proposal_drafts_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_drafts
    ADD CONSTRAINT proposal_drafts_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providerprofile(provider_id) ON DELETE CASCADE;


--
-- Name: proposal proposal_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal
    ADD CONSTRAINT proposal_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projectrequest(project_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal proposal_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal
    ADD CONSTRAINT proposal_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providerprofile(provider_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: providerprofile providerprofile_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providerprofile
    ADD CONSTRAINT providerprofile_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- Name: providerprofile providerprofile_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providerprofile
    ADD CONSTRAINT providerprofile_subscription_plan_id_fkey FOREIGN KEY (subscription_plan_id) REFERENCES public.subscriptionplan(id);


--
-- Name: review review_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contract(contract_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: review review_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public."user"(user_id) ON DELETE RESTRICT;


--
-- Name: review review_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public."user"(user_id) ON DELETE RESTRICT;


--
-- Name: rfp_provider_match rfp_provider_match_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfp_provider_match
    ADD CONSTRAINT rfp_provider_match_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projectrequest(project_id) ON DELETE CASCADE;


--
-- Name: rfp_provider_match rfp_provider_match_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfp_provider_match
    ADD CONSTRAINT rfp_provider_match_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providerprofile(provider_id) ON DELETE CASCADE;


--
-- Name: servicecategory servicecategory_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicecategory
    ADD CONSTRAINT servicecategory_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.servicecategory(category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: servicelisting servicelisting_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicelisting
    ADD CONSTRAINT servicelisting_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.servicecategory(category_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: servicelisting servicelisting_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicelisting
    ADD CONSTRAINT servicelisting_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providerprofile(provider_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Tohma5c0Fnlr8ojoK25eafGPxPDJwsaPSavlK8tpAhIFy0drw0mkDNmp0T8wF4o

