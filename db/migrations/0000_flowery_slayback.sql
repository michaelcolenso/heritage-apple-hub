CREATE TABLE `cart_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`listingId` bigint unsigned NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_cart_user_listing` UNIQUE(`userId`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`sellerId` bigint unsigned NOT NULL,
	`varietyId` bigint unsigned NOT NULL,
	`quantity` int NOT NULL,
	`pricePerStick` decimal(10,2) NOT NULL,
	`description` text,
	`shippingZones` json,
	`status` enum('active','paused','sold_out','draft') DEFAULT 'active',
	`images` json,
	`harvestDate` date,
	`expiresAt` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`buyerId` bigint unsigned NOT NULL,
	`sellerId` bigint unsigned NOT NULL,
	`listingId` bigint unsigned NOT NULL,
	`varietyName` varchar(100) NOT NULL,
	`quantity` int NOT NULL,
	`pricePerStick` decimal(10,2) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`sellerPayout` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','shipped','delivered','cancelled','disputed') DEFAULT 'pending',
	`shippingAddress` text,
	`trackingNumber` varchar(100),
	`stripePaymentIntent` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`orderId` bigint unsigned NOT NULL,
	`reviewerId` bigint unsigned NOT NULL,
	`sellerId` bigint unsigned NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_offers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`offererId` bigint unsigned NOT NULL,
	`offererVarietyId` bigint unsigned NOT NULL,
	`offererQuantity` int NOT NULL,
	`targetVarietyId` bigint unsigned NOT NULL,
	`targetQuantity` int NOT NULL,
	`status` enum('open','accepted','completed','cancelled') DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`unionId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`avatar` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`hardinessZone` int,
	`location` varchar(100),
	`bio` text,
	`isVerifiedSeller` boolean DEFAULT false,
	`stripeConnectId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_unionId_unique` UNIQUE(`unionId`)
);
--> statement-breakpoint
CREATE TABLE `varieties` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`originYear` int,
	`originCountry` varchar(100),
	`description` text,
	`flavorProfile` varchar(255),
	`primaryUse` varchar(50),
	`skinColor` varchar(100),
	`fleshColor` varchar(100),
	`diseaseResistance` varchar(255),
	`hardinessZoneMin` int,
	`hardinessZoneMax` int,
	`parentage` varchar(255),
	`imageUrl` varchar(500),
	`popularity` int DEFAULT 0,
	`isRare` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `varieties_id` PRIMARY KEY(`id`),
	CONSTRAINT `varieties_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`varietyId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlists_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_wishlist_user_variety` UNIQUE(`userId`,`varietyId`)
);
--> statement-breakpoint
CREATE INDEX `idx_listing_seller` ON `listings` (`sellerId`);--> statement-breakpoint
CREATE INDEX `idx_listing_variety` ON `listings` (`varietyId`);--> statement-breakpoint
CREATE INDEX `idx_listing_status` ON `listings` (`status`);--> statement-breakpoint
CREATE INDEX `idx_listing_price` ON `listings` (`pricePerStick`);--> statement-breakpoint
CREATE INDEX `idx_order_buyer` ON `orders` (`buyerId`);--> statement-breakpoint
CREATE INDEX `idx_order_seller` ON `orders` (`sellerId`);--> statement-breakpoint
CREATE INDEX `idx_order_listing` ON `orders` (`listingId`);--> statement-breakpoint
CREATE INDEX `idx_order_status` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_review_seller` ON `reviews` (`sellerId`);--> statement-breakpoint
CREATE INDEX `idx_review_order` ON `reviews` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_variety_slug` ON `varieties` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_variety_use` ON `varieties` (`primaryUse`);--> statement-breakpoint
CREATE INDEX `idx_variety_zone_min` ON `varieties` (`hardinessZoneMin`);--> statement-breakpoint
CREATE INDEX `idx_variety_zone_max` ON `varieties` (`hardinessZoneMax`);--> statement-breakpoint
CREATE INDEX `idx_variety_rare` ON `varieties` (`isRare`);