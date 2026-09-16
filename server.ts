import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { normalizeAiAgentInput, parseAiAgentInput } from './shared/digital-card-ai-agent.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Contas Master com acesso irrestrito
export const MASTER_EMAILS = [
  'consultatomosinfinity@gmail.com',
  'atomoseletrotecnica@gmail.com',
];

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

let supabaseAdmin: any = null;
if (SUPABASE_URL && (SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY)) {
  supabaseAdmin = createSupabaseClient(SUPABASE_URL, SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Banco de dados em arquivo JSON local para persistência rápida e robusta
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Memória de rate limit para formulário de contato (max 5 por cartão por hora)
const inquirySubmissions: { cardId: number; timestamp: number }[] = [];

// Funções utilitárias de persistência
function readJson<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Erro ao ler ${file}:`, err);
  }
  return fallback;
}

function writeJson<T>(file: string, data: T): void {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Erro ao salvar ${file}:`, err);
  }
}

// Configuração de cabeçalhos contra cache para garantir dados sempre atualizados
function setNoCacheHeaders(res: express.Response): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

// Rota pública de configuração para o frontend obter as chaves públicas do Supabase com segurança
// A chave secreta (SUPABASE_SECRET_KEY) NUNCA é enviada para o cliente!
app.get('/api/config', (req, res) => {
  setNoCacheHeaders(res);
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  });
});

// Sistema de Server-Sent Events (SSE) para atualização instantânea em tempo real entre abas e dispositivos
type SseClient = {
  id: number;
  slug?: string;
  res: express.Response;
};

const sseClients: SseClient[] = [];

