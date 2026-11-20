import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FunctionDeclaration, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please verify your key in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const CONTACT_EMAIL = 'creatoroftheyouniverse@itsyouonline.com';
const CONTACT_PHONE = '603-851-2057';

const scheduleConsultationDecl: FunctionDeclaration = {
  name: 'schedule_consultation',
  description:
    'Book and lock in a build consultation or discovery call on Sean Holbrook\'s calendar once the visitor provides their name, email, desired build scope, and preferred date & time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientName: {
        type: Type.STRING,
        description: 'Full name or nickname of the visitor booking the consultation.',
      },
      clientEmail: {
        type: Type.STRING,
        description: 'Email address of the visitor for calendar invites and invoicing follow-up.',
      },
      clientPhone: {
        type: Type.STRING,
        description: 'Optional phone number of the visitor.',
      },
      projectType: {
        type: Type.STRING,
        description:
          'Primary build type discussed, e.g., Targeted Fix / Micro-Sprint ($500+), High-Converting Landing Stack ($1,250+), Custom Business Website ($2,500+), or Full-Stack App / Custom Portal ($4,500+).',
      },
      summary: {
        type: Type.STRING,
        description: 'Short meeting title for the calendar event, e.g., "It\'s LLC Build Consult — Acme Corp".',
      },
      date: {
        type: Type.STRING,
        description: 'Preferred consultation date in YYYY-MM-DD format.',
      },
      time: {
        type: Type.STRING,
        description: 'Preferred consultation start time in 24-hour HH:MM format (e.g., "14:00" for 2:00 PM).',
      },
      notes: {
        type: Type.STRING,
        description: 'Key goals, add-ons (like AI Agent, Stripe, Calendar Sync), budget target, or timeline notes.',
      },
      preferredSubdomain: {
        type: Type.STRING,
        description: 'Optional desired custom subdomain slug for ItsYouOnline.com Multiverse hosting (e.g., "acme" for acme.itsyouonline.com).',
      },
    },
    required: ['clientName', 'clientEmail', 'projectType', 'summary', 'date', 'time'],
  },
};

const applyProjectEstimateDecl: FunctionDeclaration = {
  name: 'apply_project_estimate',
  description:
    'Update the interactive Project Estimator on the page with a specific core build scope, modular add-ons, and optional ItsYouOnline.com Multiverse subdomain based on what the visitor wants to build.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      scopeId: {
        type: Type.STRING,
        description:
          'One of: "micro" ($500 Targeted Fix / Micro-Sprint), "landing" ($1,250 High-Converting Landing Stack), "website" ($2,500 Custom Business Website), or "portal" ($4,500 Full-Stack App / Custom Portal).',
      },
      addonIds: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          'Optional list of add-on IDs: "ai_agent" (+$750 + $150/mo runtime), "calendar" (+$500), "stripe" (+$600), "pwa" (+$450), "database" (+$500), "rush" (+$750).',
      },
      preferredSubdomain: {
        type: Type.STRING,
        description: 'Optional desired custom subdomain slug for <site>.itsyouonline.com (e.g., "apex" for apex.itsyouonline.com).',
      },
    },
    required: ['scopeId'],
  },
};

const SCOPE_LOOKUP: Record<string, { name: string; basePrice: number; timeline: string }> = {
  micro: { name: 'Targeted Fix / Micro-Sprint', basePrice: 500, timeline: '2–4 days' },
  landing: { name: 'High-Converting Landing Stack', basePrice: 1250, timeline: '3–7 days' },
  website: { name: 'Custom Business Website', basePrice: 2500, timeline: '7–14 days' },
  portal: { name: 'Full-Stack App / Custom Portal', basePrice: 4500, timeline: '2–4 weeks' },
};

