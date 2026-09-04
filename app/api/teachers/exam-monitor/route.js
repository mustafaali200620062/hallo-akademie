import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', session.user.id)
      .single()

    if (!profile || !['Lehrer', 'Eigentümer'].includes(profile.roles.name)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: attempts, error } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        student:profiles!student_id (id, full_name, phone),
        exam:exams!exam_id (title, duration_minutes, starts_at, ends_at)
      `)
      .eq('exam_id', examId)
      .order('started_at', { ascending: true })

    if (error) throw error

    const attemptsWithTime = attempts?.map(attempt => {
      let elapsedMinutes = 0
      let remainingMinutes = 0
      let status = attempt.status

      if (attempt.started_at && attempt.status === 'in_progress') {
        const now = new Date()
        const start = new Date(attempt.started_at)
        elapsedMinutes = Math.floor((now - start) / 60000)
        const totalMinutes = attempt.exam.duration_minutes + (attempt.extra_minutes || 0)
        remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes)
        
        if (remainingMinutes <= 0) {
          status = 'expired'
        }
      }

      return {
        ...attempt,
        elapsed_minutes: elapsedMinutes,
        remaining_minutes: remainingMinutes,
        status: status
      }
    })

    return NextResponse.json(attemptsWithTime || [])
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { attempt_id, action, extra_minutes } = body

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', session.user.id)
      .single()

    if (!profile || !['Lehrer', 'Eigentümer'].includes(profile.roles.name)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (action === 'lock') {
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          status: 'locked',
          is_reentry_allowed: false,
          locked_reason: 'تم القفل من قبل المدرس'
        })
        .eq('id', attempt_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'تم قفل الاختبار' })
    }

    if (action === 'unlock') {
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          status: 'in_progress',
          is_reentry_allowed: true,
          locked_reason: null
        })
        .eq('id', attempt_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'تم فتح الاختبار' })
    }

    if (action === 'add_time' && extra_minutes) {
      const { data: attempt } = await supabase
        .from('exam_attempts')
        .select('extra_minutes')
        .eq('id', attempt_id)
        .single()

      const { error } = await supabase
        .from('exam_attempts')
        .update({
          extra_minutes: (attempt?.extra_minutes || 0) + extra_minutes
        })
        .eq('id', attempt_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: `تم إضافة ${extra_minutes} دقيقة` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}