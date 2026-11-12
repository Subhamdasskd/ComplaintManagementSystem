"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { stroke: "#94a3b8", fontSize: 11 };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-xl shadow-slate-900/10 backdrop-blur">
      {label !== undefined ? <p className="mb-1 text-[11px] font-semibold text-slate-500">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-xs text-slate-700">
          <span className="size-1.5 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize">{entry.name}</span>
          <span className="ml-auto font-semibold text-slate-900">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export type VolumePoint = { day: string; raised: number; closed: number };

export function VolumeChart({ data }: { data: VolumePoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="raisedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="closedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS} interval={Math.max(0, Math.floor(data.length / 7))} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} width={40} allowDecimals={false} domain={[0, "dataMax + 2"]} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="raised" name="Raised" stroke="#6366f1" strokeWidth={2.2} fill="url(#raisedFill)" />
          <Area type="monotone" dataKey="closed" name="Closed" stroke="#06b6d4" strokeWidth={2.2} fill="url(#closedFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export type SlicePoint = { name: string; value: number; color: string };

export function StatusDonut({ data, total }: { data: SlicePoint[]; total: number }) {
  return (
    <div className="relative h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-semibold text-slate-900">{total}</p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">complaints</p>
      </div>
    </div>
  );
}

export type BarPoint = { name: string; value: number };

export function CategoryChart({ data }: { data: BarPoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 6, bottom: 0 }} barSize={12}>
          <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ ...AXIS, fontSize: 10 }} width={92} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
          <Bar dataKey="value" name="Complaints" radius={[0, 6, 6, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={["#6366f1", "#8b5cf6", "#06b6d4", "#38bdf8", "#f59e0b", "#10b981", "#94a3b8"][index % 7]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ResolutionChart({ data }: { data: { name: string; hours: number }[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -20, bottom: 0 }} barSize={34}>
          <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} width={40} unit="h" />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
          <Bar dataKey="hours" name="Avg hours" radius={[8, 8, 0, 0]} fill="#6366f1">
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={["#10b981", "#38bdf8", "#f59e0b", "#f43f5e"][index % 4]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
