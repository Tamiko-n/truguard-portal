import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { submitDispute, getDisputesByAgent } from '@/lib/sheets'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { email } = session.user as { email: string }
  try {
    const data = await getDisputesByAgent(email)
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/disputes', err)
    return NextResponse.json({ error: 'Failed to load disputes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = session.user as { email: string }
  const body = await req.json().catch(() => null)

  if (!body?.ticket_no || !body?.finding_id || !body?.reason) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    await submitDispute({
      ticket_no:   body.ticket_no,
      agent_email: email,
      finding_id:  body.finding_id,
      reason:      body.reason,
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit dispute'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
