import { db } from './db'
import { roles, levels } from './db/schema'

async function fixRolesSafe() {
  console.log('🔧 جاري إضافة الأدوار والمستويات (بطريقة آمنة)...')

  try {
    // 1. التحقق من وجود الأدوار
    console.log('📌 التحقق من الأدوار...')
    const existingRoles = await db.select().from(roles).all()
    console.log('📋 الأدوار الموجودة:', existingRoles.map(r => r.name).join(', ') || 'لا يوجد')

    // 2. إضافة الأدوار (فقط لو مش موجودة)
    const rolesToAdd = [
      { id: 'r1', name: 'Eigentümer', description: 'مالك المنصة' },
      { id: 'r2', name: 'Lehrer', description: 'المدرس' },
      { id: 'r3', name: 'Assistent', description: 'المساعد' },
      { id: 'r4', name: 'Student', description: 'الطالب' },
    ]

    for (const role of rolesToAdd) {
      const exists = existingRoles.find(r => r.name === role.name)
      if (!exists) {
        console.log(`📌 إضافة دور ${role.name}...`)
        await db.insert(roles).values(role)
      } else {
        console.log(`✅ دور ${role.name} موجود بالفعل`)
      }
    }

    // 3. التحقق من وجود المستويات
    console.log('📌 التحقق من المستويات...')
    const existingLevels = await db.select().from(levels).all()
    console.log('📋 المستويات الموجودة:', existingLevels.map(l => l.code).join(', ') || 'لا يوجد')

    // 4. إضافة المستويات (فقط لو مش موجودة)
    const levelsToAdd = [
      { id: 'l1', code: 'A1', title: 'A1 - Anfänger', description: 'المستوى المبتدئ' },
      { id: 'l2', code: 'A2', title: 'A2 - Grundstufe', description: 'المستوى الأساسي' },
      { id: 'l3', code: 'B1', title: 'B1 - Mittelstufe', description: 'المستوى المتوسط' },
      { id: 'l4', code: 'B2', title: 'B2 - Fortgeschritten', description: 'المستوى فوق المتوسط' },
    ]

    for (const level of levelsToAdd) {
      const exists = existingLevels.find(l => l.code === level.code)
      if (!exists) {
        console.log(`📌 إضافة مستوى ${level.code}...`)
        await db.insert(levels).values(level)
      } else {
        console.log(`✅ مستوى ${level.code} موجود بالفعل`)
      }
    }

    console.log('🎉 تم الانتهاء بنجاح!')

    // 5. عرض النتيجة النهائية
    const finalRoles = await db.select().from(roles).all()
    const finalLevels = await db.select().from(levels).all()
    console.log('📋 الأدوار النهائية:', finalRoles.map(r => r.name).join(', '))
    console.log('📋 المستويات النهائية:', finalLevels.map(l => l.code).join(', '))

  } catch (error) {
    console.error('❌ خطأ:', error)
  }
}

fixRolesSafe().catch(console.error)