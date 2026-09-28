// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
  groups, groupStudents, exams, lessons, forumPosts, forumComments,
  profiles, examAttempts, levels
} from '@/db/schema'
import { eq, and, inArray, desc, sql } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const teacherRole = searchParams.get('teacher_role')

    // ✅ لو مفيش teacher_id → أصفار
    if (!teacherId) {
      return NextResponse.json({
        stats: { groups: 0, students: 0, exams: 0, lessons: 0 },
        recentActivity: [],
        studentPerformance: [],
        strugglingStudents: []
      })
    }

    // ═══════════════════════════════════════════════
    // 1) جلب مجموعات المدرس
    // ═══════════════════════════════════════════════
    let teacherGroups = []

    if (teacherRole === 'Eigentümer' || teacherRole === 'Assistent') {
      // المالك/المساعد → كل المجموعات
      teacherGroups = await db.select().from(groups)
    } else {
      // المدرس → مجموعاته بس
      teacherGroups = await db
        .select()
        .from(groups)
        .where(eq(groups.teacher_id, teacherId))
    }

    const groupIds = teacherGroups.map(g => g.id)

    // ═══════════════════════════════════════════════
    // 2) الإحصائيات الأساسية
    // ═══════════════════════════════════════════════

    // ✅ الطلاب في مجموعات المدرس
    let studentsCount = 0
    let allGroupStudents = []
    if (groupIds.length > 0) {
      allGroupStudents = await db
        .select()
        .from(groupStudents)
        .where(inArray(groupStudents.group_id, groupIds))
      // ✅ عدد الطلاب الفريدين (مش تكرار لو الطالب في مجموعتين)
      const uniqueStudents = new Set(allGroupStudents.map(gs => gs.student_id))
      studentsCount = uniqueStudents.size
    }

    // ✅ الاختبارات بتاعة المدرس
    let teacherExams = []
    if (teacherRole === 'Eigentümer' || teacherRole === 'Assistent') {
      teacherExams = await db.select().from(exams)
    } else {
      teacherExams = await db
        .select()
        .from(exams)
        .where(eq(exams.created_by, teacherId))
    }

    // ✅ الشروح (عدد الدروس)
    let teacherLessons = []
    if (teacherRole === 'Eigentümer' || teacherRole === 'Assistent') {
      teacherLessons = await db.select().from(lessons)
    } else {
      teacherLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.created_by, teacherId))
    }

    // ═══════════════════════════════════════════════
    // 3) آخر النشاطات
    // ═══════════════════════════════════════════════
    const recentActivity = []

    // ✅ آخر اختبار
    if (teacherExams.length > 0) {
      const latestExam = teacherExams.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      )[0]
      recentActivity.push({
        type: 'exam',
        icon: '📝',
        text: `تم إنشاء اختبار: "${latestExam.title}"`,
        time: latestExam.created_at,
      })
    }

    // ✅ آخر شرح
    if (teacherLessons.length > 0) {
      const latestLesson = teacherLessons.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      )[0]
      recentActivity.push({
        type: 'lesson',
        icon: '📖',
        text: `تم إضافة شرح جديد: "${latestLesson.title}"`,
        time: latestLesson.created_at,
      })
    }

    // ✅ آخر تعليق من طالب على منشور المدرس
    // - نجيب منشورات المدرس
    // - بعدها نجيبلهم آخر تعليق
    let teacherPostIds = []
    if (teacherRole === 'Eigentümer' || teacherRole === 'Assistent') {
      const allPosts = await db.select().from(forumPosts)
      teacherPostIds = allPosts.map(p => p.id)
    } else {
      const posts = await db
        .select()
        .from(forumPosts)
        .where(eq(forumPosts.author_id, teacherId))
      teacherPostIds = posts.map(p => p.id)
    }

    if (teacherPostIds.length > 0) {
      // ✅ آخر تعليق من طالب على أي منشور للمدرس
      const latestComments = await db
        .select()
        .from(forumComments)
        .where(inArray(forumComments.post_id, teacherPostIds))
        .orderBy(desc(forumComments.created_at))
        .limit(1)

      if (latestComments.length > 0) {
        const latestComment = latestComments[0]

        // ✅ نجيب اسم الطالب
        const commenterData = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, latestComment.author_id))
        
        const commenterName = commenterData[0]?.full_name || 'طالب'

        recentActivity.push({
          type: 'comment',
          icon: '💬',
          text: `رد جديد من "${commenterName}"`,
          time: latestComment.created_at,
        })
      }
    }

    // ✅ ترتيب النشاطات حسب الوقت
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time))

    // ═══════════════════════════════════════════════
    // 4) أداء الطلاب لكل مجموعة
    // ═══════════════════════════════════════════════
    const studentPerformance = []

    for (const group of teacherGroups) {
      // ✅ طلاب المجموعة
      const groupStudentsList = await db
        .select()
        .from(groupStudents)
        .where(eq(groupStudents.group_id, group.id))

      const groupStudentIds = groupStudentsList.map(gs => gs.student_id)

      // ✅ اختبارات المجموعة
      const groupExams = await db
        .select()
        .from(exams)
        .where(eq(exams.group_id, group.id))

      const groupExamIds = groupExams.map(e => e.id)

      // ✅ المتوسط
      let avgScore = 0
      let completionRate = 0

      if (groupStudentIds.length > 0 && groupExamIds.length > 0) {
        // ✅ كل محاولات الطلاب في اختبارات المجموعة
        const allAttempts = await db
          .select()
          .from(examAttempts)
          .where(inArray(examAttempts.exam_id, groupExamIds))

        // ✅ الطلاب اللي عندهم محاولات
        const validAttempts = allAttempts.filter(a =>
          groupStudentIds.includes(a.student_id)
        )

        // ✅ متوسط الدرجات (فقط للمسلّمين)
        const submittedAttempts = validAttempts.filter(a =>
          a.status === 'submitted'
        )

        if (submittedAttempts.length > 0) {
          let totalPercentage = 0
          let countedExams = 0

          for (const attempt of submittedAttempts) {
            const exam = groupExams.find(e => e.id === attempt.exam_id)
            if (exam && exam.total_points > 0) {
              totalPercentage += (attempt.total_score / exam.total_points) * 100
              countedExams++
            }
          }

          if (countedExams > 0) {
            avgScore = Math.round(totalPercentage / countedExams)
          }
        }

        // ✅ نسبة الإكمال
        // كل طالب × كل اختبار = الحالات المطلوبة
        const expectedAttempts = groupStudentIds.length * groupExamIds.length
        const completedAttempts = submittedAttempts.length
        if (expectedAttempts > 0) {
          completionRate = Math.round((completedAttempts / expectedAttempts) * 100)
        }
      }

      // ✅ الطلاب المتأخرين: (ما امتحنوش) + (درجتهم أقل من 50%)
      const struggling = []

      if (groupStudentIds.length > 0) {
        // ✅ محاولات المجموعة
        const allAttempts = groupExamIds.length > 0
          ? await db
              .select()
              .from(examAttempts)
              .where(inArray(examAttempts.exam_id, groupExamIds))
          : []

        // ✅ بيانات الطلاب
        const studentsData = await db
          .select()
          .from(profiles)
          .where(inArray(profiles.id, groupStudentIds))

        for (const studentId of groupStudentIds) {
          const student = studentsData.find(s => s.id === studentId)
          if (!student) continue

          const studentAttempts = allAttempts.filter(a => a.student_id === studentId)
          const submittedAttempts = studentAttempts.filter(a => a.status === 'submitted')

          // ✅ حالة 1: ما امتحنش أي اختبار
          if (studentAttempts.length === 0 || submittedAttempts.length === 0) {
            struggling.push({
              student_id: student.id,
              name: student.full_name,
              phone: student.phone || '',
              reason: 'لم يمتحن بعد',
              avgScore: null,
            })
            continue
          }

          // ✅ حالة 2: متوسط درجاته أقل من 50%
          let totalPercentage = 0
          let countedExams = 0

          for (const attempt of submittedAttempts) {
            const exam = groupExams.find(e => e.id === attempt.exam_id)
            if (exam && exam.total_points > 0) {
              totalPercentage += (attempt.total_score / exam.total_points) * 100
              countedExams++
            }
          }

          const studentAvg = countedExams > 0
            ? Math.round(totalPercentage / countedExams)
            : 0

          if (studentAvg < 50) {
            struggling.push({
              student_id: student.id,
              name: student.full_name,
              phone: student.phone || '',
              reason: `متوسط درجاته ${studentAvg}%`,
              avgScore: studentAvg,
            })
          }
        }
      }

      studentPerformance.push({
        group_id: group.id,
        group_name: group.name,
        students_count: groupStudentIds.length,
        exams_count: groupExamIds.length,
        avg_score: avgScore,
        completion_rate: completionRate,
        struggling_students: struggling,
      })
    }

    // ═══════════════════════════════════════════════
    // 5) تجميع الطلاب المتأخرين من كل المجموعات
    // ═══════════════════════════════════════════════
    const allStruggling = []
    for (const perf of studentPerformance) {
      for (const s of perf.struggling_students) {
        allStruggling.push({
          ...s,
          group_name: perf.group_name,
        })
      }
    }

    // ✅ الرد النهائي
    return NextResponse.json({
      stats: {
        groups: teacherGroups.length || 0,
        students: studentsCount || 0,
        exams: teacherExams.length || 0,
        lessons: teacherLessons.length || 0,
      },
      recentActivity,
      studentPerformance,
      strugglingStudents: allStruggling,
    })

  } catch (error) {
    console.error('❌ خطأ في dashboard المدرس:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}