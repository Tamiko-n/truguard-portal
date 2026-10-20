import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getUserByEmail } from './sheets'

declare module 'next-auth' {
  interface User   { role: string; managerEmail: string }
  interface Session { user: { role: string; managerEmail: string; email: string; name: string } }
}
declare module 'next-auth/jwt' {
  interface JWT { role: string; managerEmail: string }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await getUserByEmail(credentials.email)
        if (!user || user.active === 'FALSE') return null

        const ok = await bcrypt.compare(credentials.password, user.password_hash)
        if (!ok) return null

        return {
          id:           user.email,
          email:        user.email,
          name:         user.name,
          role:         user.role,
          managerEmail: user.manager_email,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role         = (user as any).role
        token.managerEmail = (user as any).managerEmail
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role         = token.role
        ;(session.user as any).managerEmail = token.managerEmail
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
}
