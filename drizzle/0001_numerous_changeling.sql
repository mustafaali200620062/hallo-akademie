ALTER TABLE `profiles` ADD `email` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `password` text;--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);