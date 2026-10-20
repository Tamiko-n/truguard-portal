import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getEvaluationByTicket } from '@/lib/sheets'
import Link from 'next/link'
import Badge from '@/components/Badge'
import DisputeForm from './DisputeForm'
import {
  fmtDate, fmtDuration, scoreDisplay,
  callTypeBadge, flagColor, ratingColor,
  parseCriteriaDetail, withinDisputeWindow,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ReviewDetailPage({ params }: { params: { ticket: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { email, role } = session.user as { email: string; role: string }
  const ev = await getEvaluationByTicket(params.ticket)
  if (!ev) notFound()
  if (role === 'rep' && ev.agent_email !== email) redirect('/reviews')

  const badge      = callTypeBadge(ev.call_type)
  const score      = scoreDisplay(ev)
  const flag       = ev.human_flag || ev.ai_flag
  const criteria   = parseCriteriaDetail(ev.criteria_detail || '')
  const canDispute = withinDisputeWindow(ev.call_date)

  // Area scores
  const areas: { label: string; value: string }[] = [
    { label: 'Opening',         value: ev.opening_score },
    { label: 'Discovery',       value: ev.discovery_score },
    { label: 'Value Prop',      value: ev.value_prop_score },
    { label: 'Objection',       value: ev.objection_score },
    { label: 'Close',           value: ev.close_score },
    { label: 'Compliance',      value: ev.compliance_score },
    { label: 'Professionalism', value: ev.professionalism_score },
  ].filter(a => a.value)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <Link href="/reviews" className="text-xs text-muted hover:text-yellow">
        ← Back to reviews
      </Link>

      {/* Header */}
      <div className="card flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge label={badge.label} color={badge.color} />
            {flag && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${flagColor(flag)}`}>
                {flag}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-primary mt-1">{ev.company_name || 'Call Review'}</h1>
          <p className="text-sm text-muted">
            {fmtDate(ev.call_date)} · {fmtDuration(ev.duration_sec)} · {ev.ticket_no}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-black ${ratingColor(ev.rating_band)}`}>
            {score.value}
            <span className="text-base font-normal text-muted">{score.max}</span>
          </p>
          <p className={`text-sm font-medium ${ratingColor(ev.rating_band)}`}>{ev.rating_band}</p>
        </div>
      </div>

      {/* Area scores */}
      {areas.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-primary mb-3">Area Scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {areas.map(a => (
              <div key={a.label} className="bg-raised border border-border rounded-lg p-3">
                <p className="label mb-0.5">{a.label}</p>
                <p className="text-lg font-bold text-primary">{a.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaching summary */}
      {ev.coaching_summary && (
        <div className="card border-l-2 border-yellow">
          <h2 className="text-sm font-semibold text-yellow mb-2">Coach Vance Notes</h2>
          <p className="text-sm text-dim leading-relaxed whitespace-pre-wrap">{ev.coaching_summary}</p>
        </div>
      )}

      {/* Red flag detail */}
      {flag && ev.red_flag_detail && (
        <div className={`finding-card ${flagColor(flag)}`}>
          <p className="font-semibold mb-1">{flag}</p>
          <p className="text-sm leading-relaxed">{ev.red_flag_detail}</p>
        </div>
      )}

      {/* Criteria breakdown */}
      {criteria.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-primary mb-3">Criteria Breakdown</h2>
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <div
                key={`${c.id}-${i}`}
                className={`finding-card ${
                  c.result === 'MET'     ? 'border-green/30 bg-green/5' :
                  c.result === 'NOT_MET' ? 'border-red/30 bg-red/5' :
                                           'border-border bg-raised'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    c.result === 'MET'     ? 'bg-green/20 text-green' :
                    c.result === 'NOT_MET' ? 'bg-red/20 text-red' :
                                             'bg-muted/20 text-muted'
                  }`}>
                    {c.result}
                  </span>
                  <span className="text-xs font-mono text-muted">{c.id}</span>
                  {c.label && <span className="text-sm font-medium text-primary">{c.label}</span>}
                </div>
                {c.quote && (
                  <p className="text-xs text-dim italic mb-1">"{c.quote}"</p>
                )}
                {c.why && <p className="text-xs text-dim mb-0.5"><span className="text-muted">Why: </span>{c.why}</p>}
                {c.try && <p className="text-xs text-yellow mt-1"><span className="font-semibold">Try: </span>{c.try}</p>}
                {c.result === 'NOT_MET' && (
                  <DisputeForm
                    ticketNo={ev.ticket_no}
                    findingId={c.id}
                    label={c.label}
                    withinWindow={canDispute}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw AI notes fallback */}
      {criteria.length === 0 && ev.ai_notes && (
        <div className="card">
          <h2 className="text-sm font-semibold text-primary mb-2">AI Notes</h2>
          <p className="text-sm text-dim whitespace-pre-wrap leading-relaxed">{ev.ai_notes}</p>
        </div>
      )}
    </div>
  )
}
