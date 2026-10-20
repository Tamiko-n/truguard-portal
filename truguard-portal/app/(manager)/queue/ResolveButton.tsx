'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  queueId: string
}

export default function ResolveButton({ queueId }: Props) {
  const [open, setOpen]    = useState(false)
  const [note, setNote]    = useState('')
  const [busy, setBusy]    = useState(false)
  const [done, setDone]    = useState(false)
  const [error, setError]  = useState('')
  const router = useRouter()

  if (done) {
    return <span className="text-xs text-green font-medium">Resolved ✓</span>
  }

  const handleResolve = async () => {
    setBusy(true)
    setError('')
    const res = await fetch(`/api/queue/${queueId}/resolve`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ note }),
    })
    setBusy(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Failed to resolve')
      return
    }
    setDone(true)
    router.refresh()
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn-secondary text-xs py-1 px-3"
        >
          Resolve
        </button>
      ) : (
        <div className="space-y-2 min-w-[240px]">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Optional resolution note…"
            className="input text-xs resize-none"
          />
          {error && <p className="text-red text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleResolve}
              disabled={busy}
              className="btn-primary text-xs py-1 px-3 disabled:opacity-50"
            >
              {busy ? 'Resolving…' : 'Confirm'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="btn-secondary text-xs py-1 px-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
