// components/charts/AreaChartComponent.tsx
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AreaChartComponentProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  stroke: string;
  fill: string;
}

export const AreaChartComponent: React.FC<AreaChartComponentProps> = ({ 
  data, dataKey, xAxisKey, stroke, fill 
}) => {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500">Aucune donnée</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xAxisKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Area type="monotone" dataKey={dataKey} stroke={stroke} fill={fill} strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  );
};