const ADDON_LOOKUP: Record<string, { name: string; price: number; monthlyPrice?: number }> = {
  ai_agent: { name: 'Autonomous Embedded AI Agent', price: 750, monthlyPrice: 150 },
  calendar: { name: 'Google Calendar & OAuth Sync', price: 500 },
  stripe: { name: 'Stripe Webhooks & Invoicing', price: 600 },
  pwa: { name: 'PWA Mobile App Packaging', price: 450 },
  database: { name: 'Hardened Database (Firestore/SQL)', price: 500 },
  rush: { name: 'Priority Rush Sprint Acceleration', price: 750 },
};

function sanitizeSubdomainSlug(raw?: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\.itsyouonline\.com$/i, '')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function buildSystemInstruction(clientLocalTime?: string, currentEstimate?: ChatRequestBody['currentEstimate']): string {
  const nowStr = clientLocalTime || new Date().toISOString();
  const estSlug = sanitizeSubdomainSlug(currentEstimate?.multiverseSubdomain);
  const estimateContext = currentEstimate?.scopeName
    ? `Current estimator state on visitor screen: Scope "${currentEstimate.scopeName}", Add-ons [${(currentEstimate.addonNames || []).join(', ') || 'None'}], One-Time Total: $${currentEstimate.oneTimeTotal || 500}, Monthly AI Runtime: $${currentEstimate.monthlyTotal || 0}/mo${estSlug ? `, Reserved Multiverse Subdomain: ${estSlug}.itsyouonline.com` : ''}.`
    : '';

  return `You are the official Autonomous AI Solutions Architect & Booking Concierge for It's LLC (itsllc.itsyouonline.com), built and operated directly by founder & lead engineer Sean Holbrook.

CURRENT DATE/TIME CONTEXT: ${nowStr}
AVAILABILITY STATUS: Open for new builds Q3/Q4 2026.
DIRECT CONTACT CHANNELS:
- Email: ${CONTACT_EMAIL}
- Phone / Direct Line: ${CONTACT_PHONE}

CORE IDENTITY & VALUE PROPOSITION:
- Visitors work 1-on-1 directly with Sean Holbrook—zero agency middlemen, account managers, or bloated timelines.
- Proven track record: 21 shipped MVPs, 100% custom React / TypeScript / Tailwind CSS / Node / Express / Firestore / Cloud SQL / Gemini AI stack. No WordPress templates or proprietary lock-in.
- 100% intellectual property & source code ownership upon delivery.
- Private live staging URLs within days, sub-100ms response targets.

ITSYOUONLINE.COM MULTIVERSE HOSTING (SOON TO BE RELEASED):
- ALL It's LLC builds (from $500 Micro-Sprints to Full-Stack AI Portals) can be hosted directly inside our soon-to-be-released **ItsYouOnline.com Multiverse** platform on a custom **<site>.itsyouonline.com** subdomain (just like \`itsllc.itsyouonline.com\` and \`cafe.itsyouonline.com\`).
- Includes instant HTTPS/SSL, edge CDN routing, zero DNS friction, and ecosystem discoverability inside the Multiverse—while also supporting custom external domains and 100% portable code ownership.
- If a visitor mentions a brand/site name or desired URL, offer to reserve their custom \`<site>.itsyouonline.com\` subdomain via \`preferredSubdomain\` when updating their estimate or booking their consultation!
${estimateContext}

TYPES OF BUILDS & TRANSPARENT PRICING ($500 STRICT MINIMUM):
1. Targeted Fix / Micro-Sprint — $500 minimum base (2–4 business days)
   • Single automation flow, API integration, database hook, or isolated bug fix.
2. High-Converting Landing Stack / Sales Bot Page — $1,250 base (3–7 business days)
   • Single-page responsive sales funnel, ultra-fast UI, and 24/7 lead intake pipeline.
3. Custom Business Website (AI-Embedded Storefront) — $2,500 base (7–14 business days)
   • Multi-section bespoke React application, brand showcase, and responsive dark/light UX.
4. Full-Stack App / Custom Portal / Startup MVP — $4,500 base (2–4 weeks; larger enterprise scopes range up to $15,000+ fixed quote)
   • Authenticated client dashboards, role-based access, database schemas (Firestore / Cloud SQL), and automated workflows.

MODULAR ADD-ONS:
- Autonomous Embedded AI Agent: +$750 one-time build + $150/mo recurring runtime fee
- Google Calendar & OAuth Sync: +$500 one-time
- Stripe Webhooks & Invoicing: +$600 one-time
- PWA Mobile App Packaging: +$450 one-time
- Hardened Database (Firestore/SQL): +$500 one-time
- Priority Rush Sprint Acceleration: +$750 one-time

IMPORTANT RECURRING FEE POLICY:
- Standard websites, landing pages, and portals without live AI agents have ZERO ($0/mo) forced agency retainers—clients own their code and pay only wholesale cloud hosting ($0–$15/mo), and can host inside the upcoming ItsYouOnline.com Multiverse at <site>.itsyouonline.com.
- Systems running active Autonomous AI Agents DO require a transparent $150/mo runtime fee to cover real LLM inference tokens, 24/7 autonomous uptime, vector context, and prompt maintenance. Always state this distinction clearly when asked about ongoing costs!

CASE STUDIES YOU CAN REFERENCE:
- Bridge Cafe (cafe.itsyouonline.com): All-day breakfast ordering synced in real time with a Back-of-House kitchen tablet (+18% ticket turnaround).
- Shrink: Boutique retail inventory & margin audit app (-42% untracked stock loss).

YOUR GOALS IN CONVERSATION:
1. Clearly explain which build type, add-ons, timeline, Multiverse <site>.itsyouonline.com hosting option, and investment range fits the visitor's business goals.
2. Proactively guide qualified visitors to lock in a strategy consultation on Sean's calendar—or configure their interactive Project Estimator using \`apply_project_estimate\`.
3. To close a calendar scheduling:
   - Ask briefly for anything missing among: (a) Name, (b) Email address, (c) Build type / goal (plus optional desired \`<site>.itsyouonline.com\` subdomain), and (d) Preferred Date & Time (convert relative dates like "tomorrow at 2pm" using the CURRENT DATE/TIME CONTEXT above into YYYY-MM-DD and 24-hour HH:MM).
   - As soon as you have Name, Email, Build Type, Date, and Time, IMMEDIATELY call the \`schedule_consultation\` tool!
   - Never claim a meeting is booked unless you actually invoked \`schedule_consultation\`.
4. Keep responses crisp, high-signal, confident, and helpful—no fluff. Include Sean's email (${CONTACT_EMAIL}) or phone (${CONTACT_PHONE}) whenever someone asks how to reach out directly or after confirming a booking.`;
}

