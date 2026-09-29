// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { studentPoints, pointsHistory, profiles, groupStudents, groups } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ✅ تعديل نقاط طالب (زيادة أو تقليل)
export async function POST(request) {
  try {
    const body = await request.json()
    const { student_id, teacher_id, points_change, reason } = body

    // ✅ التحقق من المدخلات
    if (!student_id || !teacher_id) {
      return NextResponse.json(
        { error: 'student_id و teacher_id مطلوبان' },
        { status: 400 }
      )
    }

    if (points_change === undefined || points_change === null || points_change === 0) {
      return NextResponse.json(
        { error: 'يجب أن يكون التعديل بقيمة غير صفرية' },
        { status: 400 }
      )
    }

    const change = parseInt(points_change)
    if (isNaN(change)) {
      return NextResponse.json(
        { error: 'قيمة التعديل غير صحيحة' },
        { status: 400 }
      )
    }

    // ✅ التأكد إن المدرس عنده الطالب ده في مجموعة من مجموعاته
    const teacherGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.teacher_id, teacher_id))

    const teacherGroupIds = teacherGroups.map(g => g.id)

    let isStudentInTeacherGroup = false
    if (teacherGroupIds.length > 0) {
      const relations = await db
        .select()
        .from(groupStudents)
        .where(eq(groupStudents.student_id, student_id))

      isStudentInTeacherGroup = relations.some(rel =>
        teacherGroupIds.includes(rel.group_id)
      )
    }

    // ✅ لو المدرس مش صاحب الطالب → رفض (ما عدا المالك/المساعد)
    const teacher = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, teacher_id))

    if (!teacher || teacher.length === 0) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // ✅ اجلب دور المدرس
    const teacherRole = await db.execute(`
      SELECT r.name as role_name
      FROM profiles p
      LEFT JOIN roles r ON r.id = p.role_id
      WHERE p.id = '${teacher_id}'
      LIMIT 1
    `)

    const roleName = teacherRole.rows[0]?.role_name || null

    // ✅ المالك والمساعد يقدر يعدلوا أي طالب
    // ✅ المدرس يعدل بس طلاب مجموعاته
    if (roleName === 'Lehrer' && !isStudentInTeacherGroup) {
      return NextResponse.json(
        { error: 'لا يمكنك تعديل نقاط هذا الطالب - ليس في مجموعاتك' },
        { status: 403 }
      )
    }

    // ✅ جلب النقاط الحالية للطالب
    const currentPointsData = await db
      .select()
      .from(studentPoints)
      .where(eq(studentPoints.student_id, student_id))

    let previousTotal = 0
    let newTotal = 0

    if (currentPointsData && currentPointsData.length > 0) {
      previousTotal = currentPointsData[0].total_points || 0
      newTotal = previousTotal + change

      // ✅ منع النقاط السلبية
      if (newTotal < 0) {
        return NextResponse.json(
          { error: `لا يمكن خصم أكثر من ${previousTotal} نقطة` },
          { status: 400 }
        )
      }

      // ✅ تحديث النقاط
      await db
        .update(studentPoints)
        .set({
          total_points: newTotal,
          updated_at: new Date(),
        })
        .where(eq(studentPoints.student_id, student_id))

    } else {
      // ✅ الطالب مالوش سجل نقاط → نعمل واحد جديد
      previousTotal = 0
      newTotal = change

      if (newTotal < 0) {
        return NextResponse.json(
          { error: 'لا يمكن خصم نقاط من طالب ليس له رصيد' },
          { status: 400 }
        )
      }

      // ✅ نجيب level_id من الطالب
      const student = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, student_id))

      const levelId = student[0]?.level_id || null

      await db.insert(studentPoints).values({
        student_id: student_id,
        level_id: levelId,
        total_points: newTotal,
        exams_completed: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }

    // ✅ تسجيل التعديل في points_history
    await db.insert(pointsHistory).values({
      id: randomUUID(),
      student_id: student_id,
      teacher_id: teacher_id,
      points_change: change,
      reason: reason || null,
      previous_total: previousTotal,
      new_total: newTotal,
      created_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `تم ${change > 0 ? 'زيادة' : 'خصم'} ${Math.abs(change)} نقطة بنجاح`,
      previous_total: previousTotal,
      new_total: newTotal,
      change: change,
    })

  } catch (error) {
    console.error('❌ خطأ في تعديل النقاط:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ جلب سجل تعديلات النقاط
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const teacherId = searchParams.get('teacher_id')
    const groupId = searchParams.get('group_id')

    // ✅ لو بنجيب سجل تعديلات طالب معين
    if (studentId) {
      const history = await db
        .select({
          id: pointsHistory.id,
          student_id: pointsHistory.student_id,
          teacher_id: pointsHistory.teacher_id,
          points_change: pointsHistory.points_change,
          reason: pointsHistory.reason,
          previous_total: pointsHistory.previous_total,
          new_total: pointsHistory.new_total,
          created_at: pointsHistory.created_at,
          teacher_name: profiles.full_name,
        })
        .from(pointsHistory)
        .leftJoin(profiles, eq(pointsHistory.teacher_id, profiles.id))
        .where(eq(pointsHistory.student_id, studentId))
        .orderBy(desc(pointsHistory.created_at))

      return NextResponse.json(history || [])
    }

    // ✅ لو بنجيب كل التعديلات اللي عملها مدرس
    if (teacherId) {
      const history = await db
        .select({
          id: pointsHistory.id,
          student_id: pointsHistory.student_id,
          teacher_id: pointsHistory.teacher_id,
          points_change: pointsHistory.points_change,
          reason: pointsHistory.reason,
          previous_total: pointsHistory.previous_total,
          new_total: pointsHistory.new_total,
          created_at: pointsHistory.created_at,
        })
        .from(pointsHistory)
        .where(eq(pointsHistory.teacher_id, teacherId))
        .orderBy(desc(pointsHistory.created_at))
        .limit(100)

      return NextResponse.json(history || [])
    }

    // ✅ كل التعديلات (للمالك/المساعد)
    const allHistory = await db
      .select({
        id: pointsHistory.id,
        student_id: pointsHistory.student_id,
        teacher_id: pointsHistory.teacher_id,
        points_change: pointsHistory.points_change,
        reason: pointsHistory.reason,
        previous_total: pointsHistory.previous_total,
        new_total: pointsHistory.new_total,
        created_at: pointsHistory.created_at,
      })
      .from(pointsHistory)
      .orderBy(desc(pointsHistory.created_at))
      .limit(200)

    return NextResponse.json(allHistory || [])

  } catch (error) {
    console.error('❌ خطأ في جلب سجل النقاط:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}