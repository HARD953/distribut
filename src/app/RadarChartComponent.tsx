// components/charts/RadarChartComponent.tsx
import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

interface RadarChartComponentProps {
  data: any[];
  dataKey: string;
  angleKey: string;
}

export const RadarChartComponent: React.FC<RadarChartComponentProps> = ({ data, dataKey, angleKey }) => {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500">Aucune donnée</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey={angleKey} />
        <PolarRadiusAxis domain={[0, 100]} />
        <Radar dataKey={dataKey} stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
};