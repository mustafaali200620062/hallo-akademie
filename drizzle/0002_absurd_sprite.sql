PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_allowed_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role_name` text NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_allowed_emails`("id", "email", "role_name", "created_by", "created_at") SELECT "id", "email", "role_name", "created_by", "created_at" FROM `allowed_emails`;--> statement-breakpoint
DROP TABLE `allowed_emails`;--> statement-breakpoint
ALTER TABLE `__new_allowed_emails` RENAME TO `allowed_emails`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `allowed_emails_email_unique` ON `allowed_emails` (`email`);--> statement-breakpoint
CREATE TABLE `__new_exam_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text,
	`student_id` text,
	`status` text DEFAULT 'not_started',
	`started_at` text,
	`submitted_at` text,
	`extra_minutes` integer DEFAULT 0,
	`total_score` integer DEFAULT 0,
	`is_reentry_allowed` integer DEFAULT false,
	`locked_reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_exam_attempts`("id", "exam_id", "student_id", "status", "started_at", "submitted_at", "extra_minutes", "total_score", "is_reentry_allowed", "locked_reason", "created_at", "updated_at") SELECT "id", "exam_id", "student_id", "status", "started_at", "submitted_at", "extra_minutes", "total_score", "is_reentry_allowed", "locked_reason", "created_at", "updated_at" FROM `exam_attempts`;--> statement-breakpoint
DROP TABLE `exam_attempts`;--> statement-breakpoint
ALTER TABLE `__new_exam_attempts` RENAME TO `exam_attempts`;--> statement-breakpoint
CREATE TABLE `__new_exam_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text,
	`question_order` integer NOT NULL,
	`question_type` text NOT NULL,
	`question_text` text NOT NULL,
	`media_url` text,
	`options` text,
	`correct_answer` text,
	`points` integer DEFAULT 1,
	`explanation` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_exam_questions`("id", "exam_id", "question_order", "question_type", "question_text", "media_url", "options", "correct_answer", "points", "explanation", "created_at", "updated_at") SELECT "id", "exam_id", "question_order", "question_type", "question_text", "media_url", "options", "correct_answer", "points", "explanation", "created_at", "updated_at" FROM `exam_questions`;--> statement-breakpoint
DROP TABLE `exam_questions`;--> statement-breakpoint
ALTER TABLE `__new_exam_questions` RENAME TO `exam_questions`;--> statement-breakpoint
CREATE TABLE `__new_exams` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text,
	`level_id` text,
	`created_by` text,
	`title` text NOT NULL,
	`description` text,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`total_points` integer DEFAULT 0,
	`status` text DEFAULT 'draft',
	`settings` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_exams`("id", "group_id", "level_id", "created_by", "title", "description", "starts_at", "ends_at", "duration_minutes", "total_points", "status", "settings", "created_at", "updated_at") SELECT "id", "group_id", "level_id", "created_by", "title", "description", "starts_at", "ends_at", "duration_minutes", "total_points", "status", "settings", "created_at", "updated_at" FROM `exams`;--> statement-breakpoint
DROP TABLE `exams`;--> statement-breakpoint
ALTER TABLE `__new_exams` RENAME TO `exams`;--> statement-breakpoint
CREATE TABLE `__new_forum_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text,
	`author_id` text,
	`body` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_forum_comments`("id", "post_id", "author_id", "body", "created_at", "updated_at") SELECT "id", "post_id", "author_id", "body", "created_at", "updated_at" FROM `forum_comments`;--> statement-breakpoint
DROP TABLE `forum_comments`;--> statement-breakpoint
ALTER TABLE `__new_forum_comments` RENAME TO `forum_comments`;--> statement-breakpoint
CREATE TABLE `__new_forum_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`level_id` text,
	`author_id` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_forum_posts`("id", "level_id", "author_id", "title", "body", "created_at", "updated_at") SELECT "id", "level_id", "author_id", "title", "body", "created_at", "updated_at" FROM `forum_posts`;--> statement-breakpoint
