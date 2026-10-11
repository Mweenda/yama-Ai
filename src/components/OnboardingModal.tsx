import React, { useState } from 'react';
import {
  UserRole,
  ExperienceLevel,
  AssistantRole,
  UserProfile,
} from '../types';
import {
  GraduationCap,
  Microscope,
  Briefcase,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Globe,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  onSave: (profile: Partial<UserProfile>) => Promise<void>;
  onClose?: () => void;
}

const ROLES: { id: UserRole; label: string; desc: string; icon: any }[] = [
  { id: 'Student', label: 'Student', desc: 'Studying courses, preparing for exams, reviewing lecture notes', icon: GraduationCap },
  { id: 'Researcher', label: 'Researcher', desc: 'Analyzing papers, synthesizing methodologies, citing literature', icon: Microscope },
  { id: 'Professional', label: 'Professional', desc: 'Reviewing policies, corporate compliance, executive summaries', icon: Briefcase },
  { id: 'Administrator', label: 'Administrator', desc: 'Managing knowledge repositories, operations & guidelines', icon: ShieldCheck },
  { id: 'General User', label: 'General User', desc: 'Everyday inquiries, learning, document explorations', icon: UserCheck },
];

const FIELDS = [
  'Computer Science',
  'Electrical Engineering',
  'Artificial Intelligence',
  'Medicine & Health',
  'Business & Finance',
  'Humanities',
  'Social Sciences',
  'Law & Compliance',
  'Natural Sciences',
  'Education',
  'Arts & Design',
  'Other',
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'Beginner', label: 'Beginner', desc: 'Explain fundamentals progressively with intuitive real-world analogies' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Standard technical depth, practical problem solving and derivations' },
  { id: 'Advanced', label: 'Advanced', desc: 'Deep technical rigor, formal definitions, and edge-case explorations' },
  { id: 'Expert', label: 'Expert', desc: 'Cutting-edge synthesis, mathematical formulation, and critical analysis' },
];

const USE_CASES = [
  'Coursework & Notes',
  'Literature Research',
  'Technical Writing',
  'Data & Code Analysis',
  'Professional Work',
  'Exam Preparation',
  'Document Synthesis',
  'Open Web Inquiries',
];

