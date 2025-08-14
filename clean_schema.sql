CREATE TABLE `contact_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE `quick_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`household_id` text NOT NULL,
	`created_by` integer,
	`tags` text,
	`attachments` text,
	`record_id` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `record_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`household_id` text NOT NULL,
	`fields` text,
	`icon` text,
	`color` text,
	`created_by` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP', 
	`allow_private` integer DEFAULT 0, 
	`category` text DEFAULT 'Personal' NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`record_type_id` integer,
	`household_id` text NOT NULL,
	`created_by` integer,
	`tags` text,
	`attachments` text,
	`is_private` integer DEFAULT 0,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP', 
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP', 
	`datetime` text, 
	`member_id` integer REFERENCES `users`(`id`),
	FOREIGN KEY (`record_type_id`) REFERENCES `record_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`household_id` text NOT NULL,
	`role` text DEFAULT 'member',
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`hashed_password` text, 
	`age` integer, 
	`relationship_to_admin` text
);

CREATE TABLE `households` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`invite_code` text UNIQUE NOT NULL,
	`created_by` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
