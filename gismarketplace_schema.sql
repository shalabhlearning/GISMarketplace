-- GISMarketplace Full Export
-- Generated: 2026-05-26T11:46:46.475Z

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

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

INSERT INTO `user` (`user_id`, `email`, `password_hash`, `user_type`, `last_login`, `status`, `phone_number`) VALUES
  ('bed9f264-58f7-11f1-b9ae-cecd02c24f20', 'saransh1@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', '2025-12-31 05:42:22', 'active', NULL),
  ('bed9f6e5-58f7-11f1-b9ae-cecd02c24f20', NULL, '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', '+919717485454'),
  ('bed9f8b5-58f7-11f1-b9ae-cecd02c24f20', 'testnew@gmail.com', '$2b$12$u3RAIPC/XAftGYZdbOAcoe/qTYYije4BWJ71v0Wd8aqtiznOqzw9m', 'provider', '2026-05-16 11:45:38', 'active', '9133446677'),
  ('bed9f96c-58f7-11f1-b9ae-cecd02c24f20', 'test80@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', '2026-05-22 01:58:11', 'active', '9999888800'),
  ('bed9fa0d-58f7-11f1-b9ae-cecd02c24f20', 'test3@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', '2026-01-11 08:53:35', 'active', NULL),
  ('bed9faaf-58f7-11f1-b9ae-cecd02c24f20', 'test4@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', '2026-01-11 08:36:26', 'active', NULL),
  ('bed9fb50-58f7-11f1-b9ae-cecd02c24f20', 'test54@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', '7848659815'),
  ('bed9fbe2-58f7-11f1-b9ae-cecd02c24f20', 'shivanshumit2107@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', '9999999999'),
  ('bed9fc87-58f7-11f1-b9ae-cecd02c24f20', 'nakshatechprivatelimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', '2026-05-15 10:53:31', 'active', NULL),
  ('bed9fd2a-58f7-11f1-b9ae-cecd02c24f20', 'geoknoindia@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bed9fdc7-58f7-11f1-b9ae-cecd02c24f20', 'aamgeospatialtechprivatelimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bed9fe6a-58f7-11f1-b9ae-cecd02c24f20', 'alartechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', '2026-05-19 08:11:24', 'active', NULL),
  ('bed9ff17-58f7-11f1-b9ae-cecd02c24f20', 'focusgeospatialprivatelimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda001b-58f7-11f1-b9ae-cecd02c24f20', 'geocentroidpvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0132-58f7-11f1-b9ae-cecd02c24f20', 'goodlandgeospatialconsultantspvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda04de-58f7-11f1-b9ae-cecd02c24f20', 'mappaconsultingengineers@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda05bd-58f7-11f1-b9ae-cecd02c24f20', 'matrixgeosolutionltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda065c-58f7-11f1-b9ae-cecd02c24f20', 'lidartechpvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda06ee-58f7-11f1-b9ae-cecd02c24f20', 'genesysinternationalcorporationlimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda07aa-58f7-11f1-b9ae-cecd02c24f20', 'marvelgeospatialsolutionspvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda083d-58f7-11f1-b9ae-cecd02c24f20', 'bpcconsultantindiapvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda08d0-58f7-11f1-b9ae-cecd02c24f20', 'airpix@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0960-58f7-11f1-b9ae-cecd02c24f20', 'sislindia@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda09f7-58f7-11f1-b9ae-cecd02c24f20', 'geovistatechnologiesprivatelimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0a93-58f7-11f1-b9ae-cecd02c24f20', 'neogeoinfotechnologiespvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0b2a-58f7-11f1-b9ae-cecd02c24f20', 'lidarengineeringandinfrastructurepvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0bc3-58f7-11f1-b9ae-cecd02c24f20', 'datalabsindiasolutionspvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0c78-58f7-11f1-b9ae-cecd02c24f20', 'landcoordinatestechnologylctssin@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0d10-58f7-11f1-b9ae-cecd02c24f20', 'rightdatalabspvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0db0-58f7-11f1-b9ae-cecd02c24f20', 'leadsquared@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0e47-58f7-11f1-b9ae-cecd02c24f20', 'ispatialtechnosolutionspvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0ede-58f7-11f1-b9ae-cecd02c24f20', 'datarisesolutions@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda0f85-58f7-11f1-b9ae-cecd02c24f20', 'lumendatasolutionsindiapvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda102e-58f7-11f1-b9ae-cecd02c24f20', 'atomaviationservicespvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda10c7-58f7-11f1-b9ae-cecd02c24f20', '3dpointshot@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda1155-58f7-11f1-b9ae-cecd02c24f20', 'infogeo@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda11e8-58f7-11f1-b9ae-cecd02c24f20', 'robomaniaindiaprivatelimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda127b-58f7-11f1-b9ae-cecd02c24f20', 'trigeotechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda130f-58f7-11f1-b9ae-cecd02c24f20', 'vividgeospatial@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda13a3-58f7-11f1-b9ae-cecd02c24f20', 'focusgeospatial@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda143b-58f7-11f1-b9ae-cecd02c24f20', 'ceinsystech@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda14cb-58f7-11f1-b9ae-cecd02c24f20', 'avakazageoscienceresearchtechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda155c-58f7-11f1-b9ae-cecd02c24f20', 'geoadithyatechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda15ed-58f7-11f1-b9ae-cecd02c24f20', 'geopageconsultants@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda1687-58f7-11f1-b9ae-cecd02c24f20', 'leptonsoftware@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda171d-58f7-11f1-b9ae-cecd02c24f20', 'ansimaptechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda17ac-58f7-11f1-b9ae-cecd02c24f20', 'productionmodelingindiaprivatelimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda183a-58f7-11f1-b9ae-cecd02c24f20', 'orbxtechnologiesprivatelimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda18cc-58f7-11f1-b9ae-cecd02c24f20', 'mapvista@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('beda195c-58f7-11f1-b9ae-cecd02c24f20', 'miraiaerospacesystems@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL);