function notifyCardUpdate(card: any, action: 'created' | 'updated' | 'deleted') {
  const payload = JSON.stringify({
    action,
    slug: card.slug,
    id: card.id,
    timestamp: Date.now(),
    card: action === 'deleted' ? null : card,
  });

  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      if (!client.slug || client.slug === card.slug) {
        client.res.write(`data: ${payload}\n\n`);
      }
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// Inicialização com dados de demonstração completos
function seedInitialData() {
  const existingCards = readJson<any[]>(CARDS_FILE, []);
  if (existingCards.length === 0) {
    const demoCard = {
      id: 1,
      userId: 1,
      slug: 'jurandir-hora',
      name: 'Jurandir Hora',
      jobTitle: 'Diretor Executivo',
      phone: '+55 (15) 99625-9353',
      email: 'consultatomosinfinity@gmail.com',
      whatsappPhone: '+55 (15) 99625-9353',
      websiteUrl: 'https://consultatomosinfinity.com.br',
      address: '',
      addressNumber: '',
      postalCode: '',
      city: '',
      state: '',
      country: 'Brasil',
      googleMapsUrl: '',
      summary: 'Consultoria e inteligência estratégica empresarial pela Átomos Infinity.',
      instagramUrl: '',
      linkedinUrl: '',
      facebookUrl: '',
      youtubeUrl: '',
      aiAgentUrl: '',
      siteAiAgentEnabled: false,
      aiAgentButtonColor: '#7C3AED',
      aiAgentButtonText: 'Atendente Virtual',
      aiAgentGlowEnabled: true,
      aiAgentGlowIntensity: 'medio',
      aiAgentButtonSize: 'padrao',
      aiAgentButtonPaddingY: 12,
      aiAgentButtonBorderWidth: 0,
      aiAgentButtonBorderColor: '#A855F7',
      brandName: 'Átomos Infinity',
      ctaLabel: 'Conheça a Átomos Infinity',
      ctaUrl: 'https://consultatomosinfinity.com.br',
      footerText: 'Cartão digital disponibilizado por Átomos Infinity',
      appearanceTheme: 'padrao',
      backgroundColor: '#12375B',
      buttonColor: '#1A7FBE',
      bodyColor: '#EAF1F7',
      contentColor: '#FFFFFF',
      contentOpacity: 100,
      contactIconColor: '#1A507F',
      contactIconSize: 18,
      dividerColor: '#D7E0E7',
      dividerWidth: 1,
      qrCodeStyle: 'arredondado',
      qrCodeForegroundColor: '#12375B',
      qrCodeBackgroundColor: '#FFFFFF',
      imageUrl: 'https://i.ibb.co/cKcG35kq/Jurandir.jpg',
      companyLogoUrl: 'https://i.ibb.co/49XgSZd/Logo.jpg',
      frameScale: 97,
      companyLogoFocusX: 56,
      companyLogoFocusY: 67,
      mobileAppName: 'Jurandir Hora | Átomos Infinity',
      trackingEnabled: true,
      activityTrackingEnabled: true,
      inquiryEnabled: true,
      status: 'ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeJson(CARDS_FILE, [demoCard]);
    console.log('Seed inicial de cartão profissional criado com sucesso!');
  }
}

seedInitialData();

// ----------------------------------------------------
// 1. ROTA DE REDIRECIONAMENTO RASTREADO: /cartao/:slug/ir/:dest
// ----------------------------------------------------
app.get('/cartao/:slug/ir/:dest', (req, res) => {
  const ALLOWED = [
    'website',
    'institutional',
    'instagram',
    'linkedin',
    'facebook',
    'youtube',
    'whatsapp',
    'maps',
    'ai_agent',
  ];

  const destination = req.params.dest;
  if (!ALLOWED.includes(destination)) {
    return res.status(400).send('Destino inválido.');
  }

  const cards = readJson<any[]>(CARDS_FILE, []);
  const card = cards.find((c) => c.slug === req.params.slug && c.status === 'ativo');

  if (!card) {
    return res.status(404).send('Cartão não encontrado ou indisponível.');
  }

  let targetUrl: string | null = null;
  switch (destination) {
    case 'website':
      targetUrl = card.websiteUrl;
      break;
    case 'institutional':
      targetUrl = card.ctaUrl;
      break;
    case 'instagram':
      targetUrl = card.instagramUrl;
      break;
    case 'linkedin':
      targetUrl = card.linkedinUrl;
      break;
    case 'facebook':
      targetUrl = card.facebookUrl;
      break;
    case 'youtube':
      targetUrl = card.youtubeUrl;
      break;
    case 'whatsapp':
      if (card.whatsappPhone) {
        const clean = card.whatsappPhone.replace(/\D/g, '');
        targetUrl = `https://wa.me/${clean}`;
      }
      break;
    case 'maps':
      targetUrl = card.googleMapsUrl || (card.address ? `https://maps.google.com/?q=${encodeURIComponent(card.address)}` : null);
      break;
    case 'ai_agent':
      if (card.aiAgentUrl) {
        const parsed = parseAiAgentInput(card.aiAgentUrl);
        targetUrl = parsed ? parsed.url : card.aiAgentUrl;
      }
      break;
  }

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(404).send('Destino não configurado neste cartão.');
  }

  // Grava métrica 100% anônima: SEM IP, SEM USER-AGENT, SEM SESSÃO
  if (card.activityTrackingEnabled !== false) {
    const events = readJson<any[]>(EVENTS_FILE, []);
    events.push({
      id: Date.now(),
      cardId: card.id,
      kind: 'outbound_click',
      destination,
      createdAt: new Date().toISOString(),
    });
    writeJson(EVENTS_FILE, events);
  }

  return res.redirect(302, targetUrl);
});

// ----------------------------------------------------
// 2. MANIFESTO PWA DINÂMICO E FAVICON POR SLUG: /cartao/:slug
// ----------------------------------------------------
app.get('/cartao/:slug/favicon.ico', (req, res) => {
  const cards = readJson<any[]>(CARDS_FILE, []);
  const card = cards.find((c) => c.slug === req.params.slug);

  if (card) {
    const iconUrl = card.mobileIconUrl || card.companyLogoUrl || card.imageUrl || '/icon-192.png';
    return res.redirect(302, iconUrl);
  }
  return res.status(404).end();
});

app.get('/cartao/:slug/manifest.json', (req, res) => {
  const cards = readJson<any[]>(CARDS_FILE, []);
  const card = cards.find((c) => c.slug === req.params.slug);

  if (!card) {
    return res.status(404).json({ error: 'Cartão não encontrado' });
  }

  const defaultAppName = card.brandName ? `${card.name} | ${card.brandName}` : (card.name || 'Cartão Digital');
  const name = card.mobileAppName || defaultAppName;
  const shortName = card.mobileAppName || card.brandName || card.name || 'Cartão';
  const iconUrl = card.mobileIconUrl || card.companyLogoUrl || card.imageUrl || '/icon-192.png';

  const manifest = {
    name,
    short_name: shortName,
    start_url: `/cartao/${card.slug}?pwa=1`,
    display: 'standalone',
    background_color: card.bodyColor || '#EAF1F7',
    theme_color: card.backgroundColor || '#12375B',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  return res.json(manifest);
});

// ----------------------------------------------------
// 3. APIS DE CARTÕES
// ----------------------------------------------------

// Endpoint de Eventos em Tempo Real (SSE) para atualização instantânea da aba aberta
app.get('/api/cards/live-updates', (req, res) => {
  const slug = req.query.slug ? String(req.query.slug) : undefined;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const clientId = Date.now() + Math.random();
  const client: SseClient = { id: clientId, slug, res };
  sseClients.push(client);

  res.write(`data: ${JSON.stringify({ action: 'connected', timestamp: Date.now() })}\n\n`);

  // Heartbeat periódico para manter a conexão aberta
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Listar todos os cartões (Painel)
app.get('/api/cards', (req, res) => {
  setNoCacheHeaders(res);
  const cards = readJson<any[]>(CARDS_FILE, []);
  res.json(cards);
});

// Obter cartão por ID
app.get('/api/cards/:id(\\d+)', (req, res) => {
  setNoCacheHeaders(res);
  const id = parseInt(req.params.id, 10);
  const cards = readJson<any[]>(CARDS_FILE, []);
  const card = cards.find((c) => c.id === id);
  if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
  res.json(card);
});

// Obter dados públicos por slug (sempre sem cache)
app.get('/api/cards/slug/:slug', (req, res) => {
  setNoCacheHeaders(res);
  const slug = req.params.slug;
  const cards = readJson<any[]>(CARDS_FILE, []);
  const card = cards.find((c) => c.slug === slug);

  // Regra de ouro: se pausado ou não encontrado, retorna estado neutro sem vazar dados pessoais!
  if (!card || card.status === 'pausado') {
    return res.json({
      status: 'pausado',
      message: 'Este cartão não está disponível no momento.',
    });
  }

  res.json({
    status: 'ativo',
    data: card,
  });
});

// Criar cartão
app.post('/api/cards', (req, res) => {
  const body = req.body;
  const slug = (body.slug || '').toLowerCase().trim();

  // Validação obrigatória do slug: /^[a-z0-9-]+$/
  if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 3 || slug.length > 120) {
    return res.status(400).json({
      error: 'Slug inválido. Use apenas letras minúsculas, números e hífens (mínimo 3 caracteres).',
    });
  }

  const cards = readJson<any[]>(CARDS_FILE, []);
  if (cards.some((c) => c.slug === slug)) {
    return res.status(400).json({ error: 'Este slug já está em uso.' });
  }

  // Normalização do AI Agent
  let normalizedAiAgentUrl = '';
  if (body.aiAgentUrl) {
    normalizedAiAgentUrl = normalizeAiAgentInput(body.aiAgentUrl);
  }

  const newCard = {
    ...body,
    id: Date.now(),
    userId: body.userId || 1,
    slug,
    name: body.name || 'Nome do Profissional',
    jobTitle: body.jobTitle || '',
    brandName: body.brandName || '',
    aiAgentUrl: normalizedAiAgentUrl || body.aiAgentUrl || '',
    aiAgentButtonText: (body.aiAgentButtonText || 'Atendente Virtual').trim().slice(0, 80),
    aiAgentButtonColor: body.aiAgentButtonColor || '#7C3AED',
    aiAgentGlowEnabled: body.aiAgentGlowEnabled !== false,
    aiAgentGlowIntensity: body.aiAgentGlowIntensity || 'medio',
    aiAgentButtonSize: body.aiAgentButtonSize || 'padrao',
    aiAgentButtonPaddingY: typeof body.aiAgentButtonPaddingY === 'number' ? body.aiAgentButtonPaddingY : 12,
    aiAgentButtonBorderWidth: typeof body.aiAgentButtonBorderWidth === 'number' ? body.aiAgentButtonBorderWidth : 0,
    aiAgentButtonBorderColor: body.aiAgentButtonBorderColor || '#A855F7',
    siteAiAgentEnabled: Boolean(body.siteAiAgentEnabled),
    appearanceTheme: body.appearanceTheme || 'padrao',
    backgroundColor: body.backgroundColor || '#12375B',
    headerOpacity: typeof body.headerOpacity === 'number' ? body.headerOpacity : 100,
    buttonColor: body.buttonColor || '#1A7FBE',
    bodyColor: body.bodyColor || '#EAF1F7',
    contentColor: body.contentColor || '#FFFFFF',
    contentOpacity: typeof body.contentOpacity === 'number' ? body.contentOpacity : 100,
    supportTextColor: body.supportTextColor || '',
    summaryTextColor: body.summaryTextColor || '',
    qrCodeTextColor: body.qrCodeTextColor || '',
    qrCodeSectionBgColor: body.qrCodeSectionBgColor || '',
    fontFamily: body.fontFamily || 'sans',
    contentBackgroundImageUrl: body.contentBackgroundImageUrl || '',
    contentBackgroundImageFocusX: typeof body.contentBackgroundImageFocusX === 'number' ? body.contentBackgroundImageFocusX : 50,
    contentBackgroundImageFocusY: typeof body.contentBackgroundImageFocusY === 'number' ? body.contentBackgroundImageFocusY : 50,
    contentBackgroundImageOpacity: typeof body.contentBackgroundImageOpacity === 'number' ? body.contentBackgroundImageOpacity : 100,
    contentBackgroundImageScale: typeof body.contentBackgroundImageScale === 'number' ? body.contentBackgroundImageScale : 100,
    qrCodeStyle: body.qrCodeStyle || 'quadrado',
    qrCodeForegroundColor: body.qrCodeForegroundColor || '#12375B',
    qrCodeBackgroundColor: body.qrCodeBackgroundColor || '#FFFFFF',
    qrCodeFrameStyle: body.qrCodeFrameStyle || 'none',
    qrCodeFrameText: body.qrCodeFrameText || 'SCAN ME',
    qrCodeFrameColor: body.qrCodeFrameColor || '',
    qrCodeFrameTextColor: body.qrCodeFrameTextColor || '#FFFFFF',
    qrCodeDotsStyle: body.qrCodeDotsStyle || 'square',
    qrCodeCornersSquareStyle: body.qrCodeCornersSquareStyle || 'square',
    qrCodeCornersSquareColor: body.qrCodeCornersSquareColor || '',
    qrCodeCornersDotStyle: body.qrCodeCornersDotStyle || 'square',
    qrCodeCornersDotColor: body.qrCodeCornersDotColor || '',
    qrCodeGradientEnabled: Boolean(body.qrCodeGradientEnabled),
    qrCodeGradientType: body.qrCodeGradientType || 'linear',
    qrCodeGradientStartColor: body.qrCodeGradientStartColor || '#12375B',
    qrCodeGradientEndColor: body.qrCodeGradientEndColor || '#1A7FBE',
    qrCodeTransparentBg: Boolean(body.qrCodeTransparentBg),
    qrCodeIncludeLogo: body.qrCodeIncludeLogo !== false,
    qrCodeLogoSize: typeof body.qrCodeLogoSize === 'number' ? body.qrCodeLogoSize : 0.22,
    frameScale: typeof body.frameScale === 'number' ? body.frameScale : 97,
    status: body.status || 'ativo',
    inquiryEnabled: body.inquiryEnabled !== false,
    trackingEnabled: Boolean(body.trackingEnabled),
    activityTrackingEnabled: body.activityTrackingEnabled !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cards.push(newCard);
  writeJson(CARDS_FILE, cards);
  notifyCardUpdate(newCard, 'created');
  res.status(201).json(newCard);
});

// Atualizar cartão
app.put('/api/cards/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const cards = readJson<any[]>(CARDS_FILE, []);
  const index = cards.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cartão não encontrado.' });
  }

  const existing = cards[index];
  const body = req.body;

  // Slug imutável conforme regra de negócio: não alterar após criação
  const slug = existing.slug;

  // Normalização do AI Agent
  let aiAgentUrl = existing.aiAgentUrl;
  if (body.aiAgentUrl !== undefined) {
    aiAgentUrl = normalizeAiAgentInput(body.aiAgentUrl) || body.aiAgentUrl;
  }

  const updatedCard = {
    ...existing,
    ...body,
    id: existing.id,
    slug, // Mantém slug inalterado
    aiAgentUrl,
    updatedAt: new Date().toISOString(),
  };

  cards[index] = updatedCard;
  writeJson(CARDS_FILE, cards);
  notifyCardUpdate(updatedCard, 'updated');
  res.json(updatedCard);
});

// Deletar cartão
app.delete('/api/cards/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  let cards = readJson<any[]>(CARDS_FILE, []);
  const index = cards.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Cartão não encontrado' });
  }

  const removed = cards[index];
  cards.splice(index, 1);

  writeJson(CARDS_FILE, cards);
  notifyCardUpdate(removed, 'deleted');
  res.json({ success: true });
});

