import { NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // ✅ جلب المستخدم من قاعدة البيانات
    const user = await db
      .select({
        id: profiles.id,
        full_name: profiles.full_name,
        email: profiles.email,
        password: profiles.password,
        is_active: profiles.is_active,
        is_approved: profiles.is_approved,
        role_name: roles.name,
        level_id: profiles.level_id,
      })
      .from(profiles)
      .leftJoin(roles, eq(profiles.role_id, roles.id))
      .where(eq(profiles.email, email))

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير مسجل' }, { status: 401 })
    }

    const userData = user[0]

    // ✅ التحقق من كلمة المرور
    if (userData.password !== password) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // ✅ التحقق من حالة الحساب
    if (!userData.is_active) {
      return NextResponse.json({ error: 'الحساب غير مفعل' }, { status: 403 })
    }

    // ✅ إرجاع بيانات المستخدم
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        name: userData.full_name,
        email: userData.email,
        role: userData.role_name,
        level_id: userData.level_id,
      },
    })
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}