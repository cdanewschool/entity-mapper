-- phpMyAdmin SQL Dump
-- version 3.5.7
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Nov 21, 2013 at 02:46 PM
-- Server version: 5.6.10
-- PHP Version: 5.3.26

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `entitymapper`
--

--
-- Dumping data for table `import_types`
--

TRUNCATE TABLE `import_types`;

INSERT INTO `import_types` (`id`, `name`, `mime_type`, `class_name`, `file_name`, `is_default`) VALUES
(1, 'ATLAS.ti', 'text/xml', 'AtlasTI', 'atlasti', 1);

--
-- Dumping data for table `users`
--

TRUNCATE TABLE `users`;

INSERT INTO `users` (`id`, `username`, `password`, `role_id`) VALUES
(1, 'admin', '21232f297a57a5a743894a0e4a801fc3', 3);

INSERT INTO `users` (`id`, `username`, `password`, `role_id`) VALUES
(2, 'guest', '084e0343a0486ff05530df6c705c8bb4', 1);

--
-- Dumping data for table `user_roles`
--

TRUNCATE TABLE `user_roles`;

INSERT INTO `user_roles` (`id`, `title`, `can_upload`, `is_admin`) VALUES
(1, 'user', 0, 0),
(2, 'contributor', 1, 0),
(3, 'admin', 1, 1);
