-- MySQL Schema Dump for GISMarketplace
-- This script recreates the exact schema based on your DESC outputs
-- Run on any MySQL 8+ instance (spatial types require MySQL spatial support enabled)
-- Usage: mysql -u root -p < gismarketplace_schema.sql

DROP DATABASE IF EXISTS gismarketplace;
CREATE DATABASE gismarketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gismarketplace;

-- Subscription Plans
CREATE TABLE subscriptionplan (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) DEFAULT NULL,
    monthly_price DECIMAL(10,2) DEFAULT NULL,
    monthly_credits INT DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Service Categories (self-referencing)
CREATE TABLE servicecategory (
    category_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    parent_category_id INT UNSIGNED DEFAULT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    embedding_vector VARBINARY(256) DEFAULT NULL,
    UNIQUE KEY category_name (category_name),
    KEY parent_category_id (parent_category_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Users
CREATE TABLE `user` (
    user_id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    email VARCHAR(255) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('buyer','provider','admin') NOT NULL,
    join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT NULL,
    status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    phone_number VARCHAR(20) DEFAULT NULL,
    UNIQUE KEY email (email),
    UNIQUE KEY phone_number (phone_number)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buyer Profiles
CREATE TABLE buyerprofile (
    buyer_id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) DEFAULT NULL,
    preferred_services JSON DEFAULT NULL,
    budget_range VARCHAR(50) DEFAULT NULL,
    location POINT NOT NULL DEFAULT (POINT(0, 0)),
    rating DECIMAL(3,2) DEFAULT 0.00,
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    SPATIAL KEY idx_location (location)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Provider Profiles
CREATE TABLE providerprofile (
    provider_id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL,
    skills JSON DEFAULT NULL,
    experience_years TINYINT UNSIGNED DEFAULT NULL,
    portfolio_url VARCHAR(2048) DEFAULT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    location POINT NOT NULL DEFAULT (POINT(0, 0)),
    rating DECIMAL(3,2) DEFAULT 0.00,
    skills_search TEXT DEFAULT NULL,  -- Note: This is a STORED GENERATED column in your original DB (expression unknown here)
    subscription_status ENUM('none','active','expired') DEFAULT 'none',
    subscription_plan_id INT DEFAULT NULL,
    subscription_start DATE DEFAULT NULL,
    subscription_end DATE DEFAULT NULL,
    SPATIAL KEY idx_location (location),
    KEY subscription_plan_id (subscription_plan_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Project Requests (RFPs)
CREATE TABLE projectrequest (
    project_id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    buyer_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) DEFAULT NULL,
    status ENUM('open','in_review','contracted','closed') NOT NULL DEFAULT 'open',
    embedding_vector VARBINARY(256) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    submission_deadline DATETIME DEFAULT NULL,
    visibility ENUM('public','private') NOT NULL DEFAULT 'public',
    contact_person VARCHAR(255) DEFAULT NULL,
    contact_email VARCHAR(255) DEFAULT NULL,
    attachments JSON DEFAULT NULL,
    KEY buyer_id (buyer_id),
    KEY title (title),
    KEY status (status),
    KEY created_at (created_at)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Service Listings
CREATE TABLE servicelisting (
    service_id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    provider_id CHAR(36) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price_type ENUM('fixed','hourly') NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    tags JSON DEFAULT NULL,
    embedding_vector VARBINARY(256) DEFAULT NULL,
    status ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
    tags_search TEXT DEFAULT NULL,  -- Note: This is a STORED GENERATED column in your original DB (expression unknown here)
    KEY provider_id (provider_id),
    KEY category_id (category_id),
    KEY title (title),
    KEY status (status)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Proposals
CREATE TABLE proposal (
    proposal_id CHAR(36) NOT NULL PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    provider_id CHAR(36) NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    proposal_message TEXT NOT NULL,
    status ENUM('submitted','accepted','rejected','withdrawn') NOT NULL DEFAULT 'submitted',
    credits_used INT DEFAULT 0,
    KEY project_id (project_id),
    KEY provider_id (provider_id),
    KEY status (status)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Contracts
CREATE TABLE contract (
    contract_id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    proposal_id CHAR(36) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    status ENUM('in_progress','completed','cancelled','disputed') NOT NULL DEFAULT 'in_progress',
    completion_report TEXT DEFAULT NULL,
    UNIQUE KEY proposal_id (proposal_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Payments
CREATE TABLE payment (
    payment_id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    contract_id CHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY contract_id (contract_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Reviews
CREATE TABLE review (
    review_id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    contract_id CHAR(36) NOT NULL,
    reviewer_id CHAR(36) NOT NULL,
    reviewee_id CHAR(36) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comments TEXT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY contract_id (contract_id),
    KEY reviewer_id (reviewer_id),
    KEY reviewee_id (reviewee_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Credit Ledger
CREATE TABLE creditledger (
    id CHAR(36) NOT NULL PRIMARY KEY,
    provider_id CHAR(36) DEFAULT NULL,
    credits INT DEFAULT NULL,
    type ENUM('credit','debit') DEFAULT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sessions
CREATE TABLE sessions (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL,
    user_id CHAR(36) NOT NULL,
    expires DATETIME NOT NULL,
    UNIQUE KEY session_token (session_token),
    KEY user_id (user_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Optional: Default subscription plans (highly recommended)
INSERT INTO subscriptionplan (name, monthly_price, monthly_credits, is_active) VALUES
('Free', 0.00, 10, 1),
('Basic', 999.00, 50, 1),
('Premium', 2999.00, 200, 1);

-- End of schema
SELECT 'GISMarketplace database schema created successfully (empty except optional subscription plans).' AS message;

-- run mysql -u root -p < gismarketplace_schema.sql