export interface Evaluation {
  ticket_no: string
  call_id: string
  call_date: string
  agent_name: string
  agent_email: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  call_duration_sec: string
  duration_sec: string        // alias used in some sheet versions
  call_type: string
  classifier_confidence: string
  rubric: string
  status: string
  review_reason: string
  total_score: string
  rating_band: string
  criteria_met: string
  dims_scored: string
  score_rapport: string
  score_discovery: string
  score_value: string
  score_pricing: string
  score_objections: string
  score_next_steps: string
  // Area score aliases
  opening_score: string
  discovery_score: string
  value_prop_score: string
  objection_score: string
  close_score: string
  compliance_score: string
  professionalism_score: string
  voicemail_score: string
  gatekeeper_score: string
  missed_criteria: string
  criteria_detail: string
  meeting_booked: string
  flag_type: string
  human_flag: string    // human-assigned flag label
  ai_flag: string       // AI-detected flag label
  has_red_flags: string
  red_flag_detail: string
  escalation_reason: string
  red_flag_snippet: string
  red_flag_confidence: string
  red_flag_context: string
  coaching_summary: string
  coaching_points: string
  ai_notes: string
  ai_scoring_notes: string
  client_risk_score: string
  guard_risk_score: string
  pipeline_stage: string
  include_in_average: string
  recording_url: string
  model: string
  prompt_version: string
  tokens_in: string
  tokens_out: string
  est_cost_usd: string
  // Added columns (add to sheet if not present)
  qa_state: string    // approved | review | disputed | revised
  show_score: string  // TRUE | FALSE
  [key: string]: string  // allow extra columns without compile error
}

export interface QueueItem {
  queue_id: string
  ticket_no: string
  evaluation_ticket: string
  priority: 'critical' | 'high' | 'normal'
  assigned_manager_email: string
  agent_email: string
  reason: string
  agent_name: string
  call_type: string
  flag_type: string
  created_at: string
  resolved_at: string
  resolution_note: string
}

export interface Dispute {
  dispute_id: string
  ticket_no: string
  agent_email: string
  finding_id: string
  reason: string
  submitted_at: string
  supervisor_email: string
  decision: string
  adjusted_score: string
  resolved_at: string
  audit_note: string
}

export interface Lesson {
  lesson_id: string
  module_code: string
  title: string
  objective: string
  lesson_body: string
  example_script: string
  key_phrases: string
  version: string
  length_min: string
  video_url: string
  call_types: string
  competency_ids: string
  teach_back_question: string
  owner: string
  status: string  // draft | in_review | verified | retired
  date_verified: string
}

export interface LessonAssignment {
  assignment_id: string
  agent_email: string
  lesson_id: string
  evaluation_ticket: string
  trigger_type: string
  assigned_at: string
  due_date: string
  due_by: string
  viewed_at: string
  completed_at: string
  teach_back_text: string
  teach_back_submitted_at: string
  verified_at: string
  verified_by: string
  training_state: string  // unassigned | assigned | viewed | completed | teach_back | verified
}

export interface User {
  email: string
  name: string
  role: 'rep' | 'manager' | 'admin'
  manager_email: string
  password_hash: string
  active: string
}

// Parsed criteria line from criteria_detail field
export interface CriterionLine {
  id: string
  result: 'MET' | 'NOT_MET' | 'NA' | 'MISSING'
  label: string
  quote: string
  why: string
  try: string
}
