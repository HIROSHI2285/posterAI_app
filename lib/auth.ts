import { getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { checkUserAccess } from "./supabase"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: '/',
        error: '/', // エラー時もホームページにリダイレクト
    },
    callbacks: {
        async signIn({ user }) {
            // Supabaseの allow-list をチェック
            if (!user.email) {
                return false
            }

            const hasAccess = await checkUserAccess(user.email)

            if (!hasAccess) {
                console.warn(`Access denied for user: ${user.email}`)
                return false
            }

            return true
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export async function getSession() {
    return await getServerSession(authOptions)
}

