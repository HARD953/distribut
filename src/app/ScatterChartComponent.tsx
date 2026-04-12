// components/charts/ScatterChartComponent.tsx
import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ScatterChartComponentProps {
  data: any[];
  xKey: string;
  yKey: string;
  fill?: string;
}

export const ScatterChartComponent: React.FC<ScatterChartComponentProps> = ({ 
  data, xKey, yKey, fill = "#8b5cf6" 
}) => {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500">Aucune donnée</div>;
  }

  const chartData = data.map(item => ({ x: item[xKey], y: item[yKey] }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name={xKey} domain={[40, 100]} />
        <YAxis type="number" dataKey="y" name={yKey} domain={[30, 100]} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={chartData} fill={fill} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};