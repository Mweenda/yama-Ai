import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  User as UserIcon,
  Mail,
  Building,
  Briefcase,
  Calendar,
  ShieldCheck,
  Check,
  X,
  Save,
  Camera,
  Sparkles,
  Phone,
  FileText,
  BadgeCheck,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: User;
  onSave: (updates: Partial<User>) => Promise<void>;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || PRESET_AVATARS[0]);
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || '');
  const [organization, setOrganization] = useState(currentUser.organization || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState(false);

  useEffect(() => {
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setAvatar(currentUser.avatar || PRESET_AVATARS[0]);
    setJobTitle(currentUser.jobTitle || '');
    setOrganization(currentUser.organization || '');
    setPhone(currentUser.phone || '');
    setBio(currentUser.bio || '');
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        avatar,
        jobTitle: jobTitle.trim(),
        organization: organization.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update personal profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Member';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="liquid-dialog rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-white/[0.12]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/20">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Personal Profile</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  User Identity
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage your identity, personal contact details, and account credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar & Identity Hero Card */}
          <div className="liquid-glass-card rounded-3xl p-5 space-y-4 border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt={name || 'User avatar'}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-950/50"
                />
                <button
                  type="button"
                  onClick={() => setCustomAvatarInput(!customAvatarInput)}
                  className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition border border-white/20"
                  title="Change avatar photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-bold text-white">{name || 'Studio Member'}</h3>
                  {currentUser.isAdmin ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-mono font-medium border border-indigo-500/40 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3 text-indigo-400" />
                      <span>Administrator</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 font-mono border border-white/[0.1]">
                      Member
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-400">{email || 'user@yama.ai'}</p>
                <div className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-3 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    <span>Joined {formattedDate}</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Session</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar Selector Options */}
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Select Photo Preset
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_AVATARS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(presetUrl)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition ${
                      avatar === presetUrl
                        ? 'border-indigo-400 scale-105 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/40'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomAvatarInput(!customAvatarInput)}
                  className="px-2.5 py-1.5 rounded-xl liquid-glass text-[11px] text-slate-300 hover:text-white border border-white/[0.08] transition"
                >
                  Custom URL
                </button>
              </div>

              {customAvatarInput && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <input
                    type="url"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full liquid-input rounded-2xl p-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Personal Information Fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Personal Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3 h-3 text-slate-400" />
                  <span>Full Name</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full liquid-input rounded-2xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>Email Address</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. user@domain.com"
                  className="w-full liquid-input rounded-2xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  <span>Job Title / Professional Role</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Machine Learning Engineer"
                  className="w-full liquid-input rounded-2xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>Organization / Institution</span>
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  placeholder="e.g. Global Research Lab"
                  className="w-full liquid-input rounded-2xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Contact Number (Optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full liquid-input rounded-2xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>Personal Bio & Background</span>
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Brief summary of your academic or professional background..."
                  className="w-full liquid-input rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Account & Security Summary */}
          <div className="p-4 rounded-2xl liquid-glass-card text-xs space-y-2 border border-white/[0.08]">
            <div className="font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Account Credentials & Privacy</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Your personal data is preserved locally in your session workspace. Knowledge bases and private document uploads are exclusively linked to your user account.
            </p>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="text-xs text-slate-400 hidden sm:block">
            {saveSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Profile updated successfully
              </span>
            ) : (
              <span>Personal data updates reflect immediately</span>
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
              disabled={isSaving || !name.trim() || !email.trim()}
              onClick={handleSave}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 border border-white/10"
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
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
