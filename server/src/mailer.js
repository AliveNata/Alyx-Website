import nodemailer from 'nodemailer'

// Gmail SMTP transport. Configured via env:
//   SMTP_USER = your gmail address
//   SMTP_PASS = a Google "App Password" (16 chars, NOT your login password)
//   SMTP_FROM = optional display From (defaults to SMTP_USER)
// If SMTP is not configured, links are logged to the server console instead of
// emailed, so the flow can be exercised in local dev.
let transporter = null
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

export const mailerReady = () => !!transporter

export async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log(`\n[mailer:DEV] (SMTP not configured) would email ${to}: ${subject}\n${text}\n`)
    return { dev: true }
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  await transporter.sendMail({ from, to, subject, html, text })
  return { sent: true }
}

// Small helper to build a branded action email.
export function actionEmail(title, intro, link, buttonLabel) {
  const text = `${title}\n\n${intro}\n\n${buttonLabel}: ${link}\n\nThis link is valid for 30 minutes. Ignore it if this wasn't you.`
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a0f1c">
      <h2 style="margin:0 0 8px">${title}</h2>
      <p style="color:#475569;line-height:1.6">${intro}</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#00d4ff;color:#0a0f1c;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;display:inline-block">${buttonLabel}</a>
      </p>
      <p style="color:#94a3b8;font-size:13px">This link is valid for 30 minutes. Ignore this email if you didn't request it.</p>
      <p style="color:#94a3b8;font-size:12px;word-break:break-all">${link}</p>
    </div>`
  return { text, html }
}
