import { getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { checkUserAccess } from "./supabase"
import { logAuditEvent } from "./audit-log"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'openid email profile',
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
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
                console.log('❌ No email provided')
                await logAuditEvent({
                    actor_email: 'unknown',
                    action: 'auth.signin.failed',
                    success: false,
                    details: { reason: 'no_email' }
                })
                return false
            }

            console.log('🔍 Checking access for:', user.email)
            const hasAccess = await checkUserAccess(user.email)
            console.log('✅ Access result:', hasAccess)

            if (!hasAccess) {
                console.warn(`❌ Access denied for user: ${user.email}`)
                await logAuditEvent({
                    actor_email: user.email,
                    action: 'auth.signin.denied',
                    success: false,
                    details: { reason: 'not_in_allowlist' }
                })
                return false
            }

            console.log('✅ Access granted for:', user.email)
            await logAuditEvent({
                actor_email: user.email,
                action: 'auth.signin.success',
                success: true
            })
            return true
        },
        async jwt({ token, account }) {
            if (account && account.access_token) {
                token.accessToken = account.access_token
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
            }
            session.accessToken = token.accessToken
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export async function getSession() {
    return await getServerSession(authOptions)
}

