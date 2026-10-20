import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getReviewQueue } from '@/lib/sheets'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, email } = session.user as { role: string; email: string }
  if (role === 'rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const data = await getReviewQueue(email)
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/queue', err)
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 })
  }
}