const ASSISTANT_ROLES: { id: AssistantRole; label: string; desc: string }[] = [
  { id: 'Tutor', label: 'Tutor', desc: 'Guides you through concepts and tests your understanding with questions' },
  { id: 'Research Assistant', label: 'Research Assistant', desc: 'Synthesizes papers, compares methodologies, and cites rigorously' },
  { id: 'Study Partner', label: 'Study Partner', desc: 'Collaborative discussion, quiz generation, and active recall' },
  { id: 'Professional Assistant', label: 'Professional Assistant', desc: 'Concise executive summaries, action items, and risk analysis' },
  { id: 'Writing Assistant', label: 'Writing Assistant', desc: 'Refines technical prose, structure, and academic precision' },
  { id: 'Analyst', label: 'Analyst', desc: 'Extracts critical data points, metrics, and contractual clauses' },
  { id: 'General Assistant', label: 'General Assistant', desc: 'Versatile, friendly, and adaptive to any query' },
  { id: 'Custom', label: 'Custom Persona', desc: 'Defined entirely by your own custom directives' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialProfile,
  onSave,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(initialProfile.role || 'Student');
  const [fields, setFields] = useState<string[]>(initialProfile.fields || ['Computer Science']);
  const [experience, setExperience] = useState<ExperienceLevel>(initialProfile.experience || 'Intermediate');
  const [useCases, setUseCases] = useState<string[]>(initialProfile.useCases || ['Coursework & Notes']);
  const [assistantRole, setAssistantRole] = useState<AssistantRole>(initialProfile.assistantRole || 'Research Assistant');
  const [searchScope, setSearchScope] = useState<'kb_only' | 'hybrid'>(initialProfile.searchScope || 'hybrid');
  const [customInstructions, setCustomInstructions] = useState(
    initialProfile.customInstructions ||
      'Provide clear, well-structured explanations with authoritative citations.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleField = (f: string) => {
    setFields(prev =>
      prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
    );
  };

  const toggleUseCase = (u: string) => {
    setUseCases(prev =>
      prev.includes(u) ? prev.filter(item => item !== u) : [...prev, u]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onSave({
        role,
        fields,
        experience,
        useCases,
        assistantRole,
        searchScope,
        customInstructions,
        completedOnboarding: true,
      });
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="liquid-dialog rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Personalize Yama AI
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                  Step {step} of 6
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure your context-aware persona and system prompt compiler
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-xl hover:bg-white/[0.08] transition"
            >
              Close
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/[0.05] h-1">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1 transition-all duration-300 shadow-sm"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Persona */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">How will you primarily use Yama AI?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select your primary role to configure default tone, depth, and explanatory framing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLES.map(r => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/15 shadow-xl shadow-indigo-950/40 text-white ring-1 ring-indigo-500/40'
                          : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-500 text-white' : 'bg-white/[0.06] text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div className="font-semibold text-sm">{r.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{r.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Field */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">What fields or disciplines are relevant to you?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select all that apply to help Yama AI understand domain terminology and notation.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FIELDS.map(f => {
                  const isSelected = fields.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleField(f)}
                      className={`px-3.5 py-3 text-xs rounded-2xl border font-medium transition text-left flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 shadow-md'
                          : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span>{f}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 ml-1.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Experience */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">What is your technical experience level?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Controls the balance between intuitive analogies and formal mathematical rigor.
                </p>
              </div>

              <div className="space-y-2.5">
                {EXPERIENCE_LEVELS.map(exp => {
                  const isSelected = experience === exp.id;
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setExperience(exp.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md ring-1 ring-indigo-500/40'
                          : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {exp.label}
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500 text-white">Active</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{exp.desc}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Usage */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">What are your intended use cases?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select key tasks you plan to accomplish with your uploaded knowledge bases.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {USE_CASES.map(u => {
                  const isSelected = useCases.includes(u);
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => toggleUseCase(u)}
                      className={`p-3.5 text-xs rounded-2xl border font-medium transition text-left flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 shadow-md'
                          : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span>{u}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 ml-1.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: AI Role */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Choose your AI Assistant Persona</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select how Yama AI interacts with you during question-and-answer exchanges.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ASSISTANT_ROLES.map(ar => {
                  const isSelected = assistantRole === ar.id;
                  return (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAssistantRole(ar.id)}
                      className={`text-left p-3.5 rounded-2xl border transition ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md ring-1 ring-indigo-500/40'
                          : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{ar.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-xs text-slate-400">{ar.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Search Scope & Custom Instructions */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">Search & Retrieval Policy</h3>
                <p className="text-xs text-slate-400">
                  Decide whether to search exclusively from your uploaded documents or include the live internet via Gemini models.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setSearchScope('kb_only')}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      searchScope === 'kb_only'
                        ? 'border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500/40'
                        : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-xs text-white">Knowledge Base Only</span>
                      </div>
                      {searchScope === 'kb_only' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      100% private document queries. Web search is strictly disabled.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSearchScope('hybrid')}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      searchScope === 'hybrid'
                        ? 'border-cyan-500 bg-cyan-500/15 text-white ring-1 ring-cyan-500/40'
                        : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold text-xs text-white">KB + Live Internet</span>
                      </div>
                      {searchScope === 'hybrid' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Searches your documents first, then grounds via live web search using Gemini.
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <h4 className="text-xs font-semibold text-white">Custom Directives (Optional)</h4>
                <p className="text-[11px] text-slate-400">
                  Additional guidance safely compiled into the User Profile prompt layer.
                </p>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Provide structured bullet points, highlight practical engineering implications, and cite specific document pages."
                  className="w-full liquid-input rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl liquid-glass-card text-xs space-y-1.5 border border-indigo-500/20">
                <div className="font-semibold text-indigo-300">Active Persona Summary:</div>
                <div className="text-slate-300">
                  <span className="text-slate-400">Role:</span> {role} • <span className="text-slate-400">Level:</span> {experience} • <span className="text-slate-400">Assistant:</span> {assistantRole}
                </div>
                <div className="text-slate-400 truncate text-[11px]">
                  Disciplines: {fields.join(', ')} • Search Scope: {searchScope === 'kb_only' ? 'KB Only' : 'Hybrid (KB + Internet)'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-2xl text-xs font-medium text-slate-300 hover:text-white liquid-glass-card hover:bg-white/[0.08] transition flex items-center gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 border border-white/10"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 border border-white/10"
            >
              {isSubmitting ? 'Saving Profile...' : 'Save & Continue'}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
