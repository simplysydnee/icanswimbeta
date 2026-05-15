import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

serve(async (_req) => {
  try {
    const appUrl = Deno.env.get('APP_URL') || 'https://icanswimbeta.vercel.app'
    const cronSecret = Deno.env.get('CRON_SECRET')

    if (!cronSecret) {
      console.error('fiscal-year-rollover: CRON_SECRET not set')
      return new Response('Missing CRON_SECRET', { status: 500 })
    }

    console.log('fiscal-year-rollover: starting rollover process...')

    const response = await fetch(`${appUrl}/api/fiscal-year-rollover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('fiscal-year-rollover: API returned error', {
        status: response.status,
        body,
      })
      return new Response(`API error: ${response.status} — ${body}`, { status: 500 })
    }

    const result = await response.json()
    console.log('fiscal-year-rollover: completed', result)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('fiscal-year-rollover: error', error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
})
