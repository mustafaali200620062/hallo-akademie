import { db } from './db'
import { levels } from './db/schema'

async function fixLevels() {
  console.log('🔧 جاري إصلاح المستويات...')

  // 1. التحقق من وجود المستويات
  const existingLevels = await db.select().from(levels).all()
  console.log('📋 المستويات الموجودة:', existingLevels)

  // 2. إضافة المستويات لو مش موجودة
  const levelsData = [
    { id: 'l1', code: 'A1', title: 'A1 - Anfänger', description: 'المستوى المبتدئ' },
    { id: 'l2', code: 'A2', title: 'A2 - Grundstufe', description: 'المستوى الأساسي' },
    { id: 'l3', code: 'B1', title: 'B1 - Mittelstufe', description: 'المستوى المتوسط' },
    { id: 'l4', code: 'B2', title: 'B2 - Fortgeschritten', description: 'المستوى فوق المتوسط' },
  ]

  for (const level of levelsData) {
    const exists = existingLevels.find(l => l.code === level.code)
    if (!exists) {
      console.log(`📌 إضافة مستوى ${level.code}...`)
      await db.insert(levels).values(level)
    } else {
      console.log(`✅ مستوى ${level.code} موجود بالفعل`)
    }
  }

  // 3. التأكد من وجود كل المستويات
  const allLevels = await db.select().from(levels).all()
  console.log('📋 المستويات بعد الإصلاح:', allLevels)

  console.log('🎉 تم الانتهاء!')
}

fixLevels().catch(console.error)