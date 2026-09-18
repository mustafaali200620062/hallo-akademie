import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exams, examAttempts, groupStudents, levels, groups, examQuestions } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { getFileUrl } from '@/lib/r2'

// ✅ دالة خلط عشوائي
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('student_id')

    // ✅ جلب اختبار محدد مع أسئلته
    if (examId) {
      const examsData = await db
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
        })
        .from(exams)
        .leftJoin(levels, eq(exams.level_id, levels.id))
        .leftJoin(groups, eq(exams.group_id, groups.id))
        .where(eq(exams.id, examId))

      if (!examsData || examsData.length === 0) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }

      const exam = examsData[0]

      // ✅ منع الطالب من الدخول لو الاختبار مش active
      if (studentId && exam.status !== 'active') {
        return NextResponse.json({
          error: 'هذا الاختبار غير مفتوح حالياً. يرجى الانتظار حتى يبدأه المدرس.',
          status: exam.status
        }, { status: 403 })
      }

      const questions = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.exam_id, examId))

      const shuffledQuestions = shuffleArray(questions || [])

      // ✅ تحويل media_url لـ Signed URL
      const shuffledWithOptions = await Promise.all(
        shuffledQuestions.map(async (q) => {
          let shuffledOpts = q.options
          try {
            const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            if (Array.isArray(opts) && opts.length > 0 && q.question_type !== 'matching') {
              shuffledOpts = JSON.stringify(shuffleArray(opts))
            }
          } catch (e) {
            shuffledOpts = q.options
          }

          // ✅ لو في media_url، نعمل Signed URL
          let signedMediaUrl = q.media_url
          if (q.media_url && (q.question_type === 'image' || q.question_type === 'audio')) {
            try {
              // لو الـ URL مش كامل (مش بيبدأ بـ http)، نعمل signed URL
              if (!q.media_url.startsWith('http')) {
                signedMediaUrl = await getFileUrl(q.media_url, 3600)
              }
            } catch (error) {
              console.error('Error signing media URL:', error)
              signedMediaUrl = q.media_url
            }
          }

          return { ...q, options: shuffledOpts, media_url: signedMediaUrl }
        })
      )

      return NextResponse.json({ ...exam, exam_questions: shuffledWithOptions })
    }

    // ✅ جلب جميع الاختبارات المتاحة للطالب
    if (!studentId) {
      return NextResponse.json([])
    }

    const studentGroups = await db
      .select()
      .from(groupStudents)
      .where(eq(groupStudents.student_id, studentId))

    const groupIds = studentGroups.map(g => g.group_id)

    if (groupIds.length === 0) {
      return NextResponse.json([])
    }

    const availableExams = await db
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
        group_name: groups.name,
      })
      .from(exams)
      .leftJoin(levels, eq(exams.level_id, levels.id))
      .leftJoin(groups, eq(exams.group_id, groups.id))
      .where(inArray(exams.group_id, groupIds))

    const attempts = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.student_id, studentId))

    const attemptMap = {}
    attempts?.forEach(a => {
      attemptMap[a.exam_id] = { status: a.status, score: a.total_score }
    })

    const examsWithStatus = availableExams?.map(exam => ({
      ...exam,
      attempt: attemptMap[exam.id] || { status: 'not_started', score: 0 }
    })) || []

    return NextResponse.json(examsWithStatus)
  } catch (error) {
    console.error('❌ خطأ في جلب اختبارات الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}