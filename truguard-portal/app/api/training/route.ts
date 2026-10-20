import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAssignmentsByAgent, getAllLessons, submitTeachBack } from '@/lib/sheets'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { email } = session.user as { email: string }

  try {
    const [assignments, lessons] = await Promise.all([
      getAssignmentsByAgent(email),
      getAllLessons(),
    ])
    return NextResponse.json({ assignments, lessons })
  } catch (err) {
    console.error('GET /api/training', err)
    return NextResponse.json({ error: 'Failed to load training data' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { email } = session.user as { email: string }
  const body = await req.json().catch(() => null)

  if (!body?.assignment_id || !body?.teach_back_text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    await submitTeachBack({
      assignment_id:   body.assignment_id,
      agent_email:     email,
      teach_back_text: body.teach_back_text,
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit teach-back'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
