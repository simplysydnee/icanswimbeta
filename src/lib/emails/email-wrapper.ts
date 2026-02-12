import { APP_CONFIG } from '@/lib/constants'

const APP_URL = APP_CONFIG.url
// Use production URL for emails to ensure links work when sent to users
const EMAIL_APP_URL = process.env.NEXT_PUBLIC_EMAIL_APP_URL || 'https://icanswimbeta.vercel.app'
const LOGO_URL = `${EMAIL_APP_URL}/images/logo.jpg`

// Brand colors
const BRAND_MAIN = '#2a5e84'
const BRAND_ACCENT = '#6abedc'

export function wrapEmailWithHeader(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>I Can Swim</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f9fafb;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
<!-- Simple Header -->
<div style="padding:24px 20px 20px;background:${BRAND_MAIN};text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.3;font-weight:bold;">I Can Swim</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:16px;line-height:1.5;">Serving Modesto & Merced, CA</p>
</div>
<!-- Content -->
<div style="padding:30px 20px;">
${content}
</div>
<!-- Footer -->
<div style="padding:20px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:14px;color:#64748b;">
<p style="margin:0 0 10px 0;">
<strong>I Can Swim</strong><br>
Adaptive swim lessons for swimmers with special needs
</p>
<p style="margin:0;line-height:1.8;">
Email: <a href="mailto:info@icanswim209.com" style="color:#2a5e84;text-decoration:none;">info@icanswim209.com</a><br>
Phone: <a href="tel:+12097787877" style="color:#2a5e84;text-decoration:none;">(209) 778-7877</a><br>
Text: <a href="sms:+12096437969" style="color:#2a5e84;text-decoration:none;">209-643-7969</a>
</p>
</div>
</div>
</body>
</html>`
}

export function createButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:30px 0;">
<a href="${url}" style="display:inline-block;background:${BRAND_MAIN};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:18px;line-height:1.5;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
${text}
</a>
<p style="margin:12px 0 0;color:#64748b;font-size:14px;">Click the button above to get started</p>
</div>`
}

export { BRAND_MAIN, BRAND_ACCENT, APP_URL, EMAIL_APP_URL, LOGO_URL }