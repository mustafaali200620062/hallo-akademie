// @ts-nocheck
import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/r2'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const type = formData.get('type')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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
    })
  } catch (error) {
    console.error('❌ Error uploading question media:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}