import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exams, levels, groups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    const exam = await db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        duration_minutes: exams.duration_minutes,
        total_points: exams.total_points,
        starts_at: exams.starts_at,
        ends_at: exams.ends_at,
        status: exams.status,
        group_id: exams.group_id,
        level_id: exams.level_id,
        level_code: levels.code,
        level_title: levels.title,
        group_name: groups.name,
        created_by: exams.created_by,
        created_at: exams.created_at,
      })
      .from(exams)
      .leftJoin(levels, eq(exams.level_id, levels.id))
      .leftJoin(groups, eq(exams.group_id, groups.id))
      .where(eq(exams.id, id))
      .get()

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('❌ خطأ في جلب تفاصيل الاختبار:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}