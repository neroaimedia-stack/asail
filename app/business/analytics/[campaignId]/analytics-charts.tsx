"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ViewsPoint = {
  date: string;
  views: number;
};

export type SpendPoint = {
  amount: number;
  week: string;
};

export type PlatformPoint = {
  name: string;
  value: number;
};

const chartColor = "#d97706";
const gridColor = "#fde68a";
const pieColors = ["#d97706", "#f59e0b", "#fbbf24"];

export function ViewsOverTimeChart({ data }: { data: ViewsPoint[] }) {
  if (!data.length) {
    return (
      <EmptyChartState message="View history will appear once videos start accumulating views." />
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 8 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            dataKey="views"
            dot={false}
            stroke={chartColor}
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpendTrajectoryChart({ data }: { data: SpendPoint[] }) {
  if (!data.length) {
    return <EmptyChartState message="Spend will appear once videos are accepted." />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 8 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="amount" fill={chartColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlatformBreakdownChart({ data }: { data: PlatformPoint[] }) {
  const visibleData = data.filter((item) => item.value > 0);

  if (!visibleData.length) {
    return <EmptyChartState message="Platform view share will appear once views are recorded." />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Tooltip />
          <Pie
            cx="50%"
            cy="50%"
            data={visibleData}
            dataKey="value"
            innerRadius={62}
            nameKey="name"
            outerRadius={96}
            paddingAngle={3}
          >
            {visibleData.map((entry, index) => (
              <Cell
                fill={pieColors[index % pieColors.length]}
                key={entry.name}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-amber-900/75">
        {visibleData.map((entry, index) => (
          <span className="inline-flex items-center gap-2" key={entry.name}>
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: pieColors[index % pieColors.length] }}
            />
            {entry.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-amber-200 bg-amber-50 px-6 text-center text-sm font-medium text-amber-900/70">
      {message}
    </div>
  );
}
