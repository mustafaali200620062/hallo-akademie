import { db } from './db'
import { roles } from './db/schema'

async function fixStudentRole() {
  console.log('🔧 جاري إصلاح دور الطالب...')

  // 1. التحقق من وجود الأدوار
  const existingRoles = await db.select().from(roles).all()
  console.log('📋 الأدوار الموجودة:', existingRoles)

  // 2. إضافة دور Student لو مش موجود
  const studentRole = existingRoles.find(r => r.name === 'Student')
  
  if (!studentRole) {
    console.log('📌 إضافة دور Student...')
    await db.insert(roles).values({
      id: 'r4',
      name: 'Student',
      description: 'الطالب'
    })
    console.log('✅ تم إضافة دور Student')
  } else {
    console.log('✅ دور Student موجود بالفعل')
  }

  // 3. التأكد من وجود كل الأدوار
  const allRoles = await db.select().from(roles).all()
  console.log('📋 الأدوار بعد الإصلاح:', allRoles)

  console.log('🎉 تم الانتهاء!')
}

fixStudentRole().catch(console.error)