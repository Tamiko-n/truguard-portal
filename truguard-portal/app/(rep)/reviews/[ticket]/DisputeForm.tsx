'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  ticketNo:    string
  findingId:   string
  label:       string
  withinWindow: boolean
}

type Fields = { reason: string }

export default function DisputeForm({ ticketNo, findingId, label, withinWindow }: Props) {
  const [open, setOpen]       = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Fields>()

  if (!withinWindow) {
    return (
      <p className="text-xs text-muted mt-2">
        Dispute window closed (48 h after call date).
      </p>
    )
  }

  if (done) {
    return (
      <p className="text-xs text-green mt-2">
        ✓ Dispute submitted — your manager will review it.
      </p>
    )
  }

  const onSubmit = async (data: Fields) => {
    setError('')
    const res = await fetch('/api/disputes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ticket_no: ticketNo, finding_id: findingId, reason: data.reason }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Submission failed')
      return
    }
    setDone(true)
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-yellow hover:underline"
        >
          Dispute this finding
        </button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 mt-2 border border-border rounded-lg p-3 bg-raised">
          <p className="text-xs text-muted">Disputing: <span className="text-primary">{label}</span></p>
          <textarea
            {...register('reason', { required: true, minLength: 20 })}
            rows={3}
            placeholder="Explain why this finding is incorrect (min 20 chars)…"
            className="input text-xs resize-none"
          />
          {error && <p className="text-red text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary text-xs py-1 px-3 disabled:opacity-50">
              {isSubmitting ? 'Submitting…' : 'Submit dispute'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-xs py-1 px-3">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
