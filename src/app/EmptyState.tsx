// components/dashboard/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  title?: string;
  text?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "Aucune donnée", 
  text = "Ajustez les filtres pour afficher les graphiques." 
}) => {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
      <div>
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{text}</div>
      </div>
    </div>
  );
};