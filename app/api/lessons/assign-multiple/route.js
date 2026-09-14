import { NextResponse } from 'next/server'
import { db } from '@/db'
import { lessons, groupLessons } from '@/db/schema'

export async function POST(request) {
  try {
    const { lesson_id, group_ids } = await request.json()

    if (!lesson_id || !group_ids || group_ids.length === 0) {
      return NextResponse.json({ error: 'Lesson ID and group IDs are required' }, { status: 400 })
    }

    // ✅ إضافة الملف لكل مجموعة
    for (const groupId of group_ids) {
      await db.insert(groupLessons).values({
        id: crypto.randomUUID(),
        lesson_id,
        group_id: groupId,
        created_at: new Date(),
      }).onConflictDoNothing()
    }

    return NextResponse.json({
      success: true,
      message: `تم إضافة الملف لـ ${group_ids.length} مجموعة`
    })
  } catch (error) {
    console.error('❌ Error assigning lesson to groups:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}