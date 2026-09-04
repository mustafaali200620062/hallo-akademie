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

    const { data: teachers, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role_id', (await supabase.from('roles').select('id').eq('name', 'Lehrer').single()).data.id)
      .order('full_name')

    if (error) throw error

    return NextResponse.json(teachers || [])
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}