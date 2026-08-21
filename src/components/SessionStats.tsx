import { Clock, EyeOff, AlertOctagon, Moon, Activity } from 'lucide-react';
import type { SessionStats } from '@/hooks/useDrowsinessDetection';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionStatsPanel({ stats }: { stats: SessionStats }) {
  const elapsed = stats.startTime ? Date.now() - stats.startTime : 0;

  const items = [
    { icon: Clock, label: 'Session Time', value: formatDuration(elapsed), color: 'text-sky-600' },
    { icon: EyeOff, label: 'Drowsy Events', value: String(stats.drowsyCount), color: 'text-amber-500' },
    { icon: AlertOctagon, label: 'Severe Alerts', value: String(stats.severeCount), color: 'text-red-500' },
    { icon: Moon, label: 'Yawn Warnings', value: String(stats.yawnCount), color: 'text-violet-500' },
    { icon: AlertOctagon, label: 'Obscured', value: String(stats.obscuredCount), color: 'text-orange-500' },
    { icon: EyeOff, label: 'Distracted', value: String(stats.distractedCount), color: 'text-indigo-500' },
    { icon: Activity, label: 'Frames', value: stats.totalFrames.toLocaleString(), color: 'text-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3"
        >
          <item.icon className={`h-4 w-4 ${item.color}`} />
          <p className="mt-2 text-xl font-bold tabular-nums text-slate-800">{item.value}</p>
          <p className="text-xs text-slate-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
