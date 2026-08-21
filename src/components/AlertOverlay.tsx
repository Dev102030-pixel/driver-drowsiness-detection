import { AlertTriangle } from 'lucide-react';
import type { DetectionState } from '@/hooks/useDrowsinessDetection';

export function AlertOverlay({ state }: { state: DetectionState }) {
  if (state.status === 'awake' || state.status === 'no-face') return null;

  const isSevere = state.closedFrames >= 40;
  const isYawn = state.status === 'yawning';
  const isObscured = state.status === 'obscured';
  const isDistracted = state.status === 'distracted';

  const config = isObscured
    ? { bg: 'bg-orange-500/90', text: 'FACE OBSCURED', sub: 'Please clear the camera view' }
    : isDistracted
      ? { bg: 'bg-indigo-500/90', text: 'DISTRACTED', sub: 'Keep your eyes on the road' }
      : isYawn
        ? { bg: 'bg-amber-500/90', text: 'YAWN WARNING', sub: 'Consider taking a break' }
        : isSevere
          ? { bg: 'bg-red-600/90', text: 'SEVERE DROWSINESS', sub: 'Pull over safely' }
          : { bg: 'bg-red-500/90', text: 'DROWSINESS ALERT', sub: 'Keep your eyes on the road' };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-4">
      <div
        className={`flex items-center gap-3 rounded-full ${config.bg} px-6 py-3 shadow-2xl`}
        style={{ animation: 'pulse-alert 1s ease-in-out infinite' }}
      >
        <AlertTriangle className="h-6 w-6 text-white" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-white">{config.text}</p>
          <p className="text-xs text-white/80">{config.sub}</p>
        </div>
      </div>
    </div>
  );
}
