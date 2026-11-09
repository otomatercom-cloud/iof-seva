"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bucketColors } from "@/components/common/badges";
import type { StatusBucket } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GREEN = "#138a50", SAFFRON = "#f39a32";
const SERIES = ["#138a50", "#f39a32", "#2563eb", "#6d4fd6", "#0e9f9f", "#94a3b8", "#c2410c"];
const axis = { fontSize: 12, fill: "#64748b" };
const tip = { contentStyle: { borderRadius: 10, border: "1px solid #e5eae7", boxShadow: "0 8px 30px rgba(7,91,56,.12)", fontSize: 12 } };

export function ChartCard({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <CardBody className="pt-3">{children}</CardBody>
    </Card>
  );
}

export function Empty({ h = 220 }: { h?: number }) {
  return <div style={{ height: h }} className="flex items-center justify-center text-sm text-muted">No data for this view yet.</div>;
}

export function MonthlyChart({ data }: { data: { month: string; registered: number; resolved: number }[] }) {
  return (
    <div className="h-[230px]" role="img" aria-label="Monthly case registrations and resolutions">
      <ResponsiveContainer>
        <BarChart data={data} barGap={2} margin={{ left: -18, right: 4, top: 6 }}>
          <CartesianGrid vertical={false} stroke="#eef2ef" />
          <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tip} cursor={{ fill: "#f0faf3" }} />
          <Bar dataKey="registered" name="Registered" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="resolved" name="Resolved" fill={SAFFRON} radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProvinceBars({ data }: { data: { name: string; count: number }[] }) {
  if (!data.length) return <Empty />;
  return (
    <div style={{ height: Math.max(200, data.length * 34) }} role="img" aria-label="Cases by province">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ ...axis, fill: "#172b24" }} axisLine={false} tickLine={false} width={92} />
          <Tooltip {...tip} cursor={{ fill: "#f0faf3" }} />
          <Bar dataKey="count" name="Cases" fill={GREEN} radius={[0, 4, 4, 0]} barSize={16} label={{ position: "right", fontSize: 12, fill: "#64748b" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data, colors, stacked }: { data: { name: string; value: number; color?: string }[]; colors?: string[]; stacked?: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <Empty />;
  return (
    <div className={cn("flex flex-col items-center gap-4", !stacked && "sm:flex-row")}>
      <div className="relative h-[176px] w-[176px] shrink-0" role="img" aria-label="Distribution chart">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={2} stroke="none">
              {data.map((d, i) => <Cell key={d.name} fill={d.color ?? (colors ?? SERIES)[i % SERIES.length]} />)}
            </Pie>
            <Tooltip {...tip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-2xl font-bold tabular">{total}</span><span className="text-[11px] text-muted">cases</span></div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 self-stretch text-[13px]">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: d.color ?? (colors ?? SERIES)[i % SERIES.length] }} />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="tabular font-medium">{d.value}</span>
            <span className="w-9 text-right text-xs text-muted tabular">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const statusDonutData = (rows: { label: string; bucket: StatusBucket; value: number }[]) =>
  rows.map((r) => ({ name: r.label, value: r.value, color: bucketColors[r.bucket] }));

export function TrendChart({ data }: { data: { month: string; resolved: number; avgDays: number | null }[] }) {
  return (
    <div className="h-[230px]" role="img" aria-label="Resolution trend">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -18, right: 8, top: 6 }}>
          <CartesianGrid vertical={false} stroke="#eef2ef" />
          <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tip} />
          <Line yAxisId="l" type="monotone" dataKey="resolved" name="Resolved cases" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3 }} />
          <Line yAxisId="r" type="monotone" dataKey="avgDays" name="Avg days to resolve" stroke={SAFFRON} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <div className="-mt-1 flex justify-center gap-5 text-xs text-muted"><span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-brand" />Resolved</span><span className="flex items-center gap-1.5"><i className="h-0.5 w-4 border-t-2 border-dashed border-saffron" />Avg days (right axis)</span></div>
    </div>
  );
}

export function AreaTrend({ data }: { data: { month: string; registered: number }[] }) {
  return (
    <div className="h-[230px]">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -18, right: 4, top: 6 }}>
          <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GREEN} stopOpacity={0.25} /><stop offset="100%" stopColor={GREEN} stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#eef2ef" />
          <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tip} />
          <Area type="monotone" dataKey="registered" name="Registered" stroke={GREEN} strokeWidth={2.5} fill="url(#g)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
