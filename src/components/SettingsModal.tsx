import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  User,
  UserRole,
  ExperienceLevel,
  AssistantRole,
} from '../types';
import {
  Settings,
  BookOpen,
  Globe,
  Sparkles,
  Sliders,
  Check,
  X,
  Save,
  Zap,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  currentUser: User;
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
  onClose: () => void;
}

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'Student', label: 'Student' },
  { id: 'Researcher', label: 'Researcher' },
  { id: 'Professional', label: 'Professional' },
  { id: 'Administrator', label: 'Administrator' },
  { id: 'General User', label: 'General User' },
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'Beginner', label: 'Beginner', desc: 'Intuitive analogies, progressive fundamentals' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Standard technical depth and derivations' },
  { id: 'Advanced', label: 'Advanced', desc: 'Rigorous mathematical notation & edge cases' },
  { id: 'Expert', label: 'Expert', desc: 'Cutting-edge synthesis and critical analysis' },
];

const ASSISTANT_ROLES: { id: AssistantRole; label: string; desc: string }[] = [
  { id: 'Tutor', label: 'Tutor', desc: 'Guides you through concepts and tests understanding' },
  { id: 'Research Assistant', label: 'Research Assistant', desc: 'Synthesizes papers and cites rigorously' },
  { id: 'Study Partner', label: 'Study Partner', desc: 'Collaborative discussion and active recall' },
  { id: 'Professional Assistant', label: 'Professional Assistant', desc: 'Executive summaries and risk analysis' },
  { id: 'Writing Assistant', label: 'Writing Assistant', desc: 'Refines technical prose and academic style' },
  { id: 'Analyst', label: 'Analyst', desc: 'Extracts critical data points and metrics' },
  { id: 'General Assistant', label: 'General Assistant', desc: 'Versatile and adaptive' },
  { id: 'Custom', label: 'Custom Persona', desc: 'Defined by your own custom instructions' },
];

