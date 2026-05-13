import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

serve(async (_req) => {
  try {
    const appUrl = Deno.env.get('APP_URL') || 'https://icanswimbeta.vercel.app'
    const cronSecret = Deno.env.get('CRON_SECRET')

    if (!cronSecret) {
      console.error('po-renewal-reminder: CRON_SECRET not set')
      return new Response('Missing CRON_SECRET', { status: 500 })
    }

    const response = await fetch(`${appUrl}/api/po-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('po-renewal-reminder: API returned error', { status: response.status, body })
      return new Response(`API error: ${response.status}`, { status: 500 })
    }

    const result = await response.json()
    console.log('po-renewal-reminder: completed', result)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('po-renewal-reminder: error', error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
})