INSERT INTO `user` (`user_id`, `email`, `password_hash`, `user_type`, `last_login`, `status`, `phone_number`) VALUES
  ('bf2c43ea-58f7-11f1-b9ae-cecd02c24f20', 'ausaaravunmannedsystems@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c492f-58f7-11f1-b9ae-cecd02c24f20', 'kglobesofttechindia@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4a21-58f7-11f1-b9ae-cecd02c24f20', 'pixelvision@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4ad0-58f7-11f1-b9ae-cecd02c24f20', 'hdsense@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4b59-58f7-11f1-b9ae-cecd02c24f20', 'easternaerocarto@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4be5-58f7-11f1-b9ae-cecd02c24f20', 'deducetechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4c6e-58f7-11f1-b9ae-cecd02c24f20', 'aryageospatial@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4cf7-58f7-11f1-b9ae-cecd02c24f20', 'edge3dtechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4daf-58f7-11f1-b9ae-cecd02c24f20', 'asteriaaerospace@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', '2026-05-19 01:54:26', 'active', NULL),
  ('bf2c4e44-58f7-11f1-b9ae-cecd02c24f20', 'peppertreeai@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4ec9-58f7-11f1-b9ae-cecd02c24f20', 'jkrconsulting@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4f54-58f7-11f1-b9ae-cecd02c24f20', 'heliware@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c4fd4-58f7-11f1-b9ae-cecd02c24f20', 'gisconsortiumindiapvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5055-58f7-11f1-b9ae-cecd02c24f20', 'rsisoftech@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c50d9-58f7-11f1-b9ae-cecd02c24f20', 'coordinatesystemsllp@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c515e-58f7-11f1-b9ae-cecd02c24f20', 'aerodyneindia@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c51eb-58f7-11f1-b9ae-cecd02c24f20', 'terrageotechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5279-58f7-11f1-b9ae-cecd02c24f20', 'mappaturageospatial@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5301-58f7-11f1-b9ae-cecd02c24f20', 'techmapperz@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c53fc-58f7-11f1-b9ae-cecd02c24f20', 'senseimagetechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c549e-58f7-11f1-b9ae-cecd02c24f20', 'yellowskye@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5573-58f7-11f1-b9ae-cecd02c24f20', 'treistek@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5613-58f7-11f1-b9ae-cecd02c24f20', 'earthonmappingconsulting@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c56ea-58f7-11f1-b9ae-cecd02c24f20', 'lucidimagingpvtltd@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5814-58f7-11f1-b9ae-cecd02c24f20', 'globeviewtechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c58b0-58f7-11f1-b9ae-cecd02c24f20', 'larixtechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5944-58f7-11f1-b9ae-cecd02c24f20', 'laderatechnology@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c59de-58f7-11f1-b9ae-cecd02c24f20', 'vmapstechindia@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5a79-58f7-11f1-b9ae-cecd02c24f20', 'geovertx@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5b1b-58f7-11f1-b9ae-cecd02c24f20', 'lgeom@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5bbd-58f7-11f1-b9ae-cecd02c24f20', 'latlontechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5c59-58f7-11f1-b9ae-cecd02c24f20', 'wildplantterrestrialsolutions@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5cf2-58f7-11f1-b9ae-cecd02c24f20', 'flybitechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5d88-58f7-11f1-b9ae-cecd02c24f20', 'leonsdigitaltechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5e20-58f7-11f1-b9ae-cecd02c24f20', 'droneacharyaaerialinnovations@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5eb0-58f7-11f1-b9ae-cecd02c24f20', 'astonbimcreations@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5f45-58f7-11f1-b9ae-cecd02c24f20', 'shayonamanagementservices@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c5fd3-58f7-11f1-b9ae-cecd02c24f20', 'dronitech@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c606b-58f7-11f1-b9ae-cecd02c24f20', 'laresgloballimited@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c60fd-58f7-11f1-b9ae-cecd02c24f20', 'raynasinfraandgeometics@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c6192-58f7-11f1-b9ae-cecd02c24f20', 'lrsservices@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c6226-58f7-11f1-b9ae-cecd02c24f20', 'ldsengineers@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c62ba-58f7-11f1-b9ae-cecd02c24f20', 'laminds@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c6353-58f7-11f1-b9ae-cecd02c24f20', 'terraaligngeospatialsolutions@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c63ec-58f7-11f1-b9ae-cecd02c24f20', 'skymapgeoinfomatic@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c6483-58f7-11f1-b9ae-cecd02c24f20', 'airotortechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c6a9b-58f7-11f1-b9ae-cecd02c24f20', 'lonartechnologies@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c6bd1-58f7-11f1-b9ae-cecd02c24f20', 'axesmap@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c6ca2-58f7-11f1-b9ae-cecd02c24f20', 'luminoguru@provider.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', NULL),
  ('bf2c6db5-58f7-11f1-b9ae-cecd02c24f20', 'test99@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', '2026-05-09 11:42:53', 'active', '9999000099');
