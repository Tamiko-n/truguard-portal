import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTeamEmails, getTeamEvaluations } from '@/lib/sheets'
import Link from 'next/link'
import Badge from '@/components/Badge'
import { fmtDate, scoreDisplay, callTypeBadge, ratingColor } from '@/lib/utils'
import type { Evaluation } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { role, email } = session.user as { role: string; email: string }
  if (role === 'rep') redirect('/reviews')

  const teamEmails = await getTeamEmails(email)
  const evals      = await getTeamEvaluations(teamEmails)

  // Group by agent
  const byAgent: Record<string, Evaluation[]> = {}
  for (const ev of evals) {
    if (!byAgent[ev.agent_email]) byAgent[ev.agent_email] = []
    byAgent[ev.agent_email].push(ev)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-primary">Team Reviews</h1>
        <p className="text-sm text-muted mt-1">
          {teamEmails.length} rep{teamEmails.length !== 1 ? 's' : ''} · {evals.length} scored call{evals.length !== 1 ? 's' : ''}
        </p>
      </div>

      {evals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">No scored calls for your team yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byAgent).map(([agentEmail, agentEvals]) => (
            <div key={agentEmail} className="card overflow-hidden p-0">
              <div className="px-5 py-3 bg-raised border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">{agentEmail}</p>
                <p className="text-xs text-muted">{agentEvals.length} call{agentEvals.length !== 1 ? 's' : ''}</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Date</th>
                    <th className="table-th">Ticket</th>
                    <th className="table-th">Call Type</th>
                    <th className="table-th">Score</th>
                    <th className="table-th">Rating</th>
                    <th className="table-th">Flag</th>
                    <th className="table-th w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {agentEvals.map((ev: Evaluation) => {
                    const badge = callTypeBadge(ev.call_type)
                    const score = scoreDisplay(ev)
                    const flag  = ev.human_flag || ev.ai_flag
                    return (
                      <tr key={ev.ticket_no} className="hover:bg-raised/40 transition-colors">
                        <td className="table-td text-dim">{fmtDate(ev.call_date)}</td>
                        <td className="table-td font-mono text-xs text-dim">{ev.ticket_no}</td>
                        <td className="table-td">
                          <Badge label={badge.label} color={badge.color} />
                        </td>
                        <td className="table-td font-semibold">
                          {score.value}
                          {score.max && <span className="text-muted text-xs">{score.max}</span>}
                        </td>
                        <td className={`table-td font-medium ${ratingColor(ev.rating_band)}`}>
                          {ev.rating_band || '—'}
                        </td>
                        <td className="table-td text-xs">
                          {flag
                            ? <span className="text-orange">{flag}</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td className="table-td">
                          <Link
                            href={`/reviews/${ev.ticket_no}`}
                            className="text-yellow hover:underline text-xs"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
