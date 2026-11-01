import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  Layers,
  Clock,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, users, projects, supabaseStatus, supabaseLatencyMs } = useApp();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Handle standard login submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await login(usernameOrEmail, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Default password is password123');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans selection:bg-emerald-500 selection:text-white py-6 md:py-0">
      {/* Unified Attached Container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row my-auto">
        {/* LEFT ATTACHED PANE: Workspace & Team Overview (Visible on md+ screens) */}
        <div className="hidden md:flex w-full md:w-1/2 p-6 sm:p-8 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 flex-col justify-between">
          <div>
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight">TaskFlow</span>
                <span className="text-[11px] text-slate-500 ml-1.5 font-medium">Enterprise</span>
              </div>
            </div>

            {/* Tagline */}
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">
              Workforce & Sprint <br />
              <span className="text-emerald-700">Management Made Simple</span>.
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Track deliverables and live presence across your engineering organization.
            </p>
          </div>

          {/* Middle Overview Box */}
          <div className="my-5 space-y-3.5">
            {/* Office Shift Timing Pill */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between shadow-soft-sm">
              <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Office Shift Hours</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/60">
                10:00 AM – 6:00 PM
              </span>
            </div>

            {/* Team Roster Avatars */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-soft-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  Active Team Roster
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{users.length} Members</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="relative flex-shrink-0" title={`${u.name} (${u.role})`}>
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
                        u.presence === 'online'
                          ? 'bg-emerald-500'
                          : u.presence === 'break'
                          ? 'bg-amber-400'
                          : 'bg-slate-300'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Current Sprints Mini Progress */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-soft-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>{projects.length > 0 ? projects[0].name : 'System Status'}</span>
                <span className="text-emerald-700 font-bold">{projects.length > 0 ? `${projects[0].progress}%` : 'Operational'}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: projects.length > 0 ? `${projects[0].progress}%` : '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Left Footer Badges */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Assigned-Only RBAC</span>
            </span>
            <span className="font-medium text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {supabaseStatus === 'connected' ? `Supabase (${supabaseLatencyMs}ms)` : 'Cloud Ready'}
            </span>
          </div>
        </div>

        {/* RIGHT ATTACHED PANE: Compact Login Form */}
        <div className="w-full md:w-1/2 p-5 sm:p-8 bg-white flex flex-col justify-between">
          <div>
            {/* Mobile-only Brand Header */}
            <div className="md:hidden flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 tracking-tight">TaskFlow</span>
                  <span className="text-[10px] text-slate-500 ml-1 font-medium">Enterprise</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-800 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                10AM – 6PM Shift
              </span>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your account username or email</p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-3.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="flex-1 text-[11px] leading-snug">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username Input */}
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Username or Work Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={e => setUsernameOrEmail(e.target.value)}
                    placeholder=""
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder=""
                    className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-3.5 h-3.5"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Simple Credentials Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <KeyRound className="w-4 h-4" />
                <h3 className="text-xs font-bold text-slate-900">Demo Credentials</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Manager Account:</p>
              <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">shreyasjadhav@gmail.com</div>
                  <div className="text-[10px] text-emerald-700 font-mono">pwd: shreyas123</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameOrEmail('shreyasjadhav@gmail.com');
                    setPassword('shreyas123');
                    setShowForgotModal(false);
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer"
                >
                  Apply
                </button>
              </div>

              <div className="pt-1">
                <p className="font-semibold text-slate-700 mb-1 text-[11px]">Employee Account:</p>
                <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">sahilparbale@gmail.com</div>
                    <div className="text-[10px] text-emerald-700 font-mono">user: sahil • pwd: password123</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameOrEmail('sahilparbale@gmail.com');
                      setPassword('password123');
                      setShowForgotModal(false);
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
