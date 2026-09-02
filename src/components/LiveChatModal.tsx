import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Send, Bot, User as UserIcon, Clock, CheckCheck, HelpCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  text: string;
  timestamp: string;
}

export const LiveChatModal: React.FC = () => {
  const { activeModal, setActiveModal, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'support',
      senderName: 'CapitalNest Support',
      text: 'Namaste! Welcome to CapitalNest Nepal customer desk. How can we assist you with your investments, deposits, or account today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeModal === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeModal]);

  if (activeModal !== 'chat') return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      senderName: user?.fullName || 'You',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Auto smart response from assistant
    setTimeout(() => {
      let reply = 'Thank you for reaching out! A senior account manager has received your query and will respond shortly.';
      const lower = userMsg.text.toLowerCase();

      if (lower.includes('deposit') || lower.includes('esewa') || lower.includes('khalti') || lower.includes('bank')) {
        reply = 'Deposits are credited to your wallet balance once our treasury verifies your transaction reference ID. Standard turnaround time is 10–30 minutes.';
      } else if (lower.includes('withdraw') || lower.includes('payout')) {
        reply = 'Withdrawals can be requested anytime from your available balance. Minimum withdrawal is NPR 500, processed directly to your Nepali bank or eSewa/Khalti.';
      } else if (lower.includes('kyc') || lower.includes('verify') || lower.includes('nagarikta')) {
        reply = 'You can submit your Citizenship (Nagarikta), NID, or Passport scan in the Profile > KYC section. Verification takes under 2 hours during business days.';
      } else if (lower.includes('plan') || lower.includes('profit') || lower.includes('return') || lower.includes('interest')) {
        reply = 'Our fixed return plans offer returns from 12% up to 28% net yield, with daily returns automatically credited directly to your accessible wallet balance.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'support',
          senderName: 'CapitalNest Support Specialist',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-slate-950/50 backdrop-blur-xs">
      <div className="w-full sm:w-96 h-[520px] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900 animate-in slide-in-from-bottom-6">
        {/* Chat Header */}
        <div className="bg-[#0B192C] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                CN
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0B192C]" />
            </div>
            <div>
              <h4 className="font-bold text-xs font-display">CapitalNest Desk</h4>
              <span className="text-[10px] text-emerald-400 font-medium">Online • Instant Support</span>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] p-3 rounded-2xl shadow-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#0B192C] text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                <div className="text-[10px] font-bold text-amber-500 mb-0.5">
                  {m.senderName}
                </div>
                <p>{m.text}</p>
                <div
                  className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                    m.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-amber-400" />}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white p-2.5 rounded-xl w-24 border border-slate-200 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
