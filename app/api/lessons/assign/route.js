import { NextResponse } from 'next/server'
import { db } from '@/db'
import { lessons } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request) {
  try {
    const { lesson_id, group_id } = await request.json()

    if (!lesson_id || !group_id) {
      return NextResponse.json({ error: 'Lesson ID and Group ID are required' }, { status: 400 })
    }

    // ✅ ربط الملف بالمجموعة
    await db
      .update(lessons)
      .set({
        group_id,
        is_published: true,
      })
      .where(eq(lessons.id, lesson_id))

    return NextResponse.json({
      success: true,
      message: 'تم إضافة الملف للمجموعة بنجاح'
    })
  } catch (error) {
    console.error('❌ Error assigning lesson:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}