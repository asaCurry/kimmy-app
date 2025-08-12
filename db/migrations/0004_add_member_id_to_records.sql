ALTER TABLE records ADD `member_id` integer REFERENCES `users`(`id`);
