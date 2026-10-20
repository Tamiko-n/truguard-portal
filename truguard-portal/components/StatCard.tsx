interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: string  // Tailwind text color class
}

export default function StatCard({ label, value, sub, accent = 'text-primary' }: StatCardProps) {
  return (
    <div className="card-sm flex flex-col gap-1">
      <p className="label">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  )
}
