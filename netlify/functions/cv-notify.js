export const handler = async (event) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return { statusCode: 500, body: 'Missing env vars' }

  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown'
  const ua = event.headers['user-agent'] || 'unknown'
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

  const text = `📄 CV Downloaded!\n⏰ ${time} WIB\n🌐 IP: ${ip}\n📱 ${ua}`

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })

  return { statusCode: 200, body: 'ok' }
}
