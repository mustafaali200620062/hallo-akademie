import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forumPosts, profiles, levels } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // جلب جميع المنشورات مع بيانات المؤلف والمستوى
    const posts = await db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        body: forumPosts.body,
        created_at: forumPosts.created_at,
        level_id: forumPosts.level_id,
        author_id: forumPosts.author_id,
        author_name: profiles.full_name,
        level_code: levels.code,
      })
      .from(forumPosts)
      .leftJoin(profiles, eq(forumPosts.author_id, profiles.id))
      .leftJoin(levels, eq(forumPosts.level_id, levels.id))
      .orderBy(desc(forumPosts.created_at))
      .all()

    return NextResponse.json(posts || [])
  } catch (error) {
    console.error('❌ خطأ في جلب المنشورات:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, body: content, level_id } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // إنشاء المنشور
    const postId = crypto.randomUUID()
    await db.insert(forumPosts).values({
      id: postId,
      title,
      body: content,
      level_id,
      author_id: session.user.id
    })

    return NextResponse.json({ 
      success: true, 
      id: postId,
      message: 'Post created successfully' 
    })
  } catch (error) {
    console.error('❌ خطأ في إنشاء المنشور:', error)
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
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    // حذف المنشور
    await db
      .delete(forumPosts)
      .where(eq(forumPosts.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ خطأ في حذف المنشور:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}