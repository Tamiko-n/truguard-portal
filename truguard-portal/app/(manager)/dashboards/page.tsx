import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTeamEmails, getTeamEvaluations } from '@/lib/sheets'
import StatCard from '@/components/StatCard'
import DashboardCharts from './DashboardCharts'
import type { Evaluation } from '@/lib/types'

export const dynamic = 'force-dynamic'

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10
}

export default async function DashboardsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { role, email } = session.user as { role: string; email: string }
  if (role === 'rep') redirect('/reviews')

  const teamEmails = await getTeamEmails(email)
  const evals      = await getTeamEvaluations(teamEmails)

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalCalls  = evals.length
  const flagged     = evals.filter((e: Evaluation) => e.human_flag || e.ai_flag).length
  const avgScore    = avg(
    evals
      .map((e: Evaluation) => Number(e.total_score))
      .filter(Boolean)
  )

  // Rating band distribution
  const bandCounts: Record<string, number> = {}
  for (const ev of evals) {
    const b = ev.rating_band || 'Unknown'
    bandCounts[b] = (bandCounts[b] || 0) + 1
  }
  const topBand  = Object.entries(bandCounts).sort((a, b) => b[1] - a[1])[0]
  const excellent = bandCounts['Excellent'] || 0
  const pctExcellent = totalCalls ? Math.round(excellent / totalCalls * 100) : 0

  // ── Chart data ─────────────────────────────────────────────────────────────
  const callsByTypeMap: Record<string, number> = {}
  for (const ev of evals) {
    const ct = ev.call_type || 'UNKNOWN'
    callsByTypeMap[ct] = (callsByTypeMap[ct] || 0) + 1
  }
  const callsByType = Object.entries(callsByTypeMap).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace('LIVE ', ''),
    value,
  }))

  // Agent avg scores (last 30 per agent)
  const agentScoreMap: Record<string, number[]> = {}
  for (const ev of evals) {
    const s = Number(ev.total_score)
    if (!s) continue
    if (!agentScoreMap[ev.agent_email]) agentScoreMap[ev.agent_email] = []
    agentScoreMap[ev.agent_email].push(s)
  }
  const agentScores = Object.entries(agentScoreMap).map(([name, scores]) => ({
    name: name.split('@')[0],
    value: avg(scores.slice(-30)),
  }))

  // Flag distribution
  const flagMap: Record<string, number> = {}
  for (const ev of evals) {
    const f = ev.human_flag || ev.ai_flag
    if (f) flagMap[f] = (flagMap[f] || 0) + 1
  }
  const FLAG_COLORS: Record<string, string> = {
    'Red Flag - Tier 2':    '#DC2626',
    'Red Flag - Tier 1':    '#EA580C',
    'Compliance Breach':    '#EA580C',
    'Training Opportunity': '#F5C518',
  }
  const flagDist = Object.entries(flagMap).map(([name, value]) => ({
    name,
    value,
    color: FLAG_COLORS[name] || '#6B7280',
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Team Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          {teamEmails.length} rep{teamEmails.length !== 1 ? 's' : ''} · all-time
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Calls"   value={totalCalls} />
        <StatCard label="Avg Score"     value={avgScore || '—'} sub="out of 30" accent="text-yellow" />
        <StatCard label="Flagged"       value={flagged}    sub={`${totalCalls ? Math.round(flagged/totalCalls*100) : 0}% of calls`} accent="text-orange" />
        <StatCard label="Excellent"     value={`${pctExcellent}%`} sub={`${excellent} calls`} accent="text-green" />
      </div>

      {/* Charts */}
      {totalCalls > 0 ? (
        <DashboardCharts
          callsByType={callsByType}
          agentScores={agentScores}
          flagDist={flagDist}
        />
      ) : (
        <div className="card text-center py-12">
          <p className="text-muted">No scored calls yet — charts will appear here.</p>
        </div>
      )}
    </div>
  )
}
