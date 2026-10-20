import { format, parseISO, isValid, differenceInHours } from 'date-fns'
import type { CriterionLine, Evaluation } from './types'

export function fmtDate(d: string): string {
  try {
    const parsed = parseISO(d)
    return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : d
  } catch { return d }
}

export function fmtDuration(sec: string | number): string {
  const s = Number(sec)
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const r = s % 60
  return m ? `${m}m ${r}s` : `${r}s`
}

export function scoreDisplay(ev: Evaluation): { value: string; max: string } {
  const show = ev.show_score !== 'FALSE'
  if (!show) return { value: 'Partial', max: '' }
  const rubric = ev.rubric || ''
  if (rubric.startsWith('sales') || rubric.startsWith('COLD') || rubric.startsWith('FOLLOW')
      || rubric.startsWith('PROPOSAL') || rubric.startsWith('CALLBACK') || rubric.startsWith('INBOUND'))
    return { value: ev.total_score || '—', max: '/30' }
  if (rubric.startsWith('voicemail')) return { value: ev.voicemail_score || '—', max: '/6' }
  if (rubric.startsWith('gatekeeper')) return { value: ev.gatekeeper_score || '—', max: '/6' }
  return { value: ev.total_score || ev.voicemail_score || ev.gatekeeper_score || '—', max: '' }
}

export function callTypeBadge(ct: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    LIVE_DECISION_MAKER: { label: 'Decision Maker',  color: 'bg-green/20 text-green' },
    LIVE_GATEKEEPER:     { label: 'Gatekeeper',       color: 'bg-blue/20 text-blue' },
    VOICEMAIL:           { label: 'Voicemail',         color: 'bg-dim/20 text-dim' },
    IVR_ONLY:            { label: 'IVR',               color: 'bg-muted/20 text-muted' },
    NO_CONVERSATION:     { label: 'No Conversation',   color: 'bg-muted/20 text-muted' },
    UNKNOWN:             { label: 'Unknown',            color: 'bg-muted/20 text-muted' },
    cold_dm:             { label: 'Cold DM',            color: 'bg-green/20 text-green' },
    gatekeeper:          { label: 'Gatekeeper',         color: 'bg-blue/20 text-blue' },
    follow_up:           { label: 'Follow-Up',          color: 'bg-yellow/20 text-yellow' },
    proposal:            { label: 'Proposal F/U',       color: 'bg-orange/20 text-orange' },
    callback:            { label: 'Callback',            color: 'bg-blue/20 text-blue' },
    inbound:             { label: 'Inbound',             color: 'bg-green/20 text-green' },
    process_only:        { label: 'Process Only',        color: 'bg-muted/20 text-muted' },
    review:              { label: 'Review',              color: 'bg-orange/20 text-orange' },
  }
  return map[ct] || { label: ct, color: 'bg-muted/20 text-muted' }
}

export function flagColor(flag: string): string {
  if (flag === 'Red Flag - Tier 2')  return 'text-red border-red/40 bg-red/10'
  if (flag === 'Red Flag - Tier 1')  return 'text-orange border-orange/40 bg-orange/10'
  if (flag === 'Compliance Breach')  return 'text-orange border-orange/40 bg-orange/10'
  if (flag === 'Training Opportunity') return 'text-yellow border-yellow/40 bg-yellow/10'
  return 'text-muted border-border bg-raised'
}

export function ratingColor(band: string): string {
  if (band === 'Excellent')       return 'text-green'
  if (band === 'Meets standard')  return 'text-blue'
  if (band === 'Needs coaching')  return 'text-yellow'
  return 'text-red'
}

/** Parse criteria_detail string into structured lines */
export function parseCriteriaDetail(detail: string): CriterionLine[] {
  if (!detail) return []
  return detail.split('\n').filter(Boolean).map(line => {
    // Format: "R1 MET - Label: "quote" | Why: ... | Try: ..."
    const idMatch     = line.match(/^([A-Z]{1,4}\d+|VM\d+|GK\d+)\s+(MET|NOT_MET|NA|MISSING)/i)
    const quoteMatch  = line.match(/:\s*"([^"]*)"/)
    const whyMatch    = line.match(/\|\s*Why:\s*([^|]*)/)
    const tryMatch    = line.match(/\|\s*Try:\s*(.*)$/)
    const labelMatch  = line.match(/^\S+\s+\S+\s+-\s+([^:]+):/)

    return {
      id:     idMatch?.[1]  || '',
      result: (idMatch?.[2]?.toUpperCase() || 'MISSING') as CriterionLine['result'],
      label:  labelMatch?.[1]?.trim() || '',
      quote:  quoteMatch?.[1] || '',
      why:    whyMatch?.[1]?.trim() || '',
      try:    tryMatch?.[1]?.trim() || '',
    }
  })
}

/** True if the review was generated within the last 48 hours (dispute window) */
export function withinDisputeWindow(callDate: string): boolean {
  try {
    return differenceInHours(new Date(), parseISO(callDate)) < 48
  } catch { return false }
}
