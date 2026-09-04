import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ========== الأدوار ==========
export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== المستويات ==========
export const levels = sqliteTable('levels', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== الملفات الشخصية ==========
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  role_id: text('role_id').references(() => roles.id),
  full_name: text('full_name').notNull(),
  email: text('email').unique(),
  password: text('password'),
  phone: text('phone'),
  level_id: text('level_id').references(() => levels.id),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  is_approved: integer('is_approved', { mode: 'boolean' }).default(false),
  last_seen_at: text('last_seen_at'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== طلبات الانضمام ==========
export const joinRequests = sqliteTable('join_requests', {
  id: text('id').primaryKey(),
  student_id: text('student_id').references(() => profiles.id),
  level_id: text('level_id').references(() => levels.id),
  status: text('status').default('pending'),
  reviewed_by: text('reviewed_by').references(() => profiles.id),
  reviewed_at: text('reviewed_at'),
  notes: text('notes'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== المجموعات ==========
export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  level_id: text('level_id').references(() => levels.id),
  teacher_id: text('teacher_id').references(() => profiles.id),
  assistant_id: text('assistant_id').references(() => profiles.id),
  description: text('description'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== ربط الطلاب بالمجموعات ==========
export const groupStudents = sqliteTable('group_students', {
  id: text('id').primaryKey(),
  group_id: text('group_id').references(() => groups.id),
  student_id: text('student_id').references(() => profiles.id),
  joined_at: text('joined_at').default(sql`CURRENT_TIMESTAMP`),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== الشروح ==========
export const lessons = sqliteTable('lessons', {
  id: text('id').primaryKey(),
  group_id: text('group_id').references(() => groups.id),
  level_id: text('level_id').references(() => levels.id),
  created_by: text('created_by').references(() => profiles.id),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content'),
  content_url: text('content_url'),
  content_type: text('content_type'),
  is_published: integer('is_published', { mode: 'boolean' }).default(false),
  published_at: text('published_at'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== الاختبارات ==========
export const exams = sqliteTable('exams', {
  id: text('id').primaryKey(),
  group_id: text('group_id').references(() => groups.id),
  level_id: text('level_id').references(() => levels.id),
  created_by: text('created_by').references(() => profiles.id),
  title: text('title').notNull(),
  description: text('description'),
  starts_at: text('starts_at').notNull(),
  ends_at: text('ends_at').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  total_points: integer('total_points').default(0),
  status: text('status').default('draft'),
  settings: text('settings'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== أسئلة الاختبارات ==========
export const examQuestions = sqliteTable('exam_questions', {
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
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== محاولات الاختبار ==========
export const examAttempts = sqliteTable('exam_attempts', {
  id: text('id').primaryKey(),
  exam_id: text('exam_id').references(() => exams.id),
  student_id: text('student_id').references(() => profiles.id),
  status: text('status').default('not_started'),
  started_at: text('started_at'),
  submitted_at: text('submitted_at'),
  extra_minutes: integer('extra_minutes').default(0),
  total_score: integer('total_score').default(0),
  is_reentry_allowed: integer('is_reentry_allowed', { mode: 'boolean' }).default(false),
  locked_reason: text('locked_reason'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== إجابات الطلاب ==========
export const studentAnswers = sqliteTable('student_answers', {
  id: text('id').primaryKey(),
  attempt_id: text('attempt_id').references(() => examAttempts.id),
  question_id: text('question_id').references(() => examQuestions.id),
  answer: text('answer'),
  is_correct: integer('is_correct', { mode: 'boolean' }),
  awarded_points: integer('awarded_points').default(0),
  answered_at: text('answered_at').default(sql`CURRENT_TIMESTAMP`),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== أخطاء الطلاب ==========
export const studentErrors = sqliteTable('student_errors', {
  id: text('id').primaryKey(),
  student_id: text('student_id').references(() => profiles.id),
  question_id: text('question_id').references(() => examQuestions.id),
  attempt_id: text('attempt_id').references(() => examAttempts.id),
  student_answer: text('student_answer'),
  correct_answer: text('correct_answer'),
  is_reviewed: integer('is_reviewed', { mode: 'boolean' }).default(false),
  reviewed_at: text('reviewed_at'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== نقاط الطلاب ==========
export const studentPoints = sqliteTable('student_points', {
  student_id: text('student_id').primaryKey().references(() => profiles.id),
  level_id: text('level_id').references(() => levels.id),
  total_points: integer('total_points').default(0),
  rank: integer('rank'),
  exams_completed: integer('exams_completed').default(0),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== منشورات المنتدى ==========
export const forumPosts = sqliteTable('forum_posts', {
  id: text('id').primaryKey(),
  level_id: text('level_id').references(() => levels.id),
  author_id: text('author_id').references(() => profiles.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== تعليقات المنتدى ==========
export const forumComments = sqliteTable('forum_comments', {
  id: text('id').primaryKey(),
  post_id: text('post_id').references(() => forumPosts.id),
  author_id: text('author_id').references(() => profiles.id),
  body: text('body').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== الإشعارات ==========
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  recipient_id: text('recipient_id').references(() => profiles.id),
  actor_id: text('actor_id').references(() => profiles.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  payload: text('payload'),
  is_read: integer('is_read', { mode: 'boolean' }).default(false),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// ========== البريد المسموح به ==========
export const allowedEmails = sqliteTable('allowed_emails', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role_name: text('role_name').notNull(),
  created_by: text('created_by').references(() => profiles.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})