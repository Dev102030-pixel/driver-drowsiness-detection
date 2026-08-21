import { useEffect, useState } from 'react';
import { fetchSessionReports, deleteSessionReport, type SessionReport } from '@/lib/storage';
import { getSession } from '@/lib/auth';
import { Calendar, Trash2, Clock, Activity, AlertOctagon, Moon, EyeOff, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export function AdminReports() {
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const session = getSession();

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    // If admin, pass undefined to fetch all. If user, pass their id.
    const data = await fetchSessionReports(session?.role === 'admin' ? undefined : session?.id);
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

  // Aggregate data for charts
  const chartData = [...reports].reverse().map((r, i) => ({
    name: `Session ${i + 1}`,
    drowsy: r.drowsy_count,
    distracted: r.distracted_count || 0,
    severe: r.severe_count,
  }));

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-xl font-bold text-slate-900">
          {session?.role === 'admin' ? 'Global Session Reports' : 'My Session Reports'}
        </h2>
        <p className="text-sm text-slate-500">
          {session?.role === 'admin' 
            ? 'Review driving history and alerts across all monitored drivers' 
            : 'Review your past driving sessions and alerts'}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          
          {/* Charts Section - Only show if there's data */}
          {reports.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-sky-500" />
                  <h3 className="font-semibold text-slate-900">Events Overview</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="drowsy" name="Drowsy" fill="#f87171" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="distracted" name="Distracted" fill="#818cf8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="severe" name="Severe" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-slate-900">Alert Trend</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="drowsy" stroke="#f87171" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="distracted" stroke="#818cf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* List Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Session Logs</h3>
            </div>
            
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
                <Calendar className="h-12 w-12 text-slate-300" />
                <div>
                  <p className="text-lg font-medium text-slate-800">No reports found</p>
                  <p className="text-sm text-slate-500">Past driving sessions will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((report) => {
                  const isExpanded = expandedId === report.id;
                  return (
                  <div
                    key={report.id}
                    className={`group relative flex flex-col gap-4 p-6 transition-all hover:bg-slate-50 cursor-pointer ${
                      isExpanded ? 'bg-slate-50' : ''
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                      className="absolute right-6 top-6 opacity-0 transition-opacity group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-white shadow-sm border border-slate-200 rounded-lg z-10"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center justify-between pr-12">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-900">
                            {new Date(report.start_time).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                          {session?.role === 'admin' && (
                            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                              Driver ID: {report.driver_id}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="h-4 w-4" />
                          Duration: {formatDuration(report.start_time, report.end_time)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
                        <p className="text-2xl font-bold text-amber-500">{report.yawn_count}</p>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Yawns</p>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
                        <p className="text-2xl font-bold text-red-500">{report.drowsy_count}</p>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Drowsy</p>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
                        <p className="text-2xl font-bold text-indigo-500">{report.distracted_count ?? 0}</p>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Distracted</p>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
                        <p className="text-2xl font-bold text-orange-500">{report.obscured_count ?? 0}</p>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Obscured</p>
                      </div>
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                        <p className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1.5">
                          {report.severe_count > 0 && <AlertOctagon className="h-5 w-5" />}
                          {report.severe_count}
                        </p>
                        <p className="text-xs uppercase tracking-wider text-red-600 font-medium">Severe</p>
                      </div>
                    </div>

                    {isExpanded && report.events && report.events.length > 0 && (
                      <div className="mt-2 flex flex-col gap-4 rounded-xl bg-white p-5 border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Detailed Timeline</h4>
                        <div className="flex flex-col gap-3">
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
                              <div key={i} className="flex items-start gap-4 border-l-2 border-slate-200 pl-4 py-1">
                                <div className="mt-0.5 rounded-full bg-slate-50 p-1.5 border border-slate-100 shadow-sm">
                                  <Icon className={`h-4 w-4 ${color}`} />
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-sm font-semibold text-slate-900">{text}</p>
                                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    {endTimeStr ? (
                                      <>
                                        <span className="text-slate-400">Start:</span> {timeStr}{' '}
                                        <span className="text-slate-400 ml-3">End:</span> {endTimeStr}
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
    </div>
  );
}
