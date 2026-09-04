import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles, levels } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // هذه الدالة غير مستخدمة حالياً
    // لأننا نجلب البروفايل من localStorage مباشرة
    return NextResponse.json({ error: 'Use client-side fetch' }, { status: 400 })
  } catch (error) {
    console.error('❌ خطأ في جلب البروفايل:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}