import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forumComments, profiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, body: content } = body

    if (!post_id || !content) {
      return NextResponse.json({ error: 'Post ID and content are required' }, { status: 400 })
    }

    // إنشاء التعليق
    const commentId = crypto.randomUUID()
    await db.insert(forumComments).values({
      id: commentId,
      post_id,
      body: content,
      author_id: session.user.id
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

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }

    // حذف التعليق
    await db
      .delete(forumComments)
      .where(eq(forumComments.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ خطأ في حذف التعليق:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}