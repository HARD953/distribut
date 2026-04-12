// components/dashboard/Segmented.tsx
import React from 'react';

interface SegmentedProps {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}

export const Segmented: React.FC<SegmentedProps> = ({ value, onChange, items }) => {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            value === item.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};