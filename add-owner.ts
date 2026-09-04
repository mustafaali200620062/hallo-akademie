import { db } from './db'
import { profiles, roles } from './db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function createOwner() {
  console.log('👑 جاري إنشاء حساب المالك...')

  // جلب معرف دور Eigentümer
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

  // تشفير كلمة المرور
  const password = await bcrypt.hash('123456', 10)
  console.log('✅ تم تشفير كلمة المرور')

  // إنشاء المالك
  await db.insert(profiles).values({
    id: '413a654a-470e-45f2-8e0e-aef51294022f',
    email: 'mustafaali200620062@gmail.com',
    password: password,
    full_name: 'Mustafa Ali',
    role_id: role.id,
    is_active: true,
    is_approved: true,
  })

  console.log('✅ تم إنشاء حساب المالك بنجاح!')
  console.log('📧 البريد: mustafaali200620062@gmail.com')
  console.log('🔑 كلمة المرور: 123456')
}

createOwner().catch(console.error)