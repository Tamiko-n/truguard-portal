'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

interface Props {
  assignmentId: string
}

type Fields = { teach_back_text: string }

export default function TeachBackForm({ assignmentId }: Props) {
  const [done, setDone]   = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Fields>()

  if (done) {
    return (
      <div className="bg-green/10 border border-green/30 rounded-lg p-4 text-sm text-green">
        ✓ Teach-back submitted! Your manager will review it.
      </div>
    )
  }

  const onSubmit = async (data: Fields) => {
    setError('')
    const res = await fetch('/api/training', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ assignment_id: assignmentId, teach_back_text: data.teach_back_text }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Submission failed')
      return
    }
    setDone(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="label mb-1 block">Your Teach-Back</label>
        <textarea
          {...register('teach_back_text', { required: true, minLength: 30 })}
          rows={5}
          placeholder="In your own words, explain what you learned from this lesson and how you'll apply it on your next call…"
          className="input resize-none"
        />
      </div>
      {error && <p className="text-red text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting…' : 'Submit teach-back'}
      </button>
    </form>
  )
}
