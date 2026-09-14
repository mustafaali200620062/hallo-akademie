// @ts-nocheck
import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/r2'
import { db } from '@/db'
import { lessons } from '@/db/schema'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const lessonId = formData.get('lesson_id')
    const title = formData.get('title')
    const levelId = formData.get('level_id')
    const groupId = formData.get('group_id')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ✅ إنشاء اسم فريد للملف
    const timestamp = Date.now()
    const fileName = `lessons/${levelId || 'general'}/${timestamp}-${file.name}`

    // ✅ رفع الملف على R2
    const result = await uploadFile(file, fileName)

    if (!result.success) {
      throw new Error('Failed to upload file')
    }

    // ✅ حفظ بيانات الملف في قاعدة البيانات
    const [newLesson] = await db.insert(lessons).values({
      id: crypto.randomUUID(),
      title: title || file.name,
      description: '',
      content_type: file.type.includes('pdf') ? 'pdf' : 'file',
      content_url: fileName,
      level_id: levelId || null,
      group_id: groupId || null,
      is_published: false,
      created_at: new Date().toISOString(),
    }).returning()

    return NextResponse.json({
      success: true,
      lesson: newLesson,
      fileName,
    })
  } catch (error) {
    console.error('❌ Error uploading file:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}