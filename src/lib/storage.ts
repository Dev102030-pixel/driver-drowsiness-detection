export type SessionEvent = {
  type: 'drowsy' | 'severe' | 'yawn' | 'obscured' | 'distracted';
  timestamp: string; // ISO string
  endTime?: string;  // Optional, for duration events like obscured
  details?: string;  // E.g. "cell phone"
};

export type SessionReport = {
  id: string;
  session_id: string;
  start_time: string;
  end_time: string;
  total_frames: number;
  drowsy_count: number;
  severe_count: number;
  yawn_count: number;
  obscured_count: number;
  distracted_count: number;
  events: SessionEvent[];
  created_at: string;
};

const STORAGE_KEY = 'guardian_vision_reports';

export function getSessionReports(): SessionReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function fetchSessionReports(): Promise<SessionReport[]> {
  // Simulating async behavior to match old API
  return getSessionReports().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function logSessionReport(
  sessionId: string,
  startTime: number,
  endTime: number,
  totalFrames: number,
  drowsyCount: number,
  severeCount: number,
  yawnCount: number,
  obscuredCount: number,
  distractedCount: number,
  events: SessionEvent[]
): Promise<void> {
  const reports = getSessionReports();
  const newReport: SessionReport = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    start_time: new Date(startTime).toISOString(),
    end_time: new Date(endTime).toISOString(),
    total_frames: totalFrames,
    drowsy_count: drowsyCount,
    severe_count: severeCount,
    yawn_count: yawnCount,
    obscured_count: obscuredCount,
    distracted_count: distractedCount,
    events,
    created_at: new Date().toISOString(),
  };
  reports.push(newReport);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export async function deleteSessionReport(id: string): Promise<void> {
  const reports = getSessionReports().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}
