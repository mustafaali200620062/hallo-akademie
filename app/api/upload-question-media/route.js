// @ts-nocheck
import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/r2'

// ✅ حد أقصى 10 ميجا
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const type = formData.get('type')

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال أي ملف' }, { status: 400 })
    }

    // ✅ التحقق من الحجم
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)} MB). الحد الأقصى 10 MB`
      }, { status: 400 })
    }

    // ✅ تحديد المجلد حسب النوع
    const folder = type === 'image' ? 'questions/images' : 'questions/audio'
    const timestamp = Date.now()
    const fileName = `${folder}/${timestamp}-${file.name}`

    // ✅ رفع الملف على R2
    const result = await uploadFile(file, fileName)

    return NextResponse.json({
      success: true,
      url: fileName,
      size: file.size,
    })
  } catch (error) {
    console.error('❌ Error uploading question media:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}