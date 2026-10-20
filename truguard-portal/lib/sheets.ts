import { google } from 'googleapis'
import type { Evaluation, QueueItem, Dispute, Lesson, LessonAssignment, User } from './types'

// ─── Auth ────────────────────────────────────────────────────────────────────

const getAuth = () =>
    new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

const getSheets = () => google.sheets({ version: 'v4', auth: getAuth() })
const SHEET_ID = process.env.SHEET_ID!

// ─── Generic reader ──────────────────────────────────────────────────────────

async function readTab(tab: string): Promise<Record<string, string>[]> {
    const res = await getSheets().spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${tab}!A:ZZ`,
    })
    const [headers, ...rows] = res.data.values || []
    if (!headers?.length) return []
    return rows.map(row =>
        Object.fromEntries((headers as string[]).map((h, i) => [h, (row[i] as string) || '']))
    )
}

// ─── Generic appender ────────────────────────────────────────────────────────

async function appendRow(tab: string, values: string[]) {
    await getSheets().spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${tab}!A:A`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map status → qa_state for rows that predate the qa_state column */
function deriveQaState(row: Record<string, string>): string {
    if (row.qa_state) return row.qa_state
    if (row.status === 'scored') return 'approved'
    if (row.status === 'needs_review' || row.status === 'parse_failed') return 'review'
    return 'approved'
}

// ─── Evaluations ─────────────────────────────────────────────────────────────

export async function getEvaluationsByAgent(agentEmail: string): Promise<Evaluation[]> {
    const rows = await readTab('QA Records')
    return rows
        .map(r => ({ ...r, qa_state: deriveQaState(r) } as Evaluation))
        .filter(r => r.agent_email === agentEmail && r.qa_state === 'approved')
        .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
}

export async function getEvaluationByTicket(ticket: string): Promise<Evaluation | null> {
    const rows = await readTab('QA Records')
    const row = rows.find(r => r.ticket_no === ticket)
    if (!row) return null
    return { ...row, qa_state: deriveQaState(row) } as Evaluation
}

export async function getTeamEvaluations(teamEmails: string[]): Promise<Evaluation[]> {
    const rows = await readTab('QA Records')
    return rows
        .map(r => ({ ...r, qa_state: deriveQaState(r) } as Evaluation))
        .filter(r => teamEmails.includes(r.agent_email))
        .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
}

export async function getAllEvaluations(): Promise<Evaluation[]> {
    const rows = await readTab('QA Records')
    return rows.map(r => ({ ...r, qa_state: deriveQaState(r) } as Evaluation))
}

// ─── Review Queue ─────────────────────────────────────────────────────────────

const PRIORITY = { critical: 0, high: 1, normal: 2 } as Record<string, number>

export async function getReviewQueue(managerEmail: string): Promise<QueueItem[]> {
    const rows = await readTab('Review Queue')
    return (rows as unknown as QueueItem[])
        .filter(r => r.assigned_manager_email === managerEmail && !r.resolved_at)
        .sort((a, b) => (PRIORITY[a.priority] ?? 3) - (PRIORITY[b.priority] ?? 3))
        .slice(0, 15)
}

export async function resolveQueueItem(queueId: string, note: string, managerEmail: string) {
    const rows = await readTab('Review Queue')
    const headers = Object.keys(rows[0] || {})
    const idx = rows.findIndex(r => r.queue_id === queueId)
    if (idx === -1) throw new Error('Queue item not found')

    const resolvedAtCol = headers.indexOf('resolved_at') + 1
    const noteCol = headers.indexOf('resolution_note') + 1
    const rowNum = idx + 2

    await getSheets().spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: [
                { range: `Review Queue!${colLetter(resolvedAtCol)}${rowNum}`, values: [[new Date().toISOString()]] },
                { range: `Review Queue!${colLetter(noteCol)}${rowNum}`, values: [[note]] },
            ],
        },
    })
}

function colLetter(n: number): string {
    let s = ''
    while (n > 0) { s = String.fromCharCode(64 + (n % 26 || 26)) + s; n = Math.floor((n - 1) / 26) }
    return s
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export async function submitDispute(data: {
    ticket_no: string; agent_email: string; finding_id: string; reason: string
}) {
    await appendRow('Disputes', [
        crypto.randomUUID(),
        data.ticket_no,
        data.agent_email,
        data.finding_id,
        data.reason,
        new Date().toISOString(),
        '', '', '', '', '',
    ])

    const rows = await readTab('QA Records')
    const headers = Object.keys(rows[0] || {})
    const idx = rows.findIndex(r => r.ticket_no === data.ticket_no)
    if (idx !== -1) {
        const qaStateCol = headers.indexOf('qa_state') + 1
        if (qaStateCol > 0) {
            await getSheets().spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `QA Records!${colLetter(qaStateCol)}${idx + 2}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [['disputed']] },
            })
        }
    }
}

export async function getDisputesByAgent(agentEmail: string): Promise<Dispute[]> {
    const rows = await readTab('Disputes')
    return (rows as unknown as Dispute[]).filter(r => r.agent_email === agentEmail)
}

// ─── Coach Vance Lessons ─────────────────────────────────────────────────────

export async function getAllLessons(): Promise<Lesson[]> {
    const rows = await readTab('CV Lessons')
    return rows as unknown as Lesson[]
}

export async function getAssignmentsByAgent(agentEmail: string): Promise<LessonAssignment[]> {
    const rows = await readTab('Lesson Assignments')
    return (rows as unknown as LessonAssignment[])
        .filter(r => r.agent_email === agentEmail)
        .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())
}

export async function submitTeachBack(data: {
    assignment_id: string; agent_email: string; teach_back_text: string
}) {
    const rows = await readTab('Lesson Assignments')
    const headers = Object.keys(rows[0] || {})
    const idx = rows.findIndex(
        r => r.assignment_id === data.assignment_id && r.agent_email === data.agent_email
    )
    if (idx === -1) throw new Error('Assignment not found')

    const tbCol = headers.indexOf('teach_back_text') + 1
    const tbTimeCol = headers.indexOf('teach_back_submitted_at') + 1
    const stateCol = headers.indexOf('training_state') + 1
    const rowNum = idx + 2

    await getSheets().spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: [
                { range: `Lesson Assignments!${colLetter(tbCol)}${rowNum}`, values: [[data.teach_back_text]] },
                { range: `Lesson Assignments!${colLetter(tbTimeCol)}${rowNum}`, values: [[new Date().toISOString()]] },
                { range: `Lesson Assignments!${colLetter(stateCol)}${rowNum}`, values: [['teach_back']] },
            ],
        },
    })
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | null> {
    const rows = await readTab('Users')
    return (rows as unknown as User[]).find(u => u.email === email) || null
}

export async function getTeamEmails(managerEmail: string): Promise<string[]> {
    const rows = await readTab('Users')
    return (rows as unknown as User[])
        .filter(u => u.manager_email === managerEmail && u.active !== 'FALSE')
        .map(u => u.email)
}

export async function getAllUsers(): Promise<User[]> {
    const rows = await readTab('Users')
    return rows as unknown as User[]
}


