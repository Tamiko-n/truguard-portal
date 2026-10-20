import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveQueueItem } from '@/lib/sheets'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, email } = session.user as { role: string; email: string }
  if (role === 'rep') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { note = '' } = await req.json().catch(() => ({}))

  try {
    await resolveQueueItem(params.id, note, email)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to resolve'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
