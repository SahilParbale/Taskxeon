import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  Smile,
  X,
  Trash2
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🚀', '🎉', '🔥', '👏', '🙏', '💯', '✨', '💡', '✅', '🙌'];

export const MessagesPage: React.FC = () => {
  const {
    users,
    currentUser,
    messages,
    sendMessage,
    clearMessages
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [inThreadSearch, setInThreadSearch] = useState('');
  const [isThreadSearchOpen, setIsThreadSearchOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Online count across all members
  const onlineCount = users.filter(u => u.presence === 'online').length;

  // Filter within chat if thread search is used
  const displayedMessages = inThreadSearch.trim()
    ? messages.filter(m => m.text.toLowerCase().includes(inThreadSearch.toLowerCase()))
    : messages;

  // Auto scroll to bottom STRICTLY within the chat messages container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText.trim(), 'ch-team-chat');
    setInputText('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden bg-slate-50 font-sans select-none relative">
      {/* =========================================================================
          TOP BAR: TEAM CHAT HEADER (FIXED 64px, NEVER SCROLLS)
          ========================================================================= */}
      <div className="h-16 px-4 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-soft-sm border border-emerald-100">
            <MessageSquare className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">
              Team Chat
            </h2>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="font-semibold text-emerald-800">{onlineCount} Online</span>
              <span>•</span>
              <span>{users.length} Members</span>
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
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
            title="Search in messages"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide-down In-Chat Search Bar */}
      {isThreadSearchOpen && (
        <div className="px-4 sm:px-8 py-2 bg-white border-b border-slate-200 flex items-center gap-2 flex-shrink-0 animate-in fade-in slide-in-from-top-1 z-10">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inThreadSearch}
            onChange={e => setInThreadSearch(e.target.value)}
            placeholder="Search messages..."
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

      {/* =========================================================================
          MESSAGES STREAM CANVAS (ONLY THIS CONTAINER SCROLLS VERTICALLY)
          ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-8 max-w-5xl w-full mx-auto space-y-4 chat-scrollbar">
        {/* Centered Date Badge */}
        {displayedMessages.length > 0 && (
          <div className="flex justify-center sticky top-1 z-10 pointer-events-none my-2">
            <span className="px-3 py-1 rounded-full bg-white/95 text-slate-500 shadow-2xs border border-slate-200 text-xs font-semibold uppercase tracking-wider">
              Today
            </span>
          </div>
        )}

        {displayedMessages.length === 0 ? (
          <div className="h-3/4 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-soft flex items-center justify-center text-emerald-600 mb-3 border border-slate-100">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No messages yet</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Start the conversation! Everyone added to the team can participate here.
            </p>
          </div>
        ) : (
          displayedMessages.map(msg => {
            const sender = users.find(u => u.id === msg.senderId);
            const isMe = msg.senderId === currentUser.id;
            const isAnnouncement = msg.text.startsWith('🎉 Welcome');

            // System auto-onboarding announcement card (triggered from My Team page)
            if (isAnnouncement) {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-2xl px-4 py-2.5 max-w-md shadow-2xs text-xs flex items-center gap-2.5">
                    <span className="text-base flex-shrink-0">🎉</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-emerald-900 leading-snug">
                        {msg.text}
                      </p>
                      <span className="text-[10px] text-emerald-700/80 mt-0.5 block">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Sender details resolution
            const senderName = isMe
              ? currentUser.name
              : (msg.senderName || sender?.name || 'Team Member');
            const senderAvatar = isMe
              ? currentUser.avatar
              : (msg.senderAvatar || sender?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
            const senderRole = isMe
              ? currentUser.role
              : (msg.senderRole || sender?.role);
            const senderTitle = isMe
              ? currentUser.title
              : (msg.senderTitle || sender?.title);

            // Regular chat messages with sender name visible on all messages
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
                  {/* Sender Name & Role Header */}
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
                      {isMe && (
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-200 inline-block" />
                      )}
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

      {/* =========================================================================
          FIXED BOTTOM INPUT BAR (NEVER SCROLLS, ALWAYS PINNED AT BOTTOM)
          ========================================================================= */}
      <div className="bg-white border-t border-slate-200 flex-shrink-0 z-10">
        <form
          onSubmit={handleSend}
          className="max-w-5xl mx-auto p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
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
            placeholder="Type a message to the team..."
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
  );
};
