import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// 許可するメールアドレスのリスト（環境変数から読み込み）
// .env ファイルで ALLOWED_EMAILS="email1@gmail.com,email2@gmail.com" のように設定
const ALLOWED_EMAILS: string[] = process.env.ALLOWED_EMAILS
    ? process.env.ALLOWED_EMAILS.split(',').map(email => email.trim())
    : []

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: '/',
        error: '/', // エラー時もホームにリダイレクト
    },
    callbacks: {
        async signIn({ user }) {
            // メールアドレスが許可リストに含まれているかチェック
            if (user.email && ALLOWED_EMAILS.includes(user.email)) {
                return true
            }
            // 許可されていない場合はサインインを拒否
            return false
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
