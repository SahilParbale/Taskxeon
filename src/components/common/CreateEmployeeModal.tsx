import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Upload,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Camera,
  Link,
  CheckCircle2
} from 'lucide-react';

const DEFAULT_EMPLOYEE_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

export const CreateEmployeeModal: React.FC = () => {
  const {
    isCreateEmployeeModalOpen,
    setIsCreateEmployeeModalOpen,
    createEmployee,
    currentUser
  } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailEditedManually, setEmailEditedManually] = useState(false);
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Employee Photo state
  const [photoUrl, setPhotoUrl] = useState(DEFAULT_EMPLOYEE_PHOTO);
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Employee ID and Password state
  const [username, setUsername] = useState('');
  const [usernameEditedManually, setUsernameEditedManually] = useState(false);
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isCreateEmployeeModalOpen) {
      setName('');
      setEmail('');
      setEmailEditedManually(false);
      setTitle('');
      setPhone('+1 (555) 234-8900');
      setBio('');
      setPhotoUrl(DEFAULT_EMPLOYEE_PHOTO);
      setPhotoInputMode('upload');
      setCustomUrlInput('');
      setUsername('');
      setUsernameEditedManually(false);
      setPassword('password123');
      setShowPassword(false);
      setError('');
    }
  }, [isCreateEmployeeModalOpen]);

  if (!isCreateEmployeeModalOpen || currentUser.role !== 'manager') return null;

  // Auto-generate email and username as manager types employee name
  const handleNameChange = (val: string) => {
    setName(val);
    setError('');

    const clean = val
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .trim()
      .split(/\s+/)
      .join('.');

    if (!emailEditedManually) {
      setEmail(clean ? `${clean}@taskflow.internal` : '');
    }
    if (!usernameEditedManually) {
      setUsername(clean || '');
    }
  };

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError('Photo file size should be less than 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (customUrlInput.trim()) {
      setPhotoUrl(customUrlInput.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'manager') {
      setError('Only Managers are authorized to add team members.');
      return;
    }
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid corporate email address is required.');
      return;
    }
    if (!title.trim()) {
      setError('Job title or role designation is required.');
      return;
    }
    if (!username.trim()) {
      setError('Employee Login ID / Username is required.');
      return;
    }
    if (!password.trim()) {
      setError('Login password is required.');
      return;
    }

    createEmployee({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      title: title.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      avatar: photoUrl.trim() || DEFAULT_EMPLOYEE_PHOTO,
      phone: phone.trim() || undefined,
      bio: bio.trim() || `Team member contributing to ${title.trim()} deliverables at TaskFlow.`,
      presence: 'online'
    });

    setIsCreateEmployeeModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCreateEmployeeModalOpen(false)}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative w-full max-w-2xl transform rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm flex-shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Add New Team Member</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    {currentUser.department && currentUser.department.toLowerCase().includes('market') ? 'Marketing Team' : 'Software Team'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Onboard an employee with credentials and team assignment.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateEmployeeModalOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(90vh-80px)] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Live Employee Preview Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-100/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <img
                    src={photoUrl}
                    alt="Employee Photo Preview"
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-sm"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_EMPLOYEE_PHOTO;
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {name.trim() || 'Employee Full Name'}
                  </h4>
                  <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                    {title.trim() || 'Job Designation / Role'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                      ID: @{username.trim() || 'username'}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {email.trim() || 'name@taskflow.internal'}
                    </span>
                  </div>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider shadow-2xs">
                Live Card
              </span>
            </div>

            {/* Employee Photo Section */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                Photo of Employee *
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-xl object-cover ring-2 ring-emerald-500/20 shadow-sm border border-slate-200"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_EMPLOYEE_PHOTO;
                    }}
                  />
                </div>

                <div className="flex-1 space-y-2 w-full">
                  {/* Mode switcher pills */}
                  <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('upload')}
                      className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        photoInputMode === 'upload'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Device Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('url')}
                      className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        photoInputMode === 'url'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>Photo Web URL</span>
                    </button>
                  </div>

                  {photoInputMode === 'upload' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Choose Photo File (JPG, PNG, WebP)</span>
                      </button>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        High-resolution square or portrait photo recommended (up to 4MB).
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={e => setCustomUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full Name & Corporate Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g., Sophia Martinez"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Corporate Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setEmailEditedManually(true);
                    }}
                    placeholder="sophia.martinez@taskflow.internal"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Job Title / Role & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Title / Designation *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={title}
                    onChange={e => {
                      setTitle(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g., Senior Fullstack Engineer"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-8900"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Employee Login Credentials Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Employee Login Credentials (ID & Password)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  Auth Credentials
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee ID / Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee ID / Username *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
                        setUsernameEditedManually(true);
                        setError('');
                      }}
                      placeholder="e.g., sophia.martinez"
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Employee enters this ID on the login page.
                  </span>
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter employee password"
                      className="w-full pl-8 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Default is <code className="text-emerald-700 font-semibold">password123</code>.
                  </span>
                </div>
              </div>
            </div>

            {/* Bio & Responsibilities */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bio & Technical Notes (Optional)
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="e.g., Focuses on distributed backend architectures, zero-downtime deployments, and performance optimization."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateEmployeeModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-soft hover:shadow-soft-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard Employee</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