const FIELDS_LIST = [
  'Computer Science',
  'Electrical Engineering',
  'Artificial Intelligence',
  'Medicine & Health',
  'Business & Finance',
  'Natural Sciences',
  'Law & Compliance',
  'Humanities',
  'Other',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  currentUser,
  profile,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'persona' | 'engine'>('search');

  // Search scope preference
  const [searchScope, setSearchScope] = useState<'kb_only' | 'hybrid'>(
    profile.searchScope || 'hybrid'
  );

  // Persona preferences
  const [assistantRole, setAssistantRole] = useState<AssistantRole>(profile.assistantRole || 'Research Assistant');
  const [userRole, setUserRole] = useState<UserRole>(profile.role || 'Student');
  const [experience, setExperience] = useState<ExperienceLevel>(profile.experience || 'Intermediate');
  const [fields, setFields] = useState<string[]>(profile.fields || ['Computer Science']);
  const [customInstructions, setCustomInstructions] = useState(profile.customInstructions || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Keep state synced when profile updates
  useEffect(() => {
    setSearchScope(profile.searchScope || 'hybrid');
    setAssistantRole(profile.assistantRole || 'Research Assistant');
    setUserRole(profile.role || 'Student');
    setExperience(profile.experience || 'Intermediate');
    setFields(profile.fields || ['Computer Science']);
    setCustomInstructions(profile.customInstructions || '');
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const toggleField = (f: string) => {
    setFields(prev =>
      prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        searchScope,
        assistantRole,
        role: userRole,
        experience,
        fields,
        customInstructions,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="liquid-dialog rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-white/[0.12]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Preferences & Search Settings</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  User Preferences
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure your search grounding scope, AI persona tone, and model execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-white/[0.08] bg-slate-950/40 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'search'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Search & Grounding Scope</span>
          </button>

          <button
            onClick={() => setActiveTab('persona')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'persona'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Persona & Tone</span>
          </button>

          <button
            onClick={() => setActiveTab('engine')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'engine'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Engine & Parameters</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Search & Grounding Scope */}
          {activeTab === 'search' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Knowledge Base & Search Grounding Policy</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Decide whether Yama AI searches strictly from your knowledge base only, or searches both your knowledge base and the open internet via Gemini's Google Search grounding.
                </p>
              </div>

              {/* 2 Options Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Knowledge Base Only */}
                <div
                  onClick={() => setSearchScope('kb_only')}
                  className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between relative ${
                    searchScope === 'kb_only'
                      ? 'border-indigo-500 bg-indigo-500/15 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        100% Private
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>Knowledge Base Only</span>
                        {searchScope === 'kb_only' && (
                          <Check className="w-4 h-4 text-indigo-400" />
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Search exclusively across your uploaded documents and notes. Web search grounding is strictly disabled.
                      </p>
                    </div>

                    <ul className="text-[11px] text-slate-300 space-y-1.5 pt-1 border-t border-white/[0.06]">
                      <li className="flex items-center gap-1.5">
                        <span className="text-indigo-400">✓</span>
                        <span>Zero external queries or web leakage</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-indigo-400">✓</span>
                        <span>Strict page citations for all claims</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-indigo-400">✓</span>
                        <span>Ideal for proprietary & confidential docs</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Retrieval Mode</span>
                    <span className="text-[10px] font-mono text-indigo-300 font-semibold">Strict Document RAG</span>
                  </div>
                </div>

                {/* Option 2: Knowledge Base + Live Internet */}
                <div
                  onClick={() => setSearchScope('hybrid')}
                  className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between relative ${
                    searchScope === 'hybrid'
                      ? 'border-cyan-500 bg-cyan-500/15 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Hybrid Grounding
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>Knowledge Base + Internet</span>
                        {searchScope === 'hybrid' && (
                          <Check className="w-4 h-4 text-cyan-400" />
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Search your uploaded knowledge bases first, and automatically enrich with live internet grounding via Gemini's Google Search.
                      </p>
                    </div>

                    <ul className="text-[11px] text-slate-300 space-y-1.5 pt-1 border-t border-white/[0.06]">
                      <li className="flex items-center gap-1.5">
                        <span className="text-cyan-400">✓</span>
                        <span>Combines your files with real-time web facts</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-cyan-400">✓</span>
                        <span>Auto-falls back to search when docs lack info</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-cyan-400">✓</span>
                        <span>Web citations + PDF page references</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Retrieval Mode</span>
                    <span className="text-[10px] font-mono text-cyan-300 font-semibold">Gemini Web Grounding</span>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="liquid-glass-card rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/[0.05] text-slate-300">
                    {searchScope === 'kb_only' ? <BookOpen className="w-4 h-4 text-indigo-400" /> : <Globe className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div>
                    <span className="text-slate-400">Current Active Search Scope: </span>
                    <span className="font-bold text-white">
                      {searchScope === 'kb_only' ? 'Knowledge Base Only (Strict RAG)' : 'Knowledge Base + Live Web Search'}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-indigo-300 font-mono hidden sm:inline">
                  Applies to all new chat queries
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: AI Persona & Tone */}
          {activeTab === 'persona' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Assistant Persona */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Assistant Behavior & Persona</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ASSISTANT_ROLES.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setAssistantRole(role.id)}
                      className={`p-3.5 rounded-2xl text-left border transition ${
                        assistantRole === role.id
                          ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-md shadow-indigo-950/30'
                          : 'bg-white/[0.02] border-white/[0.08] text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{role.label}</span>
                        {assistantRole === role.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{role.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Your Primary Domain Role
                  </label>
                  <select
                    value={userRole}
                    onChange={e => setUserRole(e.target.value as UserRole)}
                    className="w-full liquid-input rounded-2xl p-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {ROLES.map(r => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Technical Depth & Explanation Level
                  </label>
                  <select
                    value={experience}
                    onChange={e => setExperience(e.target.value as ExperienceLevel)}
                    className="w-full liquid-input rounded-2xl p-2.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {EXPERIENCE_LEVELS.map(exp => (
                      <option key={exp.id} value={exp.id} className="bg-slate-900 text-white">
                        {exp.label} — {exp.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Disciplines */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Relevant Subject Fields & Disciplines
                </label>
                <div className="flex flex-wrap gap-2">
                  {FIELDS_LIST.map(f => {
                    const isSelected = fields.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleField(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                            : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Directives */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Custom Directives & System Instructions
                </label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Provide structured bullet points, include key formulas, and cite specific document pages."
                  className="w-full liquid-input rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Engine & Parameters */}
          {activeTab === 'engine' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="liquid-glass-card rounded-2xl p-4 space-y-1 border border-white/[0.08]">
                  <span className="text-slate-400">Connected AI Engine:</span>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gemini 3.8 Flash (Server-side)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">High-throughput reasoning with built-in search grounding</p>
                </div>

                <div className="liquid-glass-card rounded-2xl p-4 space-y-1 border border-white/[0.08]">
                  <span className="text-slate-400">Embedding Engine:</span>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Gemini Text-Embedding-2</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Semantic vector representation across document pages</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl liquid-glass-card text-xs space-y-2 border border-white/[0.08]">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Rate Limits & API Secret Management</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  All inference requests run server-side securely. If you encounter a 429 quota notice during peak streaming, the system automatically falls back and buffers requests.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="text-xs text-slate-400 hidden sm:block">
            {saveSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Preferences updated successfully
              </span>
            ) : (
              <span>Active Scope: {searchScope === 'kb_only' ? 'Knowledge Base Only' : 'Hybrid (KB + Internet)'}</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-medium text-slate-300 hover:text-white liquid-glass-card hover:bg-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 border border-white/10"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
