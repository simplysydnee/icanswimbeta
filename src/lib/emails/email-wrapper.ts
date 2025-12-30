const APP_URL = 'https://icanswimbeta.vercel.app'
const LOGO_URL = `${APP_URL}/images/logo.jpg`

// Brand colors
const BRAND_MAIN = '#2a5e84'
const BRAND_ACCENT = '#6abedc'

export function wrapEmailWithHeader(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header with Logo -->
      <div style="padding: 20px; border-bottom: 3px solid ${BRAND_MAIN};">
        <img src="${LOGO_URL}" alt="I Can Swim" style="height: 50px; width: auto;" />
      </div>

      <!-- Content -->
      <div style="padding: 30px 20px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="padding: 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 14px; color: #64748b;">
        <p style="margin: 0 0 10px 0;">
          <strong>I Can Swim</strong><br>
          Modesto, CA
        </p>
        <p style="margin: 0;">
          Email: <a href="mailto:info@icanswim209.com" style="color: #2a5e84;">info@icanswim209.com</a><br>
          Phone: <a href="tel:+12097787877" style="color: #2a5e84;">(209) 778-7877</a><br>
          Text: <a href="sms:+12096437969" style="color: #2a5e84;">209-643-7969</a>
        </p>
      </div>
    </div>
  `
}

export function createButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background: ${BRAND_MAIN}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        ${text}
      </a>
    </div>
  `
}

export { BRAND_MAIN, BRAND_ACCENT }