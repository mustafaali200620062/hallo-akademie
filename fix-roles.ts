import { db } from './db'
import { roles, levels, profiles } from './db/schema'
import { eq } from 'drizzle-orm'

async function fixRoles() {
  console.log('🔧 جاري إصلاح الأدوار...')

  try {
    // 1. حذف جميع الأدوار القديمة (مع مراعاة العلاقات)
    console.log('📌 حذف الأدوار القديمة...')
    
    // حذف البروفايلات أولاً (عشان ما يشتكيش من العلاقات)
    await db.delete(profiles)
    console.log('🗑️ تم حذف الملفات الشخصية')
    
    await db.delete(roles)
    console.log('🗑️ تم حذف الأدوار القديمة')
    
    await db.delete(levels)
    console.log('🗑️ تم حذف المستويات القديمة')

    // 2. إضافة الأدوار الجديدة
    console.log('📌 إضافة الأدوار...')
    await db.insert(roles).values([
      { id: 'r1', name: 'Eigentümer', description: 'مالك المنصة' },
      { id: 'r2', name: 'Lehrer', description: 'المدرس' },
      { id: 'r3', name: 'Assistent', description: 'المساعد' },
      { id: 'r4', name: 'Student', description: 'الطالب' },
    ])
    console.log('✅ تم إضافة الأدوار')

    // 3. إضافة المستويات
    console.log('📌 إضافة المستويات...')
    await db.insert(levels).values([
      { id: 'l1', code: 'A1', title: 'A1 - Anfänger', description: 'المستوى المبتدئ' },
      { id: 'l2', code: 'A2', title: 'A2 - Grundstufe', description: 'المستوى الأساسي' },
      { id: 'l3', code: 'B1', title: 'B1 - Mittelstufe', description: 'المستوى المتوسط' },
      { id: 'l4', code: 'B2', title: 'B2 - Fortgeschritten', description: 'المستوى فوق المتوسط' },
    ])
    console.log('✅ تم إضافة المستويات')

    console.log('🎉 تم إصلاح الأدوار والمستويات بنجاح!')

  } catch (error) {
    console.error('❌ خطأ:', error)
  }
}

fixRoles().catch(console.error)