// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles, teacherLevels, levels } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const { email, full_name, password, levels: selectedLevelIds } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    // ✅ جلب دور المدرس
    const teacherRole = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Lehrer'))

    if (!teacherRole || teacherRole.length === 0) {
      return NextResponse.json({ error: 'Teacher role not found' }, { status: 404 })
    }

    // ✅ التحقق من وجود المدرس بالفعل
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 400 }
      )
    }

    // ✅ إنشاء ID للمدرس
    const teacherId = randomUUID()

    // ✅ إضافة المدرس
    await db.insert(profiles).values({
      id: teacherId,
      email,
      full_name,
      password: password || '123123',
      role_id: teacherRole[0].id,
      is_active: true,
      is_approved: true,
      created_at: new Date(),
    })

    // ✅ إضافة المستويات (لو اتحددت)
    if (Array.isArray(selectedLevelIds) && selectedLevelIds.length > 0) {
      // ✅ تأكد إن كل IDs صحيحة (موجودة في جدول levels)
      const validLevels = await db
        .select()
        .from(levels)
        .where(inArray(levels.id, selectedLevelIds))

      const validLevelIds = validLevels.map(l => l.id)

      // ✅ إدخال كل مستوى
      for (const levelId of validLevelIds) {
        await db.insert(teacherLevels).values({
          id: randomUUID(),
          teacher_id: teacherId,
          level_id: levelId,
          created_at: new Date(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher added successfully. Default password: 123123',
      teacher_id: teacherId,
    })
  } catch (error) {
    console.error('❌ Error adding teacher:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}