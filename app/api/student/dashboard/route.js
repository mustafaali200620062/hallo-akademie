// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
  profiles, groups, groupStudents, exams, examAttempts,
  studentAnswers, examQuestions, studentErrors, levels
} from '@/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    // ═══════════════════════════════════════════════
    // 1) بيانات الطالب
    // ═══════════════════════════════════════════════
    const studentData = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, studentId))

    if (!studentData || studentData.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const student = studentData[0]
    const studentLevelId = student.level_id

    // ✅ اسم المستوى
    let levelCode = null
    let levelTitle = null
    if (studentLevelId) {
      const lvl = await db.select().from(levels).where(eq(levels.id, studentLevelId))
      if (lvl.length > 0) {
        levelCode = lvl[0].code
        levelTitle = lvl[0].title
      }
    }

    // ═══════════════════════════════════════════════
    // 2) جروب الطالب
    // ═══════════════════════════════════════════════
    const studentGroups = await db
      .select()
      .from(groupStudents)
      .where(eq(groupStudents.student_id, studentId))

    let groupName = null
    let groupId = null
    if (studentGroups.length > 0) {
      const grpData = await db
        .select()
        .from(groups)
        .where(eq(groups.id, studentGroups[0].group_id))
      if (grpData.length > 0) {
        groupName = grpData[0].name
        groupId = grpData[0].id
      }
    }

    // ═══════════════════════════════════════════════
    // 3) الاختبارات المتاحة (اختبارات جروبه بس)
    // ═══════════════════════════════════════════════
    let availableExams = []
    if (groupId) {
      availableExams = await db
        .select()
        .from(exams)
        .where(and(
          eq(exams.group_id, groupId),
          eq(exams.status, 'active')
        ))
    }

    // ═══════════════════════════════════════════════
    // 4) الاختبارات المكتملة (اللي سلمها الطالب)
    // ═══════════════════════════════════════════════
    const studentAttempts = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.student_id, studentId))

    const completedAttempts = studentAttempts.filter(a => a.status === 'submitted')

    // ═══════════════════════════════════════════════
    // 5) مجموع النقاط
    // ═══════════════════════════════════════════════
    const totalPoints = completedAttempts.reduce(
      (sum, a) => sum + (a.total_score || 0), 0
    )

    // ═══════════════════════════════════════════════
    // 6) الترتيب على المستوى بالكامل (Live)
    // ═══════════════════════════════════════════════
    let levelRank = null
    let levelRankBadge = null

    if (studentLevelId) {
      // ✅ كل الطلاب في نفس المستوى
      const levelStudents = await db
        .select()
        .from(profiles)
        .where(eq(profiles.level_id, studentLevelId))

      const levelStudentIds = levelStudents.map(s => s.id)

      if (levelStudentIds.length > 0) {
        // ✅ كل محاولات طلاب المستوى
        const levelAttempts = await db
          .select()
          .from(examAttempts)
          .where(inArray(examAttempts.student_id, levelStudentIds))

        const submittedLevelAttempts = levelAttempts.filter(a => a.status === 'submitted')

        // ✅ مجموع نقاط كل طالب
        const pointsByStudent = {}
        for (const sid of levelStudentIds) {
          pointsByStudent[sid] = 0
        }
        for (const att of submittedLevelAttempts) {
          pointsByStudent[att.student_id] = (pointsByStudent[att.student_id] || 0) + (att.total_score || 0)
        }

        // ✅ ترتيب تنازلي
        const sorted = Object.entries(pointsByStudent)
          .map(([sid, pts]) => ({ student_id: sid, points: pts }))
          .sort((a, b) => b.points - a.points)

        // ✅ حساب الترتيب مع مراعاة التعادل
        let currentRank = 1
        let prevPoints = null
        const myPoints = pointsByStudent[studentId] || 0

        for (let i = 0; i < sorted.length; i++) {
          const entry = sorted[i]
          if (prevPoints !== null && entry.points === prevPoints) {
            // نفس النقاط → نفس الترتيب
          } else {
            currentRank = i + 1
          }
          prevPoints = entry.points

          if (entry.student_id === studentId) {
            levelRank = currentRank
            break
          }
        }

        // ✅ تحديد التاج أو المكرر
        if (levelRank === 1) {
          // ✅ كم طالب عنده نفس النقاط؟
          const samePointsCount = sorted.filter(s => s.points === myPoints).length
          if (samePointsCount === 1) {
            levelRankBadge = 'crown'  // 👑
          } else {
            levelRankBadge = 'duplicate'  // 🔁
          }
        }
      }
    }

    // ═══════════════════════════════════════════════
    // 7) الترتيب على المجموعة (Live)
    // ═══════════════════════════════════════════════
    let groupRank = null
    let groupRankBadge = null

    if (groupId) {
      // ✅ كل طلاب الجروب
      const groupStudentsList = await db
        .select()
        .from(groupStudents)
        .where(eq(groupStudents.group_id, groupId))

      const groupStudentIds = groupStudentsList.map(gs => gs.student_id)

      if (groupStudentIds.length > 0) {
        // ✅ كل محاولات طلاب الجروب
        const groupAttempts = await db
          .select()
          .from(examAttempts)
          .where(inArray(examAttempts.student_id, groupStudentIds))

        const submittedGroupAttempts = groupAttempts.filter(a => a.status === 'submitted')

        // ✅ مجموع نقاط كل طالب
        const pointsByStudent = {}
        for (const sid of groupStudentIds) {
          pointsByStudent[sid] = 0
        }
        for (const att of submittedGroupAttempts) {
          pointsByStudent[att.student_id] = (pointsByStudent[att.student_id] || 0) + (att.total_score || 0)
        }

        // ✅ ترتيب تنازلي
        const sorted = Object.entries(pointsByStudent)
          .map(([sid, pts]) => ({ student_id: sid, points: pts }))
          .sort((a, b) => b.points - a.points)

        // ✅ حساب الترتيب مع مراعاة التعادل
        let currentRank = 1
        let prevPoints = null
        const myPoints = pointsByStudent[studentId] || 0

        for (let i = 0; i < sorted.length; i++) {
          const entry = sorted[i]
          if (prevPoints !== null && entry.points === prevPoints) {
            // نفس الترتيب
          } else {
            currentRank = i + 1
          }
          prevPoints = entry.points

          if (entry.student_id === studentId) {
            groupRank = currentRank
            break
          }
        }

        // ✅ التاج أو المكرر
        if (groupRank === 1) {
          const samePointsCount = sorted.filter(s => s.points === myPoints).length
          if (samePointsCount === 1) {
            groupRankBadge = 'crown'
          } else {
            groupRankBadge = 'duplicate'
          }
        }
      }
    }

    // ═══════════════════════════════════════════════
    // 8) الأخطاء (باسم الاختبار + السؤال + إجابته + الصح)
    // ═══════════════════════════════════════════════
    const studentErrorsList = await db
      .select()
      .from(studentErrors)
      .where(eq(studentErrors.student_id, studentId))
      .orderBy(desc(studentErrors.created_at))

    // ✅ نجيب تفاصيل كل خطأ
    const errorsWithDetails = []
    for (const err of studentErrorsList) {
      // ✅ السؤال
      const qData = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.id, err.question_id))

      const question = qData[0] || null

      // ✅ الاختبار + اسمه
      let examTitle = 'اختبار غير معروف'
      if (question) {
        const examData = await db
          .select()
          .from(exams)
          .where(eq(exams.id, question.exam_id))
        if (examData.length > 0) {
          examTitle = examData[0].title
        }
      }

      // ✅ فك JSON للخيارات والإجابات
      const deepParse = (val) => {
        if (!val) return null
        let parsed = val
        let attempts = 0
        while (typeof parsed === 'string' && attempts < 5) {
          try { parsed = JSON.parse(parsed) } catch (e) { break }
          attempts++
        }
        return parsed
      }

      const options = deepParse(question?.options) || []
      const correctAnswersRaw = deepParse(question?.correct_answers) || []
      const studentAnswerRaw = deepParse(err.student_answer) || []

      // ✅ تحويل للعرض
      const correctTexts = (Array.isArray(correctAnswersRaw) ? correctAnswersRaw : [correctAnswersRaw]).map(ca => {
        const asNum = Number(ca)
        if (!isNaN(asNum) && Number.isInteger(asNum) && options[asNum] !== undefined) {
          return options[asNum]
        }
        return String(ca)
      })

      const studentTexts = (Array.isArray(studentAnswerRaw) ? studentAnswerRaw : [studentAnswerRaw]).map(sa => {
        const asNum = Number(sa)
        if (!isNaN(asNum) && Number.isInteger(asNum) && options[asNum] !== undefined) {
          return options[asNum]
        }
        return String(sa)
      })

      errorsWithDetails.push({
        id: err.id,
        exam_title: examTitle,
        question_text: question?.question_text || '',
        question_type: question?.question_type || '',
        student_answer: studentTexts,
        correct_answer: correctTexts,
        created_at: err.created_at,
      })
    }

    // ═══════════════════════════════════════════════
    // 9) الرد النهائي
    // ═══════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        full_name: student.full_name,
        phone: student.phone,
        level_id: studentLevelId,
        level_code: levelCode,
        level_title: levelTitle,
      },
      group: {
        id: groupId,
        name: groupName,
      },
      stats: {
        available_exams: availableExams.length,
        completed_exams: completedAttempts.length,
        total_points: totalPoints,
        level_rank: levelRank,
        level_rank_badge: levelRankBadge,
        group_rank: groupRank,
        group_rank_badge: groupRankBadge,
      },
      errors: errorsWithDetails,
    })

  } catch (error) {
    console.error('❌ خطأ في dashboard الطالب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}