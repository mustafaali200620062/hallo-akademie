// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { lessons } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getFileUrl } from '@/lib/r2'

export async function GET(request, { params }) {
  try {
    // ✅ في Next.js 15+ لازم نعمل await للـ params
    const resolvedParams = await params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // ✅ جلب بيانات الملف من قاعدة البيانات
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id))

    if (!lesson || lesson.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const file = lesson[0]

    if (!file.content_url) {
      return NextResponse.json({ error: 'No file attached' }, { status: 404 })
    }

    // ✅ إنشاء رابط مؤقت (صالح لمدة ساعة)
    const signedUrl = await getFileUrl(file.content_url, 3600)

    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('❌ Error getting file URL:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}