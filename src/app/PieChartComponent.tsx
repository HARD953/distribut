// components/charts/PieChartComponent.tsx
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ["#2563eb", "#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

interface PieChartComponentProps {
  data: any[];
  dataKey: string;
  nameKey: string;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({ data, dataKey, nameKey }) => {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500">Aucune donnée</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={110} dataKey={dataKey} nameKey={nameKey} label>
          {data.map((entry, index) => (
            <Cell key={entry[nameKey]} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};