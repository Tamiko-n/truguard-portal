import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getEvaluationsByAgent,
  getTeamEvaluations,
  getAllEvaluations,
  getTeamEmails,
} from '@/lib/sheets'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, email, managerEmail } = session.user as {
    role: string; email: string; managerEmail?: string
  }

  try {
    if (role === 'admin') {
      const data = await getAllEvaluations()
      return NextResponse.json(data)
    }

    if (role === 'manager') {
      const teamEmails = await getTeamEmails(email)
      const data = await getTeamEvaluations(teamEmails)
      return NextResponse.json(data)
    }

    // rep — own records only
    const data = await getEvaluationsByAgent(email)
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/evaluations', err)
    return NextResponse.json({ error: 'Failed to load evaluations' }, { status: 500 })
  }
}
