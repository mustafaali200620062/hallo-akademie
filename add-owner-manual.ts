import { db } from './db'
import { profiles, roles } from './db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'

async function addOwnerManual() {
  console.log('👑 جاري إضافة حساب المالك يدوياً...')

  try {
    // 1. جلب دور Eigentümer
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Eigentümer'))
      .get()

    if (!role) {
      console.error('❌ دور Eigentümer غير موجود!')
      return
    }

    console.log('✅ دور Eigentümer موجود:', role.id)

    // 2. تشفير كلمة المرور
    const password = await bcrypt.hash('123123', 10)
    console.log('✅ تم تشفير كلمة المرور')

    // 3. حذف أي حساب قديم بنفس البريد (باستخدام SQL مباشر)
    await db.run(sql`
      DELETE FROM profiles WHERE email = 'halloechensprachakademie@gmail.com'
    `)
    console.log('🗑️ تم حذف أي حساب قديم')

    // 4. إضافة المالك الجديد (باستخدام SQL مباشر)
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
        '413a654a-470e-45f2-8e0e-aef51294022f',
        'halloechensprachakademie@gmail.com',
        ${password},
        'Hallöchen Admin',
        ${role.id},
        1,
        1
      )
    `)

    console.log('✅ تم إضافة حساب المالك بنجاح!')
    console.log('📧 البريد: halloechensprachakademie@gmail.com')
    console.log('🔑 كلمة المرور: 123123')

    // 5. التحقق
    const result = await db.run(sql`
      SELECT * FROM profiles WHERE email = 'halloechensprachakademie@gmail.com'
    `)
    
    if (result) {
      console.log('✅ تم التحقق من الإضافة بنجاح!')
    } else {
      console.log('❌ فشل التحقق!')
    }

  } catch (error) {
    console.error('❌ خطأ:', error)
  }
}

addOwnerManual().catch(console.error)