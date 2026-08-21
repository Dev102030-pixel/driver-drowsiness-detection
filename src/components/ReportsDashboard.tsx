import { useEffect, useState } from 'react';
import { X, Trash2, Calendar, Clock, Activity, AlertOctagon, EyeOff, Moon } from 'lucide-react';
import { fetchSessionReports, deleteSessionReport, SessionReport } from '@/lib/storage';

export function ReportsDashboard({ onClose }: { onClose: () => void }) {
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    const data = await fetchSessionReports();
    setReports(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this report?')) {
      await deleteSessionReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function formatDuration(start: string, end: string) {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return '0s';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Session Reports</h2>
              <p className="text-sm text-slate-500">View past driving session history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <Calendar className="h-12 w-12 text-slate-400" />
              <div>
                <p className="text-lg font-medium text-slate-800">No reports found</p>
                <p className="text-sm text-slate-500">Your past driving sessions will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {reports.map((report) => {
                const isExpanded = expandedId === report.id;
                return (
                <div
                  key={report.id}
                  className={`group relative flex flex-col gap-4 rounded-xl border p-4 transition-all cursor-pointer ${
                    isExpanded 
                      ? 'border-indigo-500 shadow-md bg-white' 
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-300'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                    className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 bg-white shadow-sm border border-slate-200 rounded-md z-10"
                    title="Delete report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex flex-col gap-1 pr-10">
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(report.start_time).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      Duration: {formatDuration(report.start_time, report.end_time)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="rounded-lg bg-white border border-slate-100 shadow-sm p-2 text-center">
                      <p className="text-xl font-bold text-amber-500">{report.yawn_count}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Yawns</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 shadow-sm p-2 text-center">
                      <p className="text-xl font-bold text-orange-500">{report.obscured_count ?? 0}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Obscured</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 shadow-sm p-2 text-center">
                      <p className="text-xl font-bold text-red-500">{report.drowsy_count}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Drowsy</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 shadow-sm p-2 text-center">
                      <p className="text-xl font-bold text-indigo-500">{report.distracted_count ?? 0}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Distracted</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center">
                      <p className="text-xl font-bold text-red-600 flex items-center justify-center gap-1">
                        {report.severe_count > 0 && <AlertOctagon className="h-4 w-4" />}
                        {report.severe_count}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-red-500/70">Severe</p>
                    </div>
                  </div>

                  {isExpanded && report.events && report.events.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3 rounded-lg bg-slate-50 p-4 border border-slate-100">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detailed Timeline</h3>
                      <div className="flex flex-col gap-2">
                        {report.events.map((evt, i) => {
                          const timeStr = new Date(evt.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
                          const endTimeStr = evt.endTime ? new Date(evt.endTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : null;
                          
                          let Icon = Activity;
                          let text = '';
                          let color = 'text-slate-400';
                          
                          if (evt.type === 'yawn') {
                            Icon = Moon;
                            text = 'Yawn Detected';
                            color = 'text-amber-500';
                          } else if (evt.type === 'drowsy') {
                            Icon = EyeOff;
                            text = 'Drowsiness Detected';
                            color = 'text-red-500';
                          } else if (evt.type === 'severe') {
                            Icon = AlertOctagon;
                            text = 'Severe Drowsiness Alert';
                            color = 'text-red-600';
                          } else if (evt.type === 'obscured') {
                            Icon = AlertOctagon;
                            text = evt.details ? `Camera view obscured by ${evt.details}` : 'Camera view obscured by object';
                            color = 'text-orange-500';
                          } else if (evt.type === 'distracted') {
                            Icon = EyeOff;
                            text = evt.details ?? 'Driver Distracted';
                            color = 'text-indigo-500';
                          }

                          return (
                            <div key={i} className="flex items-start gap-3 border-l-2 border-slate-300 pl-3">
                              <div className="mt-0.5">
                                <Icon className={`h-4 w-4 ${color}`} />
                              </div>
                              <div className="flex flex-col">
                                <p className="text-sm font-medium text-slate-800">{text}</p>
                                <p className="text-xs text-slate-500">
                                  {endTimeStr ? (
                                    <>
                                      <span className="font-semibold text-slate-700">Start:</span> {timeStr}{' '}
                                      <span className="font-semibold text-slate-700 ml-2">End:</span> {endTimeStr}
                                    </>
                                  ) : (
                                    <>{timeStr}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
