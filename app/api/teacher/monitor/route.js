// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exams, examAttempts, profiles, groups, levels, studentAnswers, examQuestions } from '@/db/schema'
import { eq, and, desc, inArray, or } from 'drizzle-orm'

// ✅ جلب كل الاختبارات النشطة (مع عدد الطلاب الداخلين)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const teacherRole = searchParams.get('teacher_role')
    const examId = searchParams.get('exam_id')
    const studentId = searchParams.get('student_id')

    if (!teacherId) {
      return NextResponse.json({ error: 'teacher_id is required' }, { status: 400 })
    }

    // ═══════════════════════════════════════════════
    // الحالة 3: تفاصيل حل طالب معين
    // ═══════════════════════════════════════════════
    if (examId && studentId) {
      // ✅ جلب المحاولة
      const attempts = await db
        .select()
        .from(examAttempts)
        .where(and(
          eq(examAttempts.exam_id, examId),
          eq(examAttempts.student_id, studentId)
        ))

      if (!attempts || attempts.length === 0) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
      }

      const attempt = attempts[0]

      // ✅ جلب الطالب
      const students = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, studentId))

      const student = students[0] || null

      // ✅ جلب إجابات الطالب مع تفاصيل الأسئلة
      const answers = await db
        .select({
          id: studentAnswers.id,
          question_id: studentAnswers.question_id,
          answer: studentAnswers.answer,
          is_correct: studentAnswers.is_correct,
          awarded_points: studentAnswers.awarded_points,
          answered_at: studentAnswers.answered_at,
          updated_at: studentAnswers.updated_at,
          question_text: examQuestions.question_text,
          question_type: examQuestions.question_type,
          question_order: examQuestions.question_order,
          points: examQuestions.points,
          options: examQuestions.options,
          correct_answers: examQuestions.correct_answers,
          media_url: examQuestions.media_url,
        })
        .from(studentAnswers)
        .leftJoin(examQuestions, eq(studentAnswers.question_id, examQuestions.id))
        .where(eq(studentAnswers.attempt_id, attempt.id))

      // ✅ ترتيب حسب order السؤال
      const sortedAnswers = (answers || []).sort((a, b) =>
        (a.question_order || 0) - (b.question_order || 0)
      )

      return NextResponse.json({
        success: true,
        student,
        attempt,
        answers: sortedAnswers,
      })
    }

    // ═══════════════════════════════════════════════
    // الحالة 2: قائمة الطلاب في اختبار معين
    // ═══════════════════════════════════════════════
    if (examId) {
      // ✅ التحقق من صلاحية المدرس
      const examData = await db
        .select()
        .from(exams)
        .where(eq(exams.id, examId))

      if (!examData || examData.length === 0) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }

      const exam = examData[0]

      // ✅ لو المدرس (مش مالك/مساعد) → لازم يكون هو صاحب الاختبار
      if (teacherRole === 'Lehrer' && exam.created_by !== teacherId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      // ✅ جلب كل محاولات الاختبار ده
      const attempts = await db
        .select()
        .from(examAttempts)
        .where(eq(examAttempts.exam_id, examId))
        .orderBy(desc(examAttempts.started_at))

      // ✅ جلب بيانات الطلاب
      const studentIds = attempts.map(a => a.student_id).filter(Boolean)
      let studentsData = []
      if (studentIds.length > 0) {
        studentsData = await db
          .select()
          .from(profiles)
          .where(inArray(profiles.id, studentIds))
      }

      // ✅ دمج البيانات
      const studentsWithAttempts = attempts.map(a => {
        const student = studentsData.find(s => s.id === a.student_id)
        return {
          attempt_id: a.id,
          student_id: a.student_id,
          student_name: student?.full_name || 'غير معروف',
          student_phone: student?.phone || '',
          status: a.status,
          started_at: a.started_at,
          submitted_at: a.submitted_at,
          last_activity_at: a.last_activity_at,
          total_score: a.total_score,
          extra_minutes: a.extra_minutes,
        }
      })

      return NextResponse.json({
        success: true,
        exam: {
          id: exam.id,
          title: exam.title,
          duration_minutes: exam.duration_minutes,
          total_points: exam.total_points,
          status: exam.status,
        },
        students: studentsWithAttempts,
        counts: {
          total: studentsWithAttempts.length,
          in_progress: studentsWithAttempts.filter(s => s.status === 'in_progress').length,
          submitted: studentsWithAttempts.filter(s => s.status === 'submitted').length,
        }
      })
    }

    // ═══════════════════════════════════════════════
    // الحالة 1: قائمة الاختبارات النشطة
    // ═══════════════════════════════════════════════

    // ✅ لو مالك أو مساعد → كل الاختبارات النشطة
    // ✅ لو مدرس → بس اختباراته
    let examsQuery
    if (teacherRole === 'Eigentümer' || teacherRole === 'Assistent') {
      examsQuery = db
        .select({
          id: exams.id,
          title: exams.title,
          status: exams.status,
          starts_at: exams.starts_at,
          ends_at: exams.ends_at,
          duration_minutes: exams.duration_minutes,
          total_points: exams.total_points,
          created_by: exams.created_by,
          group_name: groups.name,
          level_code: levels.code,
        })
        .from(exams)
        .leftJoin(groups, eq(exams.group_id, groups.id))
        .leftJoin(levels, eq(exams.level_id, levels.id))
        .where(eq(exams.status, 'active'))
    } else {
      examsQuery = db
        .select({
          id: exams.id,
          title: exams.title,
          status: exams.status,
          starts_at: exams.starts_at,
          ends_at: exams.ends_at,
          duration_minutes: exams.duration_minutes,
          total_points: exams.total_points,
          created_by: exams.created_by,
          group_name: groups.name,
          level_code: levels.code,
        })
        .from(exams)
        .leftJoin(groups, eq(exams.group_id, groups.id))
        .leftJoin(levels, eq(exams.level_id, levels.id))
        .where(and(
          eq(exams.status, 'active'),
          eq(exams.created_by, teacherId)
        ))
    }

    const activeExams = await examsQuery

    // ✅ جلب عدد الطلاب لكل اختبار
    const examIds = activeExams.map(e => e.id)
    let allAttempts = []
    if (examIds.length > 0) {
      allAttempts = await db
        .select()
        .from(examAttempts)
        .where(inArray(examAttempts.exam_id, examIds))
    }

    const examsWithCounts = activeExams.map(e => {
      const examAttemptsList = allAttempts.filter(a => a.exam_id === e.id)
      return {
        ...e,
        total_students: examAttemptsList.length,
        in_progress: examAttemptsList.filter(a => a.status === 'in_progress').length,
        submitted: examAttemptsList.filter(a => a.status === 'submitted').length,
      }
    })

    return NextResponse.json({
      success: true,
      exams: examsWithCounts,
    })

  } catch (error) {
    console.error('❌ خطأ في المراقبة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}