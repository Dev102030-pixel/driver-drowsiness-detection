import { SlidersHorizontal, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import type { DetectionSettings } from '@/hooks/useDrowsinessDetection';

type Props = {
  settings: DetectionSettings;
  onChange: (patch: Partial<DetectionSettings>) => void;
  disabled: boolean;
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-600">{label}</label>
        <span className="text-sm font-semibold tabular-nums text-sky-600">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1.5 w-full accent-sky-500"
      />
    </div>
  );
}

export function SettingsPanel({ settings, onChange, disabled }: Props) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-5 ${disabled ? 'opacity-50' : ''}`}>
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-sky-500" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Detection Settings
        </h3>
      </div>

      <div className="space-y-4">
        <Slider
          label="Eye Closure Threshold (EAR)"
          value={settings.earThreshold}
          min={0.15}
          max={0.35}
          step={0.01}
          onChange={(v) => onChange({ earThreshold: v })}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="Drowsy Frame Limit"
          value={settings.closedFrameLimit}
          min={5}
          max={60}
          step={1}
          onChange={(v) => onChange({ closedFrameLimit: v })}
          format={(v) => `${v} frames`}
        />
        <Slider
          label="Severe Drowsy Limit"
          value={settings.severeFrameLimit}
          min={10}
          max={80}
          step={1}
          onChange={(v) => onChange({ severeFrameLimit: v })}
          format={(v) => `${v} frames`}
        />
        <Slider
          label="Yawn Threshold (MAR)"
          value={settings.marThreshold}
          min={0.3}
          max={1.0}
          step={0.05}
          onChange={(v) => onChange({ marThreshold: v })}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="Yawn Frame Limit"
          value={settings.yawnFrameLimit}
          min={5}
          max={40}
          step={1}
          onChange={(v) => onChange({ yawnFrameLimit: v })}
          format={(v) => `${v} frames`}
        />

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onChange({ alarmEnabled: !settings.alarmEnabled })}
            disabled={disabled}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              settings.alarmEnabled
                ? 'border-sky-200 bg-sky-50 text-sky-600'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            {settings.alarmEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            Alarm
          </button>
          <button
            onClick={() => onChange({ voiceEnabled: !settings.voiceEnabled })}
            disabled={disabled}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              settings.voiceEnabled
                ? 'border-sky-200 bg-sky-50 text-sky-600'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            {settings.voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Voice
          </button>
        </div>
      </div>
    </div>
  );
}
