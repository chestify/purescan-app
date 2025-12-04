'use client';

import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Props = {
  score: number;
  label: 'Green' | 'Yellow' | 'Red';
};

const labelConfig = {
  Green: {
    icon: ShieldCheck,
    className: 'text-chart-2',
    badgeClass: 'bg-chart-2/10 text-chart-2 border-chart-2/20 hover:bg-chart-2/20',
  },
  Yellow: {
    icon: ShieldAlert,
    className: 'text-chart-4',
    badgeClass: 'bg-chart-4/10 text-chart-4 border-chart-4/20 hover:bg-chart-4/20',
  },
  Red: {
    icon: ShieldX,
    className: 'text-destructive',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
  },
};

export function SafetyScoreDisplay({ score, label }: Props) {
  const { icon: Icon, className, badgeClass } = labelConfig[label];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={cn("relative h-40 w-40 rounded-full flex items-center justify-center bg-muted")}>
          <div className="absolute opacity-20">
              <Icon className={cn("h-32 w-32", className)} />
          </div>
          <span className={cn("text-5xl font-bold", className)}>{score}</span>
      </div>
      <Badge 
        className={cn("text-lg px-4 py-1", badgeClass)}
      >
        {label}
      </Badge>
    </div>
  );
}
