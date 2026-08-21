// Audio alarm + voice alert manager.
// The alarm uses the Web Audio API to synthesize a repeating beep tone so no
// external audio file is needed. Voice alerts use the SpeechSynthesis API.

let audioCtx: AudioContext | null = null;
let alarmInterval: number | null = null;
let alarmOscillator: OscillatorNode | null = null;
let alarmGain: GainNode | null = null;

function ensureContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function startAlarm(): void {
  if (alarmInterval !== null) return;
  const ctx = ensureContext();

  const playBeep = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    alarmOscillator = osc;
    alarmGain = gain;
  };

  playBeep();
  alarmInterval = window.setInterval(playBeep, 600);
}

export function stopAlarm(): void {
  if (alarmInterval !== null) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (alarmOscillator) {
    try {
      alarmOscillator.stop();
    } catch {
      // already stopped
    }
    alarmOscillator = null;
  }
  alarmGain = null;
}

let voiceAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string): void {
  if (!voiceAvailable) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    voiceAvailable = false;
  }
}

export function resumeAudio(): void {
  ensureContext();
}
