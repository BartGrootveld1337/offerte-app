import type { NextConfig } from "next";

const securityHeaders = [
  // CVE-006: Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // CVE-006: Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // CVE-006: Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // CVE-006: Force HTTPS (1 year, include subdomains)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // CVE-006: Disable browser features not needed
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // CVE-006: Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev; unsafe-inline for inline handlers
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://www.vrijdag.ai",
      "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.resend.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
