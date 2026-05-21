"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type UserGrowthPoint = {
  business: number;
  creator: number;
  date: string;
};

export type VideoSubmissionsPoint = {
  date: string;
  submissions: number;
};

export function AdminCharts({
  userGrowth,
  videoSubmissions,
}: {
  userGrowth: UserGrowthPoint[];
  videoSubmissions: VideoSubmissionsPoint[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold">User growth</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={userGrowth}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line dataKey="business" stroke="#dc2626" strokeWidth={2} />
              <Line dataKey="creator" stroke="#0f172a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold">Video submissions</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={videoSubmissions}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="submissions" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
