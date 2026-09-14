import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forumComments, profiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// ✅ جلب التعليقات
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    const comments = await db
      .select({
        id: forumComments.id,
        body: forumComments.body,
        created_at: forumComments.created_at,
        author_name: profiles.full_name,
      })
      .from(forumComments)
      .leftJoin(profiles, eq(forumComments.author_id, profiles.id))
      .where(eq(forumComments.post_id, postId))
      .orderBy(desc(forumComments.created_at))

    return NextResponse.json(comments || [])
  } catch (error) {
    console.error('❌ خطأ في جلب التعليقات:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ إنشاء تعليق
export async function POST(request) {
  try {
    const { post_id, body: content, author_id } = await request.json()

    if (!post_id || !content || !author_id) {
      return NextResponse.json({ error: 'Post ID, content, and author are required' }, { status: 400 })
    }

    const commentId = crypto.randomUUID()
    await db.insert(forumComments).values({
      id: commentId,
      post_id,
      body: content,
      author_id,
      created_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: commentId,
      message: 'Comment added successfully'
    })
  } catch (error) {
    console.error('❌ خطأ في إضافة التعليق:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ حذف تعليق
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }

    await db.delete(forumComments).where(eq(forumComments.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ خطأ في حذف التعليق:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}