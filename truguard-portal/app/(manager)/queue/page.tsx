import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getReviewQueue } from '@/lib/sheets'
import Link from 'next/link'
import ResolveButton from './ResolveButton'
import { fmtDate } from '@/lib/utils'
import type { QueueItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

const priorityStyle: Record<string, string> = {
  critical: 'bg-red/20 text-red border-red/40',
  high:     'bg-orange/20 text-orange border-orange/40',
  normal:   'bg-blue/20 text-blue border-blue/40',
}

export default async function QueuePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { role, email } = session.user as { role: string; email: string }
  if (role === 'rep') redirect('/reviews')

  const queue = await getReviewQueue(email)

  const critical = queue.filter((q: QueueItem) => q.priority === 'critical')
  const high     = queue.filter((q: QueueItem) => q.priority === 'high')
  const normal   = queue.filter((q: QueueItem) => !['critical', 'high'].includes(q.priority))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Review Queue</h1>
          <p className="text-sm text-muted mt-1">{queue.length} item{queue.length !== 1 ? 's' : ''} pending</p>
        </div>
        <div className="flex gap-2 text-xs">
          {critical.length > 0 && (
            <span className="px-2 py-1 rounded-full border bg-red/20 text-red border-red/40">
              {critical.length} Critical
            </span>
          )}
          {high.length > 0 && (
            <span className="px-2 py-1 rounded-full border bg-orange/20 text-orange border-orange/40">
              {high.length} High
            </span>
          )}
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-muted">Queue is clear — all reviews are up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item: QueueItem) => (
            <div key={item.queue_id} className="card flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 mt-0.5 ${
                  priorityStyle[item.priority] || priorityStyle.normal
                }`}>
                  {item.priority?.toUpperCase() || 'NORMAL'}
                </span>
                <div>
                  <Link
                    href={`/reviews/${item.ticket_no}`}
                    className="text-sm font-semibold text-primary hover:text-yellow transition-colors"
                  >
                    {item.ticket_no}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    Agent: <span className="text-dim">{item.agent_email}</span>
                    {' · '}
                    {fmtDate(item.created_at)}
                  </p>
                  {item.reason && (
                    <p className="text-sm text-dim mt-1 max-w-lg">{item.reason}</p>
                  )}
                </div>
              </div>
              <ResolveButton queueId={item.queue_id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
