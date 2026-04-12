// components/dashboard/Panel.tsx
import React from 'react';

interface PanelProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ title, subtitle, right, children, className }) => {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className || ''}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
};