INSERT INTO `user` (`user_id`, `email`, `password_hash`, `user_type`, `last_login`, `status`, `phone_number`) VALUES
  ('bfa4a53d-58f7-11f1-b9ae-cecd02c24f20', NULL, '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', NULL, 'active', '+918449309293'),
  ('bfa4ab6a-58f7-11f1-b9ae-cecd02c24f20', 'gispoint@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4accf-58f7-11f1-b9ae-cecd02c24f20', 'lidarcouk@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4adf7-58f7-11f1-b9ae-cecd02c24f20', 'logxongmbhcokg@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4aeee-58f7-11f1-b9ae-cecd02c24f20', 'blominternationaloperationsbio@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4aff4-58f7-11f1-b9ae-cecd02c24f20', 'dephosgroup@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b0fc-58f7-11f1-b9ae-cecd02c24f20', 'lidarscotland@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b1f5-58f7-11f1-b9ae-cecd02c24f20', 'leicageosystemshexagonab@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b304-58f7-11f1-b9ae-cecd02c24f20', 'fugro@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b3f3-58f7-11f1-b9ae-cecd02c24f20', 'mggpaero@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b4ec-58f7-11f1-b9ae-cecd02c24f20', 'korec@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b5e3-58f7-11f1-b9ae-cecd02c24f20', 'laserscanningeuropegmbh@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b6ba-58f7-11f1-b9ae-cecd02c24f20', 'exwayz@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b799-58f7-11f1-b9ae-cecd02c24f20', 'outsight@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b88b-58f7-11f1-b9ae-cecd02c24f20', 'routescene@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4b973-58f7-11f1-b9ae-cecd02c24f20', 'terrasolid@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4ba64-58f7-11f1-b9ae-cecd02c24f20', '3deling@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4bb58-58f7-11f1-b9ae-cecd02c24f20', 'cyclomedia@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4bc6e-58f7-11f1-b9ae-cecd02c24f20', 'dtmapping@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4bd54-58f7-11f1-b9ae-cecd02c24f20', 'generationsrobots@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4be3d-58f7-11f1-b9ae-cecd02c24f20', 'geoslamlimited@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4bf19-58f7-11f1-b9ae-cecd02c24f20', 'microdronesgmbh@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c005-58f7-11f1-b9ae-cecd02c24f20', 'nmgroup@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c0e6-58f7-11f1-b9ae-cecd02c24f20', 'yellowscansas@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c1e2-58f7-11f1-b9ae-cecd02c24f20', 'fiverivers@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c2e5-58f7-11f1-b9ae-cecd02c24f20', 'qebim@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c3d8-58f7-11f1-b9ae-cecd02c24f20', 'energylineltd@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c4a9-58f7-11f1-b9ae-cecd02c24f20', 'yellowscan@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c57a-58f7-11f1-b9ae-cecd02c24f20', 'cadden@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c64b-58f7-11f1-b9ae-cecd02c24f20', 'bimsolutions@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c71b-58f7-11f1-b9ae-cecd02c24f20', 'xenomatix@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c7da-58f7-11f1-b9ae-cecd02c24f20', 'eurosense@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c8be-58f7-11f1-b9ae-cecd02c24f20', 'blickfeld@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4c9a3-58f7-11f1-b9ae-cecd02c24f20', 'bimfaktoria@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4ca86-58f7-11f1-b9ae-cecd02c24f20', 'laserdatagmbh@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4cb61-58f7-11f1-b9ae-cecd02c24f20', 'airbornelidarmappingas@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4ccfe-58f7-11f1-b9ae-cecd02c24f20', 'readaar@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4cde1-58f7-11f1-b9ae-cecd02c24f20', 'greehill@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4cec1-58f7-11f1-b9ae-cecd02c24f20', 'artificialmodelling@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4cf8f-58f7-11f1-b9ae-cecd02c24f20', 'harmonyat@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4d055-58f7-11f1-b9ae-cecd02c24f20', 'qebimservices@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4d12d-58f7-11f1-b9ae-cecd02c24f20', 'advenser@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4d1fe-58f7-11f1-b9ae-cecd02c24f20', 'teslacaduk@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4d2d5-58f7-11f1-b9ae-cecd02c24f20', 'bimplan@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4d3ac-58f7-11f1-b9ae-cecd02c24f20', 'bureaubouwtechnieknv@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4d47f-58f7-11f1-b9ae-cecd02c24f20', 'bimconsulting@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa4d552-58f7-11f1-b9ae-cecd02c24f20', 'bimly@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa558a1-58f7-11f1-b9ae-cecd02c24f20', 'atiproject@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa55a96-58f7-11f1-b9ae-cecd02c24f20', 'hochtiefviconisaleadingeuropeanserviceproviderandconsultantforvirtualconstructionandbuildinginformationmodelingbimitadvisesclientsintheuseofintelligent3dcomputermodelstominimizeriskscommunicateeffectivelyandsavecostsitworksonbuildingandinfrastructureproje', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('bfa55c03-58f7-11f1-b9ae-cecd02c24f20', 'dpsgroupglobalisaglobalconsultingengineeringandconstructionmanagementcompanywithanofficeineuropethecompanyusesvirtualdesignandconstructionvdcmethodologiesalongsidebimtechnologiestoservehightechindustries@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL);
INSERT INTO `user` (`user_id`, `email`, `password_hash`, `user_type`, `last_login`, `status`, `phone_number`) VALUES
  ('c00970d8-58f7-11f1-b9ae-cecd02c24f20', 'bimfacilityagisabimcompanymentionedamongthetopbuildinginformationmodelingsolutionsprovidersineuropethecompanyprovidesbimservicesandisbasedinswitzerland@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c00976c3-58f7-11f1-b9ae-cecd02c24f20', 'powerkhisaukbasedcompanythatoffersmepmechanicalelectricalandplumbingbimservicesithasofficesinukraineandtheusaandprovidesavarietyofbimoutsourcingservicesincludingcontentcreationand3dmodeling@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c00978e8-58f7-11f1-b9ae-cecd02c24f20', 'qebimservicesisabimserviceproviderbasedintheukofferingbimmodelingservicesineuropethecompanyspecializesinarchitecturalstructuralandmepmodeling@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0097a0c-58f7-11f1-b9ae-cecd02c24f20', 'harmonyatisagermancompanylocatedinkundertitoffersbimmodelingservicesforclientsineurope@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0097b1d-58f7-11f1-b9ae-cecd02c24f20', 'smallbimmodelingcompanies@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0097bf6-58f7-11f1-b9ae-cecd02c24f20', 'bimspotisanaustrianstartupfoundedin2018thatprovidesasaasplatformforbimorientedcollaborationitstechnologyallowsforthedevelopmentofdigitalbuildingmodelsindependentofspecificsoftwarechoices@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0097cd0-58f7-11f1-b9ae-cecd02c24f20', 'bimlabltdmepconsultancyisaspecializedmepbimconsultancylocatedinlondonukitfocusesonmechanicalelectricalandplumbingservicesforconstructionprojects@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0097da7-58f7-11f1-b9ae-cecd02c24f20', 'bimdesignconsultingisbasedinspainandoffersbimprojectexecutionforbotharchitecturaldesignandmepinstallationsitalsoprovidesbimimplementationandtrainingforindividualsandcompanies@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0097e69-58f7-11f1-b9ae-cecd02c24f20', 'bimconsultingsroisaczechcompanylocatedinpragueitoffersbimmanagementconsultingtoinstitutionsandcompaniescoveringprocessdigitizationprojectmonitoringdatamanagementandstandardization@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0097f49-58f7-11f1-b9ae-cecd02c24f20', 'digitalengineeringworksdeworksisaukbasedcompanyspecializinginbimcontentcreationitprovidesservicestoclientswithintheukandeurope@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c009804f-58f7-11f1-b9ae-cecd02c24f20', 'sagitonisabimmodelingcompanylocatedinpolanditoffersbimservicestoclientsineuropeandfocusesondigitalconstruction@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c00982be-58f7-11f1-b9ae-cecd02c24f20', 'bimpactdesignsisabimoutsourcingcompanythatworkswithclientsineuropeitspecializesinarchitecturalstructuralandmepbimservicesandprovidessolutionsforconstructionprojects@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c00983df-58f7-11f1-b9ae-cecd02c24f20', 'innoviztechnologies@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c00984ca-58f7-11f1-b9ae-cecd02c24f20', 'quanergy@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0098598-58f7-11f1-b9ae-cecd02c24f20', 'velodyne@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0098657-58f7-11f1-b9ae-cecd02c24f20', 'ceptoninc@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c009871c-58f7-11f1-b9ae-cecd02c24f20', 'hesaitechnology@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c00987dd-58f7-11f1-b9ae-cecd02c24f20', 'ouster@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c00988d1-58f7-11f1-b9ae-cecd02c24f20', 'robosense@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c00989b0-58f7-11f1-b9ae-cecd02c24f20', 'geosat@buyer.local', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c0098aa6-58f7-11f1-b9ae-cecd02c24f20', 'shitpostsingh@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', '9999988888'),
  ('c0098bfc-58f7-11f1-b9ae-cecd02c24f20', 'test1@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', '2026-05-09 05:18:57', 'active', NULL),
  ('c0098d43-58f7-11f1-b9ae-cecd02c24f20', 'test90@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', '2026-05-22 08:16:11', 'active', '9999888820'),
  ('c0098e77-58f7-11f1-b9ae-cecd02c24f20', 'testS@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', '2026-02-14 23:31:20', 'active', '9999944444'),
  ('c0098fb5-58f7-11f1-b9ae-cecd02c24f20', 'saranshg180@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', '2026-01-24 09:00:53', 'active', NULL),
  ('c00990fe-58f7-11f1-b9ae-cecd02c24f20', 'testmaile12@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', NULL),
  ('c009923c-58f7-11f1-b9ae-cecd02c24f20', 'tinkermail2508@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', '2026-01-24 07:49:48', 'active', NULL),
  ('c0099361-58f7-11f1-b9ae-cecd02c24f20', 'test8989@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'admin', '2026-05-22 01:57:12', 'active', '8989898989'),
  ('c0099465-58f7-11f1-b9ae-cecd02c24f20', 'test2@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'provider', '2026-01-18 00:20:19', 'active', NULL),
  ('c009958f-58f7-11f1-b9ae-cecd02c24f20', 'shivanshudav48@gmail.com', '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', NULL, 'active', '9999977777'),
  ('c0099691-58f7-11f1-b9ae-cecd02c24f20', NULL, '$2b$12$iK3wjeVTZTUqxcR95e2vRO0Eg2yK07wvpLQkO6kpgjzTQACnz9j7W', 'buyer', '2026-01-23 21:42:27', 'active', '7017025630');

DROP TABLE IF EXISTS `subscriptionplan`;
CREATE TABLE `subscriptionplan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `monthly_price` decimal(10,2) DEFAULT NULL,
  `monthly_credits` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `subscriptionplan` (`id`, `name`, `monthly_price`, `monthly_credits`, `is_active`) VALUES
  (1, 'Starter', '29.00', 50, 1),
  (2, 'Professional', '99.00', 200, 1),
  (3, 'Enterprise', '249.00', 500, 1);

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

INSERT INTO `servicecategory` (`category_id`, `parent_category_id`, `category_name`, `description`, `embedding_vector`) VALUES
  (10, NULL, 'General GIS Services', 'Default category for general GIS-related requests', NULL);

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

-- (no data in buyerprofile)

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

-- (no data in providerprofile)

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
  `ai_processed` tinyint(1) DEFAULT '0',
  `ai_summary` json DEFAULT NULL,
  `ai_skills` json DEFAULT NULL,
  `ai_processed_at` datetime DEFAULT NULL,
  `ai_version` varchar(20) DEFAULT 'v1.0',
  PRIMARY KEY (`project_id`),
  KEY `idx_project_buyer` (`buyer_id`),
  KEY `idx_project_status` (`status`),
  KEY `idx_project_created` (`created_at` DESC),
  KEY `idx_awarded_to` (`awarded_to`),
  KEY `idx_ai_processed` (`ai_processed`),
  FULLTEXT KEY `idx_project_search` (`title`,`description`),
  CONSTRAINT `projectrequest_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyerprofile` (`buyer_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- (no data in projectrequest)

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

INSERT INTO `rfp_drafts` (`draft_id`, `buyer_id`, `title`, `description`, `budget`, `currency`, `start_date`, `end_date`, `submission_deadline`, `visibility`, `contact_person`, `contact_email`, `credits`) VALUES
  ('daa29031-136f-4263-98c5-5a6dd4fe2bfb', 'c288424d-c135-426e-afa5-a72040ae6476', 'dwad', 'awdad', '0.00', 'USD', NULL, NULL, NULL, 'public', '', '', 0);

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

-- (no data in proposal)

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

-- (no data in proposal_drafts)

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

-- (no data in contract)

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

-- (no data in payment)

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

-- (no data in review)

DROP TABLE IF EXISTS `rfp_provider_match`;
CREATE TABLE `rfp_provider_match` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `project_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `match_score` decimal(5,4) NOT NULL,
  `reason` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_rfp_provider` (`project_id`,`provider_id`),
  KEY `idx_rfp_matches` (`project_id`),
  KEY `idx_provider_matches` (`provider_id`),
  CONSTRAINT `rfp_provider_match_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projectrequest` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `rfp_provider_match_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providerprofile` (`provider_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- (no data in rfp_provider_match)

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

INSERT INTO `creditledger` (`id`, `provider_id`, `credits`, `type`, `reason`) VALUES
  ('141e0a37-52d8-11f1-bf88-cc28aac91a8b', '7e3e2e3f-ddc9-11f0-8727-001a7dda7113', 200, 'credit', 'Manual credit addition'),
  ('1ec2ad6b-1619-460d-ad74-7663003e1551', '1144a92e-ba5c-442e-9ff0-1e4f2dff4860', 20, 'debit', 'Proposal submission'),
  ('216a4d00-d2a8-47de-a540-ec0a5e2f445b', '1144a92e-ba5c-442e-9ff0-1e4f2dff4860', 20, 'debit', 'Proposal submission'),
  ('25d4f454-7031-402c-aa2b-7706fbab3cc1', '1144a92e-ba5c-442e-9ff0-1e4f2dff4860', 20, 'debit', 'Proposal submission'),
  ('673dcef9-5388-11f1-a1b9-28d043f11fd3', '7e33a7b4-ddc9-11f0-8727-001a7dda7113', 200, 'credit', 'Manual credit addition'),
  ('6e4c635b-60ff-46f8-85df-2cd734aa05b3', '1144a92e-ba5c-442e-9ff0-1e4f2dff4860', 200, 'credit', 'Initial credits'),
  ('97b29cc1-538a-11f1-a1b9-28d043f11fd3', '7e33a7b4-ddc9-11f0-8727-001a7dda7113', 20, 'debit', 'Proposal submission for project 1dc0d4b0-7a65-46fb-bc68-29f57c457363'),
  ('a29f0200-58db-4461-a2c7-5ba9df148374', '0b5442e4-e580-4e19-a0c6-4201a807c824', 100, 'credit', 'Initial credits'),
  ('a42d6963-92b8-42a0-a1ff-543d3ccfaa37', '1144a92e-ba5c-442e-9ff0-1e4f2dff4860', 20, 'debit', 'Proposal submission'),
  ('aa67529a-cba5-4857-b8a4-ab0d37be15c9', '1144a92e-ba5c-442e-9ff0-1e4f2dff4860', 20, 'debit', 'Proposal submission'),
  ('deb371bd-bf4d-4ffb-82c9-5bda41393be9', '1144a92e-ba5c-442e-9ff0-1e4f2dff4860', 20, 'debit', 'Proposal submission');

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

-- (no data in servicelisting)

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
) ENGINE=InnoDB AUTO_INCREMENT=263 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- (no data in sessions)

SET FOREIGN_KEY_CHECKS = 1;
