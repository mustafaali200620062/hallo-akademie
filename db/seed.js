import { db } from './index.js'
import { roles, levels } from './schema.js'

async function seed() {
  console.log('🌱 جاري إضافة البيانات الأساسية...')

  try {
    console.log('📌 إضافة الأدوار...')
    await db.insert(roles).values([
      { id: 'r1', name: 'Eigentümer', description: 'مالك المنصة' },
      { id: 'r2', name: 'Lehrer', description: 'المدرس' },
      { id: 'r3', name: 'Assistent', description: 'المساعد' },
      { id: 'r4', name: 'Student', description: 'الطالب' },
    ])
    console.log('✅ تم إضافة الأدوار')

    console.log('📌 إضافة المستويات...')
    await db.insert(levels).values([
      { id: 'l1', code: 'A1', title: 'A1 - Anfänger', description: 'المستوى المبتدئ' },
      { id: 'l2', code: 'A2', title: 'A2 - Grundstufe', description: 'المستوى الأساسي' },
      { id: 'l3', code: 'B1', title: 'B1 - Mittelstufe', description: 'المستوى المتوسط' },
      { id: 'l4', code: 'B2', title: 'B2 - Fortgeschritten', description: 'المستوى فوق المتوسط' },
    ])
    console.log('✅ تم إضافة المستويات')

    console.log('🎉 تم إضافة جميع البيانات الأساسية بنجاح!')

  } catch (error) {
    console.error('❌ خطأ:', error)
  }
}

seed().catch(console.error)