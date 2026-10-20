import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAssignmentsByAgent, getAllLessons } from '@/lib/sheets'
import TeachBackForm from './TeachBackForm'
import { fmtDate } from '@/lib/utils'
import type { LessonAssignment, Lesson } from '@/lib/types'

export const dynamic = 'force-dynamic'

const stateLabel: Record<string, { label: string; color: string }> = {
  assigned:   { label: 'Assigned',    color: 'text-yellow' },
  teach_back: { label: 'Teach-Back ✓', color: 'text-green' },
  completed:  { label: 'Completed',   color: 'text-green' },
  overdue:    { label: 'Overdue',     color: 'text-red' },
}

export default async function TrainingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { email } = session.user as { email: string }
  const [assignments, lessons] = await Promise.all([
    getAssignmentsByAgent(email),
    getAllLessons(),
  ])

  const lessonMap = Object.fromEntries(lessons.map((l: Lesson) => [l.lesson_id, l]))

  const pending   = assignments.filter((a: LessonAssignment) =>
    a.training_state === 'assigned' || a.training_state === 'overdue'
  )
  const completed = assignments.filter((a: LessonAssignment) =>
    a.training_state === 'teach_back' || a.training_state === 'completed'
  )

  const current = pending[0]
  const lesson  = current ? lessonMap[current.lesson_id] : null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Training</h1>
        <p className="text-sm text-muted mt-1">
          {pending.length} assignment{pending.length !== 1 ? 's' : ''} pending
        </p>
      </div>

      {/* Current lesson */}
      {current && lesson ? (
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label mb-0.5">Current Assignment</p>
              <h2 className="text-base font-bold text-primary">{lesson.title}</h2>
              <p className="text-xs text-muted mt-0.5">
                Lesson {lesson.lesson_id} · Module {lesson.module_code} · Due {fmtDate(current.due_date)}
              </p>
            </div>
            <span className="bg-yellow/20 text-yellow text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
              {current.training_state === 'overdue' ? 'Overdue' : 'Due'}
            </span>
          </div>

          {lesson.objective && (
            <div>
              <p className="label mb-1">Objective</p>
              <p className="text-sm text-dim leading-relaxed">{lesson.objective}</p>
            </div>
          )}

          {lesson.lesson_body && (
            <div>
              <p className="label mb-1">Lesson</p>
              <div className="bg-raised border border-border rounded-lg p-4 text-sm text-dim leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {lesson.lesson_body}
              </div>
            </div>
          )}

          {lesson.example_script && (
            <div>
              <p className="label mb-1">Example Script</p>
              <div className="bg-raised border border-yellow/20 rounded-lg p-4 text-sm text-dim leading-relaxed whitespace-pre-wrap">
                {lesson.example_script}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-primary mb-3">Teach-Back</p>
            <TeachBackForm assignmentId={current.assignment_id} />
          </div>
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-muted text-sm">No pending assignments — great work! 🎉</p>
        </div>
      )}

      {/* History */}
      {completed.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-primary mb-3">Completed Assignments</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Lesson</th>
                <th className="table-th">Assigned</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((a: LessonAssignment) => {
                const l   = lessonMap[a.lesson_id]
                const st  = stateLabel[a.training_state] || { label: a.training_state, color: 'text-muted' }
                return (
                  <tr key={a.assignment_id} className="hover:bg-raised/40 transition-colors">
                    <td className="table-td">
                      <p className="text-sm text-primary">{l?.title || a.lesson_id}</p>
                      <p className="text-xs text-muted">{l?.module_code}</p>
                    </td>
                    <td className="table-td text-dim text-sm">{fmtDate(a.assigned_at)}</td>
                    <td className={`table-td text-sm font-medium ${st.color}`}>{st.label}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
