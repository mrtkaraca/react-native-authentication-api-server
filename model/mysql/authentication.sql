create database authentication

use authentication

CREATE TABLE `users` (
  `userId` varchar(36) PRIMARY KEY NOT NULL,
  `userName` varchar(30),
  `userNickName` varchar(255) UNIQUE NOT NULL,
  `userPassword` varchar(255) NOT NULL,
  `userEmail` varchar(255) UNIQUE NOT NULL,
  `createDate` date NOT NULL,
  `updateDate` date,
);

CREATE TABLE `emailVerificationSession` (
  `token` text NOT NULL,
  `tokenExp` int NOT NULL,
  `isActive` boolean
);

create event deleteSessionTokens on schedule every 1 hour
	do delete from emailverificationsession where tokenExp < unix_timestamp()