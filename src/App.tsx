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
  ShieldCheck,
  Gauge,
  Info,
} from 'lucide-react';
import { useDrowsinessDetection } from '@/hooks/useDrowsinessDetection';
import { StatusBadge } from '@/components/StatusBadge';
import { SessionStatsPanel } from '@/components/SessionStats';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AlertOverlay } from '@/components/AlertOverlay';
import { ReportsDashboard } from '@/components/ReportsDashboard';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showReports, setShowReports] = useState(false);

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
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg shadow-sky-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Guardian Vision</h1>
              <p className="text-xs text-slate-500">Real-Time Driver Drowsiness Detection</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReports(true)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
            >
              View Reports
            </button>
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
            >
              <Info className="h-4 w-4" />
              How it works
            </button>
          </div>
        </div>
      </header>

      {showReports && (
        <ReportsDashboard onClose={() => setShowReports(false)} />
      )}

      {showInfo && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 animate-fade-in">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm leading-relaxed text-slate-600">
              Guardian Vision uses your webcam and on-device face landmark detection to monitor your
              eyes and mouth in real time. It computes the Eye Aspect Ratio (EAR) and Mouth Aspect
              Ratio (MAR) every frame. If your eyes stay closed beyond the frame threshold, it
              triggers an audio alarm and voice warning. Extended closure escalates to a severe
              alert. All alert events are logged to a database for later review. Nothing is uploaded
              — all processing happens in your browser.
            </p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video feed column */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/50">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/90">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <Camera className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">
                      Press Start to enable your webcam and begin monitoring
                    </p>
                  </div>
                )}

                {isInitializing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90">
                    <div
                      className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-sky-500"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    <p className="text-sm text-slate-500">Loading detection model…</p>
                  </div>
                )}

                {/* Alert banner */}
                {isRunning && <AlertOverlay state={state} />}

                {/* Status pill */}
                {isRunning && (
                  <div className="absolute bottom-4 left-4 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 backdrop-blur shadow-sm">
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  <Square className="h-5 w-5" />
                  Stop Monitoring
                </button>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
                      state.status === 'drowsy' ? 'bg-red-500' : 'bg-gradient-to-r from-sky-500 to-cyan-400'
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
      </main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
        Guardian Vision runs entirely in your browser. No video leaves your device.
      </footer>
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
    red: 'text-red-500',
    emerald: 'text-emerald-500',
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
