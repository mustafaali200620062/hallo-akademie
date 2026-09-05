import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// ✅ إنشاء اتصال بقاعدة البيانات PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// ✅ تصدير الـ db لاستخدامه في كل المشروع
export const db = drizzle(pool, { schema })