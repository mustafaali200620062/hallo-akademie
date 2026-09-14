import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/db'
import { profiles, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // ✅ جلب المستخدم من قاعدة البيانات
          const users = await db
            .select({
              id: profiles.id,
              full_name: profiles.full_name,
              email: profiles.email,
              password: profiles.password,
              role_name: roles.name,
              is_active: profiles.is_active,
            })
            .from(profiles)
            .leftJoin(roles, eq(profiles.role_id, roles.id))
            .where(eq(profiles.email, credentials.email))

          if (!users || users.length === 0) {
            throw new Error('البريد الإلكتروني غير مسجل')
          }

          const user = users[0]

          // ✅ التحقق من كلمة المرور (نص عادي - بدون bcrypt)
          if (user.password !== credentials.password) {
            throw new Error('كلمة المرور غير صحيحة')
          }

          // ✅ التحقق من حالة الحساب
          if (!user.is_active) {
            throw new Error('الحساب غير مفعل')
          }

          // ✅ إرجاع بيانات المستخدم
          return {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role_name,
          }
        } catch (error) {
          console.error('❌ خطأ في تسجيل الدخول:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.id = token.id
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }