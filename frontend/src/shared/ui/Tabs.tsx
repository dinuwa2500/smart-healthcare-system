'use client';
import { useState } from 'react';
import { cn } from '../lib/cn';

interface Tab { label: string; value: string; }

interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  children?: (activeTab: string) => React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, defaultValue, onChange, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value ?? '');

  const handleChange = (value: string) => {
    setActive(value);
    onChange?.(value);
  };

  return (
    <div className={className}>
      <div className="inline-flex flex-wrap gap-2 rounded-[20px] border border-white/70 bg-white/90 p-2 shadow-sm backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleChange(tab.value)}
            className={cn(
              'rounded-2xl px-4 py-2 text-sm font-medium transition-all',
              active === tab.value
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-300/40'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children && <div className="mt-4">{children(active)}</div>}
    </div>
  );
}
