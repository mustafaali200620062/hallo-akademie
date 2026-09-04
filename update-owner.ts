import { db } from './db'
import { profiles, roles } from './db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function updateOwner() {
  console.log('🔄 جاري تحديث حساب المالك...')

  try {
    // 1. جلب معرف دور Eigentümer
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

    // 2. تشفير كلمة المرور الجديدة
    const password = await bcrypt.hash('123123', 10)
    console.log('✅ تم تشفير كلمة المرور')

    // 3. حذف المالك القديم (لو موجود)
    const oldUser = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, 'mustafaali200620062@gmail.com'))
      .get()

    if (oldUser) {
      await db
        .delete(profiles)
        .where(eq(profiles.email, 'mustafaali200620062@gmail.com'))
      console.log('🗑️ تم حذف الحساب القديم')
    } else {
      console.log('ℹ️ لم يتم العثور على الحساب القديم')
    }

    // 4. حذف المالك الجديد لو موجود (عشان ما يسبب conflict)
    const existingNewUser = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, 'halloechensprachakademie@gmail.com'))
      .get()

    if (existingNewUser) {
      await db
        .delete(profiles)
        .where(eq(profiles.email, 'halloechensprachakademie@gmail.com'))
      console.log('🗑️ تم حذف الحساب الجديد القديم')
    }

    // 5. إضافة المالك الجديد
    await db.insert(profiles).values({
      id: '413a654a-470e-45f2-8e0e-aef51294022f',
      email: 'halloechensprachakademie@gmail.com',
      password: password,
      full_name: 'Hallöchen Admin',
      role_id: role.id,
      is_active: true,
      is_approved: true,
    })

    console.log('✅ تم إنشاء حساب المالك الجديد بنجاح!')
    console.log('📧 البريد: halloechensprachakademie@gmail.com')
    console.log('🔑 كلمة المرور: 123123')

    // 6. التحقق
    const user = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        full_name: profiles.full_name,
        role_name: roles.name,
      })
      .from(profiles)
      .leftJoin(roles, eq(profiles.role_id, roles.id))
      .where(eq(profiles.email, 'halloechensprachakademie@gmail.com'))
      .get()

    if (user) {
      console.log('✅ تم التحقق بنجاح:')
      console.log('📧', user.email)
      console.log('👤', user.full_name)
      console.log('🎭', user.role_name)
    } else {
      console.log('❌ فشل التحقق!')
    }

    console.log('🎉 تم الانتهاء!')

  } catch (error) {
    console.error('❌ خطأ:', error)
  }
}

updateOwner().catch(console.error)