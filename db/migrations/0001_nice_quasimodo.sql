ALTER TABLE record_types ADD `allow_private` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE users ADD `hashed_password` text;--> statement-breakpoint
ALTER TABLE users ADD `age` integer;--> statement-breakpoint
ALTER TABLE users ADD `relationship_to_admin` text;