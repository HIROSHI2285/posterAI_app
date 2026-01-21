import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番環境でconsole.logを削除（errorは残す）
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error'] }
      : false,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy - XSS/インジェクション攻撃防止
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          // XSS対策
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Clickjacking対策
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS保護
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // HTTPS強制（本番環境のみ）
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Referrerポリシー
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 権限ポリシー
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },

  // sharpをサーバーサイドでバンドルしない（Turbopackパニック防止）
  serverExternalPackages: ['sharp'],
};

export default nextConfig;


