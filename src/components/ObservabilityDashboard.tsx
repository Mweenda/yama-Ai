import React, { useState, useEffect } from 'react';
import { UsageEvent } from '../types';
import {
  Activity,
  Cpu,
  Coins,
  Clock,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ObservabilityDashboardProps {
  onRefreshData?: () => void;
}

export const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({
  onRefreshData,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchObservability = async () => {
    try {
      const [resStats, resEvents] = await Promise.all([
        fetch('/api/observability/stats').then(r => r.json()),
        fetch('/api/observability/events').then(r => r.json()),
      ]);
      setStats(resStats.stats);
      setEvents(resEvents.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObservability();
  }, []);

  const handleReset = async () => {
    if (!confirm('Clear all telemetry events and start fresh?')) return;
    setResetting(true);
    try {
      await fetch('/api/observability/reset', { method: 'POST' });
      await fetchObservability();
      if (onRefreshData) onRefreshData();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-md shadow-indigo-500/10">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Metrics & Events</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Telemetry
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time inference latencies, token consumption, query telemetry & cost tracking
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchObservability}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-2xl liquid-glass-card hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-2 border border-white/[0.08]"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Refresh Metrics</span>
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="p-2.5 rounded-2xl liquid-glass-card hover:bg-white/[0.08] text-slate-400 hover:text-rose-400 transition border border-white/[0.08]"
            title="Clear all telemetry and reset metrics"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics & Events Main Content */}
      <div className="space-y-6">
        {/* Key Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="liquid-glass rounded-3xl p-5 space-y-1.5 shadow-xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Queries</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.totalQueries ?? 0}
            </div>
            <div className="text-[11px] text-slate-500">RAG + Web searches</div>
          </div>

          <div className="liquid-glass rounded-3xl p-5 space-y-1.5 shadow-xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tokens Consumed</span>
              <Layers className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {((stats?.totalInputTokens || 0) + (stats?.totalOutputTokens || 0)).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">
              In: {(stats?.totalInputTokens || 0).toLocaleString()} • Out: {(stats?.totalOutputTokens || 0).toLocaleString()}
            </div>
          </div>

          <div className="liquid-glass rounded-3xl p-5 space-y-1.5 shadow-xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Avg Latency</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.avgLatencyMs ?? 0} <span className="text-sm font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[11px] text-slate-500">Retrieval + LLM time</div>
          </div>

          <div className="liquid-glass rounded-3xl p-5 space-y-1.5 shadow-xl border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Est. Cloud Cost</span>
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono text-emerald-400">
              ${stats?.totalCost?.toFixed(6) ?? '0.000000'}
            </div>
            <div className="text-[11px] text-slate-500">Gemini 3.8 Flash tiered pricing</div>
          </div>
        </div>

        {/* Usage Events Log Table */}
        <div className="liquid-glass rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]">
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div>
              <h3 className="text-sm font-bold text-white">Inference & Usage Audit Log</h3>
              <p className="text-xs text-slate-400">Telemetry generated across live query sessions</p>
            </div>
            <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
              {events.length} events logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 border-b border-white/[0.08] font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Input Tokens</th>
                  <th className="py-3 px-4">Output Tokens</th>
                  <th className="py-3 px-4">Retrieval Latency</th>
                  <th className="py-3 px-4">LLM Latency</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300 font-mono">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-white/[0.03] transition">
                    <td className="py-3 px-4 text-indigo-400">{ev.id}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">{ev.model}</td>
                    <td className="py-3 px-4">{ev.inputTokens}</td>
                    <td className="py-3 px-4">{ev.outputTokens}</td>
                    <td className="py-3 px-4 text-amber-400">{ev.retrievalLatencyMs} ms</td>
                    <td className="py-3 px-4 text-violet-400">{ev.llmLatencyMs} ms</td>
                    <td className="py-3 px-4 text-emerald-400">${ev.estimatedCost.toFixed(6)}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500 font-sans">
                      No telemetry events recorded yet. Start a chat or query a Knowledge Base to generate live logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
