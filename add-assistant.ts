import { db } from './db'
import { roles } from './db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'

async function addAssistant() {
  console.log('🤝 جاري إضافة حساب مساعد...')

  try {
    // 1. جلب دور Assistent
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Assistent'))
      .get()

    if (!role) {
      console.error('❌ دور Assistent غير موجود!')
      return
    }

    console.log('✅ دور Assistent موجود:', role.id)

    // 2. تشفير كلمة المرور
    const password = await bcrypt.hash('123123', 10)
    console.log('✅ تم تشفير كلمة المرور')

    // 3. حذف أي حساب قديم بنفس البريد
    await db.run(sql`
      DELETE FROM profiles WHERE email = 'moradyousef95@gmail.com'
    `)
    console.log('🗑️ تم حذف أي حساب قديم')

    // 4. إضافة المساعد الجديد
    const id = crypto.randomUUID()
    await db.run(sql`
      INSERT INTO profiles (
        id, 
        email, 
        password, 
        full_name, 
        role_id, 
        is_active, 
        is_approved
      ) VALUES (
        ${id},
        'moradyousef95@gmail.com',
        ${password},
        'Morad Youssef',
        ${role.id},
        1,
        1
      )
    `)

    console.log('✅ تم إضافة حساب المساعد بنجاح!')
    console.log('📧 البريد: moradyousef95@gmail.com')
    console.log('🔑 كلمة المرور: 123123')
    console.log('🆔 المعرف:', id)

  } catch (error) {
    console.error('❌ خطأ:', error)
  }
}

addAssistant().catch(console.error)