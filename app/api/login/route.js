import { NextResponse } from 'next/server'

// بيانات المستخدمين المؤقتة (هارد كود)
const USERS = {
  'halloechensprachakademie@gmail.com': {
    id: '413a654a-470e-45f2-8e0e-aef51294022f',
    name: 'Hallöchen Admin',
    email: 'halloechensprachakademie@gmail.com',
    password: '123123',
    role: 'Eigentümer'
  },
  'moradyousef95@gmail.com': {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Morad Youssef',
    email: 'moradyousef95@gmail.com',
    password: '123123',
    role: 'Assistent'
  },
  'mustafaali200620062@gmail.com': {
    id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Mustafa Ali (Lehrer)',
    email: 'mustafaali200620062@gmail.com',
    password: '123123',
    role: 'Lehrer'
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // البحث عن المستخدم
    const user = USERS[email]

    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير مسجل' }, { status: 401 })
    }

    // التحقق من كلمة المرور
    if (user.password !== password) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // إرجاع بيانات المستخدم
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}