import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { getStudents } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const students = await getStudents()
    return NextResponse.json(students)
  } catch (error) {
    console.error('❌ خطأ في جلب الطلاب:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}