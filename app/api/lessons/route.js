import { NextResponse } from 'next/server'
import { db } from '@/db'
import { lessons, levels, groups, profiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// ✅ جلب جميع الملفات
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const levelId = searchParams.get('levelId')

    let query = db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        content: lessons.content,
        content_url: lessons.content_url,
        content_type: lessons.content_type,
        is_published: lessons.is_published,
        group_id: lessons.group_id,
        level_id: lessons.level_id,
        created_by: lessons.created_by,
        created_at: lessons.created_at,
        level_code: levels.code,
        level_title: levels.title,
        group_name: groups.name,
        creator_name: profiles.full_name,
      })
      .from(lessons)
      .leftJoin(levels, eq(lessons.level_id, levels.id))
      .leftJoin(groups, eq(lessons.group_id, groups.id))
      .leftJoin(profiles, eq(lessons.created_by, profiles.id))
      .orderBy(desc(lessons.created_at))

    if (groupId) {
      query = query.where(eq(lessons.group_id, groupId))
    } else if (levelId) {
      query = query.where(eq(lessons.level_id, levelId))
    }

    const allLessons = await query

    return NextResponse.json(allLessons || [])
  } catch (error) {
    console.error('❌ Error fetching lessons:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ إضافة ملف / شرح جديد
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      content,
      content_url,
      content_type,
      group_id,
      level_id,
      is_published,
      created_by
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const [newLesson] = await db.insert(lessons).values({
      id: crypto.randomUUID(),
      title,
      description: description || '',
      content: content || '',
      content_url: content_url || '',
      content_type: content_type || 'text',
      group_id: group_id || null,
      level_id: level_id || null,
      created_by: created_by || null,
      is_published: is_published || false,
      created_at: new Date(),
    }).returning()

    return NextResponse.json({ success: true, lesson: newLesson })
  } catch (error) {
    console.error('❌ Error creating lesson:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ حذف ملف
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 })
    }

    await db.delete(lessons).where(eq(lessons.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting lesson:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}