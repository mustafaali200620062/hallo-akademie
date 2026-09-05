import { pgTable, text, integer, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ========== الأدوار ==========
export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== المستويات ==========
export const levels = pgTable('levels', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== الملفات الشخصية ==========
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  role_id: text('role_id').references(() => roles.id),
  full_name: text('full_name').notNull(),
  email: text('email').unique(),
  password: text('password'),
  phone: text('phone'),
  level_id: text('level_id').references(() => levels.id),
  is_active: boolean('is_active').default(true),
  is_approved: boolean('is_approved').default(false),
  last_seen_at: timestamp('last_seen_at'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== طلبات الانضمام ==========
export const joinRequests = pgTable('join_requests', {
  id: text('id').primaryKey(),
  student_id: text('student_id').references(() => profiles.id),
  level_id: text('level_id').references(() => levels.id),
  status: text('status').default('pending'),
  reviewed_by: text('reviewed_by').references(() => profiles.id),
  reviewed_at: timestamp('reviewed_at'),
  notes: text('notes'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== المجموعات ==========
export const groups = pgTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  level_id: text('level_id').references(() => levels.id),
  teacher_id: text('teacher_id').references(() => profiles.id),
  assistant_id: text('assistant_id').references(() => profiles.id),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== ربط الطلاب بالمجموعات ==========
export const groupStudents = pgTable('group_students', {
  id: text('id').primaryKey(),
  group_id: text('group_id').references(() => groups.id),
  student_id: text('student_id').references(() => profiles.id),
  joined_at: timestamp('joined_at').default(sql`CURRENT_TIMESTAMP`),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== الشروح ==========
export const lessons = pgTable('lessons', {
  id: text('id').primaryKey(),
  group_id: text('group_id').references(() => groups.id),
  level_id: text('level_id').references(() => levels.id),
  created_by: text('created_by').references(() => profiles.id),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content'),
  content_url: text('content_url'),
  content_type: text('content_type'),
  is_published: boolean('is_published').default(false),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== الاختبارات ==========
export const exams = pgTable('exams', {
  id: text('id').primaryKey(),
  group_id: text('group_id').references(() => groups.id),
  level_id: text('level_id').references(() => levels.id),
  created_by: text('created_by').references(() => profiles.id),
  title: text('title').notNull(),
  description: text('description'),
  starts_at: timestamp('starts_at').notNull(),
  ends_at: timestamp('ends_at').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  total_points: integer('total_points').default(0),
  status: text('status').default('draft'),
  settings: text('settings'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== أسئلة الاختبارات ==========
export const examQuestions = pgTable('exam_questions', {
  id: text('id').primaryKey(),
  exam_id: text('exam_id').references(() => exams.id),
  question_order: integer('question_order').notNull(),
  question_type: text('question_type').notNull(),
  question_text: text('question_text').notNull(),
  media_url: text('media_url'),
  options: text('options'),
  correct_answer: text('correct_answer'),
  points: integer('points').default(1),
  explanation: text('explanation'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== محاولات الاختبار ==========
export const examAttempts = pgTable('exam_attempts', {
  id: text('id').primaryKey(),
  exam_id: text('exam_id').references(() => exams.id),
  student_id: text('student_id').references(() => profiles.id),
  status: text('status').default('not_started'),
  started_at: timestamp('started_at'),
  submitted_at: timestamp('submitted_at'),
  extra_minutes: integer('extra_minutes').default(0),
  total_score: integer('total_score').default(0),
  is_reentry_allowed: boolean('is_reentry_allowed').default(false),
  locked_reason: text('locked_reason'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== إجابات الطلاب ==========
export const studentAnswers = pgTable('student_answers', {
  id: text('id').primaryKey(),
  attempt_id: text('attempt_id').references(() => examAttempts.id),
  question_id: text('question_id').references(() => examQuestions.id),
  answer: text('answer'),
  is_correct: boolean('is_correct'),
  awarded_points: integer('awarded_points').default(0),
  answered_at: timestamp('answered_at').default(sql`CURRENT_TIMESTAMP`),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== أخطاء الطلاب ==========
export const studentErrors = pgTable('student_errors', {
  id: text('id').primaryKey(),
  student_id: text('student_id').references(() => profiles.id),
  question_id: text('question_id').references(() => examQuestions.id),
  attempt_id: text('attempt_id').references(() => examAttempts.id),
  student_answer: text('student_answer'),
  correct_answer: text('correct_answer'),
  is_reviewed: boolean('is_reviewed').default(false),
  reviewed_at: timestamp('reviewed_at'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== نقاط الطلاب ==========
export const studentPoints = pgTable('student_points', {
  student_id: text('student_id').primaryKey().references(() => profiles.id),
  level_id: text('level_id').references(() => levels.id),
  total_points: integer('total_points').default(0),
  rank: integer('rank'),
  exams_completed: integer('exams_completed').default(0),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== منشورات المنتدى ==========
export const forumPosts = pgTable('forum_posts', {
  id: text('id').primaryKey(),
  level_id: text('level_id').references(() => levels.id),
  author_id: text('author_id').references(() => profiles.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== تعليقات المنتدى ==========
export const forumComments = pgTable('forum_comments', {
  id: text('id').primaryKey(),
  post_id: text('post_id').references(() => forumPosts.id),
  author_id: text('author_id').references(() => profiles.id),
  body: text('body').notNull(),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== الإشعارات ==========
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  recipient_id: text('recipient_id').references(() => profiles.id),
  actor_id: text('actor_id').references(() => profiles.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  payload: text('payload'),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== البريد المسموح به ==========
export const allowedEmails = pgTable('allowed_emails', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role_name: text('role_name').notNull(),
  created_by: text('created_by').references(() => profiles.id),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
})