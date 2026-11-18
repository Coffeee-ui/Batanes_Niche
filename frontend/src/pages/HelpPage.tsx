import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Mail, Phone, MapPin, Search } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
  category: 'seeker' | 'employer' | 'general';
}

const FAQS: FAQ[] = [
  {
    category: 'general',
    q: 'What is Batanes Niche?',
    a: 'Batanes Niche is a dedicated hyper-localized employment platform built specifically for the province of Batanes, covering all six municipalities: Basco, Itbayat, Ivana, Mahatao, Sabtang, and Uyugan.',
  },
  {
    category: 'seeker',
    q: 'How do I apply for a job?',
    a: 'Create a free Job Seeker account, fill in your profile details or upload your CV, and click "Apply" on any active vacancy. You can provide a custom cover letter and answer any vacancy-specific screening questions.',
  },
  {
    category: 'seeker',
    q: 'Is my CV / resume public?',
    a: 'No. Your CV and full contact details are strictly private. Employers can only access your CV after you actively submit an application to one of their vacancies.',
  },
  {
    category: 'seeker',
    q: 'What does Candidate Discoverability mean?',
    a: 'When discoverability is turned on, verified Batanes employers can discover your public summary (name, municipality, skills, and work experience) in talent searches. Your contact info and CV remain hidden until you apply.',
  },
  {
    category: 'employer',
    q: 'How many active featured vacancies can an employer have?',
    a: 'Each verified employer can have up to 3 active featured vacancies simultaneously. Featured vacancies are shown prominently on the homepage and at the top of search results.',
  },
  {
    category: 'employer',
    q: 'How do candidate pipeline stages work?',
    a: 'When an applicant applies, their application starts in the "Submitted" stage. You can progressively move candidates through Reviewing, Shortlisted, Interview, and Hired or Rejected stages.',
  },
  {
    category: 'employer',
    q: 'Can I conduct in-person and online interviews?',
    a: 'Yes. When sending an interview invitation, you can select whether the interview is In-Person (with physical address/landmark in Batanes) or Online/Phone, including exact date and time.',
  },
  {
    category: 'general',
    q: 'How do I recover my password if I forget it?',
    a: 'Visit the Forgot Password page, enter your registered email, and a secure 6-digit verification code will be sent to your inbox. Once entered, you can immediately set a new password.',
  },
];

export default function HelpPage() {
  const [filter, setFilter] = useState<'all' | 'seeker' | 'employer'>('all');
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter(faq => {
    if (filter !== 'all' && faq.category !== filter && faq.category !== 'general') return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return faq.q.toLowerCase().includes(s) || faq.a.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="container-page py-12 space-y-10 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Help & Frequently Asked Questions
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Find answers to common questions about finding work, posting vacancies, and hiring talent in Batanes.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 rounded-2xl border border-border bg-surface space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs and help topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 text-sm w-full"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            All Questions
          </button>
          <button
            type="button"
            onClick={() => setFilter('seeker')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === 'seeker'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            For Job Seekers
          </button>
          <button
            type="button"
            onClick={() => setFilter('employer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === 'employer'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            For Employers
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="card rounded-2xl border border-border bg-surface overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4"
              >
                <span className="text-sm font-bold text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support Section */}
      <div className="card p-6 sm:p-8 rounded-2xl border border-primary/20 bg-primary/5 text-center space-y-4">
        <h3 className="text-lg font-bold text-foreground">Still need help?</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Our local support team is ready to assist you with any questions regarding registration, job postings, or account management.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Mail className="w-4 h-4 text-primary" /> [EMAIL]
          </span>
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <MapPin className="w-4 h-4 text-primary" /> Basco, Batanes, Philippines
          </span>
        </div>
      </div>
    </div>
  );
}
