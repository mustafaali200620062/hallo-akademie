import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function DELETE(request) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.roles.name !== 'Eigentümer') {
      return NextResponse.json({ error: 'Unauthorized - Only Eigentümer can remove teachers' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })
    }

    const { data: teacher, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    if (teacher.email) {
      await supabase
        .from('allowed_emails')
        .delete()
        .eq('email', teacher.email)
    }

    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true, message: 'Teacher removed successfully' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}