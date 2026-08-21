import { Shield, Eye, EyeOff, Moon, AlertTriangle } from 'lucide-react';
import type { DriverStatus } from '@/hooks/useDrowsinessDetection';

const config: Record<DriverStatus, { label: string; color: string; icon: typeof Shield }> = {
  awake: { label: 'Awake', color: 'text-emerald-400', icon: Eye },
  drowsy: { label: 'Drowsy', color: 'text-red-400', icon: EyeOff },
  yawning: { label: 'Yawning', color: 'text-amber-400', icon: Moon },
  'no-face': { label: 'No Face', color: 'text-slate-500', icon: AlertTriangle },
  obscured: { label: 'Obscured', color: 'text-orange-400', icon: AlertTriangle },
  distracted: { label: 'Distracted', color: 'text-indigo-400', icon: AlertTriangle },
};

export function StatusBadge({ status }: { status: DriverStatus }) {
  const { label, color, icon: Icon } = config[status];
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className={`text-lg font-semibold ${color}`}>{label}</span>
    </div>
  );
}

export function ShieldBadge() {
  return (
    <div className="flex items-center gap-2 text-slate-300">
      <Shield className="h-5 w-5 text-sky-400" />
      <span className="font-medium">Monitoring Active</span>
    </div>
  );
}
