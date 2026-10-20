import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEvaluationByTicket, getTeamEmails } from '@/lib/sheets'

export async function GET(
  _req: Request,
  { params }: { params: { ticket: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, email } = session.user as { role: string; email: string }

  try {
    const ev = await getEvaluationByTicket(params.ticket)
    if (!ev) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // rep — only their own record
    if (role === 'rep' && ev.agent_email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // manager — only their team
    if (role === 'manager') {
      const teamEmails = await getTeamEmails(email)
      if (!teamEmails.includes(ev.agent_email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(ev)
  } catch (err) {
    console.error('GET /api/evaluations/[ticket]', err)
    return NextResponse.json({ error: 'Failed to load evaluation' }, { status: 500 })
  }
}
