-- =============================================
-- GISMarketplace - Latest Schema Export
-- Generated on: 2026-03-29T05:21:57.220Z
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- Table: buyerprofile
DROP TABLE IF EXISTS `buyerprofile`;
CREATE TABLE `buyerprofile` (
  `buyer_id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_name` varchar(255) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `preferred_services` json DEFAULT NULL,
  `budget_range` varchar(50) DEFAULT NULL,
  `location` point NOT NULL DEFAULT (point(0,0)),
  `rating` decimal(3,2) DEFAULT '0.00',
  `subscription_status` varchar(20) NOT NULL DEFAULT 'inactive',
  PRIMARY KEY (`buyer_id`),
  SPATIAL KEY `idx_buyer_location` (`location`),
  CONSTRAINT `buyerprofile_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: contract
DROP TABLE IF EXISTS `contract`;
CREATE TABLE `contract` (
  `contract_id` char(36) NOT NULL DEFAULT (uuid()),
  `proposal_id` char(36) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('in_progress','completed','cancelled','disputed') NOT NULL DEFAULT 'in_progress',
  `completion_report` text,
  PRIMARY KEY (`contract_id`),
  UNIQUE KEY `proposal_id` (`proposal_id`),
  CONSTRAINT `contract_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposal` (`proposal_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: creditledger
DROP TABLE IF EXISTS `creditledger`;
CREATE TABLE `creditledger` (
  `id` char(36) NOT NULL,
  `provider_id` char(36) DEFAULT NULL,
  `credits` int DEFAULT NULL,
  `type` enum('credit','debit') DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: payment
DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
  `payment_id` char(36) NOT NULL DEFAULT (uuid()),
  `contract_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `transaction_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `contract_id` (`contract_id`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contract` (`contract_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: projectrequest
DROP TABLE IF EXISTS `projectrequest`;
CREATE TABLE `projectrequest` (
  `project_id` char(36) NOT NULL DEFAULT (uuid()),
  `buyer_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `status` enum('open','in_review','contracted','closed') NOT NULL DEFAULT 'open',
  `embedding_vector` varbinary(256) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `submission_deadline` datetime DEFAULT NULL,
  `visibility` enum('public','private') NOT NULL DEFAULT 'public',
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `awarded_to` int DEFAULT NULL,
  PRIMARY KEY (`project_id`),
  KEY `idx_project_buyer` (`buyer_id`),
  KEY `idx_project_status` (`status`),
  KEY `idx_project_created` (`created_at` DESC),
  KEY `idx_awarded_to` (`awarded_to`),
  FULLTEXT KEY `idx_project_search` (`title`,`description`),
  CONSTRAINT `projectrequest_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyerprofile` (`buyer_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: proposal
DROP TABLE IF EXISTS `proposal`;
CREATE TABLE `proposal` (
  `proposal_id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `bid_amount` decimal(10,2) NOT NULL,
  `proposal_message` text NOT NULL,
  `status` enum('draft','submitted','accepted','rejected','withdrawn') DEFAULT 'draft',
  `credits_used` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `technical` text,
  `delivery` text,
  `milestones` json DEFAULT NULL,
  `case_studies` json DEFAULT NULL,
  `references_json` json DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  PRIMARY KEY (`proposal_id`),
  KEY `idx_proposal_project` (`project_id`),
  KEY `idx_proposal_provider` (`provider_id`),
  KEY `idx_proposal_status` (`status`),
  CONSTRAINT `proposal_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projectrequest` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `proposal_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providerprofile` (`provider_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: proposal_drafts
DROP TABLE IF EXISTS `proposal_drafts`;
CREATE TABLE `proposal_drafts` (
  `draft_id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `bid_amount` decimal(10,2) DEFAULT NULL,
  `technical` text,
  `delivery` text,
  `milestones` json DEFAULT NULL,
  `case_studies` json DEFAULT NULL,
  `references_json` json DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`draft_id`),
  UNIQUE KEY `unique_draft` (`project_id`,`provider_id`),
  KEY `provider_id` (`provider_id`),
  CONSTRAINT `proposal_drafts_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projectrequest` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `proposal_drafts_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providerprofile` (`provider_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: providerprofile
DROP TABLE IF EXISTS `providerprofile`;
CREATE TABLE `providerprofile` (
  `provider_id` char(36) NOT NULL DEFAULT (uuid()),
  `organization_name` varchar(255) NOT NULL,
  `skills` json DEFAULT NULL,
  `experience_years` tinyint unsigned DEFAULT NULL,
  `portfolio_url` varchar(2048) DEFAULT NULL,
  `hourly_rate` decimal(10,2) NOT NULL,
  `location` point NOT NULL DEFAULT (point(0,0)),
  `rating` decimal(3,2) DEFAULT '0.00',
  `skills_search` text GENERATED ALWAYS AS (json_unquote(json_extract(`skills`,_cp850'$[*]'))) STORED,
  `subscription_status` enum('none','active','expired') DEFAULT 'none',
  `subscription_plan_id` int DEFAULT NULL,
  `subscription_start` date DEFAULT NULL,
  `subscription_end` date DEFAULT NULL,
  PRIMARY KEY (`provider_id`),
  SPATIAL KEY `idx_provider_location` (`location`),
  KEY `subscription_plan_id` (`subscription_plan_id`),
  FULLTEXT KEY `idx_provider_skills` (`skills_search`),
  CONSTRAINT `providerprofile_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `providerprofile_ibfk_2` FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscriptionplan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: review
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review` (
  `review_id` char(36) NOT NULL DEFAULT (uuid()),
  `contract_id` char(36) NOT NULL,
  `reviewer_id` char(36) NOT NULL,
  `reviewee_id` char(36) NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comments` text NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `contract_id` (`contract_id`),
  KEY `reviewer_id` (`reviewer_id`),
  KEY `reviewee_id` (`reviewee_id`),
  CONSTRAINT `review_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contract` (`contract_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `review_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `review_ibfk_3` FOREIGN KEY (`reviewee_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `review_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: rfp_drafts
DROP TABLE IF EXISTS `rfp_drafts`;
CREATE TABLE `rfp_drafts` (
  `draft_id` varchar(255) NOT NULL,
  `buyer_id` varchar(255) DEFAULT NULL,
  `title` text,
  `description` text,
  `budget` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `submission_deadline` datetime DEFAULT NULL,
  `visibility` varchar(20) DEFAULT NULL,
  `contact_person` text,
  `contact_email` text,
  `credits` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`draft_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: servicecategory
DROP TABLE IF EXISTS `servicecategory`;
CREATE TABLE `servicecategory` (
  `category_id` int unsigned NOT NULL AUTO_INCREMENT,
  `parent_category_id` int unsigned DEFAULT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text,
  `embedding_vector` varbinary(256) DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name` (`category_name`),
  KEY `parent_category_id` (`parent_category_id`),
  CONSTRAINT `servicecategory_ibfk_1` FOREIGN KEY (`parent_category_id`) REFERENCES `servicecategory` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: servicelisting
DROP TABLE IF EXISTS `servicelisting`;
CREATE TABLE `servicelisting` (
  `service_id` char(36) NOT NULL DEFAULT (uuid()),
  `provider_id` char(36) NOT NULL,
  `category_id` int unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price_type` enum('fixed','hourly') NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `tags` json DEFAULT NULL,
  `embedding_vector` varbinary(256) DEFAULT NULL,
  `status` enum('active','inactive','draft') NOT NULL DEFAULT 'active',
  `tags_search` text GENERATED ALWAYS AS (json_unquote(json_extract(`tags`,_cp850'$[*]'))) STORED,
  PRIMARY KEY (`service_id`),
  KEY `idx_listing_provider` (`provider_id`),
  KEY `idx_listing_category` (`category_id`),
  KEY `idx_listing_status` (`status`),
  KEY `idx_active_listings` (`status`,`category_id`,`base_price`),
  FULLTEXT KEY `idx_service_tags` (`tags_search`),
  FULLTEXT KEY `idx_service_search` (`title`,`description`),
  CONSTRAINT `servicelisting_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providerprofile` (`provider_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `servicelisting_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `servicecategory` (`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: sessions
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_token` varchar(255) NOT NULL,
  `user_id` char(36) NOT NULL,
  `expires` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=164 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: subscriptionplan
DROP TABLE IF EXISTS `subscriptionplan`;
CREATE TABLE `subscriptionplan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `monthly_price` decimal(10,2) DEFAULT NULL,
  `monthly_credits` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: user
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `user_id` char(36) NOT NULL DEFAULT (uuid()),
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `user_type` enum('buyer','provider','admin') NOT NULL,
  `join_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `phone_number` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone_number` (`phone_number`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