// ----------------------------------------------------
// 4. EVENTOS ANÔNIMOS (Métricas 100% livres de identificação)
// ----------------------------------------------------
app.post('/api/cards/:slug/events', (req, res) => {
  const { kind, destination } = req.body;
  if (!['card_open', 'qr_open', 'outbound_click'].includes(kind)) {
    return res.status(400).json({ error: 'Tipo de evento inválido' });
  }

  const cards = readJson<any[]>(CARDS_FILE, []);
  const card = cards.find((c) => c.slug === req.params.slug);
  if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });

  if (card.activityTrackingEnabled === false) {
    return res.json({ recorded: false });
  }

  const events = readJson<any[]>(EVENTS_FILE, []);
  events.push({
    id: Date.now(),
    cardId: card.id,
    kind,
    destination: destination || null,
    createdAt: new Date().toISOString(),
  });
  writeJson(EVENTS_FILE, events);

  res.json({ recorded: true });
});

// Obter métricas de um cartão
app.get('/api/cards/:id/metrics', (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  const events = readJson<any[]>(EVENTS_FILE, []);
  const cardEvents = events.filter((e) => e.cardId === cardId);

  const cardOpens = cardEvents.filter((e) => e.kind === 'card_open').length;
  const qrOpens = cardEvents.filter((e) => e.kind === 'qr_open').length;
  const outboundClicks = cardEvents.filter((e) => e.kind === 'outbound_click').length;

  const destinations: Record<string, number> = {};
  cardEvents
    .filter((e) => e.kind === 'outbound_click' && e.destination)
    .forEach((e) => {
      destinations[e.destination] = (destinations[e.destination] || 0) + 1;
    });

  const inquiries = readJson<any[]>(INQUIRIES_FILE, []);
  const cardInquiries = inquiries.filter((i) => i.cardId === cardId);

  res.json({
    cardOpens,
    qrOpens,
    outboundClicks,
    destinations,
    inquiriesCount: cardInquiries.length,
  });
});

