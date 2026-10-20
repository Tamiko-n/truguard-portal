import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllLessons } from '@/lib/sheets'
import type { Lesson } from '@/lib/types'

export const dynamic = 'force-dynamic'

// 26 modules A–Z grouped by area
const MODULE_AREAS: Record<string, string[]> = {
  'Prospecting & Opening':      ['A', 'B', 'C', 'D'],
  'Discovery & Qualification':  ['E', 'F', 'G', 'H'],
  'Value Proposition':          ['I', 'J', 'K'],
  'Objection Handling':         ['L', 'M', 'N', 'O'],
  'Closing Techniques':         ['P', 'Q', 'R'],
  'Compliance & Ethics':        ['S', 'T', 'U'],
  'Professionalism & Mindset':  ['V', 'W', 'X', 'Y', 'Z'],
}

function areaForModule(code: string): string {
  const letter = code.toUpperCase().replace(/[^A-Z]/, '').charAt(0)
  for (const [area, letters] of Object.entries(MODULE_AREAS)) {
    if (letters.includes(letter)) return area
  }
  return 'Other'
}

export default async function LibraryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const lessons: Lesson[] = await getAllLessons()

  // Group by area → module
  const grouped: Record<string, Lesson[]> = {}
  for (const lesson of lessons) {
    const area = areaForModule(lesson.module_code || '')
    if (!grouped[area]) grouped[area] = []
    grouped[area].push(lesson)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Lesson Library</h1>
        <p className="text-sm text-muted mt-1">{lessons.length} Coach Vance lessons across 7 skill areas</p>
      </div>

      {Object.entries(grouped).map(([area, areaLessons]) => (
        <div key={area} className="card">
          <h2 className="text-sm font-bold text-yellow mb-3 uppercase tracking-wide">{area}</h2>
          <div className="space-y-3">
            {areaLessons.map(lesson => (
              <details key={lesson.lesson_id} className="group">
                <summary className="flex items-center gap-3 cursor-pointer list-none hover:bg-raised rounded-lg px-3 py-2 -mx-3 transition-colors">
                  <span className="w-7 h-7 rounded-md bg-yellow/10 text-yellow text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {lesson.module_code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{lesson.title}</p>
                    {lesson.objective && (
                      <p className="text-xs text-muted truncate">{lesson.objective}</p>
                    )}
                  </div>
                  <span className="text-muted text-xs group-open:hidden">▶</span>
                  <span className="text-muted text-xs hidden group-open:inline">▼</span>
                </summary>

                <div className="mt-2 ml-10 space-y-3 pb-2">
                  {lesson.objective && (
                    <p className="text-xs text-dim italic">{lesson.objective}</p>
                  )}
                  {lesson.lesson_body && (
                    <div className="bg-raised border border-border rounded-lg p-3 text-sm text-dim leading-relaxed whitespace-pre-wrap">
                      {lesson.lesson_body}
                    </div>
                  )}
                  {lesson.example_script && (
                    <div>
                      <p className="label mb-1">Example Script</p>
                      <div className="bg-raised border border-yellow/20 rounded-lg p-3 text-sm text-dim leading-relaxed whitespace-pre-wrap">
                        {lesson.example_script}
                      </div>
                    </div>
                  )}
                  {lesson.key_phrases && (
                    <div>
                      <p className="label mb-1">Key Phrases</p>
                      <p className="text-sm text-dim">{lesson.key_phrases}</p>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}

      {lessons.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-muted">Library is being built — check back soon.</p>
        </div>
      )}
    </div>
  )
}