DROP TABLE `forum_posts`;--> statement-breakpoint
ALTER TABLE `__new_forum_posts` RENAME TO `forum_posts`;--> statement-breakpoint
CREATE TABLE `__new_group_students` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text,
	`student_id` text,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_group_students`("id", "group_id", "student_id", "joined_at", "is_active", "created_at", "updated_at") SELECT "id", "group_id", "student_id", "joined_at", "is_active", "created_at", "updated_at" FROM `group_students`;--> statement-breakpoint
DROP TABLE `group_students`;--> statement-breakpoint
ALTER TABLE `__new_group_students` RENAME TO `group_students`;--> statement-breakpoint
CREATE TABLE `__new_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`level_id` text,
	`teacher_id` text,
	`assistant_id` text,
	`description` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assistant_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_groups`("id", "name", "level_id", "teacher_id", "assistant_id", "description", "is_active", "created_at", "updated_at") SELECT "id", "name", "level_id", "teacher_id", "assistant_id", "description", "is_active", "created_at", "updated_at" FROM `groups`;--> statement-breakpoint
DROP TABLE `groups`;--> statement-breakpoint
ALTER TABLE `__new_groups` RENAME TO `groups`;--> statement-breakpoint
CREATE TABLE `__new_join_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text,
	`level_id` text,
	`status` text DEFAULT 'pending',
	`reviewed_by` text,
	`reviewed_at` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_join_requests`("id", "student_id", "level_id", "status", "reviewed_by", "reviewed_at", "notes", "created_at", "updated_at") SELECT "id", "student_id", "level_id", "status", "reviewed_by", "reviewed_at", "notes", "created_at", "updated_at" FROM `join_requests`;--> statement-breakpoint
DROP TABLE `join_requests`;--> statement-breakpoint
ALTER TABLE `__new_join_requests` RENAME TO `join_requests`;--> statement-breakpoint
CREATE TABLE `__new_lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text,
	`level_id` text,
	`created_by` text,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`content_url` text,
	`content_type` text,
	`is_published` integer DEFAULT false,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_lessons`("id", "group_id", "level_id", "created_by", "title", "description", "content", "content_url", "content_type", "is_published", "published_at", "created_at", "updated_at") SELECT "id", "group_id", "level_id", "created_by", "title", "description", "content", "content_url", "content_type", "is_published", "published_at", "created_at", "updated_at" FROM `lessons`;--> statement-breakpoint
DROP TABLE `lessons`;--> statement-breakpoint
ALTER TABLE `__new_lessons` RENAME TO `lessons`;--> statement-breakpoint
CREATE TABLE `__new_levels` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `__new_levels`("id", "code", "title", "description", "created_at", "updated_at") SELECT "id", "code", "title", "description", "created_at", "updated_at" FROM `levels`;--> statement-breakpoint
DROP TABLE `levels`;--> statement-breakpoint
ALTER TABLE `__new_levels` RENAME TO `levels`;--> statement-breakpoint
CREATE UNIQUE INDEX `levels_code_unique` ON `levels` (`code`);--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_id` text,
	`actor_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`payload` text,
	`is_read` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`recipient_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "recipient_id", "actor_id", "type", "title", "body", "payload", "is_read", "created_at", "updated_at") SELECT "id", "recipient_id", "actor_id", "type", "title", "body", "payload", "is_read", "created_at", "updated_at" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
CREATE TABLE `__new_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `__new_roles`("id", "name", "description", "created_at", "updated_at") SELECT "id", "name", "description", "created_at", "updated_at" FROM `roles`;--> statement-breakpoint
DROP TABLE `roles`;--> statement-breakpoint
ALTER TABLE `__new_roles` RENAME TO `roles`;--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `__new_student_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text,
	`question_id` text,
	`answer` text,
	`is_correct` integer,
	`awarded_points` integer DEFAULT 0,
	`answered_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `exam_questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_student_answers`("id", "attempt_id", "question_id", "answer", "is_correct", "awarded_points", "answered_at", "created_at", "updated_at") SELECT "id", "attempt_id", "question_id", "answer", "is_correct", "awarded_points", "answered_at", "created_at", "updated_at" FROM `student_answers`;--> statement-breakpoint
DROP TABLE `student_answers`;--> statement-breakpoint
ALTER TABLE `__new_student_answers` RENAME TO `student_answers`;--> statement-breakpoint
CREATE TABLE `__new_student_errors` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text,
	`question_id` text,
	`attempt_id` text,
	`student_answer` text,
	`correct_answer` text,
	`is_reviewed` integer DEFAULT false,
	`reviewed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `exam_questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_student_errors`("id", "student_id", "question_id", "attempt_id", "student_answer", "correct_answer", "is_reviewed", "reviewed_at", "created_at", "updated_at") SELECT "id", "student_id", "question_id", "attempt_id", "student_answer", "correct_answer", "is_reviewed", "reviewed_at", "created_at", "updated_at" FROM `student_errors`;--> statement-breakpoint
DROP TABLE `student_errors`;--> statement-breakpoint
ALTER TABLE `__new_student_errors` RENAME TO `student_errors`;