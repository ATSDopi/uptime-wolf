interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

export function StatCard({ label, value, subtext, color = "text-slate-100" }: Props) {
  return (
    <div className="stat-card">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}
