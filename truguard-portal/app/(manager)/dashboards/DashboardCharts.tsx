'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface BarData  { name: string; value: number }
interface PieData  { name: string; value: number; color: string }

interface Props {
  callsByType:   BarData[]
  agentScores:   BarData[]
  flagDist:      PieData[]
}

const TICK_STYLE = { fontSize: 11, fill: '#9094A8' }
const GRID_COLOR = '#2A2A3C'
const YELLOW     = '#F5C518'
const BLUE       = '#3B82F6'

export default function DashboardCharts({ callsByType, agentScores, flagDist }: Props) {
  return (
    <div className="space-y-5">
      {/* Calls by type */}
      {callsByType.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-primary mb-4">Calls by Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={callsByType} margin={{ top: 0, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid #2A2A3C', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: '#1A1A24' }}
              />
              <Bar dataKey="value" fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Agent avg scores */}
      {agentScores.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-primary mb-4">Agent Avg Score (last 30 calls)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agentScores} margin={{ top: 0, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 30]} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid #2A2A3C', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: '#1A1A24' }}
              />
              <Bar dataKey="value" fill={YELLOW} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Flag distribution */}
      {flagDist.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-primary mb-4">Flag Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={flagDist}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {flagDist.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid #2A2A3C', borderRadius: 8, fontSize: 12 }}
              />
              <Legend
                formatter={(val) => <span style={{ color: '#9094A8', fontSize: 12 }}>{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
