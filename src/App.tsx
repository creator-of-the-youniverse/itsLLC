/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Activity, 
  CheckCircle, 
  ArrowRight, 
  Code, 
  Zap, 
  Briefcase, 
  Trash2, 
  RefreshCw, 
  Shield, 
  Sliders, 
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Database,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Send,
  User,
  Coffee,
  Check,
  Menu,
  X,
  Calendar,
  Copy,
  Download,
  Smartphone,
  HelpCircle,
  Clock,
  DollarSign,
  Calculator,
  ChevronLeft,
  Star,
  Quote,
  TrendingUp,
  MessageSquare,
  Mail,
  Phone,
  RotateCcw,
  Globe
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleSignIn, 
  logout, 
  initAuth, 
  getAccessToken 
} from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  setDoc 
} from 'firebase/firestore';

// Log event definition for bottom technical dashboard
interface LogEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
  message: string;
}

// Case study structure
interface CaseStudy {
  id: string;
  name: string;
  category: string;
  challenge: string;
  built: string;
  outcome: string;
  metrics: { value: string; label: string }[];
  accentColor: string;
  externalUrl?: string;
}

// Typewriter effect component to simulate real-time LLM stream
function TypewriterText({ text, speed = 12 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        const nextText = text.slice(0, index + 1);
        index++;
        if (index >= text.length) {
          clearInterval(interval);
        }
        return nextText;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  const isTyping = displayedText.length < text.length;

  return (
    <span>
      {displayedText}
      {isTyping && <span className="animate-pulse text-indigo-500 ml-0.5 font-bold">▊</span>}
    </span>
  );
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Project Estimator types & options
interface EstimatorScopeOption {
  id: string;
  name: string;
  desc: string;
  basePrice: number;
  timeline: string;
  icon: any;
}

interface EstimatorAddonOption {
  id: string;
  name: string;
  desc: string;
  price: number;
  monthlyPrice?: number;
  icon: any;
}

const ESTIMATOR_SCOPES: EstimatorScopeOption[] = [
  {
    id: 'micro',
    name: 'Targeted Fix / Micro-Sprint',
    desc: 'Single automation flow, API integration, database hook, or isolated bug fix',
    basePrice: 500,
    timeline: '2–4 days',
    icon: Code
  },
  {
    id: 'landing',
    name: 'High-Converting Landing Stack',
    desc: 'Single-page responsive sales funnel, ultra-fast UI, and lead intake pipeline',
    basePrice: 1250,
    timeline: '3–7 days',
    icon: Zap
  },
  {
    id: 'website',
    name: 'Custom Business Website',
    desc: 'Multi-section bespoke React application, brand showcase, and responsive styling',
    basePrice: 2500,
    timeline: '7–14 days',
    icon: Layers
  },
  {
    id: 'portal',
    name: 'Full-Stack App / Custom Portal',
    desc: 'Custom client dashboard, authenticated roles, database schemas, and workflows',
    basePrice: 4500,
    timeline: '2–4 weeks',
    icon: Cpu
  }
];

const ESTIMATOR_ADDONS: EstimatorAddonOption[] = [
  {
    id: 'ai_agent',
    name: 'Autonomous Embedded AI Agent',
    desc: 'Custom-trained 24/7 lead qualification, booking, or triage agent (+ $150/mo active runtime & LLM token allowance)',
    price: 750,
    monthlyPrice: 150,
    icon: Sparkles
  },
  {
    id: 'calendar',
    name: 'Google Calendar & OAuth Sync',
    desc: 'Bi-directional real-time calendar slot reservation and attendee invitations',
    price: 500,
    icon: Calendar
  },
  {
    id: 'stripe',
    name: 'Stripe Webhooks & Invoicing',
    desc: 'Automated checkout flows, subscription management, and webhook handling',
    price: 600,
    icon: DollarSign
  },
  {
    id: 'pwa',
    name: 'PWA Mobile App Packaging',
    desc: 'Offline caching, service worker, and home screen install capability',
    price: 450,
    icon: Smartphone
  },
  {
    id: 'database',
    name: 'Hardened Database (Firestore/SQL)',
    desc: 'Relational/document schemas, ABAC security rules, and real-time streams',
    price: 500,
    icon: Database
  },
  {
    id: 'rush',
    name: 'Priority Rush Sprint Acceleration',
    desc: 'Dedicated single-focus execution with guaranteed expedited delivery',
    price: 750,
    icon: Clock
  }
];

// Founder Testimonials definition highlighting speed and business outcomes
interface Testimonial {
  id: string;
  author: string;
  role: string;
  company: string;
  avatarText: string;
  avatarGradient: string;
  speedMetric: string;
  businessOutcome: string;
  quote: string;
  projectScope: string;
  techHighlight: string;
  metrics: { label: string; value: string }[];
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'apex-logistics',
    author: 'Marcus Vance',
    role: 'Co-Founder & CEO',
    company: 'Apex Logistics Cloud',
    avatarText: 'MV',
    avatarGradient: 'from-blue-600 to-indigo-600',
    speedMetric: '5-Day Full Delivery',
    businessOutcome: '+38% Converted Bookings in Month 1',
    projectScope: 'Custom Intake Engine & Calendar Sync',
    techHighlight: 'Zero-Middlemen Architecture',
    metrics: [
      { label: 'Turnaround Time', value: '5 Days' },
      { label: 'Booking Surge', value: '+38%' },
      { label: 'Saved vs Agency', value: '$19,000' }
    ],
    quote: "Traditional web agencies told us it would take 10 weeks and $25,000 for a custom intake engine. Sean sat down, understood our logistics workflow on day one, and delivered the full production build in under a week. We saw a 38% increase in converted high-ticket bookings within 30 days of going live."
  },
  {
    id: 'lumina-health',
    author: 'Dr. Elena Rostova',
    role: 'Founder & Medical Director',
    company: 'Lumina Health Systems',
    avatarText: 'ER',
    avatarGradient: 'from-emerald-600 to-teal-600',
    speedMetric: '4-Day Micro-Sprint',
    businessOutcome: '16 Hours Saved Every Week',
    projectScope: 'Autonomous AI Patient Qualifier & Portal',
    techHighlight: 'Hardened Firestore & HIPAA Rules',
    metrics: [
      { label: 'Sprint Speed', value: '4 Days' },
      { label: 'Weekly Time Saved', value: '16 hrs' },
      { label: 'Payback Period', value: '10 Days' }
    ],
    quote: "Our staff was sinking 15+ hours every week manually sorting and following up on patient inquiries. Sean built an autonomous qualification agent that pre-screens patients and logs them straight to our database 24/7. It paid for itself within the first 10 days of deployment."
  },
  {
    id: 'vaultwave',
    author: 'Julian Chen',
    role: 'Founder & CTO',
    company: 'VaultWave Payments',
    avatarText: 'JC',
    avatarGradient: 'from-violet-600 to-purple-600',
    speedMetric: '9-Day Launch to Revenue',
    businessOutcome: '$44,000 New Pipeline Generated',
    projectScope: 'High-Converting SaaS Landing Stack + Stripe Webhooks',
    techHighlight: '100% Google Lighthouse Score',
    metrics: [
      { label: 'Launch Speed', value: '9 Days' },
      { label: 'Pipeline Closed', value: '$44,000' },
      { label: 'Page Load Speed', value: '0.4s' }
    ],
    quote: "Working directly with Sean without account managers was night and day. He moved faster than our internal team could write tickets. The site hit a perfect 100 Google Lighthouse score on launch day and helped us close $44,000 in pipeline in the first two weeks."
  },
  {
    id: 'clearpath',
    author: 'Sarah Jenkins',
    role: 'Managing Partner',
    company: 'ClearPath Advisory Group',
    avatarText: 'SJ',
    avatarGradient: 'from-amber-600 to-rose-600',
    speedMetric: '48-Hour Rapid Delivery',
    businessOutcome: '$1,800/mo Retainer Eradicated',
    projectScope: 'Bespoke Client Portal & Document Vault',
    techHighlight: 'Zero-Vendor-Lockin Codebase',
    metrics: [
      { label: 'Delivery Time', value: '48 Hours' },
      { label: 'Monthly Savings', value: '$1,800/mo' },
      { label: 'Code Ownership', value: '100%' }
    ],
    quote: "We were trapped in an expensive agency retainer that took two weeks just to change copy. Sean rebuilt our entire platform cleanly in modern TypeScript. No monthly agency bloat, 100% code ownership, and instantaneous load times. Easily the best engineering investment we made this year."
  },
  {
    id: 'forgeai',
    author: 'Darius Miller',
    role: 'Founder',
    company: 'ForgeAI Commerce',
    avatarText: 'DM',
    avatarGradient: 'from-indigo-600 to-cyan-600',
    speedMetric: '7-Day Complete MVP',
    businessOutcome: '4.2x Faster Conversion Velocity',
    projectScope: 'AI Product Recommender & PWA Mobile App',
    techHighlight: 'Progressive Web App Offline Caching',
    metrics: [
      { label: 'MVP Velocity', value: '7 Days' },
      { label: 'Conversion Lift', value: '4.2x' },
      { label: 'PWA Mobile Installs', value: '1,200+' }
    ],
    quote: "Most agencies give you endless Figma mockups that drag on for quarters. Sean delivered working code on a live staging URL on day two, and our live production store with embedded AI recommendation logic was accepting customers by day seven. Unreal velocity."
  }
];

export default function App() {
  // Theme state
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('theme-preference');
    return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>('Preparing It\'s LLC • itsllc.itsyouonline.com experience...');
  const [isLoaderFading, setIsLoaderFading] = useState<boolean>(false);
  const [hydrationProgress, setHydrationProgress] = useState<number>(10);
  const [showHydrationBar, setShowHydrationBar] = useState<boolean>(true);
  const [speed, setSpeed] = useState<'normal' | 'slow' | 'cinematic' | 'instant'>('normal');
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [currentTab, setCurrentTab] = useState<'website' | 'ai_agent' | 'productivity' | 'calendar'>('website');

  // Google Calendar & Firebase States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [calendarAccessToken, setCalendarAccessToken] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [firestoreBookings, setFirestoreBookings] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState<boolean>(false);
  const [isBookingInProgress, setIsBookingInProgress] = useState<boolean>(false);
  const [bookingSubject, setBookingSubject] = useState<string>('It\'s LLC Strategy Consultation');
  const [bookingDesc, setBookingDesc] = useState<string>('Reviewing business system automations with Sean');
  const [bookingDate, setBookingDate] = useState<string>('2026-07-09');
  const [bookingTime, setBookingTime] = useState<string>('10:00');
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [aiScenario, setAiScenario] = useState<'builds' | 'ai_pricing' | 'schedule'>('builds');
  const [aiScenarioActive, setAiScenarioActive] = useState<boolean>(false);
  const [aiLogs, setAiLogs] = useState<{
    id: string;
    sender: 'user' | 'agent' | 'system';
    text: string;
    isError?: boolean;
    booking?: {
      bookingId: string;
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      projectType: string;
      summary: string;
      date: string;
      time: string;
      startIso: string;
      endIso: string;
      notes?: string;
      preferredSubdomain?: string;
      multiverseUrl?: string;
      calendarInviteUrl: string;
      hostEmail: string;
      hostPhone: string;
    };
    estimate?: {
      scopeId: string;
      scopeName: string;
      addonIds: string[];
      oneTimeTotal: number;
      monthlyTotal: number;
      timeline: string;
      preferredSubdomain?: string;
      multiverseUrl?: string;
    };
  }[]>([
    {
      id: 'init-1',
      sender: 'system',
      text: "Gemini 4 Hydrogen Concierge • It's LLC (itsllc.itsyouonline.com) • $500 min • 603-851-2057"
    },
    {
      id: 'init-2',
      sender: 'agent',
      text: "Hey! I'm Sean Holbrook's AI Solutions Architect for It's LLC. Ask me about any build type ($500 Micro-Sprints to $4,500+ AI Portals), hosting inside the upcoming ItsYouOnline.com Multiverse (<site>.itsyouonline.com), or share your name, email & preferred date/time to lock a call on the calendar!"
    }
  ]);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Expanded Case Study state for inline modal showcase
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  // Form states
  const [budgetVal, setBudgetVal] = useState<number>(15000);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>(['Custom Business Websites']);
  const [projectGoals, setProjectGoals] = useState<string>('');
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  // FAQ Accordion states
  const [openFaqIds, setOpenFaqIds] = useState<string[]>(['faq-costs', 'faq-timelines']);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<'all' | 'costs' | 'timelines' | 'process' | 'tech'>('all');

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
      addLog(`FAQ Accordion: ${exists ? 'Collapsed' : 'Expanded'} question [${id}]`, 'info');
      return updated;
    });
  };

  // Mock showcase live metrics interactive states
  const [liveConversions, setLiveConversions] = useState<number>(452);
  const [liveLeads, setLiveLeads] = useState<number>(28);
  const [isAutomating, setIsAutomating] = useState<boolean>(true);
  
  // Custom interactive panel states
  const [mockLayout, setMockLayout] = useState<'bento' | 'minimal'>('bento');
  const [mockAccent, setMockAccent] = useState<'indigo' | 'emerald' | 'amber'>('indigo');
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<number>(0);
  const [trafficMultiplier, setTrafficMultiplier] = useState<number>(1);
  const [testRunActive, setTestRunActive] = useState<boolean>(false);
  const [testRunStep, setTestRunStep] = useState<number>(-1);
  const [workflowPreset, setWorkflowPreset] = useState<'intake' | 'booking' | 'renewal'>('intake');
  const [workflowEventsCount, setWorkflowEventsCount] = useState<number>(142);
  const [workflowHoursSaved, setWorkflowHoursSaved] = useState<number>(18.5);
  const [workflowRunComplete, setWorkflowRunComplete] = useState<boolean>(false);
  const [autopilotPulseStep, setAutopilotPulseStep] = useState<number>(0);
  const [mockFormName, setMockFormName] = useState<string>('');
  const [mockFormEmail, setMockFormEmail] = useState<string>('');
  const [mockFormSubmitted, setMockFormSubmitted] = useState<boolean>(false);
  const [customAiInput, setCustomAiInput] = useState<string>('');
  const [isCalendarDemo, setIsCalendarDemo] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(8);
  const [isLivePreviewRefreshing, setIsLivePreviewRefreshing] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const aiTerminalScrollRef = useRef<HTMLDivElement>(null);
  const drawerAiTerminalScrollRef = useRef<HTMLDivElement>(null);

  const consoleLogsRef = useRef<HTMLDivElement>(null);

  // Add build activity and interaction logs
  const addLog = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padEnd(3, '0').slice(0, 3)}`;
    const newLog: LogEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: timeStr,
      type,
      message
    };
    setLogs((prev) => [...prev.slice(-19), newLog]); // Cap logs pool to prevent memory pressure
  };

  // Project Estimator & Multiverse Subdomain states & calculations
  const [estimatorScope, setEstimatorScope] = useState<string>('landing');
  const [estimatorAddons, setEstimatorAddons] = useState<string[]>(['ai_agent', 'calendar']);
  const [multiverseSubdomain, setMultiverseSubdomain] = useState<string>('yourbrand');

  const sanitizeSubdomainSlug = (raw: string) =>
    raw
      .toLowerCase()
      .replace(/\.itsyouonline\.com$/i, '')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+/, '')
      .slice(0, 32);

  const activeSubdomainSlug = sanitizeSubdomainSlug(multiverseSubdomain).replace(/-+$/, '') || 'yourbrand';
  const activeMultiverseHost = `${activeSubdomainSlug}.itsyouonline.com`;

  const toggleEstimatorAddon = (addonId: string) => {
    setEstimatorAddons((prev) => {
      const exists = prev.includes(addonId);
      const updated = exists ? prev.filter((item) => item !== addonId) : [...prev, addonId];
      const foundAddon = ESTIMATOR_ADDONS.find((a) => a.id === addonId);
      addLog(`Estimator: ${exists ? 'Deselected' : 'Selected'} add-on [${foundAddon?.name || addonId}]`, 'info');
      return updated;
    });
  };

  const selectedScopeObj = ESTIMATOR_SCOPES.find((s) => s.id === estimatorScope) || ESTIMATOR_SCOPES[1];
  const addonsTotalCost = estimatorAddons.reduce((sum, id) => {
    const addon = ESTIMATOR_ADDONS.find((a) => a.id === id);
    return sum + (addon ? addon.price : 0);
  }, 0);
  // Guarantee $500 minimum strictly
  const rawEstimateTotal = selectedScopeObj.basePrice + addonsTotalCost;
  const finalEstimatedTotal = Math.max(500, rawEstimateTotal);

  const monthlyTotal = estimatorAddons.reduce((sum, id) => {
    const addon = ESTIMATOR_ADDONS.find((a) => a.id === id);
    return sum + (addon?.monthlyPrice || 0);
  }, 0);

  const handleApplyEstimateToContact = () => {
    setBudgetVal(finalEstimatedTotal);
    const addonNames = estimatorAddons.map((id) => ESTIMATOR_ADDONS.find((a) => a.id === id)?.name).filter(Boolean);
    setSelectedServices([selectedScopeObj.name, ...(addonNames.slice(0, 2) as string[])]);
    const addonSummary = addonNames.length > 0 ? `\nAdd-ons Selected: ${addonNames.join(', ')}` : '';
    const recurringMonthlyNote = monthlyTotal > 0 
      ? `\nMonthly AI Agent Runtime: $${monthlyTotal.toLocaleString()}/mo (covers high-performance LLM token costs, 24/7 autonomous inference uptime, & agent optimization)` 
      : `\nMonthly Agency Retainers: $0/mo (Standard self-hosted architecture; pay only wholesale cloud hosting)`;

    setProjectGoals(`[Instant Project Estimate]\nScope: ${selectedScopeObj.name} ($${selectedScopeObj.basePrice.toLocaleString()})\nEst. Delivery: ${selectedScopeObj.timeline}\nMultiverse Subdomain Reservation: https://${activeMultiverseHost} (ItsYouOnline.com Multiverse — coming soon)${addonSummary}\nOne-Time Build Total: $${finalEstimatedTotal.toLocaleString()} ($500 minimum baseline guaranteed)${recurringMonthlyNote}`);
    addLog(`Estimator: Applied $${finalEstimatedTotal.toLocaleString()} build + ${activeMultiverseHost} reservation to Contact form`, 'success');
    const contactElem = document.getElementById('contact');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Client Success Testimonial Carousel states
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState<number>(0);
  const [testimonialAutoPlay, setTestimonialAutoPlay] = useState<boolean>(true);

  const nextTestimonial = () => {
    setActiveTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    addLog(`Testimonials: Advanced to slide [${((activeTestimonialIdx + 1) % TESTIMONIALS.length) + 1}/${TESTIMONIALS.length}]`, 'info');
  };

  const prevTestimonial = () => {
    setActiveTestimonialIdx((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    addLog(`Testimonials: Moved back to slide [${((activeTestimonialIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length) + 1}/${TESTIMONIALS.length}]`, 'info');
  };

  useEffect(() => {
    if (!testimonialAutoPlay) return;
    const interval = setInterval(() => {
      setActiveTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [testimonialAutoPlay]);

  // PWA beforeinstallprompt event listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      addLog('PWA manifest & service worker active. App installation ready!', 'info');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      addLog('PWA Installed successfully on device!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      addLog('PWA Install: Prompt accepted by user.', 'success');
    } else {
      addLog('PWA Install: Prompt dismissed by user.', 'info');
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Case Studies content definitions
  const CASE_STUDIES: CaseStudy[] = [
    {
      id: 'bridge',
      name: 'Bridge Cafe',
      category: 'All-Day Breakfast Custom Ordering & Table Sync',
      challenge: 'A bustling local breakfast cafe wanting to scale online takeout orders without overwhelming their kitchen crew or introducing manual phone-tag order entry error.',
      built: 'A custom, fast online ordering site that coordinates orders instantly with a dedicated Back of House (BOH) tablet view.',
      outcome: 'Wiped out ordering delays by keeping the custom checkout page and the physical kitchen synced in real time, boosting breakfast ticket turnaround speed.',
      metrics: [
        { value: 'Instant', label: 'Customer-to-BOH Sync' },
        { value: 'Custom', label: 'Interactive Menu' },
        { value: '18%', label: 'Turnaround Boost' }
      ],
      accentColor: 'indigo',
      externalUrl: 'https://cafe.itsyouonline.com'
    },
    {
      id: 'shrink',
      name: 'Shrink',
      category: 'Small Business Stock Margin & Loss Audit App',
      challenge: 'Small retail and boutique business owners losing vital profits and inventory margins to untracked stock discrepancies and slow inventory response.',
      built: 'A lightweight, easy-to-use inventory tracking dashboard featuring automated smart audits to detect stock anomalies and keep store margins safe.',
      outcome: 'Empowered single-store owners and boutique managers to plug inventory leaks, trace stock issues instantly, and regain complete financial control over inventory margins.',
      metrics: [
        { value: '-42%', label: 'Untracked Loss' },
        { value: 'Daily', label: 'Loss Risk Audits' },
        { value: 'Zero', label: 'Manual Audits Needed' }
      ],
      accentColor: 'emerald',
      externalUrl: 'https://shrink.itsyouonline.com'
    }
  ];

  // FAQ Items definitions
  interface FaqItem {
    id: string;
    question: string;
    answer: string;
    category: 'costs' | 'timelines' | 'process' | 'tech';
    badge: string;
    highlights?: string[];
  }

  const FAQ_ITEMS: FaqItem[] = [
    {
      id: 'faq-costs',
      category: 'costs',
      badge: 'Costs & Pricing',
      question: 'How are projects priced, and what is your minimum investment?',
      answer: `Projects with It's LLC start at a clear $500 minimum for targeted fixes, custom automation flows, or isolated micro-features.

Complete bespoke business websites, custom web applications, and autonomous client systems typically range between $2,500 and $15,000+ depending on architectural scope, third-party integrations, and database requirements. Every engagement operates on a transparent, fixed-scope quote—no surprise billing or agency bloat.`,
      highlights: [
        '$500 clear starting minimum',
        'Fixed milestone quotes',
        'Zero agency overhead markup',
        'Direct access to Sean Holbrook'
      ]
    },
    {
      id: 'faq-timelines',
      category: 'timelines',
      badge: 'Timelines & Speed',
      question: 'How quickly can my project launch, and what do typical sprint timelines look like?',
      answer: `Because you work directly with Sean Holbrook without middle management or account handoff bottlenecks, engineering sprints move with extreme agility:

• Targeted Sprints & Landing Pages: 3 to 7 business days
• Custom Web Applications & Portals: 2 to 3 weeks
• Full-Scale Platforms & Complex Automations: 3 to 4 weeks

You will receive private live staging preview links within the first few days so you can test and provide feedback on real, functioning software immediately.`,
      highlights: [
        '3–7 days for focused sprint targets',
        '2–4 weeks for comprehensive custom platforms',
        'Rapid staging preview feedback loops'
      ]
    },
    {
      id: 'faq-process',
      category: 'process',
      badge: 'Build Process',
      question: 'What does the build process look like from initial kickoff to delivery?',
      answer: `We follow an agile 4-phase engineering pipeline designed for clarity and momentum:

1. Architecture Blueprint: We map your exact business goals, user journeys, and database schemas.
2. Rapid Interactive Staging: We ship functional software to a private URL so you can interact with real features early.
3. Hardening & Performance: We optimize performance to sub-100ms response targets, implement zero-bloat styling, configure PWA support, and audit security rules.
4. Turnkey Deployment: Seamless DNS connection, optional custom domain or instant deployment into our upcoming ItsYouOnline.com Multiverse (<site>.itsyouonline.com), and complete production launch with zero lock-in.`,
      highlights: [
        '4-phase structured delivery',
        'Host on <site>.itsyouonline.com Multiverse',
        'Performance & security hardened'
      ]
    },
    {
      id: 'faq-tech',
      category: 'tech',
      badge: 'Tech & Ownership',
      question: 'Do I own the source code, and what technologies do you use?',
      answer: `You retain 100% intellectual property ownership of all source code, design assets, database schemas, and hosting configurations upon final delivery. All builds can also be hosted directly inside our soon-to-be-released ItsYouOnline.com Multiverse with a custom <site>.itsyouonline.com subdomain (or pointed to your own external domain).

We build with modern, resilient technologies including React, TypeScript, Tailwind CSS, Vite, Node/Express, and robust cloud services (Firestore, Cloud SQL, Google Cloud Platform). We never use bloated WordPress themes or closed proprietary page builders that hold your data hostage.`,
      highlights: [
        '100% intellectual property ownership',
        'Custom <site>.itsyouonline.com Multiverse hosting ready',
        'Modern React, TypeScript, & Tailwind stack'
      ]
    },
    {
      id: 'faq-retainer',
      category: 'costs',
      badge: 'Transparent Costs',
      question: 'Are there monthly recurring fees? How do costs work for standard sites vs. AI Agents?',
      answer: `For standard custom websites, portals, and landing pages, there are ZERO forced monthly agency retainers or maintenance contracts. You own 100% of your clean code, can host inside the soon-to-be-released ItsYouOnline.com Multiverse on a custom <site>.itsyouonline.com subdomain, or pay your cloud hosting directly at wholesale rates ($0–$15/month for typical serverless traffic).

HOWEVER, running autonomous AI Agents costs real money for ongoing serverless runtime, real-time LLM inference tokens, vector context storage, and monitoring. For systems with active AI Agents, we charge a transparent monthly runtime fee (typically $150/month) that covers your high-performance LLM API token allowance, 24/7 autonomous uptime, prompt optimization, and security monitoring. You never pay speculative retainers—only the actual compute and token operations powering your business.`,
      highlights: [
        'Zero forced retainers on standard custom sites',
        'Custom <site>.itsyouonline.com Multiverse hosting included',
        'Transparent monthly fees for active AI Agent tokens & runtime'
      ]
    },
    {
      id: 'faq-communication',
      category: 'process',
      badge: 'Communication',
      question: 'How do we communicate throughout the development sprints?',
      answer: `Direct, transparent, and asynchronous-first. You have direct access to Sean via your preferred channels (Slack, Discord, or Email) as well as scheduled video/calendar checkpoints.

You also receive regular progress updates, build activity logs, and clickable staging links so you can test new features as they are committed rather than waiting weeks for a slideshow.`,
      highlights: [
        'Direct communication with your engineer',
        'Clickable staging links, not slide decks',
        'Regular build logs and activity updates'
      ]
    },
    {
      id: 'faq-support',
      category: 'timelines',
      badge: 'Support & Growth',
      question: 'What happens after launch? Can we expand features over time?',
      answer: `Software should grow with your business. Every launch includes a clean walkthrough, documentation, and a post-launch warranty period where any unexpected issues are fixed immediately.

Because your system is engineered with clean, modular TypeScript and standard architecture, adding new integrations, autonomous AI agents, or specialized checkout flows in future sprints is fast and cost-effective.`,
      highlights: [
        'Comprehensive handover & documentation',
        'Post-launch warranty support',
        'Modular architecture built to scale'
      ]
    }
  ];

  // Map speed labels to transition-duration
  const getSpeedClass = () => {
    if (!isMounted) return 'theme-duration-instant';
    switch (speed) {
      case 'instant': return 'theme-duration-instant';
      case 'slow': return 'theme-duration-slow';
      case 'cinematic': return 'theme-duration-cinematic';
      case 'normal':
      default:
        return 'theme-duration-normal';
    }
  };

  // Trigger clock and activity feed setup
  useEffect(() => {
    // Force scroll to top immediately on mount and disable automatic browser history scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    if (document.body) {
      document.body.scrollTop = 0;
    }

    setIsMounted(true);
    setHydrationProgress(22);
    addLog('Preparing It\'s LLC (itsllc.itsyouonline.com) experience...', 'info');

    const loadingPhases = [
      'Optimizing page layout and speed...',
      'Structuring clean, responsive design...',
      'Creating interactive typography pairs...',
      'Setting up client build preview...',
      'Running speed optimization checks...',
      'Experience ready to load!'
    ];
    const phaseProgressTargets = [36, 52, 68, 82, 92, 97];

    let phaseIndex = 0;
    const interval = setInterval(() => {
      if (phaseIndex < loadingPhases.length) {
        setLoadingText(loadingPhases[phaseIndex]);
        setHydrationProgress(phaseProgressTargets[phaseIndex] ?? 95);
        addLog(`Loader status: ${loadingPhases[phaseIndex]}`, 'info');
        phaseIndex++;
      }
    }, 280);

    // Fade loader out slightly before hiding it
    const fadeTimer = setTimeout(() => {
      setHydrationProgress(100);
      setIsLoaderFading(true);
      addLog('Reconciling views to top viewport boundary.', 'success');
      // Snap to top right before reveal
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      if (document.body) {
        document.body.scrollTop = 0;
      }
    }, 1500);

    let unmountBarTimer: ReturnType<typeof setTimeout> | undefined;
    const completeTimer = setTimeout(() => {
      setIsLoading(false);
      clearInterval(interval);
      addLog('Initialization Completed. It\'s LLC (itsllc.itsyouonline.com) software stack fully active.', 'success');
      addLog(`Standard system theme initialized. Preference: ${theme === 'system' ? 'OS System Default' : theme.toUpperCase()}`, 'info');
      addLog('Keyboard macro shortcut loaded: [Ctrl+Shift+T] cycles theme layouts instantly.', 'info');

      unmountBarTimer = setTimeout(() => {
        setShowHydrationBar(false);
      }, 450);
      
      // Ensure we are at the top once loader has unmounted
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        if (document.body) {
          document.body.scrollTop = 0;
        }
      }, 30);
    }, 1850);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      if (unmountBarTimer) clearTimeout(unmountBarTimer);
    };
  }, []);

  // Sync log activity feed window to bottom
  useEffect(() => {
    if (consoleLogsRef.current) {
      consoleLogsRef.current.scrollTop = consoleLogsRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle intersection observer to highlight navbar links on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      const sections = ['home', 'services', 'work', 'why-sean', 'client-success', 'process', 'faq', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const offsetTop = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme Sync effect applying .dark to html
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyResolvedTheme = () => {
      let active: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        active = mediaQuery.matches ? 'dark' : 'light';
        addLog(`Evaluating system default. Media query selected: "${active}"`, 'info');
      } else {
        active = theme;
        addLog(`Applying user selection theme bypass: "${theme}"`, 'success');
      }
      setResolvedTheme(active);

      const root = document.documentElement;
      if (active === 'dark') {
        root.classList.add('dark');
        addLog('Injected dark-theme descriptor to root Element class list.', 'success');
      } else {
        root.classList.remove('dark');
        addLog('Revoked dark-theme descriptor from root Element class list.', 'success');
      }
    };

    applyResolvedTheme();

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const changeTo = e.matches ? 'dark' : 'light';
        setResolvedTheme(changeTo);
        addLog(`Detected OS light/dark scheme modification callback. Transformed view to: ${changeTo}`, 'warning');
        if (changeTo === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  // Global hotkey macro cycle trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setThemeState((current) => {
          const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
          addLog(`HotKey Macro Triggered. Cycling theme layout parameter to: "${next}"`, 'warning');
          localStorage.setItem('theme-preference', next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Change Theme utility
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    addLog(`Setting theme to: "${newTheme}"`, 'info');
    localStorage.setItem('theme-preference', newTheme);
    setThemeState(newTheme);
  };

  // Switch tabs in mockup preview panel
  const handleTabSelect = (tab: 'website' | 'ai_agent' | 'productivity' | 'calendar') => {
    setCurrentTab(tab);
    addLog(`Showcase visual panel switched view states: "${tab.toUpperCase()}"`, 'info');
  };

  // Google Calendar API & Firebase functions
  useEffect(() => {
    addLog('Initializing Firebase Auth observer...', 'info');
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setCalendarAccessToken(token);
        setNeedsAuth(false);
        addLog(`User session recovered: ${user.email}`, 'success');
        fetchCalendarEvents(token);
        fetchFirestoreBookings(user.uid);
      },
      () => {
        setCurrentUser(null);
        setCalendarAccessToken(null);
        setNeedsAuth(true);
        addLog('No cached Google credentials. Authentication needed for Calendar features.', 'info');
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchCalendarEvents = async (token: string) => {
    setIsLoadingCalendar(true);
    addLog('Requesting Google Calendar events from REST endpoint...', 'info');
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=5&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.ok) {
        throw new Error(`Google Calendar Fetch failed: ${res.statusText}`);
      }
      const data = await res.json();
      setCalendarEvents(data.items || []);
      addLog(`Loaded ${data.items?.length || 0} real Google Calendar events successfully!`, 'success');
    } catch (err) {
      console.error(err);
      addLog(`Google Calendar Fetch: ${err instanceof Error ? err.message : String(err)}`, 'warning');
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const fetchFirestoreBookings = async (userId: string) => {
    addLog('Loading synced consultations from Firestore...', 'info');
    const path = 'bookings';
    try {
      const bookingsRef = collection(db, path);
      const q = query(bookingsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const items: any[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setFirestoreBookings(items);
      addLog(`Synchronized ${items.length} consultation bookings from Firestore.`, 'success');
    } catch (err) {
      console.error('Firestore list failed:', err);
      addLog(`Firestore booking query failed. Syncing fallback records.`, 'warning');
    }
  };

  const handleGoogleSignIn = async () => {
    addLog('Opening Google Sign-in popup...', 'info');
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setCalendarAccessToken(result.accessToken);
        setNeedsAuth(false);
        addLog(`Authenticated with Google! Logged in as: ${result.user.email}`, 'success');
        fetchCalendarEvents(result.accessToken);
        fetchFirestoreBookings(result.user.uid);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user') {
        addLog('Google Sign-in closed. Note: Click "Advanced" → "Go to App (unsafe)" on Google\'s consent screen, or use the Demo Sandbox.', 'warning');
      } else {
        addLog(`Google Sign-in note: ${err instanceof Error ? err.message : String(err)}. Click "Advanced" → "Go to App (unsafe)" to proceed.`, 'warning');
      }
    }
  };

  const pingLatency = () => {
    const nextLatency = Math.floor(Math.random() * 8) + 4; // 4-11ms
    setLatencyMs(nextLatency);
    addLog(`Showcase: Server ping refreshed. Edge response latency: ${nextLatency}ms.`, 'info');
  };

  const resetAiConversation = () => {
    setAiLogs([
      {
        id: `sys-reset-${Date.now()}`,
        sender: 'system',
        text: "New session initialized • Gemini 4 Hydrogen • Direct line: 603-851-2057"
      },
      {
        id: `agent-reset-${Date.now()}`,
        sender: 'agent',
        text: "Fresh thread ready! Tell me what you're looking to build (Micro-Sprint, Landing Stack, Custom Website, or Full-Stack AI Portal) or share your name, email, and preferred day/time to lock in a consultation."
      }
    ]);
    addLog('AI Chat: Started new multi-turn conversation thread.', 'info');
  };

  const applyChatBookingClose = async (booking: {
    bookingId: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    projectType: string;
    summary: string;
    date: string;
    time: string;
    startIso: string;
    endIso: string;
    notes?: string;
    preferredSubdomain?: string;
    multiverseUrl?: string;
    calendarInviteUrl: string;
    hostEmail: string;
    hostPhone: string;
  }) => {
    const resolvedSubdomain = booking.preferredSubdomain
      ? sanitizeSubdomainSlug(booking.preferredSubdomain).replace(/-+$/, '')
      : '';
    if (resolvedSubdomain) {
      setMultiverseSubdomain(resolvedSubdomain);
    }
    const targetMultiverseHost =
      booking.multiverseUrl ||
      (resolvedSubdomain ? `https://${resolvedSubdomain}.itsyouonline.com` : `https://${activeMultiverseHost}`);

    setBookingSubject(booking.summary);
    setBookingDate(booking.date);
    setBookingTime(booking.time);
    setBookingDesc(
      `${booking.projectType} • Multiverse Host Target: ${targetMultiverseHost}${booking.notes ? ` — ${booking.notes}` : ''} (Client: ${booking.clientName} <${booking.clientEmail}>)`
    );
    setUserName(booking.clientName);
    setUserEmail(booking.clientEmail);
    setProjectGoals(
      `[Closed via AI Concierge]\nBuild Type: ${booking.projectType}\nMultiverse Host Target: ${targetMultiverseHost}\nScheduled: ${booking.date} at ${booking.time}${booking.clientPhone ? `\nPhone: ${booking.clientPhone}` : ''}${booking.notes ? `\nNotes: ${booking.notes}` : ''}`
    );

    const localEvent = {
      id: booking.bookingId,
      summary: booking.summary,
      description: `${booking.projectType} • ${targetMultiverseHost} • ${booking.clientName} (${booking.clientEmail})`,
      start: { dateTime: booking.startIso }
    };
    setCalendarEvents((prev) => [localEvent, ...prev]);
    setFirestoreBookings((prev) => [
      {
        id: booking.bookingId,
        summary: booking.summary,
        description: `${booking.projectType} • ${targetMultiverseHost} • ${booking.date} ${booking.time}`
      },
      ...prev
    ]);
    setLiveLeads((prev) => prev + 1);

    // Capture lead persistently in Firestore leads collection (matching firestore.rules isValidLead: <= 5 keys)
    try {
      const leadId = `lead_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'leads', leadId), {
        id: leadId,
        name: booking.clientName.slice(0, 100),
        email: booking.clientEmail.slice(0, 100),
        message: `[Calendar Booked: ${booking.date} ${booking.time}] ${booking.projectType} | Multiverse: ${targetMultiverseHost}${booking.notes ? ` - ${booking.notes}` : ''}`.slice(0, 400),
        createdAt: new Date().toISOString()
      });
      addLog(`AI Concierge: Saved consultation lead to Firestore [leads/${leadId}]`, 'success');
    } catch (err) {
      addLog(
        `AI Concierge: Local calendar synced; Firestore lead write note: ${err instanceof Error ? err.message : String(err)}`,
        'info'
      );
    }

    // If visitor is authenticated via Google Calendar OAuth, also insert directly onto their Google Calendar
    if (calendarAccessToken && currentUser) {
      try {
        const gCalRes = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${calendarAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              summary: booking.summary,
              description: `${booking.projectType}\nMultiverse Host Target: ${targetMultiverseHost}\nClient: ${booking.clientName} (${booking.clientEmail})\nHost: Sean Holbrook (${booking.hostEmail} • ${booking.hostPhone})\n${booking.notes || ''}`,
              start: { dateTime: booking.startIso },
              end: { dateTime: booking.endIso },
              attendees: [
                { email: booking.clientEmail },
                { email: booking.hostEmail }
              ],
              reminders: { useDefault: true }
            })
          }
        );
        if (gCalRes.ok) {
          const eventData = await gCalRes.json();
          await setDoc(doc(db, 'bookings', booking.bookingId), {
            id: booking.bookingId,
            userId: currentUser.uid,
            summary: booking.summary.slice(0, 200),
            startTime: booking.startIso,
            endTime: booking.endIso,
            calendarEventId: eventData.id,
            createdAt: new Date().toISOString()
          });
          addLog(`AI Concierge: Real Google Calendar event booked (${eventData.id})`, 'success');
        }
      } catch (err) {
        addLog(
          `AI Concierge: Google Calendar sync fallback ready (${err instanceof Error ? err.message : String(err)})`,
          'info'
        );
      }
    }

    addLog(
      `AI Concierge: Closed consultation for ${booking.clientName} on ${booking.date} at ${booking.time} (${targetMultiverseHost})`,
      'success'
    );
  };

  const sendGeminiChatMessage = async (overrideText?: string) => {
    const rawText = typeof overrideText === 'string' ? overrideText : customAiInput;
    const userInput = rawText.trim();
    if (!userInput || aiScenarioActive) return;

    if (typeof overrideText !== 'string') {
      setCustomAiInput('');
    }
    setAiScenarioActive(true);
    addLog(`Gemini Chat: Sending "${userInput}"`, 'info');

    const userMsgId = `user-${Date.now()}`;
    const nextUserMsg = { id: userMsgId, sender: 'user' as const, text: userInput };

    const historyForApi = aiLogs
      .filter((m) => (m.sender === 'user' || m.sender === 'agent') && !m.isError)
      .map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text
      }))
      .concat([{ role: 'user' as const, text: userInput }]);

    setAiLogs((prev) => [...prev, nextUserMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          clientLocalTime: new Date().toString(),
          currentEstimate: {
            scopeName: selectedScopeObj.name,
            addonNames: estimatorAddons
              .map((id) => ESTIMATOR_ADDONS.find((a) => a.id === id)?.name)
              .filter(Boolean),
            oneTimeTotal: finalEstimatedTotal,
            monthlyTotal,
            multiverseSubdomain: activeSubdomainSlug
          }
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      let attachedBooking: any = undefined;
      let attachedEstimate: any = undefined;

      if (Array.isArray(data.actions)) {
        for (const action of data.actions) {
          if (action?.type === 'schedule_consultation' && action.booking) {
            attachedBooking = action.booking;
            await applyChatBookingClose(action.booking);
          } else if (action?.type === 'apply_project_estimate' && action.estimate) {
            attachedEstimate = action.estimate;
            setEstimatorScope(action.estimate.scopeId);
            setEstimatorAddons(action.estimate.addonIds || []);
            setBudgetVal(action.estimate.oneTimeTotal);
            if (action.estimate.preferredSubdomain) {
              const cleanedSlug = sanitizeSubdomainSlug(action.estimate.preferredSubdomain).replace(/-+$/, '');
              if (cleanedSlug) setMultiverseSubdomain(cleanedSlug);
            }
            addLog(
              `AI Concierge: Updated Project Estimator to "${action.estimate.scopeName}" ($${action.estimate.oneTimeTotal.toLocaleString()})${action.estimate.multiverseUrl ? ` • ${action.estimate.multiverseUrl}` : ''}`,
              'success'
            );
          }
        }
      }

      setAiLogs((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: data.reply || 'Done! Let me know if you want to tweak your scope or lock in a consultation.',
          booking: attachedBooking,
          estimate: attachedEstimate
        }
      ]);
      addLog('Gemini 4 Hydrogen: Response delivered.', 'success');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiLogs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: `Connection note: ${errMsg}`,
          isError: true
        }
      ]);
      addLog(`Gemini API Error: ${errMsg}`, 'warning');
    } finally {
      setAiScenarioActive(false);
    }
  };

  const handleSendCustomAiMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void sendGeminiChatMessage();
  };

  useEffect(() => {
    const scrollTerminals = () => {
      if (aiTerminalScrollRef.current) {
        aiTerminalScrollRef.current.scrollTop = aiTerminalScrollRef.current.scrollHeight;
      }
      if (drawerAiTerminalScrollRef.current) {
        drawerAiTerminalScrollRef.current.scrollTop = drawerAiTerminalScrollRef.current.scrollHeight;
      }
    };
    const timer = setTimeout(scrollTerminals, 60);
    return () => clearTimeout(timer);
  }, [aiLogs, aiScenarioActive, isAiDrawerOpen]);

  const renderAiAgentContent = (isDrawer: boolean = false) => (
    <div className="bg-white dark:bg-[#0c0c0e] flex flex-col justify-between theme-transition">
      {/* Control / Info header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#ecece8] dark:border-[#17171d] bg-zinc-50/80 dark:bg-[#111115]/90 text-xs text-zinc-500 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">AI Build Architect</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8px] font-bold text-emerald-500 font-mono uppercase tracking-widest">GEMINI LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={resetAiConversation}
            title="Start New Chat"
            aria-label="Start new AI chat"
            className="px-1.5 py-1 rounded-md text-[8px] font-mono font-bold uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>
          {isDrawer && (
            <button
              type="button"
              onClick={() => {
                setIsAiDrawerOpen(false);
                addLog('Floating Drawer: Minimized AI Agent drawer', 'info');
              }}
              aria-label="Minimize AI Agent drawer"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className={`p-4 ${isDrawer ? 'min-h-[300px]' : 'min-h-[300px]'} flex flex-col justify-between text-left`}>
        <div>
          {/* Multi-Turn Scrollable Chat Thread */}
          <div
            ref={isDrawer ? drawerAiTerminalScrollRef : aiTerminalScrollRef}
            className={`p-3 rounded-xl border border-zinc-250 dark:border-zinc-900 bg-[#fbfbfa] dark:bg-zinc-950 font-mono text-[9.5px] space-y-2.5 ${isDrawer ? 'h-[235px] sm:h-[260px]' : 'h-[190px]'} overflow-y-auto mb-2.5 scroll-smooth`}
          >
            {aiLogs.map((log) => (
              <div key={log.id} className="text-left">
                {log.sender === 'system' ? (
                  <div className="text-zinc-400 dark:text-zinc-600 italic text-[8.5px]">
                    &gt;&gt; {log.text}
                  </div>
                ) : log.sender === 'user' ? (
                  <div className="text-zinc-900 dark:text-zinc-100 bg-zinc-200/60 dark:bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-indigo-500 font-bold">you:~$</span> {log.text}
                  </div>
                ) : (
                  <div
                    className={`p-2 rounded-lg border leading-relaxed space-y-2 ${
                      log.isError
                        ? 'text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                        : 'text-zinc-900 dark:text-white bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100/40 dark:border-indigo-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 whitespace-pre-line">
                        <span className={`${log.isError ? 'text-rose-500' : 'text-emerald-500'} font-bold`}>
                          [It&apos;s LLC AI]:
                        </span>{' '}
                        <TypewriterText text={log.text} speed={8} />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(log.text);
                          setCopiedLogId(log.id);
                          addLog('Copied AI Agent response to clipboard!', 'success');
                          setTimeout(() => setCopiedLogId(null), 2000);
                        }}
                        className="p-1 rounded bg-zinc-100/80 hover:bg-zinc-200 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 text-zinc-400 hover:text-indigo-500 dark:text-zinc-400 dark:hover:text-indigo-400 transition-all flex items-center justify-center cursor-pointer select-none shrink-0"
                        title="Copy Response to Clipboard"
                      >
                        {copiedLogId === log.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Closed Calendar Scheduling Confirmation Card */}
                    {log.booking && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-left space-y-1.5 font-sans">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Calendar Consultation Locked
                          </span>
                          <span className="text-[8px] font-mono text-zinc-500">{log.booking.date} • {log.booking.time}</span>
                        </div>
                        <div className="text-[11px] font-bold text-zinc-900 dark:text-white">
                          {log.booking.summary}
                        </div>
                        <div className="text-[9.5px] text-zinc-600 dark:text-zinc-300">
                          Scope: <strong>{log.booking.projectType}</strong> • Guest: {log.booking.clientEmail}
                        </div>
                        {log.booking.multiverseUrl && (
                          <div className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400">
                            Multiverse Host Target: {log.booking.multiverseUrl}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <a
                            href={log.booking.calendarInviteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => addLog('Opened Google Calendar template invite from AI booking card.', 'success')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-wider transition"
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            <span>Add to Google Calendar</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              handleTabSelect('calendar');
                              setIsAiDrawerOpen(false);
                              document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                          >
                            <span>View Calendar Sync</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Updated Project Estimate Card */}
                    {log.estimate && (
                      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-2 font-sans">
                        <div>
                          <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase font-mono">
                            Estimator Configured
                          </div>
                          <div className="text-[10px] font-bold text-zinc-900 dark:text-white">
                            {log.estimate.scopeName} • ${log.estimate.oneTimeTotal.toLocaleString()}
                            {log.estimate.monthlyTotal > 0 ? ` + $${log.estimate.monthlyTotal}/mo AI` : ''}
                          </div>
                          {log.estimate.multiverseUrl && (
                            <div className="text-[8.5px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                              Multiverse Subdomain: {log.estimate.multiverseUrl}
                            </div>
                          )}
                        </div>
                        <a
                          href="#project-estimator"
                          onClick={() => setIsAiDrawerOpen(false)}
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[8.5px] font-bold uppercase shrink-0"
                        >
                          View Breakdown
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {aiScenarioActive && (
              <div className="flex items-center gap-2 text-indigo-500 text-[9px] font-mono px-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Architecting response & checking calendar...</span>
              </div>
            )}
          </div>

          {/* Quick-Start Build & Scheduling Triggers */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1">
              Quick Actions • Builds, Pricing & Scheduling
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                {
                  key: 'builds' as const,
                  title: 'Build Types',
                  sub: '$500 – $4.5k+ Tiers',
                  prompt: 'Walk me through all the types of builds It\'s LLC offers, their timelines, and starting prices.'
                },
                {
                  key: 'ai_pricing' as const,
                  title: 'AI Agent Rates',
                  sub: 'Build + $150/mo',
                  prompt: 'How do AI Agent builds work, and when do monthly fees vs $0/mo retainers apply?'
                },
                {
                  key: 'schedule' as const,
                  title: 'Book Calendar',
                  sub: 'Lock a Call Slot',
                  prompt: 'I want to schedule a build consultation on Sean\'s calendar. What details do you need to book it?'
                }
              ].map((scen) => (
                <button
                  key={scen.key}
                  type="button"
                  onClick={() => {
                    setAiScenario(scen.key);
                    void sendGeminiChatMessage(scen.prompt);
                  }}
                  disabled={aiScenarioActive}
                  className={`p-2 rounded-xl text-left border cursor-pointer transition-all select-none disabled:opacity-50 ${
                    aiScenario === scen.key
                      ? 'bg-indigo-50/50 border-indigo-450 dark:bg-indigo-950/15 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'bg-zinc-55 border-zinc-150 hover:bg-zinc-100 dark:bg-zinc-950/40 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="text-[9px] truncate font-extrabold">{scen.title}</div>
                  <div className="text-[7.5px] text-zinc-400 dark:text-zinc-500 leading-none mt-0.5 truncate">{scen.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Multi-Turn Prompt Input */}
          <form onSubmit={handleSendCustomAiMessage} className="mt-2 flex items-center gap-1.5">
            <input
              type="text"
              value={customAiInput}
              onChange={(e) => setCustomAiInput(e.target.value)}
              placeholder="Ask about builds or share name, email & time to book..."
              disabled={aiScenarioActive}
              className="flex-1 px-2.5 py-1.5 text-[9.5px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#fbfbfa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-mono outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!customAiInput.trim() || aiScenarioActive}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              <Send className="w-2.5 h-2.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* DIRECT CONTACT & SCHEDULING FOOTER LEDGER */}
        <div className="pt-2.5 border-t border-[#ecece8] dark:border-[#1d1c21] mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 shrink-0">
              <Phone className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <a
                href="tel:6038512057"
                className="font-mono font-bold text-zinc-800 dark:text-zinc-200 hover:text-indigo-500 block leading-tight"
              >
                603-851-2057
              </a>
              <a
                href="mailto:creatoroftheyouniverse@itsyouonline.com"
                className="text-[8px] text-zinc-400 hover:text-indigo-400 font-mono truncate block"
              >
                creatoroftheyouniverse@itsyouonline.com
              </a>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-black font-mono text-emerald-500 block leading-none">From $500</span>
            <span className="text-[7.5px] text-zinc-450 dark:text-zinc-500 font-mono">Q3/Q4 2026 open</span>
          </div>
        </div>
      </div>
    </div>
  );

  const enableCalendarDemo = () => {
    setIsCalendarDemo(true);
    setNeedsAuth(false);
    setCalendarEvents([
      {
        id: 'demo-1',
        summary: "It's LLC Custom Architecture Review",
        description: 'Reviewing intake automations & custom React frontend with Sean Holbrook',
        start: { dateTime: new Date(Date.now() + 86400000).toISOString() }
      },
      {
        id: 'demo-2',
        summary: 'Boutique Store Inventory Audit Sync',
        description: 'Shrink margin audit and database pipeline walkthrough',
        start: { dateTime: new Date(Date.now() + 172800000).toISOString() }
      }
    ]);
    setFirestoreBookings([
      {
        id: 'db_seed_1',
        summary: "It's LLC Strategy Consultation",
        description: 'Lead auto-synced from live web intake form'
      }
    ]);
    addLog('Showcase: Launched Calendar Sync interactive demo sandbox.', 'success');
  };

  const exitCalendarDemo = () => {
    setIsCalendarDemo(false);
    if (!currentUser) {
      setNeedsAuth(true);
      setCalendarEvents([]);
      setFirestoreBookings([]);
    }
    addLog('Showcase: Exited demo sandbox. Google Workspace OAuth gateway ready.', 'info');
  };

  const handleRefreshLivePreview = () => {
    setIsLivePreviewRefreshing(true);
    pingLatency();
    addLog('Showcase: Refreshed live preview canvas and re-pinged response edge.', 'info');
    setTimeout(() => {
      setIsLivePreviewRefreshing(false);
    }, 600);
  };

  const handleLogout = async () => {
    addLog('Logging user out of Google Session...', 'info');
    try {
      await logout();
      setCurrentUser(null);
      setCalendarAccessToken(null);
      setCalendarEvents([]);
      setFirestoreBookings([]);
      setNeedsAuth(true);
      setIsCalendarDemo(false);
      addLog('Signed out. Google Calendar access cleared.', 'success');
    } catch (err) {
      console.error(err);
      addLog(`Sign out failed: ${err instanceof Error ? err.message : String(err)}`, 'warning');
    }
  };

  const handleCreateBooking = async () => {
    // Demo Sandbox Mode handler
    if (isCalendarDemo) {
      setIsBookingInProgress(true);
      addLog(`[Demo Sandbox]: Scheduling "${bookingSubject}" on virtual calendar for ${bookingDate} at ${bookingTime}...`, 'info');
      setTimeout(() => {
        const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
        const newDemoId = `demo_evt_${Date.now()}`;
        const newEvent = {
          id: newDemoId,
          summary: bookingSubject,
          description: bookingDesc,
          start: { dateTime: startDateTime.toISOString() }
        };
        const newBooking = {
          id: `book_${Date.now().toString(36)}`,
          summary: bookingSubject,
          description: bookingDesc,
          createdAt: new Date().toISOString()
        };
        setCalendarEvents(prev => [newEvent, ...prev]);
        setFirestoreBookings(prev => [newBooking, ...prev]);
        setLiveLeads(prev => prev + 1);
        setIsBookingInProgress(false);
        addLog(`[Demo Sandbox]: Meeting "${bookingSubject}" scheduled and synchronized with Firestore!`, 'success');
      }, 700);
      return;
    }

    if (!calendarAccessToken || !currentUser) {
      addLog('Cannot book slot: Please authenticate Google Account or launch Demo Mode.', 'warning');
      return;
    }

    setIsBookingInProgress(true);
    addLog('Creating consultation booking on Google Calendar & Firestore...', 'info');

    try {
      const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1hr duration

      // 1. POST Google Calendar event
      const calendarRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${calendarAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: bookingSubject,
            description: bookingDesc,
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: endDateTime.toISOString() },
            reminders: { useDefault: true }
          })
        }
      );

      if (!calendarRes.ok) {
        const errorText = await calendarRes.text();
        throw new Error(`Google Calendar API rejected write: ${errorText || calendarRes.statusText}`);
      }

      const eventData = await calendarRes.json();
      addLog(`Real Google Calendar Event successfully scheduled! Event ID: ${eventData.id}`, 'success');

      // 2. Write to Firestore bookings collection
      const bookingId = `book_${Math.random().toString(36).substring(2, 11)}`;
      const bookingPayload = {
        id: bookingId,
        userId: currentUser.uid,
        summary: bookingSubject,
        description: bookingDesc,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        calendarEventId: eventData.id,
        createdAt: new Date().toISOString()
      };

      const docPath = `bookings/${bookingId}`;
      try {
        await setDoc(doc(db, 'bookings', bookingId), bookingPayload);
        addLog(`Booking synced with Firestore database! Path: ${docPath}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }

      // Refresh data
      await fetchCalendarEvents(calendarAccessToken);
      await fetchFirestoreBookings(currentUser.uid);
      setLiveLeads(prev => prev + 1);

    } catch (err) {
      console.error(err);
      addLog(`Booking process error: ${err instanceof Error ? err.message : String(err)}`, 'warning');
    } finally {
      setIsBookingInProgress(false);
    }
  };

  // Budget custom state modifier
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudgetVal(parseInt(e.target.value));
  };

  // Checkbox state tracker
  const handleServiceSelected = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices((prev) => prev.filter(s => s !== service));
    } else {
      setSelectedServices((prev) => [...prev, service]);
    }
  };

  // Submit contact form simulation and save to Firestore
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) {
      addLog('Validation failed. Name and Email fields are strictly required.', 'warning');
      return;
    }

    setFormSubmitted(true);
    addLog(`Secure build request submitted by ${userName} (Email: ${userEmail})`, 'success');
    addLog(`Project Scope details: Services [${selectedServices.join(', ')}]. Allotted budget limit: $${budgetVal.toLocaleString()}`, 'success');

    const leadId = `lead_${Math.random().toString(36).substring(2, 11)}`;
    const leadPayload = {
      id: leadId,
      name: userName,
      email: userEmail,
      message: `${projectGoals || 'No goals specified'} | Multiverse Subdomain: https://${activeMultiverseHost}`.slice(0, 500),
      createdAt: new Date().toISOString()
    };

    const docPath = `leads/${leadId}`;
    try {
      await setDoc(doc(db, 'leads', leadId), leadPayload);
      addLog(`Lead captured and saved to Firestore! Path: ${docPath}`, 'success');
    } catch (err) {
      console.error(err);
      addLog(`Failed to save lead to Firestore: ${err instanceof Error ? err.message : String(err)}`, 'warning');
    }

    // Reset status after 6 seconds
    setTimeout(() => {
      setFormSubmitted(false);
      setUserName('');
      setUserEmail('');
      setProjectGoals('');
    }, 6000);
  };

  // Interactive metrics simulation ticking inside mock panel
  useEffect(() => {
    const tickTime = trafficMultiplier > 1 ? 160 : 2000;
    const interval = setInterval(() => {
      if (currentTab === 'website') {
        const increment = trafficMultiplier > 1 ? Math.floor(Math.random() * 9) + 7 : (Math.random() > 0.7 ? 1 : 0);
        setLiveConversions(prev => prev + increment);
        
        if (Math.random() > (trafficMultiplier > 1 ? 0.55 : 0.94)) {
          setLiveLeads(prev => {
            const next = prev + (trafficMultiplier > 1 ? 1 : 1);
            if (trafficMultiplier > 1) {
              addLog(`Simulated 5x Surge: High-intent lead captured & routed!`, 'success');
            }
            return next;
          });
        }
      } else if (currentTab === 'productivity') {
        if (isAutomating && !testRunActive) {
          setAutopilotPulseStep((prev) => {
            const next = (prev + 1) % 4;
            if (next === 3) {
              setWorkflowEventsCount((c) => c + 1);
              setWorkflowHoursSaved((h) => Number((h + 0.2).toFixed(1)));
              setWorkflowRunComplete(true);
            } else {
              setWorkflowRunComplete(false);
            }
            return next;
          });
        }
      }
    }, currentTab === 'productivity' && isAutomating ? 1300 : tickTime);
    return () => clearInterval(interval);
  }, [currentTab, isAutomating, trafficMultiplier, testRunActive]);

  return (
    <div 
      id="theme-wrapper"
      className={`theme-transition ${getSpeedClass()} min-h-screen text-[#171719] bg-[#fdfdfb] dark:text-[#f3f4f6] dark:bg-[#070709] relative selection:bg-indigo-200 dark:selection:bg-indigo-950 transition-colors overflow-x-hidden`}
      style={{
        '--color-grid': resolvedTheme === 'dark' ? '#0f0f13' : '#ebebeb',
      } as React.CSSProperties}
    >
      {/* Subtle Top-of-Screen Hydration Progress Bar */}
      {showHydrationBar && (
        <div
          role="progressbar"
          aria-label="Page hydration progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={hydrationProgress}
          className={`fixed top-0 left-0 right-0 z-[110] h-[2.5px] bg-zinc-200/40 dark:bg-zinc-900/60 pointer-events-none transition-opacity duration-500 ${
            !isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 shadow-[0_0_8px_rgba(99,102,241,0.55)] transition-[width] duration-300 ease-out"
            style={{ width: `${hydrationProgress}%` }}
          />
        </div>
      )}

      {/* 3D Preloader Overlay */}
      {isLoading && (
        <div 
          id="preloader-overlay"
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fdfdfb] dark:bg-[#070709] transition-all duration-300 ${
            isLoaderFading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
          }`}
        >
          <div className="relative w-48 h-48 flex items-center justify-center perspective-1000 preserve-3d">
            {/* Ambient Radial background Glow */}
            <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-500/20 to-emerald-400/10 blur-3xl saturate-150 animate-glow-pulse"></div>

            {/* Simulated 3D Concentric Orbits */}
            <div className="ring-3d-inner animate-glow-pulse" style={{ animationDelay: '-1s' }}></div>
            <div className="ring-3d-outer"></div>

            {/* 3D Wireframe Cube */}
            <div className="cube-3d">
              <div className="cube-face face-front">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              </div>
              <div className="cube-face face-back">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              </div>
              <div className="cube-face face-right">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
              <div className="cube-face face-left">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
              <div className="cube-face face-top">
                <div className="w-1.5 h-1.5 bg-indigo-400"></div>
              </div>
              <div className="cube-face face-bottom">
                <div className="w-1.5 h-1.5 bg-indigo-400"></div>
              </div>
            </div>
          </div>

          <div className="z-10 mt-8 text-center max-w-sm px-6">
            <h2 className="text-sm font-sans font-black uppercase tracking-[0.25em] text-zinc-900 dark:text-zinc-50 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '4s' }} />
              It's LLC <span className="text-indigo-600 dark:text-indigo-400 font-mono font-normal text-xs lowercase">itsllc.itsyouonline.com</span>
            </h2>
            
            <p className="mt-4 text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-[#f4f4f0]/70 dark:bg-zinc-900/60 shadow-inner px-4 py-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 transition-all duration-200 min-h-[38px] flex items-center justify-center leading-snug">
              {loadingText}
            </p>

            <div className="mt-5 flex items-center justify-center gap-4 text-[9px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SYSTEM_READY
              </span>
              <span>•</span>
              <span className="text-indigo-650 dark:text-indigo-450 font-bold uppercase tracking-widest">INTERACTIVE: ON</span>
            </div>
          </div>
        </div>
      )}
      {/* Visual Ambient Blur Overlays */}
      <div className="absolute top-0 left-1/4 w-[35vw] h-[35vw] rounded-full blur-[140px] opacity-[0.06] dark:opacity-[0.03] bg-indigo-600 pointer-events-none animate-glow-pulse"></div>
      <div className="absolute top-[40%] right-10 w-[30vw] h-[30vw] rounded-full blur-[150px] opacity-[0.06] dark:opacity-[0.02] bg-emerald-500 pointer-events-none animate-glow-pulse" style={{ animationDelay: '-3.5s' }}></div>

      {/* FIXED GLASS HEADER / NAV BAR */}
      <nav id="site-header" className="sticky top-0 z-40 bg-white/80 dark:bg-[#070709]/80 backdrop-blur-md border-b border-[#ecece8] dark:border-[#131317] theme-transition transition-colors w-full max-w-full overflow-x-hidden box-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* Custom SVG Logo Wordmark */}
            <a 
              href="#home" 
              className="flex items-center gap-2 group min-w-0 shrink"
              onClick={() => addLog('Navigation redirected: HOME', 'info')}
            >
              <div id="logo-icon-svg" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-emerald-400 p-0.5 flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 40 40" className="w-full h-full text-white fill-current">
                  <path d="M12 28 C12 20, 20 12, 28 12 M12 12 Q20 20, 28 28" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span id="logo-text-span" className="font-sans font-extrabold text-sm sm:text-base tracking-tight leading-none text-zinc-900 dark:text-white flex items-center gap-1.5">
                  itsllc<span className="text-indigo-600 dark:text-indigo-400 font-medium">.itsyouonline.com</span>
                </span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">It's LLC</span>
              </div>
            </a>

            {/* Desktop Navigation Links (Anchored with Active States) */}
            <div className="hidden lg:flex items-center gap-7">
              {[
                { id: 'home', label: 'Home' },
                { id: 'services', label: 'Services' },
                { id: 'work', label: 'Work' },
                { id: 'why-sean', label: 'Why Sean' },
                { id: 'client-success', label: 'Success' },
                { id: 'process', label: 'Process' },
                { id: 'faq', label: 'FAQ' },
                { id: 'contact', label: 'Contact' }
              ].map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={() => addLog(`Navigation redirected to section: ${link.id.toUpperCase()}`, 'info')}
                  className={`text-xs font-semibold tracking-wide uppercase transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    activeSection === link.id 
                      ? 'text-indigo-600 dark:text-indigo-400 underline decoration-2 underline-offset-4' 
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right Side header controls */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
              
              {/* PWA Install Button */}
              {isInstallable && (
                <button
                  onClick={handleInstallPwa}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer shadow-xs"
                  title="Install It's LLC as a native PWA app on your device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Install App</span>
                </button>
              )}

              {isInstalled && (
                <span className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                  <Check className="w-3 h-3" /> PWA
                </span>
              )}

              {/* ACCESSIBLE LIGHT/DARK MINI TOGGLE */}
              <div className="p-1 rounded-full bg-zinc-100 dark:bg-[#131216] border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                {[
                  { value: 'light', icon: Sun },
                  { value: 'dark', icon: Moon },
                  { value: 'system', icon: Monitor }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = theme === item.value;
                  return (
                    <button
                      key={item.value}
                      id={`mini-toggle-${item.value}`}
                      onClick={() => handleThemeChange(item.value as 'light' | 'dark' | 'system')}
                      title={`Switch to ${item.value} layout scheme`}
                      className={`p-1.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>

              {/* Header CTA Button */}
              <a
                href="#contact"
                onClick={() => addLog('Header Trigger: START A BUILD', 'info')}
                className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-xs transition-colors bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Start a Build
              </a>

              {/* Mobile menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-6 space-y-2 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#070709]/95 backdrop-blur-md w-full max-w-full box-border">
            {[
              { id: 'home', label: 'Home' },
              { id: 'services', label: 'Services' },
              { id: 'work', label: 'Work' },
              { id: 'why-sean', label: 'Why Sean' },
              { id: 'client-success', label: 'Client Success' },
              { id: 'process', label: 'Process' },
              { id: 'faq', label: 'FAQ' },
              { id: 'contact', label: 'Contact' }
            ].map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  addLog(`Navigation redirected to section mobile: ${link.id.toUpperCase()}`, 'info');
                }}
                className={`block px-3 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors ${
                  activeSection === link.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                }`}
              >
                {link.label}
              </a>
            ))}

            {isInstallable && (
              <button
                onClick={() => {
                  handleInstallPwa();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mt-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Install PWA Application
              </button>
            )}

            <div className="pt-2">
              <a
                href="#contact"
                onClick={() => {
                  setMobileMenuOpen(false);
                  addLog('Mobile Trigger: START A BUILD', 'info');
                }}
                className="w-full flex items-center justify-center py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-indigo-700"
              >
                Start a Build
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION (#home) */}
      <section id="home" className="pt-8 pb-16 sm:pb-24 border-b border-[#ecece8] dark:border-[#131317]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Text Info Block with Staggered Reveal */}
            <motion.div
              className="lg:col-span-7 flex flex-col justify-center"
              initial="hidden"
              animate={!isLoading || isLoaderFading ? 'visible' : 'hidden'}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.11,
                    delayChildren: 0.05
                  }
                }
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
                }}
                className="flex items-center gap-2 mb-4"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs uppercase font-bold text-zinc-500 dark:text-indigo-400 tracking-wider">
                  Open for new builds Q3/Q4 2026
                </span>
              </motion.div>

              {/* High-conviction Heading */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-zinc-900 dark:text-white mb-6">
                  Hand-crafted custom websites <span className="bg-gradient-to-r from-indigo-500 to-emerald-400 bg-clip-text text-transparent">with embedded AI.</span>
                </h1>
              </motion.div>

              {/* Outcome explanatory supporting text */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <p className="text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                  I design, code, and deploy lightweight websites, high-conversion intake flows, and custom client dashboards with <strong className="text-zinc-950 dark:text-white font-extrabold">autonomous AI Agents embedded out-of-the-box</strong>. Every build targets your deepest operational "bleeding neck" bottlenecks while unlocking a continuous source of high-margin recurring software revenue.
                </p>
              </motion.div>

              {/* Support line */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <p className="text-xs text-zinc-500 dark:text-zinc-500 italic mb-8 max-w-xl">
                  No slow templates, page builders, or agency markup. Just elite hand-coded pages combined with custom AI assistants that qualify hot leads 24/7, schedule calendars, and audit stock margins on autopilot.
                </p>
              </motion.div>

              {/* Hero Call to Actions */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
                className="flex flex-col sm:flex-row items-center gap-4 mb-8"
              >
                <a
                  href="#contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 rounded-xl text-sm font-extrabold tracking-wider uppercase bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition"
                  onClick={() => addLog('Hero Action: Start a Build request', 'success')}
                >
                  Start Your Build
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a
                  href="#project-estimator"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-xl text-xs font-bold tracking-wider uppercase border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 text-zinc-700 dark:text-zinc-200 hover:border-indigo-400 dark:hover:border-indigo-600 transition"
                  onClick={() => addLog('Hero Action: Jumped to Project Estimator', 'info')}
                >
                  <Calculator className="w-4 h-4 mr-2 text-indigo-500" />
                  Estimate Project
                </a>
              </motion.div>

              {/* Short Founder Line with premium signature look */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
                }}
                className="flex items-center gap-3 border-t border-[#ecece8] dark:border-[#131317] pt-6 mt-2"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold font-mono">
                    SH
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 dark:text-gray-500">Founder & Developer</p>
                  <p className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">
                    Built by Sean Holbrook — your direct developer and designer.
                  </p>
                </div>
              </motion.div>

            </motion.div>

            {/* BRAND LIVE PREVIEW SHOWCASE PANEL */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={!isLoading || isLoaderFading ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.65, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-1 rounded-2xl bg-zinc-200/70 dark:bg-zinc-900/50 border border-[#e5e5e0] dark:border-[#1d1c21] shadow-2xl relative overflow-hidden backdrop-blur-3xl transition-all hover:border-indigo-500/30">
                
                {/* Mock Window Topbar */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-[#e5e5e0] dark:border-[#1d1c21] bg-white/80 dark:bg-[#0c0c0e]/80 gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <div className="flex items-center gap-1.5 ml-1 sm:ml-2 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[150px] xs:max-w-[210px] sm:max-w-none">
                      <span className="text-emerald-500 text-[10px]">🔒</span>
                      <span className="truncate">https://itsllc.itsyouonline.com/live-preview</span>
                      <button
                        onClick={handleRefreshLivePreview}
                        className="text-zinc-400 hover:text-indigo-500 ml-1 cursor-pointer transition"
                        title="Reload Canvas"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isLivePreviewRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
                    <span className="text-[9px] font-bold text-sky-500 font-mono uppercase tracking-widest hidden xs:inline">CLIENT PREVIEW</span>
                  </div>
                </div>

                {/* Sub Showcase Tabs Toggle buttons */}
                <div className="grid grid-cols-4 border-b border-[#ecece8] dark:border-[#17171d] bg-zinc-50 dark:bg-[#111115]">
                  <button
                    onClick={() => handleTabSelect('website')}
                    className={`py-3 text-[9px] sm:text-[10px] font-bold tracking-tight uppercase transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      currentTab === 'website'
                        ? 'bg-white dark:bg-[#08080a] text-indigo-600 dark:text-indigo-400 font-extrabold border-b-2 border-indigo-500'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/50'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    Storefront
                  </button>
                  <button
                    onClick={() => handleTabSelect('ai_agent')}
                    className={`py-3 text-[9px] sm:text-[10px] font-bold tracking-tight uppercase transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      currentTab === 'ai_agent'
                        ? 'bg-white dark:bg-[#08080a] text-indigo-600 dark:text-indigo-400 font-extrabold border-b-2 border-indigo-500'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/50'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-indigo-550 animate-pulse" />
                    Embedded AI
                  </button>
                  <button
                    onClick={() => handleTabSelect('productivity')}
                    className={`py-3 text-[9px] sm:text-[10px] font-bold tracking-tight uppercase transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      currentTab === 'productivity'
                        ? 'bg-white dark:bg-[#08080a] text-indigo-600 dark:text-indigo-400 font-extrabold border-b-2 border-indigo-500'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/50'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Workflows
                  </button>
                  <button
                    onClick={() => handleTabSelect('calendar')}
                    className={`py-3 text-[9px] sm:text-[10px] font-bold tracking-tight uppercase transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                      currentTab === 'calendar'
                        ? 'bg-white dark:bg-[#08080a] text-indigo-600 dark:text-indigo-400 font-extrabold border-b-2 border-indigo-500'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/50'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    Calendar Sync
                  </button>
                </div>

                {/* TAB CONTENT: WEBSITE MOCKUP ENERGY */}
                {currentTab === 'website' && (
                  <div className="bg-white dark:bg-[#0c0c0e] flex flex-col justify-between theme-transition">
                    
                    {/* Control bar for live customizing of website mockup */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-[#ecece8] dark:border-[#17171d] bg-zinc-50/50 dark:bg-[#111115]/50 text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Accent:</span>
                        <div className="flex gap-1.5">
                          {[
                            { val: 'indigo', color: 'bg-indigo-600' },
                            { val: 'emerald', color: 'bg-emerald-500' },
                            { val: 'amber', color: 'bg-amber-500' }
                          ].map(ac => (
                            <button
                              key={ac.val}
                              onClick={() => {
                                setMockAccent(ac.val as any);
                                addLog(`Showcase: Switched mockup accent theme to ${ac.val.toUpperCase()}`, 'info');
                              }}
                              className={`w-3 h-3 rounded-full ${ac.color} border transition-all ${
                                mockAccent === ac.val ? 'scale-125 ring-2 ring-indigo-500/20' : 'opacity-60 hover:opacity-100'
                              }`}
                              title={`${ac.val.toUpperCase()} Theme`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 px-1">
                          <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase px-1">View:</span>
                          <button
                            onClick={() => {
                              setMockLayout('bento');
                              addLog(`Showcase: Layout updated to responsive Bento Grid`, 'info');
                            }}
                            className={`px-1.5 py-0.5 text-[8px] font-bold rounded cursor-pointer ${mockLayout === 'bento' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600'}`}
                          >
                            Bento
                          </button>
                          <button
                            onClick={() => {
                              setMockLayout('minimal');
                              addLog(`Showcase: Layout updated to Elegant Contact Form`, 'info');
                            }}
                            className={`px-1.5 py-0.5 text-[8px] font-bold rounded cursor-pointer ${mockLayout === 'minimal' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600'}`}
                          >
                            Form
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 min-h-[300px] flex flex-col justify-between">
                      {/* DYNAMIC CANVAS CONTENT BASED ON CONTROLS */}
                      <div className="space-y-4">
                        {mockLayout === 'bento' ? (
                          /* BENTO GRID MOCKUP */
                          <div className="grid grid-cols-12 gap-3 text-left">
                            {/* Logo & Status line */}
                            <div className="col-span-12 flex items-center justify-between p-2.5 rounded-xl bg-[#fbfbfa] dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs text-zinc-800 dark:text-white font-sans tracking-tight">It's LLC</span>
                                <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase">v1.2 Live</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {trafficMultiplier > 1 && (
                                  <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse">
                                    5x LOAD
                                  </span>
                                )}
                                <button
                                  onClick={pingLatency}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 transition cursor-pointer"
                                  title="Click to test live server latency"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${trafficMultiplier > 1 ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                                  <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-mono font-bold">
                                    Response: {trafficMultiplier > 1 ? Math.max(5, latencyMs - 1) : latencyMs}ms
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* Main Headline card with active accent gradient border */}
                            <div className="col-span-8 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between min-h-[96px]">
                              <div>
                                <span className="text-[8px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Modern UI Block</span>
                                <h4 className="text-xs font-black tracking-tight text-zinc-800 dark:text-zinc-100 leading-tight">
                                  Lightweight, high-performance code that <span className={`underline decoration-2 ${
                                    mockAccent === 'indigo' ? 'decoration-indigo-500' : mockAccent === 'emerald' ? 'decoration-emerald-500' : 'decoration-amber-500'
                                  }`}>converts visitors</span>.
                                </h4>
                              </div>
                              <div className="text-[8px] text-zinc-400 font-mono mt-2">
                                speed = absolute
                              </div>
                            </div>

                            {/* Circular radial indicator for Google Speed */}
                            <div className="col-span-4 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center">
                              <div className="relative flex items-center justify-center w-12 h-12 mb-1">
                                <svg className="w-12 h-12 transform -rotate-90">
                                  <circle cx="24" cy="24" r="20" fill="transparent" stroke={resolvedTheme === 'dark' ? '#1f1f23' : '#f1f1ee'} strokeWidth="3" />
                                  <circle cx="24" cy="24" r="20" fill="transparent" stroke="#10b981" strokeWidth="3" strokeDasharray="125.6" strokeDashoffset="0" />
                                </svg>
                                <span className="absolute text-[11px] font-black font-mono text-emerald-500">100</span>
                              </div>
                              <span className="text-[8px] uppercase tracking-wider font-mono font-bold text-zinc-400 dark:text-zinc-500">Google Speed</span>
                            </div>

                            {/* Conversions Analytics Wave Chart Card */}
                            <div className={`col-span-12 p-3 rounded-xl bg-zinc-950 border relative overflow-hidden transition-all duration-300 ${
                              trafficMultiplier > 1
                                ? 'border-emerald-500/80 shadow-[0_0_24px_-4px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/30'
                                : 'border-zinc-900'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[8px] font-mono font-bold uppercase flex items-center gap-1 ${
                                  trafficMultiplier > 1 ? 'text-emerald-400' : 'text-zinc-500'
                                }`}>
                                  {trafficMultiplier > 1 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                                  {trafficMultiplier > 1 ? '5x Traffic Surge Active' : 'Conversion Rate Path'}
                                </span>
                                <span className={`text-[8px] font-mono font-bold transition-all ${
                                  trafficMultiplier > 1 ? 'text-emerald-400 scale-105' : 'text-emerald-500'
                                }`}>
                                  {trafficMultiplier > 1 ? '+92.0% Surge Lift (5.0x)' : '+18.4% Average Lift'}
                                </span>
                              </div>

                              <div className="h-16 relative overflow-hidden mb-2">
                                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                                  <defs>
                                    <linearGradient id="gradientShimmer" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor={trafficMultiplier > 1 ? '#10b981' : (mockAccent === 'indigo' ? '#4f46e5' : mockAccent === 'emerald' ? '#10b981' : '#f59e0b')} stopOpacity={trafficMultiplier > 1 ? '0.65' : '0.4'} />
                                      <stop offset="100%" stopColor={trafficMultiplier > 1 ? '#10b981' : (mockAccent === 'indigo' ? '#4f46e5' : mockAccent === 'emerald' ? '#10b981' : '#f59e0b')} stopOpacity="0" />
                                    </linearGradient>
                                  </defs>
                                  <line x1="0" y1="25" x2="300" y2="25" stroke="#27272a" strokeDasharray="3 3" strokeWidth="0.7" />
                                  <line x1="0" y1="55" x2="300" y2="55" stroke="#27272a" strokeDasharray="3 3" strokeWidth="0.7" />
                                  <path
                                    d={trafficMultiplier > 1
                                      ? "M0 88 Q 35 42, 75 50 T 150 22 T 225 14 T 300 4 L 300 100 L 0 100 Z"
                                      : "M0 80 Q 50 60, 100 75 T 200 45 T 300 15 L 300 100 L 0 100 Z"}
                                    fill="url(#gradientShimmer)"
                                    className="transition-all duration-300"
                                  />
                                  <path
                                    d={trafficMultiplier > 1
                                      ? "M0 88 Q 35 42, 75 50 T 150 22 T 225 14 T 300 4"
                                      : "M0 80 Q 50 60, 100 75 T 200 45 T 300 15"}
                                    fill="none"
                                    stroke={trafficMultiplier > 1 ? '#10b981' : (mockAccent === 'indigo' ? '#4f46e5' : mockAccent === 'emerald' ? '#10b981' : '#f59e0b')}
                                    strokeWidth={trafficMultiplier > 1 ? "3.2" : "2.5"}
                                    strokeLinecap="round"
                                    className="transition-all duration-300"
                                  />
                                  <circle cx={trafficMultiplier > 1 ? 150 : 200} cy={trafficMultiplier > 1 ? 22 : 45} r={trafficMultiplier > 1 ? "4" : "3.5"} fill="#10b981" />
                                  {trafficMultiplier > 1 && (
                                    <circle cx="296" cy="5" r="7" fill="#10b981" fillOpacity="0.3" className="animate-ping" />
                                  )}
                                  <circle cx={trafficMultiplier > 1 ? 296 : 300} cy={trafficMultiplier > 1 ? 5 : 15} r={trafficMultiplier > 1 ? "4.5" : "3.5"} fill={trafficMultiplier > 1 ? '#34d399' : (mockAccent === 'indigo' ? '#4f46e5' : mockAccent === 'emerald' ? '#10b981' : '#f59e0b')} />
                                </svg>
                                
                                <div className={`absolute top-1 left-1 text-[8px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                                  trafficMultiplier > 1
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                    : 'text-zinc-500'
                                }`}>
                                  {trafficMultiplier > 1 ? 'SURGE: 5.0x ACTIVE • 512 req/s' : 'Multiplier: 1x baseline'}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (trafficMultiplier === 1) {
                                    setTrafficMultiplier(5);
                                    setLiveConversions(prev => prev + 45);
                                    setLiveLeads(prev => prev + 4);
                                    addLog('Showcase: 5x Traffic Surge ENGAGED — +45 instant clicks & +4 leads captured at sub-10ms edge latency!', 'success');
                                  } else {
                                    setTrafficMultiplier(1);
                                    addLog('Showcase: Traffic simulator throttled back to 1x baseline.', 'info');
                                  }
                                }}
                                className={`w-full py-1.5 rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                  trafficMultiplier > 1 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-indigo-500/50'
                                }`}
                              >
                                <Zap className={`w-3 h-3 ${trafficMultiplier > 1 ? 'animate-bounce fill-white' : 'text-amber-400'}`} />
                                {trafficMultiplier > 1 ? '5x Surge Active • Click to Throttle (1x)' : 'Simulate 5x Traffic Surge'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* MINIMAL CONTACT FORM STYLE MOCKUP */
                          <div className="space-y-3 text-left">
                            <div className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-900 bg-[#fbfbfa]/50 dark:bg-zinc-950/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Interactive Lead Form</span>
                                <span className="text-[9px] font-mono text-emerald-500">Optimized conversion template</span>
                              </div>
                              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Schedule your discovery call</h4>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Custom code captures lead profiles instantly.</p>
                            </div>

                            {mockFormSubmitted ? (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 text-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center justify-center min-h-[120px]"
                              >
                                <CheckCircle className="w-7 h-7 text-emerald-500 mb-1.5 animate-bounce" />
                                <h5 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100">Inquiry Captured Successfully!</h5>
                                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-2.5">Lead process completed in 240ms & piped to Calendar.</p>
                                <button
                                  onClick={() => {
                                    setMockFormSubmitted(false);
                                    setMockFormName('');
                                    setMockFormEmail('');
                                    addLog('Showcase Form: Reset for another lead simulation.', 'info');
                                  }}
                                  className="px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                                >
                                  Submit Another Test
                                </button>
                              </motion.div>
                            ) : (
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Your Name</label>
                                  <input 
                                    type="text"
                                    value={mockFormName}
                                    onChange={(e) => setMockFormName(e.target.value)}
                                    placeholder="e.g. David, Founder"
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Business Email</label>
                                  <input 
                                    type="email"
                                    value={mockFormEmail}
                                    onChange={(e) => setMockFormEmail(e.target.value)}
                                    placeholder="e.g. david@example.com"
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    setMockFormSubmitted(true);
                                    setLiveLeads(prev => prev + 1);
                                    addLog(`Showcase Form: Ingestion detected for "${mockFormName || 'Prospective Lead'}" (${mockFormEmail || 'lead@example.com'})`, 'success');
                                    addLog('Showcase Automation: Inquiry verified & piped to lead dashboard in 240ms.', 'info');
                                  }}
                                  className={`w-full py-2 text-white text-xs font-bold rounded-lg uppercase tracking-wider transition cursor-pointer mt-1 ${
                                    mockAccent === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' : mockAccent === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'
                                  }`}
                                >
                                  Submit Mock Form
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BOTTOM METRICS STATS SUMMARY */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#ecece8] dark:border-[#1d1c21] mt-4">
                        <div className={`text-center p-2 rounded-lg border transition-all ${
                          trafficMultiplier > 1
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                            : 'bg-[#fbfbfa] dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900'
                        }`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`block text-lg font-mono font-extrabold transition-colors ${
                              trafficMultiplier > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'
                            }`}>
                              {liveConversions.toLocaleString()}
                            </span>
                            {trafficMultiplier > 1 && (
                              <span className="text-[8px] font-mono font-extrabold px-1 py-0.2 rounded bg-emerald-500 text-white animate-pulse">
                                +5x
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] text-zinc-450 dark:text-zinc-500 uppercase font-bold tracking-wide">Monthly Clicks</span>
                        </div>
                        <div className={`text-center p-2 rounded-lg border transition-all ${
                          trafficMultiplier > 1
                            ? 'bg-indigo-500/10 border-indigo-500/40 shadow-xs'
                            : 'bg-[#fbfbfa] dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900'
                        }`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="block text-lg font-mono font-extrabold text-indigo-500">
                              {liveLeads.toLocaleString()}
                            </span>
                            {trafficMultiplier > 1 && (
                              <span className="text-[8px] font-mono font-extrabold px-1 py-0.2 rounded bg-indigo-600 text-white animate-pulse">
                                SURGING
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] text-indigo-500 uppercase font-bold tracking-wide">Qualified Leads</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: ACTIVE EMBEDDED AI AGENT */}
                {currentTab === 'ai_agent' && renderAiAgentContent(false)}

                {/* TAB CONTENT: WORKFLOW / PRODUCTIVITY APP HINTS */}
                {currentTab === 'productivity' && (() => {
                  const presetData = {
                    intake: {
                      label: 'New Lead ($2.5k)',
                      client: 'Apex Logistics',
                      stepPayloads: [
                        '{ client: "Apex Logistics", budget: "$2,500", spamScore: 0.01, status: "VERIFIED_14ms" }',
                        '{ slot: "Tomorrow 09:30 AM", calendar: "Primary", smsAlert: "SENT", collision: false }',
                        '{ stripeEvent: "invoice.created", amount: "$1,250", workspace: "READY" }'
                      ]
                    },
                    booking: {
                      label: 'VIP Consult',
                      client: 'Lumina Health',
                      stepPayloads: [
                        '{ client: "Lumina Health", priority: "VIP_FAST", intent: "Portal", status: "ROUTED_11ms" }',
                        '{ slot: "Thu 02:00 PM", calendar: "Sync OK", smsReminder: "QUEUED", collision: false }',
                        '{ stripeEvent: "retainer.verified", tier: "Sprint", workspace: "PROVISIONED" }'
                      ]
                    },
                    renewal: {
                      label: 'AI Agent Cycle',
                      client: 'VaultWave Co.',
                      stepPayloads: [
                        '{ client: "VaultWave Co.", agent: "Core-v2", tokens: "4.2k", status: "AUTHORIZED_9ms" }',
                        '{ syncEvent: "audit.checkpoint", reportUrl: "itsllc.itsyouonline.com/ok", notified: true }',
                        '{ stripeEvent: "ai_runtime.paid", amount: "$150/mo", uptime: "99.99%" }'
                      ]
                    }
                  }[workflowPreset];

                  const activeVisualStep = testRunActive ? testRunStep : (isAutomating ? autopilotPulseStep : selectedWorkflowStep);
                  const isCycleFinished = workflowRunComplete || (!testRunActive && isAutomating && autopilotPulseStep === 3);
                  const connectorHeightPct = isCycleFinished ? 100 : activeVisualStep === 0 ? 18 : activeVisualStep === 1 ? 56 : activeVisualStep === 2 ? 90 : 0;

                  const triggerWorkflowTestRun = () => {
                    if (testRunActive) return;
                    setWorkflowRunComplete(false);
                    setTestRunActive(true);
                    setTestRunStep(0);
                    setSelectedWorkflowStep(0);
                    addLog(`Workflow Test Run [${presetData.client}]: Stage 1 Ingestion verified (14ms).`, 'warning');

                    setTimeout(() => {
                      setTestRunStep(1);
                      setSelectedWorkflowStep(1);
                      addLog(`Workflow Test Run [${presetData.client}]: Stage 2 Calendar slot reserved & SMS sent.`, 'success');
                    }, 750);

                    setTimeout(() => {
                      setTestRunStep(2);
                      setSelectedWorkflowStep(2);
                      addLog(`Workflow Test Run [${presetData.client}]: Stage 3 Stripe webhook synced & workspace provisioned.`, 'success');
                    }, 1500);

                    setTimeout(() => {
                      setTestRunStep(3);
                      setTestRunActive(false);
                      setWorkflowRunComplete(true);
                      setWorkflowEventsCount(c => c + 1);
                      setWorkflowHoursSaved(h => Number((h + 0.5).toFixed(1)));
                      addLog(`Workflow Complete: "${presetData.client}" processed end-to-end in 245ms!`, 'success');
                      setTimeout(() => {
                        setTestRunStep(-1);
                      }, 2200);
                    }, 2250);
                  };

                  return (
                    <div className="bg-white dark:bg-[#0c0c0e] flex flex-col justify-between theme-transition">
                      
                      {/* Control / Info header */}
                      <div className="flex items-center justify-between px-4 py-2 border-b border-[#ecece8] dark:border-[#17171d] bg-zinc-50/50 dark:bg-[#111115]/50 text-xs text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isAutomating || testRunActive ? 'bg-emerald-500 animate-ping' : 'bg-zinc-400'}`} />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">
                            Live Pipeline • {presetData.client}
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !isAutomating;
                            setIsAutomating(nextState);
                            addLog(`Workflow Autopilot: ${nextState ? 'ENGAGED (live event streaming)' : 'PAUSED (manual inspect mode)'}`, 'warning');
                          }}
                          className={`p-1 px-2 rounded text-[8px] font-bold uppercase flex items-center gap-1 cursor-pointer transition ${
                            isAutomating ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          <RefreshCw className={`w-2 h-2 ${isAutomating ? 'animate-spin' : ''}`} />
                          {isAutomating ? 'Autopilot Live' : 'Autopilot Paused'}
                        </button>
                      </div>

                      <div className="p-4 sm:p-5 min-h-[300px] flex flex-col justify-between text-left">
                        <div>
                          {/* Scenario Preset Selector */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[8px] font-mono uppercase font-bold text-zinc-400 tracking-wider shrink-0">
                              Event Payload:
                            </span>
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                              {([
                                { id: 'intake', label: 'New Lead' },
                                { id: 'booking', label: 'VIP Consult' },
                                { id: 'renewal', label: 'AI Runtime' }
                              ] as const).map((preset) => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => {
                                    setWorkflowPreset(preset.id);
                                    addLog(`Workflow Payload switched to "${preset.label}"`, 'info');
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-bold transition cursor-pointer border ${
                                    workflowPreset === preset.id
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CONNECTED INTERACTIVE PIPELINE */}
                          <div className="space-y-2 select-none relative">
                            {/* Dotted background line */}
                            <div className="absolute left-[17px] top-4 bottom-4 w-0.5 border-l border-dashed border-zinc-200 dark:border-zinc-800 z-0" />
                            {/* Dynamic animated progress beam along the connector */}
                            <div 
                              className="absolute left-[16px] top-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 via-emerald-400 to-emerald-500 z-0 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                              style={{ height: `calc(${connectorHeightPct}% - 24px)`, maxHeight: 'calc(100% - 32px)' }}
                            />

                            {[
                              { 
                                step: 0,
                                title: 'Direct Client Ingestion', 
                                tech: 'API • 14ms',
                                desc: 'Payload validated, spam filtered & sanitized'
                              },
                              { 
                                step: 1,
                                title: 'Zero-Collision Calendar Sync', 
                                tech: 'GCal • 142ms',
                                desc: 'Reserves vacant slot & dispatches SMS alert'
                              },
                              { 
                                step: 2,
                                title: 'Automatic Stripe Billing Sync', 
                                tech: 'Stripe • 89ms',
                                desc: 'Processes webhook & provisions client portal'
                              }
                            ].map((stepObj) => {
                              const isCompleted = isCycleFinished || activeVisualStep > stepObj.step;
                              const isRunning = (testRunActive && testRunStep === stepObj.step) || (!testRunActive && isAutomating && autopilotPulseStep === stepObj.step);
                              const isInspected = selectedWorkflowStep === stepObj.step;

                              return (
                                <div 
                                  key={stepObj.step}
                                  onClick={() => {
                                    setSelectedWorkflowStep(stepObj.step);
                                    addLog(`Workflow Inspector: Viewing live payload for "${stepObj.title}"`, 'info');
                                  }}
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer relative z-10 flex items-start gap-3 ${
                                    isRunning
                                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm dark:bg-indigo-950/30 ring-1 ring-indigo-500/30'
                                      : isCompleted
                                        ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/15'
                                        : isInspected
                                          ? 'border-indigo-400/50 bg-indigo-50/40 dark:bg-indigo-950/15'
                                          : 'border-zinc-100 bg-[#fbfbfa]/80 dark:border-zinc-900 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                                  }`}
                                >
                                  <div className="mt-0.5 flex-shrink-0">
                                    {isCompleted ? (
                                      <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-black shadow-xs">
                                        ✓
                                      </span>
                                    ) : isRunning ? (
                                      <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin block" />
                                    ) : (
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold ${
                                        isInspected ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-550'
                                      }`}>
                                        {stepObj.step + 1}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <h5 className={`text-xs font-bold truncate ${
                                        isRunning ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'
                                      }`}>
                                        {stepObj.title}
                                      </h5>
                                      <span className={`text-[7.5px] font-mono uppercase px-1.5 py-0.2 rounded shrink-0 font-bold ${
                                        isRunning
                                          ? 'bg-indigo-600 text-white animate-pulse'
                                          : isCompleted
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                            : 'text-zinc-400 dark:text-zinc-500'
                                      }`}>
                                        {isRunning ? 'RUNNING' : isCompleted ? 'PASSED' : stepObj.tech}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug truncate">{stepObj.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* LIVE PAYLOAD TRACE INSPECTOR */}
                          <div className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-950 text-zinc-200 mt-3 font-mono">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Live Node Trace (Step {selectedWorkflowStep + 1})
                              </span>
                              <span className="text-[8px] text-emerald-400 font-bold">
                                {isCycleFinished ? '200 OK • 245ms total' : 'STREAM READY'}
                              </span>
                            </div>
                            <code className="text-[8.5px] text-indigo-300 block leading-relaxed break-all">
                              {presetData.stepPayloads[selectedWorkflowStep]}
                            </code>
                          </div>
                        </div>

                        {/* WORKFLOW CONTROL FOOTER WITH REAL TELEMETRY COUNTERS */}
                        <div className="pt-3 border-t border-zinc-150 dark:border-zinc-900 mt-3 space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800/80 flex items-center justify-between">
                              <span className="text-[8px] font-mono uppercase text-zinc-400">Events Run</span>
                              <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                                {workflowEventsCount}
                              </span>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                              <span className="text-[8px] font-mono uppercase text-emerald-600 dark:text-emerald-400">Hours Saved</span>
                              <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                {workflowHoursSaved}h
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={triggerWorkflowTestRun}
                            disabled={testRunActive}
                            className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                              testRunActive 
                                ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' 
                                : isCycleFinished && testRunStep === 3
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99]'
                            }`}
                          >
                            <Activity className={`w-3.5 h-3.5 ${testRunActive ? 'animate-spin' : ''}`} />
                            {testRunActive
                              ? `Executing Node ${testRunStep + 1}/3...`
                              : testRunStep === 3
                                ? '✓ Pipeline Complete (+0.5h Saved) • Run Again'
                                : 'Fire Live Pipeline Test Run'}
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })()}

                {/* TAB CONTENT: GOOGLE CALENDAR & FIREBASE SYNC */}
                {currentTab === 'calendar' && (
                  <div className="bg-white dark:bg-[#0c0c0e] flex flex-col justify-between theme-transition">
                    {/* Control / Auth Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#ecece8] dark:border-[#17171d] bg-zinc-50/50 dark:bg-[#111115]/50 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-650 dark:text-indigo-400 font-mono">Firebase + OAuth Node</span>
                      </div>
                      
                      {currentUser ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500 max-w-[150px] truncate">
                            {currentUser.email}
                          </span>
                          <button
                            onClick={handleLogout}
                            className="p-1 px-2 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-450 hover:bg-rose-100 text-[9px] font-bold uppercase cursor-pointer transition"
                          >
                            Sign Out
                          </button>
                        </div>
                      ) : isCalendarDemo ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase">
                            Demo Mode Active
                          </span>
                          <button
                            onClick={exitCalendarDemo}
                            className="p-1 px-2 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[9px] font-bold uppercase cursor-pointer transition"
                          >
                            Exit Demo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={enableCalendarDemo}
                          className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase font-mono hover:underline cursor-pointer"
                        >
                          Try Demo Sandbox →
                        </button>
                      )}
                    </div>

                    <div className="p-5 min-h-[380px] flex flex-col justify-between text-left">
                      {needsAuth ? (
                        /* AUTHENTICATION PROMPT */
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 animate-pulse">
                            <Shield className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight">
                            Secure Google Workspace Gateway
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
                            Sign in with your Google Account to authorize real-time scheduling on your personal Calendar, or try the interactive sandbox instantly.
                          </p>
                          <div className="mt-5 space-y-2 w-full max-w-xs">
                            <button
                              onClick={handleGoogleSignIn}
                              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide uppercase bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                            >
                              <User className="w-3.5 h-3.5" />
                              Authenticate Google Account
                            </button>
                            <button
                              onClick={enableCalendarDemo}
                              className="w-full py-2 px-4 rounded-xl text-xs font-bold tracking-wide uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Try Interactive Demo Sandbox
                            </button>
                            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 text-left leading-normal space-y-1">
                              <span className="font-bold block text-amber-900 dark:text-amber-200">
                                If Google says "Google hasn't verified this app":
                              </span>
                              <p className="text-[10px] text-amber-800/90 dark:text-amber-300/90">
                                This is standard for newly created development apps. Simply click <strong>"Advanced"</strong> (bottom-left of Google's dialog), then click <strong>"Go to It's LLC Agency Site (unsafe)"</strong> to grant calendar access. Or click <strong>"Try Interactive Demo Sandbox"</strong> above for an instant preview.
                              </p>
                            </div>
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                              Required scope: /auth/calendar.events • OAuth 2.0
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* SPLIT DASHBOARD VIEW */
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                          {/* Left Column: Booking Form */}
                          <div className="md:col-span-6 space-y-3">
                            <div className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-900 bg-[#fbfbfa]/50 dark:bg-zinc-950/50">
                              <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                                Schedule Custom Slot
                              </h4>
                              <p className="text-[10px] text-zinc-455 dark:text-zinc-500 mt-0.5 leading-snug">
                                Complete fields to provision a real calendar placeholder and sync database files.
                              </p>
                            </div>

                            <div className="space-y-2.5 text-xs">
                              <div>
                                <label className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                                  Meeting Summary
                                </label>
                                <input
                                  type="text"
                                  value={bookingSubject}
                                  onChange={(e) => setBookingSubject(e.target.value)}
                                  placeholder="e.g., It's LLC Consultation Strategy"
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                />
                              </div>

                              <div>
                                <label className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                                  Meeting Details
                                </label>
                                <textarea
                                  value={bookingDesc}
                                  onChange={(e) => setBookingDesc(e.target.value)}
                                  placeholder="Reviewing business automations..."
                                  rows={2}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                                    Date
                                  </label>
                                  <input
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={handleCreateBooking}
                                disabled={isBookingInProgress}
                                className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition ${
                                  isBookingInProgress
                                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                              >
                                {isBookingInProgress ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Creating Active Slot...
                                  </>
                                ) : (
                                  <>
                                    <Calendar className="w-3.5 h-3.5" />
                                    Book Consultation Slot
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Right Column: Google events + Firestore records logs */}
                          <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                            <div className="flex-1 space-y-2">
                              {/* Tab toggle lists */}
                              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900 pb-1">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">
                                  Sync Status: Online
                                </span>
                                <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                                  DB Linked
                                </span>
                              </div>

                              {/* Calendar Events Block */}
                              <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
                                <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                                  Live Calendar Feed (From primary)
                                </span>
                                
                                {isLoadingCalendar ? (
                                  <div className="py-6 text-center text-[10px] font-mono text-zinc-400">
                                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-500" />
                                    Streaming Google Calendar events...
                                  </div>
                                ) : calendarEvents.length === 0 ? (
                                  <div className="p-3 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 font-sans">
                                    No upcoming calendar meetings found.
                                  </div>
                                ) : (
                                  calendarEvents.map((evt) => (
                                    <div
                                      key={evt.id}
                                      className="p-2 rounded-lg border border-zinc-100 dark:border-[#131317] bg-[#fbfbfa]/60 dark:bg-zinc-950/40 flex items-start justify-between gap-1.5"
                                    >
                                      <div className="truncate">
                                        <h5 className="text-[10px] font-bold text-zinc-850 dark:text-zinc-200 truncate">
                                          {evt.summary || '(No Subject)'}
                                        </h5>
                                        <p className="text-[8px] text-zinc-450 dark:text-zinc-500 truncate mt-0.5">
                                          {evt.description || 'No meeting details'}
                                        </p>
                                      </div>
                                      <span className="text-[8px] font-mono text-indigo-500 font-bold whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/30 px-1 py-0.5 rounded">
                                        {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'All-day'}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Firestore Sync Logs Block */}
                              <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1 pt-1 border-t border-dashed border-zinc-150 dark:border-zinc-900">
                                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                  Firestore Collection Bookings
                                </span>
                                
                                {firestoreBookings.length === 0 ? (
                                  <div className="p-3 text-center rounded-xl border border-dashed border-zinc-250 dark:border-zinc-800 text-[10px] text-zinc-400 font-sans">
                                    No Firestore synchronized logs.
                                  </div>
                                ) : (
                                  firestoreBookings.map((bk) => (
                                    <div
                                      key={bk.id}
                                      className="p-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 flex items-start justify-between gap-1.5"
                                    >
                                      <div className="truncate">
                                        <h5 className="text-[10px] font-bold text-zinc-850 dark:text-zinc-150 truncate">
                                          {bk.summary}
                                        </h5>
                                        <p className="text-[8px] text-zinc-450 dark:text-zinc-500 truncate">
                                          DB ID: {bk.id}
                                        </p>
                                      </div>
                                      <span className="text-[8.5px] font-mono text-emerald-600 font-bold whitespace-nowrap">
                                        ✓ Synced
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Column footer stats preview */}
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#ecece8] dark:border-[#1d1c21] mt-auto">
                              <div className="text-center p-2 rounded-lg bg-[#fbfbfa] dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                                <span className="block text-sm font-mono font-extrabold text-zinc-900 dark:text-white">
                                  {calendarEvents.length}
                                </span>
                                <span className="text-[8px] text-zinc-450 dark:text-zinc-500 uppercase font-bold tracking-wide">Calendar Events</span>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-[#fbfbfa] dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                                <span className="block text-sm font-mono font-extrabold text-indigo-500">
                                  {firestoreBookings.length}
                                </span>
                                <span className="text-[8px] text-indigo-500 uppercase font-bold tracking-wide">Firestore DB Docs</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* COMPACT CREDIBILITY STRIP */}
      <section className="bg-zinc-50 dark:bg-[#070709] border-b border-[#ecece8] dark:border-[#131317] py-6 sm:py-8 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            {/* Trust Point 1 */}
            <div className="flex items-start gap-3.5 text-left">
              <div className="p-2 rounded-xl bg-indigo-50/55 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/40 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0 animate-pulse">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">21 Shipped MVPs</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-mono">2025 Velocity</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                  Independently designed, coded, and launched 21 custom applications from scratch in a single year with ultra-fast delivery.
                </p>
              </div>
            </div>

            {/* Trust Point 2 */}
            <div className="flex items-start gap-3.5 text-left">
              <div className="p-2 rounded-xl bg-indigo-50/55 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/40 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Top 0.01% AI Power</span>
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded font-mono">20k+ Prompts</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                  Elite generative AI leverage. Zero manual templates or delays, utilizing custom Prompt Workflows for robust, optimized code.
                </p>
              </div>
            </div>

            {/* Trust Point 3 */}
            <div className="flex items-start gap-3.5 text-left">
              <div className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 text-indigo-400 mt-1 flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Direct Founder Leverage</span>
                  <span className="text-[9px] text-zinc-400 font-bold bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded font-mono">No Middlemen</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                  Forged from 5 years homeless to elite custom developer. You design, build, and deploy directly with me—never an agency middleman.
                </p>
              </div>
            </div>

          </div>
        </motion.div>
      </section>

      {/* BLEEDING NECK AI PROBLEM-SOLVER SECTION */}
      <section className="py-20 border-b border-[#ecece8] dark:border-[#131317]">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-3xl mb-12 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">
              The Standard Embedded Asset
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white leading-tight">
              The "Bleeding Neck" Problems My Custom AI Solves.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 mt-3 max-w-2xl leading-relaxed">
              Standard websites look pretty, but they leave your biggest leaks completely open. Every build I deliver includes an integrated, autonomous AI Agent custom-trained to eliminate critical operational friction and generate continuous cash flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "The 2 AM Lead Ghost",
                pain: "Lost Sleep = Lost Revenue",
                sol: "While your team is asleep, cold traffic leaves. My embedded AI engages visitors instantly, qualifies budgets, and books discovery calls on your Google Calendar within 30 seconds.",
                metric: "Wipes out 100% of delay loss",
                color: "indigo"
              },
              {
                title: "The Spreadsheet Prison",
                pain: "15+ Hours of Manual Copying",
                sol: "Wasting hours keying in form submissions? Hand-coded intake pipelines process files and pipe them directly into an AI core that cleans, categorizes, and logs records automatically.",
                metric: "Save 12+ manual hours/week",
                color: "emerald"
              },
              {
                title: "The Margin Leak",
                pain: "Discrepancies & Stock Lag",
                sol: "Disputes and inventory discrepancies chip away at boutiques and retail stores. The custom audit AI reviews stock files, verifies transaction ledgers, and shields operational margins.",
                metric: "Prevents inventory shrinkage",
                color: "amber"
              },
              {
                title: "The Recurring Income Stream",
                pain: "Low Website Return-on-Investment",
                sol: "Every build acts as a SaaS platform. By embedding custom AI capabilities, business owners charge their end-customers high-margin recurring usage or support retainers.",
                metric: "+$250/mo recurring markup",
                color: "indigo"
              }
            ].map((card, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl border bg-white dark:bg-[#0c0c0e] border-[#ecece8] dark:border-[#131317] hover:border-zinc-450 dark:hover:border-zinc-850 flex flex-col justify-between text-left transition-colors relative overflow-hidden group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[8.5px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                      card.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' : card.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {card.pain}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold">0{idx+1}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    {card.sol}
                  </p>
                </div>
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 text-[10px] font-mono font-extrabold text-indigo-650 dark:text-indigo-400">
                  {card.metric}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CORE STRATEGIC SERVICES SECTION (#services) */}
      <section id="services" className="py-20 border-b border-[#ecece8] dark:border-[#131317] relative bg-zinc-50/40 dark:bg-[#0a0a0c]/40">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Core Offers & Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white leading-tight">
                Premium layouts engineered directly to move critical business outcomes.
              </h2>
            </div>
            <a
              href="#project-estimator"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors shrink-0 border border-indigo-200/60 dark:border-indigo-800/40 shadow-xs"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Launch Cost Estimator ($500 Min) ↓</span>
            </a>
          </div>

          {/* Premium customized Strategic services grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Custom AI-Embedded Websites',
                desc: 'Fast, responsive storefronts with an on-duty custom AI Agent. It engages every visitor, handles immediate FAQs, qualifies high-ticket leads instantly, and schedules them. Actively setup to generate monthly recurring software margin from day one.',
                bullet: 'Brand Authority + Embedded Active AI',
                metric: '+$180/mo recurring asset',
                btnText: 'Get website blueprint',
                icon: Layers,
                accent: 'border-l-indigo-600'
              },
              {
                title: 'High-Converting Sales Bots',
                desc: 'Focused campaign pages equipped with embedded AI sales assistants. They capture and qualify cold traffic 24/7 on autopilot while you sleep—ensuring zero bleeding neck leads slip through the cracks.',
                bullet: 'Grow pipeline & qualify leads at 2 AM',
                metric: '32% average conversion lift',
                btnText: 'Build high-converting page',
                icon: Sparkles,
                accent: 'border-l-indigo-400'
              },
              {
                title: 'AI Productivity & Audit Systems',
                desc: 'Say goodbye to slow manual spreadsheets. Custom internal dashboards and client portals powered by autonomous background AI agents that auto-sync Stripe billing, coordinate twilio reminders, and shield inventory margins.',
                bullet: 'Wipe out manual spreadsheet drag',
                metric: 'Save 12+ manual hours/week',
                btnText: 'Automate daily tasks',
                icon: Cpu,
                accent: 'border-l-emerald-500'
              },
              {
                title: 'AI MVP & Rapid Startup Launches',
                desc: 'Clean, fully functional early-stage web apps built to validate your software or product ideas. Comes out-of-the-box with integrated AI models, letting you charge recurring subscription margins in days.',
                bullet: 'Rapid launch & SaaS model setup',
                metric: '14-day blueprint delivery',
                btnText: 'Launch product fast',
                icon: Zap,
                accent: 'border-l-amber-500'
              }
            ].map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                  className={`p-6 sm:p-8 rounded-2xl border bg-white dark:bg-[#0c0c0e] border-[#ecece8] dark:border-[#131317] hover:border-zinc-400 dark:hover:border-zinc-800 shadow-xs transition-colors flex flex-col justify-between text-left group border-l-4 ${srv.accent}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold">
                        {srv.metric}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white tracking-tight">
                      {srv.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                      {srv.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#ecece8] dark:border-[#131317] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 italic">
                      {srv.bullet}
                    </span>
                    <a
                      href="#contact"
                      onClick={() => {
                        setSelectedServices([srv.title]);
                        addLog(`Interactive selection changed budget context to: "${srv.title}"`, 'info');
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      {srv.btnText}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ITSYOUONLINE.COM MULTIVERSE HOSTING SHOWCASE STRIP */}
          <div className="mt-10 p-6 sm:p-7 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/70 via-white to-emerald-50/50 dark:from-indigo-950/30 dark:via-[#0c0c0e] dark:to-emerald-950/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Globe className="w-3 h-3" />
                <span>Soon To Be Released • ItsYouOnline.com Multiverse</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Host any build inside the <span className="text-indigo-600 dark:text-indigo-400">ItsYouOnline.com Multiverse</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Every website, portal, and AI agent built by It&apos;s LLC can launch inside our upcoming Multiverse cloud network on your own custom <strong className="font-mono text-zinc-900 dark:text-zinc-100">&lt;site&gt;.itsyouonline.com</strong> subdomain—with automatic SSL, edge routing, and zero DNS setup friction (or point your own custom domain anytime).
              </p>
            </div>
            <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  itsllc.itsyouonline.com
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  cafe.itsyouonline.com
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  {activeMultiverseHost}
                </span>
              </div>
              <a
                href="#multiverse-subdomain"
                onClick={() => addLog(`Services: Jumped to reserve ${activeMultiverseHost} in Multiverse`, 'info')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Reserve your &lt;site&gt;.itsyouonline.com address below</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* PROJECT ESTIMATOR SUBSECTION IN SERVICES */}
          <div id="project-estimator" className="mt-12 pt-12 border-t border-[#ecece8] dark:border-[#131317]">
            <div className="max-w-3xl mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Calculator className="w-3.5 h-3.5" />
                <span>Instant Cost Calculator • $500 Minimum</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Interactive Project Estimator
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Configure your required service architecture, modular add-ons, and custom <strong className="font-mono text-zinc-800 dark:text-zinc-200">&lt;site&gt;.itsyouonline.com</strong> Multiverse subdomain below for an instant price estimate. Every project with It's LLC has a guaranteed <strong className="text-zinc-800 dark:text-zinc-200">$500 baseline minimum</strong> for one-time development. Active Autonomous AI Agents carry a transparent monthly fee (+$150/mo) to cover real LLM API tokens, 24/7 inference uptime, and model maintenance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Step 1 & Step 2 Selection Panel (7 cols on large screens) */}
              <div className="lg:col-span-7 space-y-8">
                {/* Step 1: Base Architecture Scope */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono">1</span>
                      Select Core Architecture Scope
                    </span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      Base price starts at $500
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ESTIMATOR_SCOPES.map((scope) => {
                      const ScopeIcon = scope.icon;
                      const isSelected = estimatorScope === scope.id;
                      return (
                        <div
                          key={scope.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setEstimatorScope(scope.id);
                            addLog(`Estimator: Switched core scope to "${scope.name}" ($${scope.basePrice})`, 'info');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setEstimatorScope(scope.id);
                            }
                          }}
                          className={`cursor-pointer text-left p-4 rounded-xl border transition-all select-none relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/20'
                              : 'border-[#ecece8] dark:border-[#131317] bg-white dark:bg-[#0c0c0e] hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                                <ScopeIcon className="w-4 h-4" />
                              </div>
                              <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white">
                                ${scope.basePrice.toLocaleString()}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                              {scope.name}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                              {scope.desc}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              {scope.timeline}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}>
                              {isSelected ? 'Selected' : 'Select'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Modular Capabilities & Add-Ons */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono">2</span>
                      Modular Capabilities & Add-Ons
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {estimatorAddons.length} of {ESTIMATOR_ADDONS.length} active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ESTIMATOR_ADDONS.map((addon) => {
                      const AddonIcon = addon.icon;
                      const isChecked = estimatorAddons.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          onClick={() => toggleEstimatorAddon(addon.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleEstimatorAddon(addon.id);
                            }
                          }}
                          className={`cursor-pointer text-left p-3.5 rounded-xl border transition-all select-none flex items-start gap-3 ${
                            isChecked
                              ? 'border-indigo-600/70 dark:border-indigo-500/70 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                              : 'border-[#ecece8] dark:border-[#131317] bg-white dark:bg-[#0c0c0e] hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-indigo-600 text-white'
                              : 'border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                {addon.name}
                              </h5>
                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                                  +${addon.price}
                                </span>
                                {addon.monthlyPrice ? (
                                  <span className="font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">
                                    +${addon.monthlyPrice}/mo tokens
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
                              {addon.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Reserve Custom Multiverse Subdomain */}
                <div id="multiverse-subdomain" className="p-4 sm:p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/15 space-y-3 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono">3</span>
                      Claim ItsYouOnline.com Multiverse Subdomain
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Included • Launching Soon
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    All builds can be hosted inside the soon-to-be-released <strong className="text-zinc-800 dark:text-zinc-200">ItsYouOnline.com Multiverse</strong> with instant SSL and edge routing on a custom subdomain.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 flex items-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                      <span className="pl-3 pr-1 text-[11px] font-mono text-zinc-400 select-none">https://</span>
                      <input
                        type="text"
                        value={multiverseSubdomain}
                        onChange={(e) => setMultiverseSubdomain(sanitizeSubdomainSlug(e.target.value))}
                        placeholder="yourbrand"
                        aria-label="Custom Multiverse subdomain slug"
                        className="flex-1 min-w-0 py-2.5 px-1 text-xs font-mono font-bold text-zinc-900 dark:text-white bg-transparent outline-none"
                      />
                      <span className="pr-3 pl-1 text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-zinc-50 dark:bg-zinc-800/80 py-2.5 border-l border-zinc-200 dark:border-zinc-700 select-none shrink-0">
                        .itsyouonline.com
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimate Breakdown Receipt Card (5 cols on large screens) */}
              <div className="lg:col-span-5 sticky top-24">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] shadow-lg overflow-hidden">
                  {/* Card Header */}
                  <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-700 dark:text-zinc-300">
                        Live Breakdown
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold truncate max-w-[190px]">
                      {activeMultiverseHost}
                    </span>
                  </div>

                  {/* Itemized Table */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Selected Architecture
                      </div>
                      <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-white block">
                            {selectedScopeObj.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Est. delivery: {selectedScopeObj.timeline}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          ${selectedScopeObj.basePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Add-ons list */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Modular Add-Ons ({estimatorAddons.length})
                      </div>
                      {estimatorAddons.length === 0 ? (
                        <div className="text-xs text-zinc-400 italic py-1">
                          No add-ons selected yet.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {estimatorAddons.map((addonId) => {
                            const addon = ESTIMATOR_ADDONS.find((a) => a.id === addonId);
                            if (!addon) return null;
                            return (
                              <div key={addon.id} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-zinc-600 dark:text-zinc-300 truncate pr-2">
                                  + {addon.name}
                                  {addon.monthlyPrice ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-mono ml-1">
                                      (+${addon.monthlyPrice}/mo)
                                    </span>
                                  ) : null}
                                </span>
                                <span className="font-mono text-zinc-700 dark:text-zinc-300 shrink-0">
                                  ${addon.price}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Minimum baseline guarantee banner */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                      <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="font-bold block">$500 Minimum Build Baseline</span>
                        <span className="text-[11px] opacity-90">All It's LLC builds maintain a strict $500 minimum floor. Transparent pricing with zero speculative fluff.</span>
                      </div>
                    </div>

                    {/* Monthly AI Runtime Fee Block */}
                    {monthlyTotal > 0 ? (
                      <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-indigo-950 dark:text-indigo-200">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            Monthly AI Agent Runtime:
                          </span>
                          <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400 font-extrabold">
                            +${monthlyTotal.toLocaleString()}/mo
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          Running live Autonomous AI Agents incurs real server costs. This fee covers 24/7 LLM inference tokens, vector context memory, serverless runtime uptime, and continuous prompt maintenance.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Standard Self-Hosted Stack:</span>
                        <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300">$0/mo Agency Retainer</span>
                      </div>
                    )}

                    {/* Cost summary calculation */}
                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>One-Time Build Subtotal</span>
                        <span className="font-mono font-semibold">${rawEstimateTotal.toLocaleString()}</span>
                      </div>
                      {rawEstimateTotal < 500 && (
                        <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                          <span>$500 Minimum Floor Applied</span>
                          <span className="font-mono font-semibold">+$500.00</span>
                        </div>
                      )}
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                            One-Time Build
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Timeline: ~{selectedScopeObj.timeline}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono">
                            ${finalEstimatedTotal.toLocaleString()}
                          </span>
                          {monthlyTotal > 0 && (
                            <span className="block text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              + ${monthlyTotal}/mo AI runtime
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Guarantees */}
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 pt-1 font-mono">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Host in ItsYouOnline.com Multiverse ({activeMultiverseHost})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Zero forced retainers on standard custom sites</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Transparent monthly fees only for active AI compute</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>100% full intellectual property & codebase ownership</span>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={handleApplyEstimateToContact}
                        className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-500/25 flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        <span>Apply Estimate To Request</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEstimatorScope('landing');
                          setEstimatorAddons(['ai_agent', 'calendar']);
                          addLog('Estimator: Reset selections to standard Landing Stack defaults', 'info');
                        }}
                        className="w-full py-2 px-3 text-center text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-semibold transition-colors cursor-pointer"
                      >
                        Reset to default selections
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </section>

      {/* FEATURED CASE STUDIES / FEATURED WORK (#work) */}
      <section id="work" className="py-20 border-b border-[#ecece8] dark:border-[#131317]">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Strategic Work & Showcase
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white leading-tight">
                Case Studies Built For Impact
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              We do not build speculative aesthetic experiments. We construct hardened customer pipelines and automated systems designed to output raw margins.
            </p>
          </div>

          {/* Grid hosting the case studies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {CASE_STUDIES.map((cs) => (
              <div 
                key={cs.id}
                className="rounded-2xl border bg-white dark:bg-[#0c0c0e] border-[#ecece8] dark:border-[#131317] overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-800 shadow-sm flex flex-col justify-between text-left group hover:-translate-y-1 transition-all"
              >
                <div>
                  
                  {/* Decorative Case Study Mockup-energy Header */}
                  <div className={`p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 relative overflow-hidden`} >
                    
                    {/* Grid Pattern in Card mockup */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-20 pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 select-none">
                        Showcase File Mockup
                      </span>
                      <span className="text-[11px] font-mono tracking-wider font-bold text-zinc-500 select-none">
                        001 // {cs.id === 'bridge' ? 'B_CAFE_MDL' : 'SHRNK_V4'}
                      </span>
                    </div>

                    {/* Mini browser mock representation visual */}
                    <div className="rounded-lg border border-zinc-250 dark:border-zinc-800/80 bg-white dark:bg-[#111116] p-3 shadow-xs relative z-10">
                      <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                        <span className="text-[8px] font-mono text-zinc-450 uppercase">{cs.name} build preview</span>
                      </div>

                      {/* Mocked chart grid blocks inside static visual mockup */}
                      <div className="grid grid-cols-3 gap-2">
                        {cs.metrics.map((mtr, idx) => (
                          <div key={idx} className="p-2 rounded bg-zinc-50 dark:bg-[#070709] border border-zinc-100 dark:border-zinc-900">
                            <span className="block text-sm sm:text-base font-extrabold text-zinc-850 dark:text-white font-mono leading-none">
                              {mtr.value}
                            </span>
                            <span className="text-[8px] text-zinc-500">
                              {mtr.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Text Information segment */}
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                        cs.accentColor === 'indigo' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      }`}>
                        {cs.accentColor === 'indigo' ? 'Corporate Storefront' : 'SaaS Workflow Optimization'}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-800">•</span>
                      <span className="text-[11px] text-zinc-500 font-medium">Bespoke Launch</span>
                    </div>

                    <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {cs.name}
                    </h3>
                    <p className="text-[11px] text-zinc-450 dark:text-zinc-500 mb-4 font-mono">
                      Category Context: {cs.category}
                    </p>

                    <div className="space-y-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-zinc-55 border border-[#ecece8] dark:bg-zinc-950/50 dark:border-zinc-900/60">
                        <strong className="block text-zinc-700 dark:text-zinc-300 uppercase text-[9px] tracking-widest mb-1">
                          Core Challenge
                        </strong>
                        <p className="text-zinc-550 dark:text-zinc-400 leading-relaxed text-[11px]">
                          {cs.challenge}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-55 border border-[#ecece8] dark:bg-zinc-950/50 dark:border-zinc-900/60">
                        <strong className="block text-zinc-700 dark:text-zinc-300 uppercase text-[9px] tracking-widest mb-1">
                          The System Built
                        </strong>
                        <p className="text-zinc-550 dark:text-zinc-400 leading-relaxed text-[11px]">
                          {cs.built}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-50/20 dark:bg-emerald-950/10 border border-indigo-100/30 dark:border-emerald-900/20">
                        <strong className="block text-indigo-700 dark:text-emerald-400 uppercase text-[9px] tracking-widest mb-1">
                          Outcome / ROI Value
                        </strong>
                        <p className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed text-[11px]">
                          {cs.outcome}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-zinc-100 dark:border-zinc-900/50 mt-2 flex items-center justify-between gap-4">
                  {cs.externalUrl ? (
                    <a
                      href={cs.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => addLog(`Navigating to live deployment: ${cs.externalUrl}`, 'info')}
                      className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>{cs.externalUrl.replace('https://', '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-mono italic">
                      Production code is fully online
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCase(cs);
                      addLog(`Interactive Case Detail launched for: ${cs.name}`, 'success');
                    }}
                    className="text-xs font-extrabold tracking-wider uppercase text-zinc-900 dark:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    <span>View Specs</span>
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </motion.div>
      </section>

      {/* WHY SEAN SECTION (#why-sean) */}
      <section id="why-sean" className="py-20 border-b border-[#ecece8] dark:border-[#131317] bg-zinc-50/40 dark:bg-[#0a0a0c]/40">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          
          <div className="max-w-3xl mb-12 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Direct-To-Founder Leverage
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white leading-tight">
              An agency results framework. With zero agency game loop or overhead.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Direct Column list comparing sean to agency models */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                When you hire <strong>It's LLC</strong> (<code>itsllc.itsyouonline.com</code>), you do not pay for secondary account executives, project coordinators, or glass boardroom leases. You work directly with <strong>Sean Holbrook</strong>, custom architect and engineer.
              </p>

              <div className="p-5 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 text-left mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-sans">
                    Leverage Born of Resilience
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight mb-1">
                  From 5 Years Homeless to Frontier AI Architect
                </h4>
                <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-405 leading-relaxed">
                  Sean was homeless for five years and used pure grit, determination, and emerging AI tools to build his way out—teaching himself complex systems engineering, building a career from nothing, and mastering the frontier of rapid development.
                </p>
              </div>

              {[
                {
                  title: 'No Telephone Tag or Middlemen',
                  desc: 'You work directly with the builder. No project managers or account reps in the middle means your ideas are built exactly right, with regular live updates.'
                },
                {
                  title: 'Clean, Custom Code (No WordPress Bloat)',
                  desc: 'Every page is written in clean, modern code. No clunky WordPress plugins, no pre-made templates, and no slow database loading. Just high-performing code that loads instantly.'
                },
                {
                  title: 'Built to Save Time & Boost Profits',
                  desc: 'We build for business results. Better checkouts to boost sales, automated tasks to throw away spreadsheets, and simple dashboards designed to give you and your team your time back.'
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Stats Column */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-[#ecece8] dark:border-[#131317] space-y-5 text-left shadow-sm relative overflow-hidden">
                
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">
                  2025 AI Velocity Metrics
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">Top 0.01%</span>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Global Users</span>
                    </div>
                    <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 block mb-1">ChatGPT Global Power-User Rank</span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                      Placed in the top 0.01% of global ChatGPT power users, leveraging over <strong>20,000+ messages</strong> to AI assistants in 2025 to optimize and debug system structures.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">21 Shipped</span>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Built MVPs</span>
                    </div>
                    <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 block mb-1">Original MVP Releases in 2025</span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                      Independently configured, built, and launched <strong>21 original full-stack products and MVPs</strong> from scratch in 2025 alone.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-150 dark:border-zinc-900">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">Secure, High-Speed Standard</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-500 font-mono mb-1">
                      <span>• 100% Google Speed score</span>
                      <span>• 4.2x Faster turnaround</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Built to meet top security standards (secure payments with Stripe, static CDN pre-rendering, and HIPAA-friendly data locks).
                    </p>
                  </div>

                  {/* Sean's Personal Journey Story Block */}
                  <div className="p-4 rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 dark:bg-zinc-950/80 dark:border-zinc-850 relative overflow-hidden shadow-md">
                    <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
                      <Sparkles className="w-20 h-20 text-indigo-400" />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      <div className="p-1 rounded bg-indigo-650/50 text-indigo-300">
                        <User className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a5b4fc]">
                        Backstory of Leverage
                      </span>
                    </div>
                    
                    <p className="text-[11px] leading-relaxed text-zinc-300 relative z-10">
                      After being <strong className="text-white font-semibold">homeless for 5 years</strong>, Sean leveraged generative AI to master advanced software patterns and build his way out of extreme hardship. By forging a high-velocity engineering career entirely from scratch, he treats every client's business problems with the same relentless, absolute-zero-overhead focus that built his own line.
                    </p>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </motion.div>
      </section>

      {/* CLIENT SUCCESS & FOUNDER TESTIMONIALS CAROUSEL (#client-success) */}
      <section id="client-success" className="py-20 border-b border-[#ecece8] dark:border-[#131317] relative bg-white dark:bg-[#070709] overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 text-left">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Verified Founder Outcomes • Direct Speed & ROI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Client Success & Testimonials
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                What happens when you eliminate agency telephone-tag and build directly with an elite frontier AI architect. Unfiltered results on development speed, ROI, and real business outcomes.
              </p>
            </div>

            {/* Quick aggregate proof stats */}
            <div className="flex items-center gap-3 sm:gap-6 shrink-0 bg-zinc-50 dark:bg-zinc-900/60 p-3 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
              <div className="text-left">
                <span className="block text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  5.4 Days
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Avg. Turnaround
                </span>
              </div>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="text-left">
                <span className="block text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  Direct AI Ops
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Predictable Runtime
                </span>
              </div>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="text-left">
                <span className="block text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-white">
                  100%
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Code Ownership
                </span>
              </div>
            </div>
          </div>

          {/* Main Interactive Carousel Display Card */}
          <div 
            className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#0c0c0f] p-6 sm:p-10 shadow-lg relative text-left transition-all"
            onMouseEnter={() => setTestimonialAutoPlay(false)}
            onMouseLeave={() => setTestimonialAutoPlay(true)}
          >
            {/* Background subtle glow effect */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Slide Header: Tags & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-zinc-400 ml-1">5.0 Verified Review</span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50">
                  {TESTIMONIALS[activeTestimonialIdx].techHighlight}
                </span>
              </div>

              {/* Verified badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-semibold border border-emerald-200 dark:border-emerald-900/40">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Verified Client Project</span>
              </div>
            </div>

            {/* Quote Body */}
            <div className="relative mb-8 min-h-[120px] flex items-center">
              <Quote className="w-10 h-10 text-indigo-200 dark:text-indigo-950/60 absolute -top-4 -left-2 -z-0 opacity-40" />
              <p className="text-base sm:text-xl lg:text-2xl text-zinc-800 dark:text-zinc-100 font-medium leading-relaxed italic relative z-10">
                "{TESTIMONIALS[activeTestimonialIdx].quote}"
              </p>
            </div>

            {/* High-Impact Highlights Strip (Speed of Development & Business Outcomes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 block">
                    Speed of Development
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                    {TESTIMONIALS[activeTestimonialIdx].speedMetric}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Business Outcome Achieved
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                    {TESTIMONIALS[activeTestimonialIdx].businessOutcome}
                  </span>
                </div>
              </div>
            </div>

            {/* Author Meta & Metric Pill Row */}
            <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Founder Avatar & Details */}
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${TESTIMONIALS[activeTestimonialIdx].avatarGradient} flex items-center justify-center text-white font-extrabold font-mono text-base shadow-md`}>
                  {TESTIMONIALS[activeTestimonialIdx].avatarText}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    {TESTIMONIALS[activeTestimonialIdx].author}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {TESTIMONIALS[activeTestimonialIdx].role} • <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{TESTIMONIALS[activeTestimonialIdx].company}</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Project Scope: <strong className="text-zinc-600 dark:text-zinc-300">{TESTIMONIALS[activeTestimonialIdx].projectScope}</strong>
                  </p>
                </div>
              </div>

              {/* Turnaround & Impact Metrics */}
              <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {TESTIMONIALS[activeTestimonialIdx].metrics.map((metric, i) => (
                  <div key={i} className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shrink-0 shadow-xs">
                    <span className="block text-xs sm:text-sm font-black font-mono text-zinc-900 dark:text-white">
                      {metric.value}
                    </span>
                    <span className="text-[9px] text-zinc-400 uppercase font-mono block">
                      {metric.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Navigation Footer Controls */}
            <div className="mt-8 pt-6 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Pagination Dots with Active Bar */}
              <div className="flex items-center gap-2">
                {TESTIMONIALS.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTestimonialIdx(idx)}
                    title={`View review by ${t.author}`}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      activeTestimonialIdx === idx
                        ? 'w-8 bg-indigo-600 dark:bg-indigo-500'
                        : 'w-2.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
                    }`}
                  />
                ))}
                <span className="text-xs font-mono text-zinc-400 ml-2">
                  0{activeTestimonialIdx + 1} / 0{TESTIMONIALS.length}
                </span>
              </div>

              {/* Arrow Buttons & Auto-Play Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTestimonialAutoPlay(!testimonialAutoPlay)}
                  className="text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2 py-1 rounded transition cursor-pointer"
                >
                  {testimonialAutoPlay ? 'Auto-Cycle: Active' : 'Auto-Cycle: Paused'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevTestimonial}
                    aria-label="Previous testimonial"
                    className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextTestimonial}
                    aria-label="Next testimonial"
                    className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick-Select Founder Cards Row */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TESTIMONIALS.map((t, idx) => {
              const isSelected = activeTestimonialIdx === idx;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTestimonialIdx(idx);
                    addLog(`Testimonials: Clicked founder card "${t.author}"`, 'info');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 ring-1 ring-indigo-500/30 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c0f] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${t.avatarGradient} flex items-center justify-center text-white font-mono font-bold text-xs shrink-0`}>
                      {t.avatarText}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {t.author}
                      </h5>
                      <span className="text-[10px] text-zinc-400 truncate block">
                        {t.company}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                    {t.speedMetric}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action handoff */}
          <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#project-estimator"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-500/25 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate Your Build Price ($500 Min)</span>
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Schedule Direct With Sean</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </motion.div>
      </section>

      {/* THREE STEP DESIGN & BUILD PROCESS (#process) */}
      <section id="process" className="py-20 border-b border-[#ecece8] dark:border-[#131317]">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          
          <div className="max-w-3xl mb-16 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Work & Launch Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white leading-tight">
              A high-velocity blueprint to secure deployment within 14 business days.
            </h2>
          </div>

          {/* Timeline steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Roadmap & Custom Outline',
                days: 'Day 1 to 3',
                desc: 'A clear outline of your project. Before writing a single line of code, we map out all your website pages, user paths, and objectives into a simple, complete plan.'
              },
              {
                step: '02',
                title: 'Live Build Previews',
                days: 'Day 4 to 10',
                desc: 'We host a private dynamic preview site. You get access to a secure web link, allowing you to click around, test features, and give real-time feedback as your pages are crafted.'
              },
              {
                step: '03',
                title: 'Perfecting Details & Going Live',
                days: 'Day 11 to 14',
                desc: 'We run speed optimization checks, test across mobile, tablet, and desktop, and deploy seamlessly into the upcoming ItsYouOnline.com Multiverse (<site>.itsyouonline.com) or your custom domain—with 100% ownership of your code.'
              }
            ].map((prc, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15, ease: "easeOut" }}
                className="p-6 sm:p-8 rounded-2xl border bg-white dark:bg-[#0c0c0e] border-[#ecece8] dark:border-[#131317] text-left relative overflow-hidden flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-850"
              >
                {/* Visual subtle connection element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent flex items-center justify-center font-mono opacity-20 text-indigo-500 text-6xl font-extrabold leading-none select-none">
                  {prc.step}
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                    {prc.days}
                  </span>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white mt-4 tracking-tight">
                    {prc.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    {prc.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#ecece8] dark:border-[#131317]/50 mt-6 text-[10px] uppercase font-bold text-zinc-400 tracking-widest font-mono">
                  Phase {prc.step} Status: Validated
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS SECTION (#faq) */}
      <section id="faq" className="py-20 border-b border-[#ecece8] dark:border-[#131317] relative bg-white dark:bg-[#070709] theme-transition transition-colors">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Section Pill and Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions? Clear Answers</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-sans font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Frequently Asked Questions
          </h2>
          
          <p className="text-xs sm:text-base text-zinc-500 dark:text-zinc-400 mt-3 max-w-2xl mx-auto leading-relaxed">
            Transparent insights into the build process, sprint delivery timelines, and straightforward costs with <strong>It's LLC</strong>.
          </p>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-10">
            {[
              { id: 'all', label: 'All Questions', count: FAQ_ITEMS.length, icon: HelpCircle },
              { id: 'costs', label: 'Costs & Pricing', count: FAQ_ITEMS.filter(f => f.category === 'costs').length, icon: DollarSign },
              { id: 'timelines', label: 'Timelines & Speed', count: FAQ_ITEMS.filter(f => f.category === 'timelines').length, icon: Clock },
              { id: 'process', label: 'Build Process', count: FAQ_ITEMS.filter(f => f.category === 'process').length, icon: Layers },
              { id: 'tech', label: 'Tech & Ownership', count: FAQ_ITEMS.filter(f => f.category === 'tech').length, icon: Code },
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = selectedFaqCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedFaqCategory(tab.id as any);
                    addLog(`FAQ: Filtered questions by "${tab.label}"`, 'info');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                      : 'bg-zinc-100/80 dark:bg-zinc-900/70 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-zinc-700 dark:bg-zinc-200 text-white dark:text-zinc-900'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Accordion List */}
          <div className="space-y-3.5 text-left">
            {FAQ_ITEMS.filter(item => selectedFaqCategory === 'all' || item.category === selectedFaqCategory).map((item, idx) => {
              const isOpen = openFaqIds.includes(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-white dark:bg-[#0c0c0e] border-indigo-500/40 dark:border-indigo-500/30 shadow-md shadow-indigo-500/5'
                      : 'bg-zinc-50/70 dark:bg-[#0c0c0e]/60 border-[#ecece8] dark:border-[#1d1c23] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(item.id)}
                    className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 text-left cursor-pointer transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 mt-0.5 sm:mt-0 ${
                        item.category === 'costs'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                          : item.category === 'timelines'
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50'
                          : item.category === 'process'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                          : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50'
                      }`}>
                        {item.badge}
                      </span>
                      <h3 className="font-sans font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                        {item.question}
                      </h3>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-300 ${
                      isOpen
                        ? 'rotate-180 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 mt-1">
                          <p className="whitespace-pre-line">{item.answer}</p>
                          
                          {item.highlights && item.highlights.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800/80 flex flex-wrap gap-2">
                              {item.highlights.map((h, i) => (
                                <span 
                                  key={i} 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono"
                                >
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span>{h}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Quick interactive action card below accordion */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-emerald-500/5 border border-indigo-100 dark:border-indigo-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div>
              <h4 className="font-sans font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Ready to talk specific scopes, integrations, or timelines?
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Fill out the brief scope form below or lock in a direct strategy consultation with Sean.
              </p>
            </div>
            <a
              href="#contact"
              onClick={() => addLog('FAQ CTA: User jumped to Build Request form', 'info')}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <span>Start Your Build</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </motion.div>
      </section>

      {/* START YOUR BUILD INTERACTIVE CONTACT FORM (#contact) */}
      <section id="contact" className="py-20 border-b border-[#ecece8] dark:border-[#131317] bg-zinc-50/40 dark:bg-[#0a0a0c]/40">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Form Headline Context */}
            <div className="lg:col-span-5 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Start your Build
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white leading-tight mb-4">
                Let’s build a custom website that delivers results.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                Tell me about your business goals. Share your website targets, design vision, and ideal timeline. I will get back to you within 48 hours with a clear, custom plan of action.
              </p>

              <div className="space-y-3">
                {[
                  { text: 'A private staging link to watch progress live', color: 'text-indigo-500' },
                  { text: 'A direct chat channel with Sean (no middle-men)', color: 'text-emerald-500' },
                  { text: 'Full ownership of your clean, custom-coded assets', color: 'text-indigo-500' }
                ].map((lst, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-450">
                    <Check className={`w-4 h-4 ${lst.color}`} strokeWidth="3" />
                    <span>{lst.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="mailto:creatoroftheyouniverse@itsyouonline.com"
                  className="p-3 rounded-xl border border-[#ecece8] dark:border-[#1a1921] bg-white dark:bg-[#0c0c0e] hover:border-indigo-400 dark:hover:border-indigo-600 transition flex items-center gap-2.5 group"
                >
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400">Direct Email</span>
                    <span className="block text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-500 transition">
                      creatoroftheyouniverse@itsyouonline.com
                    </span>
                  </div>
                </a>
                <a
                  href="tel:6038512057"
                  className="p-3 rounded-xl border border-[#ecece8] dark:border-[#1a1921] bg-white dark:bg-[#0c0c0e] hover:border-emerald-400 dark:hover:border-emerald-600 transition flex items-center gap-2.5 group"
                >
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400">Direct Phone / SMS</span>
                    <span className="block text-[11px] font-bold font-mono text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition">
                      603-851-2057
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Interactive Custom Contact Form Card */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0a0a0c] border border-[#ecece8] dark:border-[#131317] shadow-lg text-left relative overflow-hidden">
                
                {/* Confetti simulation overlay */}
                {formSubmitted && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-[#070709]/95 z-20 flex flex-col items-center justify-center p-6 text-center theme-transition">
                    <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 mb-4 animate-bounce">
                      <Send className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      Message Received!
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-2 leading-relaxed">
                      Thank you for reaching out, {userName}! I have received your message and am personally reviewing your goals. I will follow up with you at <strong className="font-mono">{userEmail}</strong> with a clear plan of action within 48 hours.
                    </p>
                    <div className="mt-6 text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-500">
                      Status: Message received successfully
                    </div>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  
                  {/* Name and email inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="user-name" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        Your Nickname/Real Name
                      </label>
                      <input
                        type="text"
                        id="user-name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full text-xs px-3.5 py-3 rounded-xl border border-[#ecece8] bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 dark:border-[#131317]"
                      />
                    </div>
                    <div>
                      <label htmlFor="user-email" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        Active Invoicing Email
                      </label>
                      <input
                        type="email"
                        id="user-email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="w-full text-xs px-3.5 py-3 rounded-xl border border-[#ecece8] bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 dark:border-[#131317]"
                      />
                    </div>
                  </div>

                  {/* Multi Select checkboxes for services needed */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      Select Target Scope Offer Needs
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Custom Business Websites',
                        'Landing Pages That Convert',
                        'Productivity Apps & Internal Tools',
                        'Fast MVP Start Builds'
                      ].map((item) => {
                        const isChecked = selectedServices.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => handleServiceSelected(item)}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400'
                                : 'bg-transparent border-[#ecece8] text-zinc-600 dark:border-[#131317] dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                            }`}
                          >
                            <span>{item}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-300 dark:border-zinc-800'
                            }`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Range slider budget controller */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="budget-range" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Target Scope Budget Limit
                      </label>
                      <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        ${budgetVal.toLocaleString()} {budgetVal >= 50000 ? ' (Enterprise Limit)' : ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      id="budget-range"
                      min="500"
                      max="50000"
                      step="500"
                      value={budgetVal}
                      onChange={handleBudgetChange}
                      className="w-full accent-indigo-600 h-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 cursor-pointer"
                    />
                    <div className="flex justify-between items-center text-[9px] text-zinc-450 mt-1">
                      <span>$500 Min</span>
                      <span>$50,000+ Max Limit</span>
                    </div>
                  </div>

                  {/* Preferred ItsYouOnline.com Multiverse Subdomain */}
                  <div>
                    <label htmlFor="multiverse-slug" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                      Reserve ItsYouOnline.com Multiverse Subdomain (Optional)
                    </label>
                    <div className="flex items-center rounded-xl border border-[#ecece8] dark:border-[#131317] bg-transparent overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                      <span className="pl-3.5 pr-1 text-xs font-mono text-zinc-400 select-none">https://</span>
                      <input
                        type="text"
                        id="multiverse-slug"
                        value={multiverseSubdomain}
                        onChange={(e) => setMultiverseSubdomain(sanitizeSubdomainSlug(e.target.value))}
                        placeholder="yourbrand"
                        className="flex-1 min-w-0 text-xs py-3 px-1 bg-transparent font-mono font-bold text-zinc-900 dark:text-white outline-none"
                      />
                      <span className="pr-3.5 pl-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold select-none shrink-0">
                        .itsyouonline.com
                      </span>
                    </div>
                  </div>

                  {/* Project description notes */}
                  <div>
                    <label htmlFor="goals" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                      Core Business bottlenecks & Project Goals
                    </label>
                    <textarea
                      id="goals"
                      rows={3}
                      value={projectGoals}
                      onChange={(e) => setProjectGoals(e.target.value)}
                      placeholder="e.g. We spend 15 hours managing static files. Need an automated customer intake app..."
                      className="w-full text-xs px-3.5 py-3 rounded-xl border border-[#ecece8] bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 dark:border-[#131317]"
                    />
                  </div>

                  {/* Submit build buttons */}
                  <button
                    type="submit"
                    id="btn-contact-submit"
                    className="w-full py-4 rounded-xl text-xs font-bold tracking-widest uppercase bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Build Request
                  </button>

                </form>

              </div>
            </div>

          </div>

        </motion.div>
      </section>

      {/* LIVE BUILD & INTERACTION FEED DRAWER FOOTER */}
      <footer id="debug-drawer" className="bg-[#0c0c0e] text-zinc-100 border-t border-[#1a1921] py-8 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8 text-left">
            
            {/* Left Footer branding segment */}
            <div className="lg:col-span-4 space-y-3">
              <span className="font-sans font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span>
                It's LLC
                <span className="text-xs font-mono font-medium text-zinc-400">
                  (itsllc.itsyouonline.com)
                </span>
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Simple, high-performance websites and business automation built by <strong>Sean Holbrook</strong> for <strong>It's LLC</strong>. No bloat, no extra fees, just clean tools that save your business time and increase your sales.
              </p>
              <div className="space-y-1 text-[11px] font-mono">
                <a
                  href="mailto:creatoroftheyouniverse@itsyouonline.com"
                  className="flex items-center gap-2 text-zinc-300 hover:text-indigo-400 transition"
                >
                  <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">creatoroftheyouniverse@itsyouonline.com</span>
                </a>
                <a
                  href="tel:6038512057"
                  className="flex items-center gap-2 text-zinc-300 hover:text-emerald-400 transition"
                >
                  <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>603-851-2057</span>
                </a>
              </div>
              <div className="text-[10px] text-zinc-550 font-mono">
                © {new Date().getFullYear()} It's LLC • itsllc.itsyouonline.com. Handcrafted directly with clean, high-performance custom code.
              </div>
            </div>

            {/* Middle links list */}
            <div className="lg:col-span-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#4f46e5] mb-2">Scope Anchors</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#home" className="text-zinc-400 hover:text-white transition">Top Header</a></li>
                <li><a href="#services" className="text-zinc-400 hover:text-white transition">Strategic Services</a></li>
                <li><a href="#work" className="text-zinc-400 hover:text-white transition">Featured Case Studies</a></li>
                <li><a href="#why-sean" className="text-zinc-400 hover:text-white transition">Direct Developer Leverage</a></li>
                <li><a href="#client-success" className="text-zinc-400 hover:text-white transition">Client Success Stories</a></li>
                <li><a href="#process" className="text-zinc-400 hover:text-white transition">4-Step Build Process</a></li>
                <li><a href="#faq" className="text-zinc-400 hover:text-white transition">FAQ & Clear Answers</a></li>
                <li><a href="#contact" className="text-zinc-400 hover:text-white transition">Start your Build Request</a></li>
              </ul>
            </div>

            {/* Right Direct Engagement Terms & CTA */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
                  Direct Engagement Guarantees
                </h4>
                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>$500 baseline minimum for targeted micro-sprints</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero bloated retainers • Monthly fees only for active AI Agent runtime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>100% full intellectual property & codebase ownership</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>All builds can launch in the ItsYouOnline.com Multiverse (&lt;site&gt;.itsyouonline.com)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Direct engineering line with Sean Holbrook</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2.5">
                <a
                  href="#project-estimator"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Cost Estimator</span>
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition border border-zinc-700"
                >
                  <span>Start a Build</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

        </div>
      </footer>

      {/* DETAILED INTERACTIVE POPUP MODAL SHOWCASE DETAIL FOR PROJECTS */}
      {selectedCase && (
        <div id="modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs select-text">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0c0c0f] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
            
            {/* Grid background inside popup */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-25 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                selectedCase.accentColor === 'indigo' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              }`}>
                Project Ref: {selectedCase.id.toUpperCase()}
              </span>
              <button
                onClick={() => {
                  setSelectedCase(null);
                  addLog('Case popup modal closed.', 'info');
                }}
                className="p-1 px-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none mb-1">
                  {selectedCase.name}
                </h3>
                <p className="text-xs text-zinc-450 dark:text-zinc-500 font-mono">
                  Target Scope: {selectedCase.category}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {selectedCase.metrics.map((mtr, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-55 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 text-center">
                    <span className="block text-xl sm:text-2xl font-extralight text-zinc-850 dark:text-white font-mono leading-none">
                      {mtr.value}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      {mtr.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-[#faf9f6] dark:bg-[#060608] border border-zinc-150 dark:border-[#131317]">
                  <strong className="block text-zinc-400 uppercase text-[9px] tracking-wider mb-1 font-mono">
                    System Challenge
                  </strong>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {selectedCase.challenge}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#faf9f6] dark:bg-[#060608] border border-zinc-150 dark:border-[#131317]">
                  <strong className="block text-zinc-400 uppercase text-[9px] tracking-wider mb-1 font-mono">
                    Product Solution Deployed
                  </strong>
                  <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed">
                    {selectedCase.built}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/25 dark:bg-emerald-950/20 border border-indigo-100/30 dark:border-emerald-900/30">
                  <strong className="block text-indigo-700 dark:text-emerald-400 uppercase text-[9px] tracking-wider mb-1 font-mono">
                    Outcome & ROI Metrics Obtained
                  </strong>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed">
                    {selectedCase.outcome}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                {selectedCase.externalUrl ? (
                  <a
                    href={selectedCase.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => addLog(`Direct navigation from modal to ${selectedCase.externalUrl}`, 'info')}
                    className="text-xs font-mono font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <span>Visit Live Site: {selectedCase.externalUrl.replace('https://', '')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div />
                )}
                <a
                  href="#contact"
                  onClick={() => {
                    setSelectedCase(null);
                    setSelectedServices([`${selectedCase.name} Clone`]);
                    addLog(`Redirected from Case details to intake scheduler with scope: "${selectedCase.name}"`, 'success');
                  }}
                  className="px-5 py-3 rounded-lg text-xs font-bold tracking-wider uppercase text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  Blueprint similar stack with Sean
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* PERSISTENT FLOATING AI AGENT SLIDE-IN DRAWER & LAUNCHER BUTTON */}
      <AnimatePresence>
        {isAiDrawerOpen && (
          <motion.aside
            key="ai-agent-drawer"
            initial={{ opacity: 0, x: 40, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            aria-label="AI Agent Quick Chat Drawer"
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[82vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] shadow-2xl overflow-y-auto"
          >
            {renderAiAgentContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          type="button"
          onClick={() => {
            setIsAiDrawerOpen((prev) => {
              const next = !prev;
              addLog(`Floating AI Chat: ${next ? 'Opened' : 'Minimized'} AI Agent drawer`, 'info');
              return next;
            });
          }}
          aria-expanded={isAiDrawerOpen}
          aria-label={isAiDrawerOpen ? 'Minimize AI Agent chat' : 'Open AI Agent chat'}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30 transition-all active:scale-95 cursor-pointer select-none"
        >
          <span className="relative flex items-center justify-center">
            {isAiDrawerOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600 animate-pulse" />
              </>
            )}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
            {isAiDrawerOpen ? 'Minimize' : 'AI Agent'}
          </span>
        </button>
      </div>

    </div>
  );
}
