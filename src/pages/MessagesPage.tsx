import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MESSAGES_TABLE_SQL } from '../lib/supabase';
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  Smile,
  X,
  Trash2,
  Hash,
  User as UserIcon,
  Copy,
  ExternalLink,
  AlertTriangle,
  Menu,
  ChevronRight
} from 'lucide-react';
import { User } from '../types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🚀', '🎉', '🔥', '👏', '🙏', '💯', '✨', '💡', '✅', '🙌'];

export const MessagesPage: React.FC = () => {
  const {
    users,
    currentUser,
    messages,
    sendMessage,
    clearMessages,
    addToast,
    isMessagesTableMissing,
    activeChatTarget,
    setActiveChatTarget
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [inThreadSearch, setInThreadSearch] = useState('');
  const [isThreadSearchOpen, setIsThreadSearchOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to match user across ID aliases, email, or name
  const isUserMatch = (idOrEmail?: string, targetUser?: User | null): boolean => {
    if (!idOrEmail || !targetUser) return false;
    const val = idOrEmail.toLowerCase().trim();
    if (targetUser.id.toLowerCase() === val) return true;
    if (targetUser.email && targetUser.email.toLowerCase() === val) return true;
    if (targetUser.username && targetUser.username.toLowerCase() === val) return true;
    if (targetUser.name && targetUser.name.toLowerCase() === val) return true;

    // First name match
    const firstName = targetUser.name.split(' ')[0].toLowerCase();
    if (firstName && (val === firstName || val.startsWith(firstName))) return true;

    // Resilient fallback for Shreyas and Sahil personas
    if (targetUser.id === 'user-1' || targetUser.name.toLowerCase().includes('shreyas')) {
      if (val === 'user-1' || val.includes('shreyas')) return true;
    }
    if (targetUser.id === 'user-2' || targetUser.name.toLowerCase().includes('sahil')) {
      if (val === 'user-2' || val.includes('sahil')) return true;
    }
    return false;
  };

  // Active recipient user object if in Direct Message mode
  const activeRecipient = useMemo(() => {
    if (activeChatTarget === 'team') return null;
    return users.find(u => u.id === activeChatTarget || isUserMatch(activeChatTarget, u)) || null;
  }, [activeChatTarget, users]);

  // Online count across team
  const onlineCount = users.filter(u => u.presence === 'online').length;

  // Other colleagues for Direct Messaging
  const otherMembers = useMemo(() => {
    return users.filter(u => u.id !== currentUser.id && u.email !== currentUser.email);
  }, [users, currentUser]);

  // Direct message summaries for sidebar items (latest message snippet & timestamp)
  const membersWithDmMeta = useMemo(() => {
    return otherMembers.map(member => {
      const dms = messages.filter(m => {
        const fromMe = isUserMatch(m.senderId, currentUser) && isUserMatch(m.recipientId, member);
        const toMe = isUserMatch(m.senderId, member) && isUserMatch(m.recipientId, currentUser);
        return fromMe || toMe;
      });

      const lastMessage = dms.length > 0 ? dms[dms.length - 1] : null;
      const unreadCount = dms.filter(m => isUserMatch(m.senderId, member) && activeChatTarget !== member.id).length;

      return {
        ...member,
        lastMessage,
        unreadCount
      };
    });
  }, [otherMembers, messages, currentUser, activeChatTarget]);

  // Check if any teammate sent a direct message while looking at Team Chat
  const pendingDmNotification = useMemo(() => {
    if (activeChatTarget !== 'team') return null;
    const directMessagesToMe = messages.filter(m =>
      m.recipientId && isUserMatch(m.recipientId, currentUser) && !isUserMatch(m.senderId, currentUser)
    );
    if (directMessagesToMe.length === 0) return null;
    const latest = directMessagesToMe[directMessagesToMe.length - 1];
    const sender = users.find(u => isUserMatch(latest.senderId, u));
    return {
      sender,
      message: latest
    };
  }, [activeChatTarget, messages, currentUser, users]);

  // Filter messages by active conversation:
  // - 'team': strictly universal #team-chat messages (no recipientId, and channelId === 'ch-team-chat')
  // - Direct Message: strictly messages between currentUser and activeRecipient
  const conversationMessages = useMemo(() => {
    if (activeChatTarget === 'team') {
      return messages.filter(m => !m.recipientId && (!m.channelId || m.channelId === 'ch-team-chat'));
    }
    if (!activeRecipient) return [];
    return messages.filter(m => {
      const fromMeToRecipient = isUserMatch(m.senderId, currentUser) && isUserMatch(m.recipientId, activeRecipient);
      const fromRecipientToMe = isUserMatch(m.senderId, activeRecipient) && isUserMatch(m.recipientId, currentUser);
      return fromMeToRecipient || fromRecipientToMe;
    });
  }, [messages, activeChatTarget, activeRecipient, currentUser]);

  // Apply in-thread text search if active
  const displayedMessages = useMemo(() => {
    if (!inThreadSearch.trim()) return conversationMessages;
    return conversationMessages.filter(m =>
      m.text.toLowerCase().includes(inThreadSearch.toLowerCase())
    );
  }, [conversationMessages, inThreadSearch]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages.length, activeChatTarget]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (activeRecipient) {
      // 1-on-1 Direct Message addressed specifically to active recipient's ID
      sendMessage(inputText.trim(), undefined, activeRecipient.id);
    } else {
      // Universal Team Chat Channel
      sendMessage(inputText.trim(), 'ch-team-chat');
    }

    setInputText('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(MESSAGES_TABLE_SQL);
    addToast('SQL Copied to Clipboard 📋', 'Paste this into Supabase SQL Editor and click Run.', 'success');
  };

  return (
    <div className="flex-1 min-h-0 w-full h-full flex overflow-hidden bg-slate-50 font-sans select-none relative">
      {/* =========================================================================
          LEFT SIDEBAR: CHANNELS & DIRECT MESSAGES BY ID
          ========================================================================= */}
      <div
        className={`w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 transition-all duration-300 md:static fixed inset-y-0 left-0 shadow-lg md:shadow-none ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Conversations</h2>
              <p className="text-[11px] text-slate-400 font-medium">Chat & Direct Messages</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 chat-scrollbar">
          {/* CHANNELS SECTION */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Channels</span>
              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">1</span>
            </div>
            <button
              onClick={() => {
                setActiveChatTarget('team');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeChatTarget === 'team'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activeChatTarget === 'team' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Hash className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs truncate">Team Chat</p>
                  <p className="text-[10px] text-slate-400 truncate font-normal">All team members</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            </button>
          </div>

          {/* DIRECT MESSAGES SECTION (BY MEMBER ID) */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Direct Messages</span>
              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">
                {membersWithDmMeta.length}
              </span>
            </div>

            <div className="space-y-1 mt-1">
              {membersWithDmMeta.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400 italic">No other members registered.</p>
              ) : (
                membersWithDmMeta.map(member => {
                  const isSelected = activeChatTarget === member.id || isUserMatch(activeChatTarget, member);
                  const isOnline = member.presence === 'online';
                  const isOnBreak = member.presence === 'break';

                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        setActiveChatTarget(member.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200/80 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <img
                            src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                              isOnline ? 'bg-emerald-500' : isOnBreak ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-xs truncate font-semibold">{member.name}</p>
                              {member.role === 'manager' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                                  MGR
                                </span>
                              )}
                            </div>
                            {member.lastMessage && (
                              <span className="text-[9px] text-slate-400 font-normal tabular-nums flex-shrink-0">
                                {member.lastMessage.timestamp}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className="text-[10px] text-slate-400 truncate font-normal">
                              {member.lastMessage
                                ? `${isUserMatch(member.lastMessage.senderId, currentUser) ? 'You: ' : ''}${member.lastMessage.text}`
                                : (member.title || 'Team Member')}
                            </p>
                            {member.unreadCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex-shrink-0">
                                {member.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ml-1 text-slate-400 flex-shrink-0 ${isSelected ? 'text-emerald-700' : 'opacity-0 hover:opacity-100'}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Current User Footnote */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{currentUser.role} • Active</p>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-10 md:hidden"
        />
      )}

      {/* =========================================================================
          RIGHT CHAT CANVAS
          ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        {/* TOP BAR: CONVERSATION HEADER */}
        <div className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Open Channels & Direct Messages"
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeChatTarget === 'team' ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-soft-sm border border-emerald-100">
                  <Hash className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight truncate flex items-center gap-2">
                    Team Chat
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      # Universal
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span className="font-semibold text-emerald-800">{onlineCount} Online</span>
                    <span>•</span>
                    <span>{users.length} Members</span>
                  </p>
                </div>
              </div>
            ) : (
              activeRecipient && (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={activeRecipient.avatar}
                      alt={activeRecipient.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/20 shadow-soft-sm"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ring-2 ring-white ${
                        activeRecipient.presence === 'online'
                          ? 'bg-emerald-500'
                          : activeRecipient.presence === 'break'
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight truncate flex items-center gap-2">
                      {activeRecipient.name}
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full capitalize">
                        {activeRecipient.role}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {activeRecipient.title || 'Team Member'} • Direct Message
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2">
            {conversationMessages.length > 0 && activeChatTarget === 'team' && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all messages from Team Chat?')) {
                    clearMessages();
                  }
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Clear all messages from Team Chat"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            )}

            <button
              onClick={() => setIsThreadSearchOpen(!isThreadSearchOpen)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isThreadSearchOpen
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Search in conversation"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actionable Banner: Direct Message received while on Team Chat */}
        {pendingDmNotification && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in z-10 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-soft-sm">
                💬
              </div>
              <div className="min-w-0">
                <p className="font-bold text-emerald-950 truncate">
                  Direct message from {pendingDmNotification.sender?.name || 'Team Member'}
                </p>
                <p className="text-[11px] text-emerald-800 truncate font-normal">
                  "{pendingDmNotification.message.text}"
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveChatTarget(pendingDmNotification.sender?.id || pendingDmNotification.message.senderId)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex-shrink-0 cursor-pointer shadow-soft-sm hover:shadow"
            >
              Open Direct Chat →
            </button>
          </div>
        )}

        {/* Database Missing Notice Banner */}
        {isMessagesTableMissing && !isNoticeDismissed && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in z-10 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="truncate">
                <span className="font-bold">Database Setup Notice:</span> The <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">public.messages</code> table is not yet created in your Supabase database.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 text-[11px] shadow-2xs transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Copy SQL Script
              </button>
              <a
                href="https://supabase.com/dashboard/project/xdwkcybxgqdtnpnypxfj/sql"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-semibold flex items-center gap-1 text-[11px] transition-colors"
              >
                Open SQL Editor
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setIsNoticeDismissed(true)}
                className="p-1 rounded text-amber-600 hover:text-amber-900"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Slide-down In-Chat Search Bar */}
        {isThreadSearchOpen && (
          <div className="px-4 sm:px-6 py-2 bg-white border-b border-slate-200 flex items-center gap-2 flex-shrink-0 animate-in fade-in slide-in-from-top-1 z-10">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={inThreadSearch}
              onChange={e => setInThreadSearch(e.target.value)}
              placeholder="Search messages in this thread..."
              className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none"
              autoFocus
            />
            {inThreadSearch && (
              <button
                onClick={() => setInThreadSearch('')}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                setIsThreadSearchOpen(false);
                setInThreadSearch('');
              }}
              className="text-xs text-emerald-700 font-bold px-2 py-0.5 hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* MESSAGES STREAM CANVAS */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-8 max-w-4xl w-full mx-auto space-y-4 chat-scrollbar">
          {displayedMessages.length > 0 && (
            <div className="flex justify-center sticky top-1 z-10 pointer-events-none my-2">
              <span className="px-3 py-1 rounded-full bg-white/95 text-slate-500 shadow-2xs border border-slate-200 text-xs font-semibold uppercase tracking-wider">
                Today
              </span>
            </div>
          )}

          {displayedMessages.length === 0 ? (
            <div className="h-3/4 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-emerald-600 mb-3 border border-slate-100">
                {activeRecipient ? <UserIcon className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
              </div>
              <p className="text-sm font-bold text-slate-800">
                {activeRecipient ? `No direct messages with ${activeRecipient.name} yet` : 'No team messages yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                {activeRecipient
                  ? `Say hello to ${activeRecipient.name} (${activeRecipient.title || 'Team Member'})! Direct messages between your IDs appear here.`
                  : 'Start the conversation! Everyone added to the team can participate in this channel.'}
              </p>
            </div>
          ) : (
            displayedMessages.map(msg => {
              const sender = users.find(u => isUserMatch(msg.senderId, u));
              const isMe = isUserMatch(msg.senderId, currentUser) || (currentUser.name && msg.senderName === currentUser.name);
              const isAnnouncement = msg.text.startsWith('🎉 Welcome');

              // System auto-onboarding announcement card
              if (isAnnouncement) {
                return (
                  <div key={msg.id} className="flex justify-center my-3">
                    <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-2xl px-4 py-2.5 max-w-md shadow-2xs text-xs flex items-center gap-2.5">
                      <span className="text-base flex-shrink-0">🎉</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-emerald-900 leading-snug">{msg.text}</p>
                        <span className="text-[10px] text-emerald-700/80 mt-0.5 block">{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Sender details resolution
              const senderName = isMe ? currentUser.name : (msg.senderName || sender?.name || 'Team Member');
              const senderAvatar = isMe
                ? currentUser.avatar
                : (msg.senderAvatar || sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
              const senderRole = isMe ? currentUser.role : (msg.senderRole || sender?.role);
              const senderTitle = isMe ? currentUser.title : (msg.senderTitle || sender?.title);

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <img
                      src={senderAvatar}
                      alt={senderName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 mt-0.5 flex-shrink-0 shadow-2xs"
                    />
                  )}

                  <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender Header */}
                    <div className={`flex items-center gap-1.5 mb-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {isMe ? (
                        <>
                          {senderRole === 'manager' ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider">
                              Manager
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {senderTitle || 'Employee'}
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900 tracking-tight">
                            {senderName} <span className="text-emerald-700 font-semibold">(You)</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-slate-900 tracking-tight">
                            {senderName}
                          </span>
                          {senderRole === 'manager' ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider">
                              Manager
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {senderTitle || 'Employee'}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-soft-sm leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                      }`}
                    >
                      <p
                        className={`text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                          isMe ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {msg.text}
                      </p>

                      <div
                        className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 text-[10px] select-none ${
                          isMe ? 'text-emerald-100/90' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-200 inline-block" />}
                      </div>
                    </div>
                  </div>

                  {isMe && (
                    <img
                      src={senderAvatar}
                      alt={senderName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30 mt-0.5 flex-shrink-0 shadow-2xs"
                    />
                  )}
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reaction Emojis Drawer */}
        {showEmojiPicker && (
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-center gap-1.5 flex-wrap flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
              Quick React:
            </span>
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleAddEmoji(emoji)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-base transition-transform active:scale-125 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* FIXED BOTTOM INPUT BAR */}
        <div className="bg-white border-t border-slate-200 flex-shrink-0 z-10">
          <form
            onSubmit={handleSend}
            className="max-w-4xl mx-auto p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
          >
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                showEmojiPicker
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Emoji Reactions"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                activeRecipient
                  ? `Direct message to ${activeRecipient.name}...`
                  : 'Type a message to the team...'
              }
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-soft transition-all active:scale-95 cursor-pointer flex-shrink-0"
              title="Send (Enter)"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
