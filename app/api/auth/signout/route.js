import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // تسجيل الخروج (سيتم التعامل معه من خلال NextAuth)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}