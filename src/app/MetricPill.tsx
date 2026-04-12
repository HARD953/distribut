// components/dashboard/MetricPill.tsx
import React from 'react';

interface MetricPillProps {
  label: string;
  value: string;
}

export const MetricPill: React.FC<MetricPillProps> = ({ label, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
};