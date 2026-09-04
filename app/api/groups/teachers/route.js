import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // جلب المدرسين
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