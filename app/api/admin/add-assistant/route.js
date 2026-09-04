import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request) {
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
      return NextResponse.json({ error: 'Unauthorized - Only Eigentümer can add assistants' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: existingEmail, error: checkError } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('allowed_emails')
      .insert({
        email: email,
        role_name: 'Assistent',
        created_by: session.user.id
      })

    if (insertError) throw insertError

    return NextResponse.json({ 
      success: true, 
      message: 'Assistant added successfully. They can now sign in with Google.' 
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}