// ----------------------------------------------------
// 5. PRIMEIRO CONTATO (Formulário com consentimento e Honeypot)
// ----------------------------------------------------
app.post('/api/cards/:slug/inquiry', (req, res) => {
  const { name, email, whatsappPhone, message, consent, website } = req.body;

  // 1. Verificação de Honeypot: se preenchido, é um bot!
  if (website) {
    console.warn('Honeypot acionado para spam.');
    // Responde 200 silencioso para confundir o bot
    return res.json({ success: true });
  }

  // 2. Verificação de consentimento explícito obrigatório
  if (!consent) {
    return res.status(400).json({ error: 'Consentimento obrigatório.' });
  }

  // 3. Validação de mensagem (mín. 10 caracteres, máx. 1200)
  if (!message || message.trim().length < 10 || message.trim().length > 1200) {
    return res.status(400).json({ error: 'A mensagem deve conter entre 10 e 1200 caracteres.' });
  }

  // 4. Ao menos email ou whatsapp
  if (!email?.trim() && !whatsappPhone?.trim()) {
    return res.status(400).json({ error: 'Informe ao menos um e-mail ou WhatsApp para retorno.' });
  }

  const cards = readJson<any[]>(CARDS_FILE, []);
  const card = cards.find((c) => c.slug === req.params.slug);
  if (!card) return res.status(404).json({ error: 'Cartão não encontrado.' });

  // 5. Rate limit: máx. 5 submissões por cartão por hora
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentSubmissions = inquirySubmissions.filter(
    (s) => s.cardId === card.id && s.timestamp > oneHourAgo
  );

  if (recentSubmissions.length >= 5) {
    // Retorno genérico sem revelar detalhes conforme a especificação
    return res.status(429).json({ error: 'Não foi possível enviar sua mensagem no momento. Tente novamente mais tarde.' });
  }

  inquirySubmissions.push({ cardId: card.id, timestamp: now });

  const inquiries = readJson<any[]>(INQUIRIES_FILE, []);
  const newInquiry = {
    id: Date.now(),
    cardId: card.id,
    name: (name || '').trim().slice(0, 160),
    email: (email || '').trim().slice(0, 320),
    whatsappPhone: (whatsappPhone || '').trim().slice(0, 32),
    message: message.trim(),
    status: 'novo',
    consentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inquiries.push(newInquiry);
  writeJson(INQUIRIES_FILE, inquiries);

  res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso!' });
});

// Listar mensagens de um cartão
app.get('/api/cards/:id/inquiries', (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  const inquiries = readJson<any[]>(INQUIRIES_FILE, []);
  const cardInquiries = inquiries.filter((i) => i.cardId === cardId);
  res.json(cardInquiries);
});

// ----------------------------------------------------
// 5. APIS DE ADMINISTRAÇÃO MASTER (Acesso Total)
// ----------------------------------------------------

function seedInitialUsers() {
  const existingUsers = readJson<any[]>(USERS_FILE, []);
  if (existingUsers.length === 0) {
    const defaultUsers = [
      {
        id: 'master-jurandir',
        email: 'consultatomosinfinity@gmail.com',
        fullName: 'Jurandir Hora',
        role: 'master',
        plan: 'corporativo',
        status: 'ativo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'master-atomos',
        email: 'atomoseletrotecnica@gmail.com',
        fullName: 'Átomos Eletrotécnica',
        role: 'master',
        plan: 'corporativo',
        status: 'ativo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    writeJson(USERS_FILE, defaultUsers);
  }
}
seedInitialUsers();

// Listar todos os usuários (com total de cartões)
app.get('/api/admin/users', async (req, res) => {
  setNoCacheHeaders(res);
  try {
    let usersList: any[] = [];

    // Tenta carregar do Supabase se disponível
    if (supabaseAdmin) {
      try {
        const { data: dbProfiles, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && dbProfiles && dbProfiles.length > 0) {
          usersList = dbProfiles.map((p: any) => ({
            id: p.id,
            email: p.email,
            fullName: p.full_name || '',
            role: MASTER_EMAILS.includes(p.email?.toLowerCase()) ? 'master' : (p.role || 'cliente'),
            plan: MASTER_EMAILS.includes(p.email?.toLowerCase()) ? 'corporativo' : (p.plan || 'degustacao'),
            status: p.status || 'ativo',
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }));
        }
      } catch (dbErr) {
        console.warn('Falha ao consultar perfis do Supabase:', dbErr);
      }
    }

    // Mescla com arquivo local users.json
    const localUsers = readJson<any[]>(USERS_FILE, []);
    for (const lu of localUsers) {
      if (!usersList.some((u) => u.email?.toLowerCase() === lu.email?.toLowerCase() || u.id === lu.id)) {
        usersList.push(lu);
      }
    }

    // Garante que os dois e-mails Master estejam sempre na lista
    for (const masterEmail of MASTER_EMAILS) {
      if (!usersList.some((u) => u.email?.toLowerCase() === masterEmail)) {
        usersList.unshift({
          id: `master-${masterEmail.split('@')[0]}`,
          email: masterEmail,
          fullName: masterEmail.includes('jurandir') ? 'Jurandir Hora' : 'Átomos Eletrotécnica',
          role: 'master',
          plan: 'corporativo',
          status: 'ativo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Calcula contagem de cartões por usuário
    const cards = readJson<any[]>(CARDS_FILE, []);
    const cardsCountMap: Record<string, number> = {};
    for (const card of cards) {
      const uKey = String(card.userId);
      cardsCountMap[uKey] = (cardsCountMap[uKey] || 0) + 1;
    }

    const enriched = usersList.map((u) => ({
      ...u,
      cardsCount: cardsCountMap[String(u.id)] || 0,
    }));

    return res.json(enriched);
  } catch (err: any) {
    console.error('Erro ao listar usuários:', err);
    return res.status(500).json({ error: 'Erro interno ao listar usuários' });
  }
});

// Criar novo usuário (com role, plano e senha)
app.post('/api/admin/users', async (req, res) => {
  try {
    const { email, password, fullName, role, plan } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'E-mail válido é obrigatório.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const finalRole = MASTER_EMAILS.includes(cleanEmail) ? 'master' : (role || 'cliente');
    const finalPlan = MASTER_EMAILS.includes(cleanEmail) ? 'corporativo' : (plan || 'degustacao');

    let createdId = `user-${Date.now()}`;

    // Cria no Supabase Auth se admin client configurado
    if (supabaseAdmin) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: password || 'Atomos123!',
          email_confirm: true,
          user_metadata: {
            full_name: fullName || '',
            role: finalRole,
            plan: finalPlan,
          },
        });

        if (!authError && authData?.user) {
          createdId = authData.user.id;

          // Insere/atualiza na tabela profiles
          await supabaseAdmin.from('profiles').upsert({
            id: createdId,
            email: cleanEmail,
            full_name: fullName || '',
            role: finalRole,
            plan: finalPlan,
            status: 'ativo',
            updated_at: new Date().toISOString(),
          });
        }
      } catch (authErr) {
        console.warn('Erro ao criar usuário no Supabase Auth:', authErr);
      }
    }

    // Persiste também no users.json local
    const localUsers = readJson<any[]>(USERS_FILE, []);
    const existingIndex = localUsers.findIndex((u) => u.email?.toLowerCase() === cleanEmail);
    const newUser = {
      id: createdId,
      email: cleanEmail,
      fullName: fullName || '',
      role: finalRole,
      plan: finalPlan,
      status: 'ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      localUsers[existingIndex] = newUser;
    } else {
      localUsers.push(newUser);
    }
    writeJson(USERS_FILE, localUsers);

    return res.status(201).json({ success: true, user: newUser });
  } catch (err: any) {
    console.error('Erro ao cadastrar usuário:', err);
    return res.status(500).json({ error: err.message || 'Erro ao criar usuário.' });
  }
});

// Atualizar usuário (função, plano, status, nome)
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, plan, status } = req.body;

    const localUsers = readJson<any[]>(USERS_FILE, []);
    const userIndex = localUsers.findIndex((u) => u.id === id || String(u.id) === String(id));
    const targetUser = userIndex !== -1 ? localUsers[userIndex] : null;

    const targetEmail = (targetUser?.email || '').toLowerCase();
    const isPrimaryMaster = MASTER_EMAILS.includes(targetEmail);

    if (isPrimaryMaster) {
      if (role && role !== 'master') {
        return res.status(400).json({ error: 'As contas Master principais não podem ter sua função rebaixada.' });
      }
      if (status && status !== 'ativo') {
        return res.status(400).json({ error: 'As contas Master principais não podem ser pausadas ou bloqueadas.' });
      }
    }

    // Atualiza no Supabase se disponível
    if (supabaseAdmin) {
      try {
        const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (fullName !== undefined) updatePayload.full_name = fullName;
        if (role !== undefined && !isPrimaryMaster) updatePayload.role = role;
        if (plan !== undefined) updatePayload.plan = plan;
        if (status !== undefined && !isPrimaryMaster) updatePayload.status = status;

        await supabaseAdmin.from('profiles').update(updatePayload).eq('id', id);

        // Atualiza metadata no Auth
        if (fullName !== undefined || role !== undefined || plan !== undefined) {
          await supabaseAdmin.auth.admin.updateUserById(id, {
            user_metadata: {
              ...(fullName !== undefined ? { full_name: fullName } : {}),
              ...(role !== undefined ? { role } : {}),
              ...(plan !== undefined ? { plan } : {}),
            },
          });
        }
      } catch (dbErr) {
        console.warn('Erro ao atualizar perfil no Supabase:', dbErr);
      }
    }

    // Atualiza no USERS_FILE
    if (userIndex !== -1) {
      localUsers[userIndex] = {
        ...localUsers[userIndex],
        ...(fullName !== undefined ? { fullName } : {}),
        ...(role !== undefined && !isPrimaryMaster ? { role } : {}),
        ...(plan !== undefined ? { plan } : {}),
        ...(status !== undefined && !isPrimaryMaster ? { status } : {}),
        updatedAt: new Date().toISOString(),
      };
      writeJson(USERS_FILE, localUsers);
    }

    return res.json({ success: true, message: 'Usuário atualizado com sucesso!' });
  } catch (err: any) {
    console.error('Erro ao atualizar usuário:', err);
    return res.status(500).json({ error: err.message || 'Erro ao atualizar usuário.' });
  }
});

