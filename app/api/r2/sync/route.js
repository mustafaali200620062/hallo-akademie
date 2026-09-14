import { NextResponse } from 'next/server'
import { db } from '@/db'
import { lessons, levels } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { listFiles } from '@/lib/r2'

export async function POST(request) {
  try {
    const { level_id } = await request.json()

    if (!level_id) {
      return NextResponse.json({ error: 'Level ID is required' }, { status: 400 })
    }

    // ✅ جلب المستوى
    const levelsData = await db
      .select()
      .from(levels)
      .where(eq(levels.id, level_id))

    if (!levelsData || levelsData.length === 0) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 })
    }

    const level = levelsData[0]

    // ✅ جلب جميع الملفات من R2
    const r2Files = await listFiles('lessons/')

    // ✅ جلب الملفات الموجودة في قاعدة البيانات
    const existingLessons = await db
      .select()
      .from(lessons)

    const existingKeys = new Set(existingLessons.map(l => l.content_url))

    let addedCount = 0
    let skippedCount = 0

    // ✅ إضافة الملفات الجديدة
    for (const file of r2Files) {
      if (!file.Key || existingKeys.has(file.Key)) {
        skippedCount++
        continue
      }

      // استخراج اسم الملف من المسار
      const fileName = file.Key.split('/').pop() || file.Key
      const title = fileName.replace('.pdf', '').replace(/^\d+-/, '')

      await db.insert(lessons).values({
        id: crypto.randomUUID(),
        title,
        description: '',
        content_url: file.Key,
        content_type: 'pdf',
        level_id: level.id,
        is_published: true,
        created_at: new Date(),
      })

      addedCount++
    }

    return NextResponse.json({
      success: true,
      message: `تم إضافة ${addedCount} ملف جديد، وتم تخطي ${skippedCount} ملف موجود`,
      added: addedCount,
      skipped: skippedCount,
      total: r2Files.length,
    })
  } catch (error) {
    console.error('❌ Error syncing R2:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}