import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // جلب دور المساعد
    const assistantRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Assistent'))
      .get()

    if (!assistantRole) {
      return NextResponse.json([])
    }

    // جلب جميع المساعدين
    const assistants = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        email: profiles.email,
        phone: profiles.phone,
        is_active: profiles.is_active,
        created_at: profiles.created_at,
      })
      .from(profiles)
      .where(eq(profiles.role_id, assistantRole.id))
      .all()

    return NextResponse.json(assistants || [])
  } catch (error) {
    console.error('❌ خطأ في جلب المساعدين:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}