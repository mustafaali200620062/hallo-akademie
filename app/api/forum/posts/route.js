import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forumPosts, profiles, levels } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'

// ✅ جلب المنشورات
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const levelId = searchParams.get('level_id')

    let query = db
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

    // ✅ لو في level_id، نفلتر
    if (levelId) {
      query = query.where(eq(forumPosts.level_id, levelId))
    }

    const posts = await query

    // ✅ جلب التعليقات لكل منشور
    const { forumComments } = await import('@/db/schema')

    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await db
          .select({
            id: forumComments.id,
            body: forumComments.body,
            created_at: forumComments.created_at,
            author_name: profiles.full_name,
          })
          .from(forumComments)
          .leftJoin(profiles, eq(forumComments.author_id, profiles.id))
          .where(eq(forumComments.post_id, post.id))
          .orderBy(desc(forumComments.created_at))

        return { ...post, comments: comments || [] }
      })
    )

    return NextResponse.json(postsWithComments || [])
  } catch (error) {
    console.error('❌ خطأ في جلب المنشورات:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ إنشاء منشور جديد
export async function POST(request) {
  try {
    const body = await request.json()
    const { title, body: content, level_id, author_id } = body

    if (!title || !content || !author_id) {
      return NextResponse.json({ error: 'Title, content, and author are required' }, { status: 400 })
    }

    if (!level_id) {
      return NextResponse.json({ error: 'Level is required' }, { status: 400 })
    }

    // ✅ إنشاء المنشور
    const postId = crypto.randomUUID()
    await db.insert(forumPosts).values({
      id: postId,
      title,
      body: content,
      level_id,
      author_id,
      created_at: new Date(),
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

// ✅ حذف منشور
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    // ✅ حذف التعليقات المرتبطة
    const { forumComments } = await import('@/db/schema')
    await db.delete(forumComments).where(eq(forumComments.post_id, id))

    // ✅ حذف المنشور
    await db.delete(forumPosts).where(eq(forumPosts.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ خطأ في حذف المنشور:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}