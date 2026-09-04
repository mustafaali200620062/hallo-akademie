import { db } from './db'
import { profiles, roles } from './db/schema'
import { eq } from 'drizzle-orm'

async function checkOwner() {
  console.log('🔍 جاري التحقق من حساب المالك...')

  const user = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      full_name: profiles.full_name,
      role_name: roles.name,
      password: profiles.password,
    })
    .from(profiles)
    .leftJoin(roles, eq(profiles.role_id, roles.id))
    .where(eq(profiles.email, 'mustafaali200620062@gmail.com'))
    .get()

  if (user) {
    console.log('✅ المستخدم موجود:')
    console.log('📧', user.email)
    console.log('👤', user.full_name)
    console.log('🎭', user.role_name)
    console.log('🔑 كلمة المرور:', user.password ? 'موجودة ✅' : 'غير موجودة ❌')
  } else {
    console.log('❌ المستخدم غير موجود!')
  }
}

checkOwner().catch(console.error)