interface ChatMessageInput {
  role: 'user' | 'model';
  text: string;
}

interface ChatRequestBody {
  messages: ChatMessageInput[];
  clientLocalTime?: string;
  currentEstimate?: {
    scopeName?: string;
    addonNames?: string[];
    oneTimeTotal?: number;
    monthlyTotal?: number;
    multiverseSubdomain?: string;
  };
}

interface ChatActionPayload {
  type: 'schedule_consultation' | 'apply_project_estimate';
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
}

function buildGoogleCalendarUrl(params: {
  summary: string;
  startIso: string;
  endIso: string;
  details: string;
  guestEmail: string;
}): string {
  const formatCalDate = (iso: string) =>
    iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.summary,
    dates: `${formatCalDate(params.startIso)}/${formatCalDate(params.endIso)}`,
    details: params.details,
    add: `${CONTACT_EMAIL},${params.guestEmail}`,
  });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

async function withTimeout<T>(promise: Promise<T>, ms = 20000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Gemini API request timed out after ${Math.round(ms / 1000)}s`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function generateWithRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), 20000);
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      const isTransient = status === 503 || status === 500;
      if (!isTransient || attempt === retries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: "It's LLC AI Concierge",
      model: 'gemini-4-hydrogen',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      hasBaseUrl: Boolean(process.env.GOOGLE_GEMINI_BASE_URL || process.env.GEMINI_API_BASE_URL),
    });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as ChatRequestBody;
      const rawMessages = Array.isArray(body.messages) ? body.messages : [];

      const sanitizedHistory = rawMessages
        .filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0)
        .map((m) => ({
          role: (m.role === 'model' ? 'model' : 'user') as 'user' | 'model',
          parts: [{ text: m.text.trim() }],
        }));

      if (sanitizedHistory.length === 0) {
        res.status(400).json({ error: 'Please enter a message before sending.' });
        return;
      }

      // Gemini contents must start with a user turn
      const firstUserIndex = sanitizedHistory.findIndex((m) => m.role === 'user');
      const contents = firstUserIndex >= 0 ? sanitizedHistory.slice(firstUserIndex) : sanitizedHistory;

      const ai = getAiClient();
      const systemInstruction = buildSystemInstruction(body.clientLocalTime, body.currentEstimate);
      const tools = [{ functionDeclarations: [scheduleConsultationDecl, applyProjectEstimateDecl] }];

      const response1 = await generateWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction,
            tools,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        })
      );

      const triggeredActions: ChatActionPayload[] = [];
      let finalReplyText = (response1.text || '').trim();

      const functionCalls = response1.functionCalls;
      const previousContent = response1.candidates?.[0]?.content;

      if (functionCalls && functionCalls.length > 0 && previousContent) {
        const functionResponseParts: Array<{
          functionResponse: {
            id?: string;
            name: string;
            response: Record<string, unknown>;
          };
        }> = [];

        for (const call of functionCalls) {
          const callName = call.name || '';
          const args = (call.args || {}) as Record<string, any>;

          if (callName === 'schedule_consultation') {
            const clientName = String(args.clientName || 'Client').trim();
            const clientEmail = String(args.clientEmail || '').trim();
            const clientPhone = args.clientPhone ? String(args.clientPhone).trim() : undefined;
            const projectType = String(args.projectType || 'Custom Build Consultation').trim();
            const summary = String(args.summary || `It's LLC Consultation — ${clientName}`).trim();
            const date = String(args.date || new Date().toISOString().slice(0, 10)).trim();
            const time = String(args.time || '10:00').trim();
            const notes = args.notes ? String(args.notes).trim() : undefined;
            const preferredSubdomain = sanitizeSubdomainSlug(
              args.preferredSubdomain ? String(args.preferredSubdomain) : body.currentEstimate?.multiverseSubdomain
            );
            const multiverseUrl = preferredSubdomain ? `https://${preferredSubdomain}.itsyouonline.com` : undefined;

            const parsedStart = new Date(`${date}T${time}:00`);
            const validStart = Number.isNaN(parsedStart.getTime()) ? new Date(Date.now() + 86400000) : parsedStart;
            const validEnd = new Date(validStart.getTime() + 45 * 60 * 1000);
            const startIso = validStart.toISOString();
            const endIso = validEnd.toISOString();
            const bookingId = `consult_${Date.now().toString(36)}`;

            const details = [
              `It's LLC Build Consultation with Sean Holbrook`,
              `Client: ${clientName} (${clientEmail}${clientPhone ? ` • ${clientPhone}` : ''})`,
              `Build Scope: ${projectType}`,
              multiverseUrl ? `ItsYouOnline.com Multiverse Hosting Target: ${multiverseUrl}` : '',
              notes ? `Notes: ${notes}` : '',
              `Direct Contact: ${CONTACT_EMAIL} • ${CONTACT_PHONE}`,
            ]
              .filter(Boolean)
              .join('\n');

            const calendarInviteUrl = buildGoogleCalendarUrl({
              summary,
              startIso,
              endIso,
              details,
              guestEmail: clientEmail,
            });

            const bookingPayload = {
              bookingId,
              clientName,
              clientEmail,
              clientPhone,
              projectType,
              summary,
              date,
              time,
              startIso,
              endIso,
              notes,
              preferredSubdomain: preferredSubdomain || undefined,
              multiverseUrl,
              calendarInviteUrl,
              hostEmail: CONTACT_EMAIL,
              hostPhone: CONTACT_PHONE,
            };

            triggeredActions.push({
              type: 'schedule_consultation',
              booking: bookingPayload,
            });

            functionResponseParts.push({
              functionResponse: {
                id: call.id,
                name: 'schedule_consultation',
                response: {
                  status: 'confirmed',
                  bookingId,
                  summary,
                  date,
                  time,
                  clientName,
                  clientEmail,
                  projectType,
                  multiverseUrl,
                  hostEmail: CONTACT_EMAIL,
                  hostPhone: CONTACT_PHONE,
                  message:
                    'Consultation locked into the live site scheduler & lead capture pipeline, and one-click Google Calendar invite link generated.',
                },
              },
            });
          } else if (callName === 'apply_project_estimate') {
            const rawScope = String(args.scopeId || 'website').toLowerCase();
            const scopeId = SCOPE_LOOKUP[rawScope] ? rawScope : 'website';
            const scopeInfo = SCOPE_LOOKUP[scopeId];

            const rawAddons: string[] = Array.isArray(args.addonIds) ? args.addonIds.map(String) : [];
            const validAddons = rawAddons.filter((id) => Boolean(ADDON_LOOKUP[id]));

            const addonOneTime = validAddons.reduce((sum, id) => sum + (ADDON_LOOKUP[id]?.price || 0), 0);
            const monthlyTotal = validAddons.reduce((sum, id) => sum + (ADDON_LOOKUP[id]?.monthlyPrice || 0), 0);
            const oneTimeTotal = Math.max(500, scopeInfo.basePrice + addonOneTime);
            const preferredSubdomain = sanitizeSubdomainSlug(
              args.preferredSubdomain ? String(args.preferredSubdomain) : body.currentEstimate?.multiverseSubdomain
            );
            const multiverseUrl = preferredSubdomain ? `https://${preferredSubdomain}.itsyouonline.com` : undefined;

            triggeredActions.push({
              type: 'apply_project_estimate',
              estimate: {
                scopeId,
                scopeName: scopeInfo.name,
                addonIds: validAddons,
                oneTimeTotal,
                monthlyTotal,
                timeline: scopeInfo.timeline,
                preferredSubdomain: preferredSubdomain || undefined,
                multiverseUrl,
              },
            });

            functionResponseParts.push({
              functionResponse: {
                id: call.id,
                name: 'apply_project_estimate',
                response: {
                  status: 'applied',
                  scopeId,
                  scopeName: scopeInfo.name,
                  addonIds: validAddons,
                  oneTimeTotal,
                  monthlyTotal,
                  timeline: scopeInfo.timeline,
                  multiverseUrl,
                },
              },
            });
          }
        }

        if (functionResponseParts.length > 0) {
          const response2 = await generateWithRetry(() =>
            ai.models.generateContent({
              model: 'gemini-4-hydrogen',
              contents: [
                ...contents,
                previousContent,
                {
                  role: 'user',
                  parts: functionResponseParts,
                },
              ],
              config: {
                systemInstruction,
                tools,
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              },
            })
          );
          finalReplyText = (response2.text || '').trim();
        }
      }

      if (!finalReplyText) {
        finalReplyText = `I've processed that request. You can also reach Sean directly at ${CONTACT_EMAIL} or ${CONTACT_PHONE}.`;
      }

      res.json({
        reply: finalReplyText,
        actions: triggeredActions,
        model: 'gemini-4-hydrogen',
      });
    } catch (err: any) {
      console.error('Gemini /api/chat error:', err);
      const status = typeof err?.status === 'number' ? err.status : 500;
      const rawMessage = err instanceof Error ? err.message : String(err);

      let friendlyMessage = rawMessage;
      if (status === 403 || rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('API_KEY_INVALID')) {
        friendlyMessage =
          'Gemini API authentication error. Please verify GEMINI_API_KEY in Settings > Secrets.';
      } else if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
        friendlyMessage =
          'Gemini API rate limit reached. Please try again in a moment or check your API quota in Settings > Secrets.';
      }

      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: friendlyMessage,
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`It's LLC full-stack server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
