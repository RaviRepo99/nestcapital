import React, { useState } from 'react';
import { FAQS } from '../data/faqs';
import { HelpCircle, ChevronDown, Search, Sparkles } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(FAQS[0].id);

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General & Concept' },
    { id: 'investment', label: 'Investments & Returns' },
    { id: 'deposit_withdrawal', label: 'Deposits & Withdrawals' },
    { id: 'security_legal', label: 'Security & Legal' },
  ];

  const filtered = FAQS.filter((f) => {
    const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchSearch =
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 text-xs font-bold">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Everything you need to know about investing, returns, payment gateways, and security at CapitalNest Nepal.
        </p>
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or keywords (e.g. deposit, eSewa, payout, minimum)..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-xs text-slate-900 shadow-xs focus:border-amber-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-[#0B192C] text-amber-400 font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No FAQ questions match your search.
          </div>
        ) : (
          filtered.map((faq) => {
            const isOpen = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition shadow-xs"
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-amber-600 transition"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
