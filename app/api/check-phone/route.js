import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // التحقق من وجود رقم الهاتف
    const existingUser = await db
      .select()
      .from(profiles)
      .where(eq(profiles.phone, phone))
      .get()

    return NextResponse.json({ exists: !!existingUser })
  } catch (error) {
    console.error('❌ خطأ في التحقق من رقم الهاتف:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}