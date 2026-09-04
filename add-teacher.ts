import { db } from './db'
import { roles } from './db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'

async function addTeacher() {
  console.log('👨‍🏫 جاري إضافة حساب معلم...')

  try {
    // 1. جلب دور Lehrer
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Lehrer'))
      .get()

    if (!role) {
      console.error('❌ دور Lehrer غير موجود!')
      return
    }

    console.log('✅ دور Lehrer موجود:', role.id)

    // 2. تشفير كلمة المرور
    const password = await bcrypt.hash('123123', 10)
    console.log('✅ تم تشفير كلمة المرور')

    // 3. حذف أي حساب قديم بنفس البريد
    await db.run(sql`
      DELETE FROM profiles WHERE email = 'mustafaali200620062@gmail.com'
    `)
    console.log('🗑️ تم حذف أي حساب قديم')

    // 4. إضافة المعلم الجديد
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
        '${id}',
        'mustafaali200620062@gmail.com',
        '${password}',
        'Mustafa Ali (Lehrer)',
        '${role.id}',
        1,
        1
      )
    `)

    console.log('✅ تم إضافة حساب المعلم بنجاح!')
    console.log('📧 البريد: mustafaali200620062@gmail.com')
    console.log('🔑 كلمة المرور: 123123')
    console.log('🎭 الدور: Lehrer')

  } catch (error) {
    console.error('❌ خطأ:', error)
  }
}

addTeacher().catch(console.error)