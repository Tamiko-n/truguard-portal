'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

type Fields = { email: string; password: string }

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Fields>()

  const onSubmit = async (data: Fields) => {
    setError('')
    const res = await signIn('credentials', {
      email:    data.email,
      password: data.password,
      redirect: false,
    })
    if (res?.error) {
      setError('Invalid email or password')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-yellow flex items-center justify-center">
            <span className="text-bg font-bold text-2xl">V</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-primary">Coach Vance</h1>
            <p className="text-sm text-muted mt-0.5">TruGuard QA Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-primary">Sign in</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="label mb-1 block">Email</label>
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="you@truguardsecurity.com"
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label mb-1 block">Password</label>
              <input
                {...register('password', { required: true })}
                type="password"
                placeholder="••••••••"
                className="input"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-red text-sm bg-red/10 border border-red/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-1 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted">
          Contact your manager to reset your password.
        </p>
      </div>
    </div>
  )
}
