CREATE INDEX `records_household_record_type_idx` ON `records` (`household_id`,`record_type_id`,`datetime`);--> statement-breakpoint
CREATE INDEX `records_household_member_idx` ON `records` (`household_id`,`member_id`,`datetime`);--> statement-breakpoint
CREATE INDEX `records_datetime_idx` ON `records` (`datetime`);--> statement-breakpoint
CREATE INDEX `records_title_idx` ON `records` (`household_id`,`record_type_id`,`title`);