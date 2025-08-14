
 ⛅️ wrangler 4.21.2 (update available 4.29.1)
─────────────────────────────────────────────
🌀 Executing on remote database kimmy-app-db (6d9a4a6c-81c4-4338-9c5d-4c688f57091a):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.5825ms
[
  {
    "results": [
      {
        "sql": "CREATE TABLE `contact_submissions` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`name` text NOT NULL,\n\t`email` text NOT NULL,\n\t`message` text NOT NULL,\n\t`created_at` text DEFAULT 'CURRENT_TIMESTAMP'\n)"
      },
      {
        "sql": "CREATE TABLE `quick_notes` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`content` text NOT NULL,\n\t`family_id` text NOT NULL,\n\t`created_by` integer,\n\t`tags` text,\n\t`attachments` text,\n\t`record_id` integer,\n\t`created_at` text DEFAULT 'CURRENT_TIMESTAMP',\n\tFOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action\n)"
      },
      {
        "sql": "CREATE TABLE `record_types` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`name` text NOT NULL,\n\t`description` text,\n\t`family_id` text NOT NULL,\n\t`fields` text,\n\t`icon` text,\n\t`color` text,\n\t`created_by` integer,\n\t`created_at` text DEFAULT 'CURRENT_TIMESTAMP', `allow_private` integer DEFAULT 0, `category` text DEFAULT 'Personal' NOT NULL,\n\tFOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action\n)"
      },
      {
        "sql": "CREATE TABLE `records` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`title` text NOT NULL,\n\t`content` text,\n\t`record_type_id` integer,\n\t`family_id` text NOT NULL,\n\t`created_by` integer,\n\t`tags` text,\n\t`attachments` text,\n\t`is_private` integer DEFAULT 0,\n\t`created_at` text DEFAULT 'CURRENT_TIMESTAMP',\n\t`updated_at` text DEFAULT 'CURRENT_TIMESTAMP', `datetime` text, `member_id` integer REFERENCES `users`(`id`),\n\tFOREIGN KEY (`record_type_id`) REFERENCES `record_types`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action\n)"
      },
      {
        "sql": "CREATE TABLE `users` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`name` text NOT NULL,\n\t`email` text NOT NULL,\n\t`family_id` text NOT NULL,\n\t`role` text DEFAULT 'member',\n\t`created_at` text DEFAULT 'CURRENT_TIMESTAMP'\n, `hashed_password` text, `age` integer, `relationship_to_admin` text)"
      },
      {
        "sql": "CREATE TABLE d1_migrations(\n\t\tid         INTEGER PRIMARY KEY AUTOINCREMENT,\n\t\tname       TEXT UNIQUE,\n\t\tapplied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL\n)"
      },
      {
        "sql": "CREATE TABLE `households` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`invite_code` text UNIQUE NOT NULL,\n\t`created_by` integer,\n\t`created_at` text DEFAULT 'CURRENT_TIMESTAMP',\n\t`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',\n\tFOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action\n)"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "ENAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.5825
      },
      "duration": 0.5825,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 65536,
      "rows_read": 14,
      "rows_written": 0
    }
  }
]
