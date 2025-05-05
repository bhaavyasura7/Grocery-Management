-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: grocery_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bill_items`
--
USE grocery_db;
DROP TABLE IF EXISTS `bill_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_id` int DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bill_id` (`bill_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `bill_items_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bill_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `grocery` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_items`
--

LOCK TABLES `bill_items` WRITE;
/*!40000 ALTER TABLE `bill_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `bill_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buyer_name` varchar(100) NOT NULL,
  `buyer_mobile` varchar(20) NOT NULL,
  `cashier` varchar(50) NOT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (1,'a','9876543567','cashier1','2025-04-20 16:41:06',3.98),(3,'s','9876543234','cashier1','2025-04-20 16:41:21',3.98),(4,'s','9876543234','cashier1','2025-04-20 16:41:21',3.98),(5,'a','9875123456','cashier1','2025-04-20 16:41:39',9.95),(6,'a','9875123456','cashier1','2025-04-20 16:41:39',9.95),(7,'a','9876543345','cashier1','2025-04-20 16:43:00',7.96),(8,'a','9876543345','cashier1','2025-04-20 16:43:00',7.96),(9,'z','7643654543','cashier1','2025-04-20 16:43:21',7.96),(10,'z','7643654543','cashier1','2025-04-20 16:43:21',7.96),(13,'a','8765675456','cashier1','2025-04-20 16:48:41',2.40),(14,'a','8765675456','cashier1','2025-04-20 16:48:41',2.40),(15,'a','8723456763','cashier1','2025-04-20 16:58:23',5.97),(16,'a','8723456763','cashier1','2025-04-20 16:58:23',5.97),(17,'q','9876543234','cashier1','2025-04-20 17:12:09',3.98),(18,'q','9876543234','cashier1','2025-04-20 17:12:09',3.98),(19,'a','9876543456','cashier1','2025-04-20 17:12:33',1.98),(20,'a','9876543456','cashier1','2025-04-20 17:12:33',1.98),(21,'av','9876543456','cashier1','2025-04-20 17:18:37',21.30),(22,'av','9876543456','cashier1','2025-04-20 17:18:37',21.30),(23,'a','8765434556','cashier1','2025-04-20 17:18:55',3.98),(24,'a','8765434556','cashier1','2025-04-20 17:19:23',11.00),(25,'a','8765434556','cashier1','2025-04-20 17:19:23',11.00),(26,'adsfasdf','9876543213','cashier1','2025-04-20 17:19:38',8.40),(27,'adsfasdf','9876543213','cashier1','2025-04-20 17:19:38',8.40),(28,'a','9876543234','cashier1','2025-04-20 17:20:05',38.50),(29,'a','9876543234','cashier1','2025-04-20 17:20:05',38.50),(30,'vi','9234567876','cashier1','2025-04-21 16:28:34',165.00),(31,'vi','9234567876','cashier1','2025-04-21 16:28:34',165.00),(32,'b','9876543212','cashier1','2025-04-21 16:28:59',3.96),(33,'b','9876543212','cashier1','2025-04-21 16:28:59',3.96),(34,'avi','9876543212','cashier1','2025-04-21 16:30:05',5.60),(35,'sreeya','9876543987','cashier1','2025-04-21 16:48:19',85.39),(36,'riya','2897837589','cashier1','2025-04-21 16:50:44',19.60),(37,'anudeep','0987654323','cashier1','2025-04-21 16:51:20',5.60),(38,'bhaavs','9847263456','cashier1','2025-04-21 16:58:40',7.98),(39,'bhaavya','9876543234','cashier1','2025-04-22 13:33:30',1.98),(40,'wee','9087654321','cashier1','2025-04-22 13:52:56',11.00),(41,'bhaavya','9087654321','cashier1','2025-04-22 14:47:49',173.10),(42,'erer','9087654321','cashier1','2025-04-24 09:01:48',102.00);
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grocery`
--

DROP TABLE IF EXISTS `grocery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grocery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `threshold` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grocery`
--

LOCK TABLES `grocery` WRITE;
/*!40000 ALTER TABLE `grocery` DISABLE KEYS */;
INSERT INTO `grocery` VALUES (1,'Apple',30,1.99,10),(2,'Milk',15,2.50,5),(3,'Bread',3,1.20,8),(4,'Eggs',35,3.99,10),(5,'Rice',9,5.50,15),(7,'Salt',56,0.99,5),(8,'Butter',0,4.20,5),(9,'Cheese',35,3.75,8),(10,'Yogurt',50,2.99,6),(11,'Chicken',16,6.50,5),(12,'Beef',15,8.99,5),(13,'Fish',5,7.20,5),(14,'Tomatoes',80,1.50,10),(15,'Onions',90,1.10,12),(16,'Potatoes',100,0.80,15),(17,'Carrots',75,1.30,10),(18,'Cabbage',50,2.00,5),(19,'Lettuce',40,1.75,6),(20,'Oranges',60,2.25,10),(21,'Bananas',70,1.60,8),(22,'Strawberries',40,4.99,6),(23,'Pineapple',30,3.50,5),(24,'Cucumber',55,1.40,10),(25,'Garlic',50,0.75,5),(26,'Ginger',40,2.20,5),(27,'Coffee',25,7.99,5),(28,'Tea',30,4.50,5),(29,'Biscuits',60,2.10,10),(30,'Juice',50,3.00,6),(31,'Honey',20,6.99,4),(32,'Olive Oil',15,9.50,3),(33,'Vegetable Oil',25,5.99,5),(34,'Flour',80,2.40,10),(35,'Pasta',30,1.90,8),(36,'Noodles',60,2.30,7),(37,'Cereal',45,4.20,6),(38,'Peanut Butter',30,5.50,5),(39,'Jam',35,3.99,5),(40,'Ketchup',25,2.80,5),(41,'Mayonnaise',20,3.60,4),(42,'Soya Sauce',30,2.50,5),(43,'Vinegar',25,1.99,5),(44,'Cornflakes',40,3.75,6),(45,'Chips',50,1.50,8),(46,'Cookies',55,2.90,8),(47,'Ice Cream',20,5.25,5),(48,'Soda',60,1.80,10),(49,'Mineral Water',100,0.99,15);
/*!40000 ALTER TABLE `grocery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `grocery` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paused_transactions`
--

DROP TABLE IF EXISTS `paused_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paused_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buyer_name` varchar(100) NOT NULL,
  `buyer_mobile` varchar(20) NOT NULL,
  `cashier` varchar(50) NOT NULL,
  `cart_data` json NOT NULL,
  `pause_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','resumed','expired') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_buyer_mobile` (`buyer_mobile`),
  KEY `idx_cashier` (`cashier`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paused_transactions`
--

LOCK TABLES `paused_transactions` WRITE;
/*!40000 ALTER TABLE `paused_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `paused_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` enum('admin','cashier') NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `worker_id` varchar(50) DEFAULT NULL,
  `theme_preference` enum('light','dark') DEFAULT 'light',
  `theme_color` varchar(7) DEFAULT '#015551',
  `profile_picture_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin123','admin',NULL,NULL,NULL,NULL,'light','#015551',NULL),(2,'cashier1','cashier123','cashier',NULL,NULL,NULL,NULL,'light','#015551',NULL),(3,'cashier2','cashier123','cashier',NULL,NULL,NULL,NULL,'light','#015551',NULL),(4,'cashier3','cashier123','cashier',NULL,NULL,NULL,NULL,'light','#015551',NULL),(5,'cashier7','cashier123','cashier',NULL,NULL,NULL,NULL,'light','#015551',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workers`
--

DROP TABLE IF EXISTS `workers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `position` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workers`
--

LOCK TABLES `workers` WRITE;
/*!40000 ALTER TABLE `workers` DISABLE KEYS */;
/*!40000 ALTER TABLE `workers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-05 20:35:04
