// components/charts/BarChartComponent.tsx
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface BarChartComponentProps {
  data: any[];
  bars: { dataKey: string; fill: string }[];
  xAxisKey: string;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ data, bars, xAxisKey }) => {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500">Aucune donnée</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xAxisKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        {bars.map((bar, index) => (
          <Bar key={bar.dataKey} dataKey={bar.dataKey} fill={bar.fill} radius={[8, 8, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};