// Excluir usuário (Master Only)
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const localUsers = readJson<any[]>(USERS_FILE, []);
    const targetUser = localUsers.find((u) => u.id === id || String(u.id) === String(id));
    const targetEmail = (targetUser?.email || '').toLowerCase();

    if (MASTER_EMAILS.includes(targetEmail)) {
      return res.status(400).json({ error: 'Não é permitido excluir as contas Master principais da plataforma.' });
    }

    // Exclui do Supabase Auth e DB
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(id);
        await supabaseAdmin.from('profiles').delete().eq('id', id);
        await supabaseAdmin.from('digital_cards').delete().eq('user_id', id);
      } catch (authErr) {
        console.warn('Erro ao deletar usuário do Supabase Auth:', authErr);
      }
    }

    // Exclui do users.json
    const updatedUsers = localUsers.filter((u) => u.id !== id && String(u.id) !== String(id));
    writeJson(USERS_FILE, updatedUsers);

    return res.json({ success: true, message: 'Usuário e dados associados excluídos com sucesso!' });
  } catch (err: any) {
    console.error('Erro ao excluir usuário:', err);
    return res.status(500).json({ error: err.message || 'Erro ao excluir usuário.' });
  }
});

// Redefinir senha de um usuário
app.post('/api/admin/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, newPassword } = req.body;

    if (supabaseAdmin) {
      if (newPassword && newPassword.length >= 6) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
          password: newPassword,
        });
        if (error) throw error;
        return res.json({ success: true, message: 'Senha atualizada diretamente para o usuário!' });
      } else if (email) {
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${req.protocol}://${req.get('host')}/app`,
        });
        if (error) throw error;
        return res.json({ success: true, message: `E-mail de recuperação de senha enviado para ${email}!` });
      }
    }

    return res.json({ success: true, message: 'Instruções de redefinição registradas com sucesso!' });
  } catch (err: any) {
    console.error('Erro ao redefinir senha:', err);
    return res.status(500).json({ error: err.message || 'Erro ao redefinir senha.' });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVIDOR
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Cartões Digitais rodando na porta ${PORT}`);
  });
}

startServer();
