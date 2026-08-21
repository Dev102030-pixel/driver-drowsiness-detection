import { useRef, useState } from 'react';
import {
  Play,
  Square,
  Camera,
  Eye,
  EyeOff,
  Moon,
  AlertOctagon,
  Activity,
  Gauge,
  Info,
} from 'lucide-react';
import { useDrowsinessDetection } from '@/hooks/useDrowsinessDetection';
import { StatusBadge } from '@/components/StatusBadge';
import { SessionStatsPanel } from '@/components/SessionStats';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AlertOverlay } from '@/components/AlertOverlay';

export function DriverDashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  const {
    isRunning,
    isInitializing,
    error,
    settings,
    state,
    stats,
    start,
    stop,
    updateSettings,
  } = useDrowsinessDetection(videoRef, canvasRef);

  const earPercent = Math.round((1 - state.ear) * 100);
  const eyeOpenLabel = state.faceDetected
    ? state.ear >= settings.earThreshold
      ? 'Open'
      : 'Closed'
    : '—';

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live Monitor</h2>
          <p className="text-sm text-slate-500">Real-time driver fatigue and distraction tracking</p>
        </div>
        <button
          onClick={() => setShowInfo((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
        >
          <Info className="h-4 w-4" />
          How it works
        </button>
      </header>

      {showInfo && (
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 animate-fade-in">
          <p className="text-sm leading-relaxed text-slate-600 max-w-4xl">
            Guardian Vision uses your webcam and on-device face landmark detection to monitor your
            eyes, head pose, and mouth in real time. It computes metrics every frame. If your eyes stay closed beyond the frame threshold, or your head turns sideways, it
            triggers an audio alarm and voice warning. Nothing is uploaded — all processing happens in your browser.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-3">
          {/* Video feed column */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-inner">
              <div className="relative aspect-video w-full">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Idle / placeholder overlay */}
                {!isRunning && !isInitializing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/90 text-white">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                      <Camera className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      Press Start to enable your webcam and begin monitoring
                    </p>
                  </div>
                )}

                {isInitializing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90 text-white">
                    <div
                      className="h-10 w-10 rounded-full border-4 border-slate-700 border-t-sky-500"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    <p className="text-sm font-medium text-slate-300">Loading AI models…</p>
                  </div>
                )}

                {/* Alert banner */}
                {isRunning && <AlertOverlay state={state} />}

                {/* HUD Overlay rings for "futuristic" feel */}
                {isRunning && state.faceDetected && (
                   <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className={`h-48 w-48 rounded-full border-2 border-dashed opacity-30 transition-colors duration-500 ${state.status === 'awake' ? 'border-emerald-400' : 'border-red-500'}`} style={{ animation: 'spin 20s linear infinite' }} />
                      <div className={`absolute h-64 w-64 rounded-full border border-opacity-20 transition-colors duration-500 ${state.status === 'awake' ? 'border-emerald-400' : 'border-red-500'}`} />
                   </div>
                )}

                {/* Status pill */}
                {isRunning && (
                  <div className="absolute bottom-4 left-4 rounded-xl border border-slate-200/20 bg-black/60 px-4 py-2 backdrop-blur shadow-sm">
                    <StatusBadge status={state.status} />
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex gap-3">
              {!isRunning ? (
                <button
                  onClick={start}
                  disabled={isInitializing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-cyan-500 disabled:opacity-50"
                >
                  <Play className="h-5 w-5" />
                  {isInitializing ? 'Starting…' : 'Start Monitoring'}
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-500/20"
                >
                  <Square className="h-5 w-5" />
                  Stop Monitoring
                </button>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Live metrics */}
            {isRunning && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricTile
                  icon={state.ear >= settings.earThreshold ? Eye : EyeOff}
                  label="Eye State"
                  value={eyeOpenLabel}
                  color={state.ear >= settings.earThreshold ? 'emerald' : 'red'}
                />
                <MetricTile
                  icon={Gauge}
                  label="EAR"
                  value={state.faceDetected ? state.ear.toFixed(3) : '—'}
                  color="sky"
                />
                <MetricTile
                  icon={Moon}
                  label="MAR"
                  value={state.faceDetected ? state.mar.toFixed(3) : '—'}
                  color={state.mar > settings.marThreshold ? 'amber' : 'sky'}
                />
                <MetricTile
                  icon={AlertOctagon}
                  label="Closed Frames"
                  value={String(state.closedFrames)}
                  color={state.closedFrames >= settings.closedFrameLimit ? 'red' : 'slate'}
                />
              </div>
            )}

            {/* Session stats */}
            {isRunning && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Session Statistics
                </h2>
                <SessionStatsPanel stats={stats} />
              </div>
            )}
          </div>

          {/* Settings column */}
          <div className="space-y-6">
            <SettingsPanel
              settings={settings}
              onChange={updateSettings}
              disabled={isInitializing}
            />

            {/* EAR gauge */}
            {isRunning && state.faceDetected && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                    Eye Closure Level
                  </h3>
                </div>
                <div className="relative h-4 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      state.status === 'drowsy' || state.status === 'distracted' ? 'bg-red-500' : 'bg-gradient-to-r from-sky-500 to-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, earPercent))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Open</span>
                  <span>Closed</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  color: 'sky' | 'amber' | 'red' | 'emerald' | 'slate';
}) {
  const colorMap = {
    sky: 'text-sky-600',
    amber: 'text-amber-500',
    red: 'text-red-600',
    emerald: 'text-emerald-600',
    slate: 'text-slate-500',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3">
      <Icon className={`h-4 w-4 ${colorMap[color]}`} />
      <p className={`mt-2 text-xl font-bold tabular-nums ${colorMap[color]}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
