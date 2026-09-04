import { getServerSession } from 'next-auth'
import { authOptions } from '../[...nextauth]/route'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    return NextResponse.json(session || { user: null })
  } catch (error) {
    console.error('❌ خطأ في جلب الجلسة:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}