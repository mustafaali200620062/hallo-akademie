import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/db'
import { profiles, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

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
          // تسجيل دخول وهمي للمالك (للتجربة)
          if (credentials.email === 'mustafaali200620062@gmail.com' && credentials.password === '123456') {
            return {
              id: '413a654a-470e-45f2-8e0e-aef51294022f',
              name: 'Mustafa Ali',
              email: 'mustafaali200620062@gmail.com',
              role: 'Eigentümer',
            }
          }

          // جلب المستخدم من قاعدة البيانات (للباقي)
          const user = await db
            .select({
              id: profiles.id,
              full_name: profiles.full_name,
              email: profiles.email,
              password: profiles.password,
              role_name: roles.name,
            })
            .from(profiles)
            .leftJoin(roles, eq(profiles.role_id, roles.id))
            .where(eq(profiles.email, credentials.email))
            .get()

          if (!user) {
            throw new Error('البريد الإلكتروني غير مسجل')
          }

          // التحقق من كلمة المرور
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            throw new Error('كلمة المرور غير صحيحة')
          }

          // إرجاع بيانات المستخدم
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