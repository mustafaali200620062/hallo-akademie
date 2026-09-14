import { NextResponse } from 'next/server'
import { db } from '@/db'
import { groups, levels, profiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// ✅ جلب جميع المجموعات
export async function GET() {
  try {
    const allGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        is_active: groups.is_active,
        created_at: groups.created_at,
        level_id: groups.level_id,
        level_code: levels.code,
        level_title: levels.title,
        teacher_id: groups.teacher_id,
        teacher_name: profiles.full_name,
      })
      .from(groups)
      .leftJoin(levels, eq(groups.level_id, levels.id))
      .leftJoin(profiles, eq(groups.teacher_id, profiles.id))
      .orderBy(desc(groups.created_at))

    return NextResponse.json(allGroups || [])
  } catch (error) {
    console.error('❌ Error fetching groups:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ إضافة مجموعة جديدة
export async function POST(request) {
  try {
    const { name, level_id, teacher_id, description } = await request.json()

    if (!name || !level_id) {
      return NextResponse.json({ error: 'Name and level are required' }, { status: 400 })
    }

    const [newGroup] = await db.insert(groups).values({
      id: crypto.randomUUID(),
      name,
      level_id,
      teacher_id: teacher_id || null,
      description: description || '',
      is_active: true,
      created_at: new Date(),
    }).returning()

    return NextResponse.json({ 
      success: true, 
      group: newGroup 
    })
  } catch (error) {
    console.error('❌ Error creating group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ حذف مجموعة
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    await db.delete(groups).where(eq(groups.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}