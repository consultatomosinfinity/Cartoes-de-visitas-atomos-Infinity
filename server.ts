import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { normalizeAiAgentInput, parseAiAgentInput } from './shared/digital-card-ai-agent.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
const LANDING_TEMPLATE_FILE = path.join(DATA_DIR, 'landing_template.json');
const SYSTEM_SETTINGS_FILE = path.join(DATA_DIR, 'system_settings.json');
const WALLPAPERS_FILE = path.join(DATA_DIR, 'wallpapers.json');
const ONBOARDING_FORMS_FILE = path.join(DATA_DIR, 'onboarding_forms.json');

const DEFAULT_WALLPAPERS_DATA = {
  folders: [
    { id: 'corporativo', name: 'Corporativo & Executivo', description: 'Fundos sóbrios e profissionais para cartões executivos', icon: 'Briefcase', order: 1 },
    { id: 'tecnologia', name: 'Tecnologia & Inovação', description: 'Linhas digitais, conexões e visual moderno', icon: 'Cpu', order: 2 },
    { id: 'gradientes', name: 'Gradientes & Modernos', description: 'Transições suaves de cores vibrantes e elegantes', icon: 'Palette', order: 3 },
    { id: 'texturas', name: 'Texturas & Minimalistas', description: 'Padrões geométricos discretos e neutros', icon: 'Layers', order: 4 },
    { id: 'atomosinfinity', name: 'Átomos Infinity', description: 'Logotipos, ícones e elementos oficiais da marca', icon: 'Sparkles', order: 5 },
    { id: 'icones-logos', name: 'Ícones, Logos & Favicons', description: 'Modelos padrão para logomarca, ícone de celular e favicon da aba', icon: 'Sparkles', order: 6 },
    { id: 'avatares', name: 'Avatares & Fotos Padrão', description: 'Avatares ilustrados e fotos de perfil padrão', icon: 'User', order: 7 },
  ],
  items: [
    {
      id: 'logo-oficial-atomos',
      title: 'Logotipo Oficial Átomos Infinity',
      folderId: 'atomosinfinity',
      url: '/logo-atomos.svg',
      thumbnailUrl: '/logo-atomos.svg',
      recommendedTheme: 'personalizado',
    },
    {
      id: 'favicon-atomos',
      title: 'Favicon Átomos Infinity',
      folderId: 'atomosinfinity',
      url: '/favicon-atomos.svg',
      thumbnailUrl: '/favicon-atomos.svg',
      recommendedTheme: 'personalizado',
    },
    {
      id: 'icon-192-atomos',
      title: 'Ícone PWA 192x192 Átomos',
      folderId: 'atomosinfinity',
      url: '/icon-192.png',
      thumbnailUrl: '/icon-192.png',
      recommendedTheme: 'personalizado',
    },
    {
      id: 'icon-512-atomos',
      title: 'Ícone PWA 512x512 Átomos',
      folderId: 'atomosinfinity',
      url: '/icon-512.png',
      thumbnailUrl: '/icon-512.png',
      recommendedTheme: 'personalizado',
    },
    {
      id: 'avatar-gato-gravata',
      title: 'Gato de Gravata Executivo',
      folderId: 'avatares',
      url: '/default-cat-avatar.jpg',
      thumbnailUrl: '/default-cat-avatar.jpg',
      recommendedTheme: 'personalizado',
    },
    {
      id: 'icon-atomos-infinity',
      title: 'Ícone Átomos Infinity PWA',
      folderId: 'icones-logos',
      url: '/icon-192.png',
      thumbnailUrl: '/icon-192.png',
      recommendedTheme: 'personalizado',
    },
    {
      id: 'corp-dark-navy',
      title: 'Dark Navy Minimalist',
      folderId: 'corporativo',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=70',
      recommendedTheme: 'escuro',
    },
    {
      id: 'corp-slate-geometry',
      title: 'Slate Architecture & Glass',
      folderId: 'corporativo',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=70',
      recommendedTheme: 'padrao',
    },
    {
      id: 'tech-cyber-mesh',
      title: 'Digital Cyber Mesh Blue',
      folderId: 'tecnologia',
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=70',
      recommendedTheme: 'escuro',
    },
    {
      id: 'tech-neon-circuit',
      title: 'Deep Indigo Waves',
      folderId: 'tecnologia',
      url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=70',
      recommendedTheme: 'escuro',
    },
    {
      id: 'grad-aurora-sunset',
      title: 'Aurora Sunset Gradient',
      folderId: 'gradientes',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=70',
      recommendedTheme: 'personalizado',
    },
    {
      id: 'grad-ocean-mist',
      title: 'Cyan & Cobalt Wave',
      folderId: 'gradientes',
      url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=300&q=70',
      recommendedTheme: 'personalizado',
    },
    {
      id: 'text-hex-gold',
      title: 'Geometric Carbon Texture',
      folderId: 'texturas',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=70',
      recommendedTheme: 'escuro',
    },
    {
      id: 'text-white-marble',
      title: 'Soft White Carrara Marble',
      folderId: 'texturas',
      url: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=300&q=70',
      recommendedTheme: 'claro',
    },
  ],
};

function getWallpapersData() {
  const existing = readJson<any>(WALLPAPERS_FILE, null);
  if (!existing || !Array.isArray(existing.folders)) {
    writeJson(WALLPAPERS_FILE, DEFAULT_WALLPAPERS_DATA);
    return DEFAULT_WALLPAPERS_DATA;
  }

  // Mescla pastas e itens padrão para garantir que Atomosinfinity e logotipos oficiais nunca sumam
  let updated = false;
  const folders = [...existing.folders];
  for (const defFolder of DEFAULT_WALLPAPERS_DATA.folders) {
    if (!folders.some((f: any) => f.id === defFolder.id)) {
      folders.push(defFolder);
      updated = true;
    }
  }

  const items = [...existing.items];
  for (const defItem of DEFAULT_WALLPAPERS_DATA.items) {
    if (!items.some((i: any) => i.id === defItem.id || i.url === defItem.url)) {
      items.unshift(defItem);
      updated = true;
    }
  }

  const result = { folders, items };
  if (updated) {
    writeJson(WALLPAPERS_FILE, result);
  }
  return result;
}

const DEFAULT_SYSTEM_SETTINGS = {
  requireMasterApproval: false, // Padrão mantido: entra direto
  defaultRole: 'cliente',       // Padrão mantido: entra como cliente
  defaultPlan: 'degustacao',    // Padrão mantido: plano degustação
  degustacaoDays: 30,           // Padrão mantido: 30 dias
  allowPublicRegistration: true, // Padrão mantido: aberto
  masterWhatsApp: '+55 (15) 99625-9353',
  customWelcomeMessage: '',
  platformLogoUrl: '/logo-atomos.svg',
  platformTitle: 'Átomos Infinity',
  updatedAt: new Date().toISOString(),
};

function getSystemSettings() {
  const existing = readJson<any>(SYSTEM_SETTINGS_FILE, null);
  if (!existing) {
    writeJson(SYSTEM_SETTINGS_FILE, DEFAULT_SYSTEM_SETTINGS);
    return DEFAULT_SYSTEM_SETTINGS;
  }
  return { ...DEFAULT_SYSTEM_SETTINGS, ...existing };
}

const DEFAULT_LANDING_TEMPLATE = {
  id: 1,
  userId: 1,
  slug: 'jurandir-hora',
  name: 'Jurandir Hora',
  jobTitle: 'Diretor Executivo',
  brandName: 'Átomos Infinity',
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
  googleReviewUrl: '',
  pixKey: '',
  pixType: 'telefone',
  pixBeneficiary: '',
  pixCity: 'Brasil',
  summary: 'Consultoria e inteligência estratégica empresarial pela Átomos Infinity.',
  instagramUrl: '',
  linkedinUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
  aiAgentUrl: 'https://wa.me/5515996259353?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es',
  siteAiAgentEnabled: false,
  aiAgentButtonColor: '#7C3AED',
  aiAgentButtonText: 'Atendente Virtual IA',
  aiAgentGlowEnabled: true,
  aiAgentGlowIntensity: 'medio',
  aiAgentButtonSize: 'padrao',
  aiAgentButtonPaddingY: 12,
  aiAgentButtonBorderWidth: 0,
  aiAgentButtonBorderColor: '#A855F7',
  ctaLabel: 'Conheça a Átomos Infinity',
  ctaUrl: 'https://consultatomosinfinity.com.br',
  footerText: 'Cartão digital disponibilizado por Átomos Infinity',
  appearanceTheme: 'padrao',
  backgroundColor: '#12375B',
  headerOpacity: 100,
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
};

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
app.get('/cartao/:slug/ir/:dest', async (req, res) => {
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
  let card = cards.find((c) => c.slug === req.params.slug && c.status === 'ativo');

  // Se não encontrar no arquivo JSON local, busca diretamente no Supabase
  if (!card && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('digital_cards')
        .select('*')
        .eq('slug', req.params.slug)
        .maybeSingle();

      if (!error && data && data.status === 'ativo') {
        card = {
          ...data,
          websiteUrl: data.website_url,
          ctaUrl: data.cta_url,
          instagramUrl: data.instagram_url,
          linkedinUrl: data.linkedin_url,
          facebookUrl: data.facebook_url,
          youtubeUrl: data.youtube_url,
          whatsappPhone: data.whatsapp_phone,
          googleMapsUrl: (() => {
            const raw = data.google_maps_url || '';
            let clean = raw;
            if (clean.includes('###review=')) clean = clean.split('###review=')[0];
            if (clean.includes('###pix=')) clean = clean.split('###pix=')[0];
            return clean.trim();
          })(),
          googleReviewUrl: (() => {
            const raw = data.google_maps_url || '';
            if (raw.includes('###review=')) {
              const afterReview = raw.split('###review=')[1] || '';
              return (afterReview.includes('###pix=') ? afterReview.split('###pix=')[0] : afterReview).trim();
            }
            return (data.google_review_url || '');
          })(),
          pixKey: (() => {
            const raw = data.google_maps_url || '';
            if (raw.includes('###pix=')) {
              try {
                const encoded = raw.split('###pix=')[1] || '';
                const parsed = JSON.parse(decodeURIComponent(encoded));
                if (parsed && parsed.key) return parsed.key;
              } catch (_) {}
            }
            return data.pix_key || data.billing_pix_key || '';
          })(),
          pixType: (() => {
            const raw = data.google_maps_url || '';
            if (raw.includes('###pix=')) {
              try {
                const encoded = raw.split('###pix=')[1] || '';
                const parsed = JSON.parse(decodeURIComponent(encoded));
                if (parsed && parsed.type) return parsed.type;
              } catch (_) {}
            }
            return data.pix_type || 'telefone';
          })(),
          pixBeneficiary: (() => {
            const raw = data.google_maps_url || '';
            if (raw.includes('###pix=')) {
              try {
                const encoded = raw.split('###pix=')[1] || '';
                const parsed = JSON.parse(decodeURIComponent(encoded));
                if (parsed && parsed.beneficiary) return parsed.beneficiary;
              } catch (_) {}
            }
            return data.pix_beneficiary || data.billing_customer_name || '';
          })(),
          pixCity: (() => {
            const raw = data.google_maps_url || '';
            if (raw.includes('###pix=')) {
              try {
                const encoded = raw.split('###pix=')[1] || '';
                const parsed = JSON.parse(decodeURIComponent(encoded));
                if (parsed && parsed.city) return parsed.city;
              } catch (_) {}
            }
            return data.pix_city || data.city || 'Brasil';
          })(),
          address: data.address,
          addressNumber: data.address_number,
          city: data.city,
          state: data.state,
          country: data.country,
          aiAgentUrl: data.ai_agent_url,
          activityTrackingEnabled: data.activity_tracking_enabled,
        };
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase na rota /ir/:', e);
    }
  }

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
    case 'instagram': {
      let raw = card.instagramUrl ? card.instagramUrl.trim() : null;
      if (raw) {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          targetUrl = raw;
        } else {
          let clean = raw.replace(/^@/, '');
          targetUrl = clean.startsWith('instagram.com/') ? `https://${clean}` : `https://instagram.com/${clean}`;
        }
      }
      break;
    }
    case 'linkedin': {
      let raw = card.linkedinUrl ? card.linkedinUrl.trim() : null;
      if (raw) {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          targetUrl = raw;
        } else {
          let clean = raw.replace(/^@/, '');
          targetUrl = (clean.startsWith('linkedin.com/') || clean.startsWith('in/')) ? `https://${clean.replace(/^in\//, 'linkedin.com/in/')}` : `https://linkedin.com/in/${clean}`;
        }
      }
      break;
    }
    case 'facebook': {
      let raw = card.facebookUrl ? card.facebookUrl.trim() : null;
      if (raw) {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          targetUrl = raw;
        } else {
          let clean = raw.replace(/^@/, '');
          targetUrl = clean.startsWith('facebook.com/') ? `https://${clean}` : `https://facebook.com/${clean}`;
        }
      }
      break;
    }
    case 'youtube': {
      let raw = card.youtubeUrl ? card.youtubeUrl.trim() : null;
      if (raw) {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          targetUrl = raw;
        } else {
          let clean = raw.replace(/^@/, '');
          targetUrl = (clean.startsWith('youtube.com/') || clean.startsWith('youtu.be/')) ? `https://${clean}` : `https://youtube.com/@${clean}`;
        }
      }
      break;
    }
    case 'whatsapp':
      if (card.whatsappPhone) {
        let clean = card.whatsappPhone.replace(/\D/g, '');
        if (clean && !clean.startsWith('55') && (clean.length === 10 || clean.length === 11)) {
          clean = `55${clean}`;
        }
        targetUrl = `https://wa.me/${clean}`;
      }
      break;
    case 'maps':
      if (card.googleMapsUrl && card.googleMapsUrl.trim()) {
        const raw = card.googleMapsUrl.trim();
        targetUrl = (raw.startsWith('http://') || raw.startsWith('https://')) ? raw : `https://${raw}`;
      } else {
        const parts = [card.address, card.addressNumber, card.city, card.state, card.country].filter(Boolean);
        if (parts.length > 0) {
          targetUrl = `https://maps.google.com/?q=${encodeURIComponent(parts.join(', '))}`;
        }
      }
      break;
    case 'google_review':
    case 'review':
      if (card.googleReviewUrl && card.googleReviewUrl.trim()) {
        const raw = card.googleReviewUrl.trim();
        targetUrl = (raw.startsWith('http://') || raw.startsWith('https://')) ? raw : `https://${raw}`;
      }
      break;
    case 'ai_agent':
      if (card.aiAgentUrl) {
        const parsed = parseAiAgentInput(card.aiAgentUrl);
        targetUrl = parsed ? parsed.url : card.aiAgentUrl;
      }
      break;
  }

  if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  if (!targetUrl) {
    return res.status(404).send('Destino não configurado neste cartão.');
  }

  // Grava métrica 100% anônima: SEM IP, SEM USER-AGENT, SEM SESSÃO
  if (card.activityTrackingEnabled !== false) {
    try {
      const events = readJson<any[]>(EVENTS_FILE, []);
      events.push({
        id: Date.now(),
        cardId: card.id,
        kind: 'outbound_click',
        destination,
        createdAt: new Date().toISOString(),
      });
      writeJson(EVENTS_FILE, events);
    } catch {}

    if (supabaseAdmin && card.id) {
      void supabaseAdmin.from('digital_card_events').insert([{
        card_id: card.id,
        kind: 'outbound_click',
        destination,
      }]);
    }
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

// ----------------------------------------------------
// MODELO PADRÃO DA LANDING PAGE (Configurável pelo Master)
// ----------------------------------------------------
app.get(['/api/settings/landing-card', '/api/landing-card'], (req, res) => {
  setNoCacheHeaders(res);
  const template = readJson<any>(LANDING_TEMPLATE_FILE, null);
  if (template) {
    return res.json(template);
  }
  // Fallback: se não existir arquivo específico de template salvo, tenta pegar o primeiro cartão se existir, ou o default
  const cards = readJson<any[]>(CARDS_FILE, []);
  if (cards.length > 0) {
    return res.json(cards[0]);
  }
  return res.json(DEFAULT_LANDING_TEMPLATE);
});

app.put('/api/settings/landing-card', (req, res) => {
  const body = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Dados do modelo são obrigatórios.' });
  }

  // Normalização do AI Agent
  let aiAgentUrl = body.aiAgentUrl;
  if (aiAgentUrl) {
    aiAgentUrl = normalizeAiAgentInput(aiAgentUrl) || aiAgentUrl;
  }

  const existing = readJson<any>(LANDING_TEMPLATE_FILE, DEFAULT_LANDING_TEMPLATE);

  const updatedTemplate = {
    ...DEFAULT_LANDING_TEMPLATE,
    ...existing,
    ...body,
    aiAgentUrl: aiAgentUrl !== undefined ? aiAgentUrl : (existing.aiAgentUrl || ''),
    updatedAt: new Date().toISOString(),
  };

  writeJson(LANDING_TEMPLATE_FILE, updatedTemplate);

  // Notifica clientes em tempo real
  notifyCardUpdate({ ...updatedTemplate, slug: updatedTemplate.slug || 'jurandir-hora' }, 'updated');

  return res.json({
    success: true,
    message: 'Modelo padrão da Landing Page atualizado com sucesso!',
    template: updatedTemplate,
  });
});

app.post('/api/settings/landing-card/reset', (req, res) => {
  const freshTemplate = {
    ...DEFAULT_LANDING_TEMPLATE,
    updatedAt: new Date().toISOString(),
  };
  writeJson(LANDING_TEMPLATE_FILE, freshTemplate);
  notifyCardUpdate({ ...freshTemplate, slug: freshTemplate.slug || 'jurandir-hora' }, 'updated');

  return res.json({
    success: true,
    message: 'Modelo da Landing Page restaurado para os padrões de fábrica!',
    template: freshTemplate,
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
app.get('/api/cards/slug/:slug', async (req, res) => {
  setNoCacheHeaders(res);
  const slug = req.params.slug;
  const cards = readJson<any[]>(CARDS_FILE, []);
  let card = cards.find((c) => c.slug === slug);

  // Se não encontrar no arquivo JSON local, busca diretamente no Supabase
  if (!card && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('digital_cards')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        card = {
          id: data.id,
          userId: data.user_id,
          slug: data.slug,
          name: data.name,
          title: data.title,
          brandName: data.brand_name,
          bio: data.bio,
          summary: data.summary,
          phone: data.phone,
          whatsappPhone: data.whatsapp_phone,
          email: data.email,
          websiteUrl: data.website_url,
          address: data.address,
          addressNumber: data.address_number,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postal_code,
          googleMapsUrl: data.google_maps_url,
          instagramUrl: data.instagram_url,
          linkedinUrl: data.linkedin_url,
          facebookUrl: data.facebook_url,
          youtubeUrl: data.youtube_url,
          avatarUrl: data.avatar_url,
          bannerUrl: data.banner_url,
          qrCodeColor: data.qr_code_color,
          primaryColor: data.primary_color,
          backgroundColor: data.background_color,
          textColor: data.text_color,
          supportTextColor: data.support_text_color,
          activityTrackingEnabled: data.activity_tracking_enabled,
          aiAgentUrl: data.ai_agent_url,
          aiAgentButtonText: data.ai_agent_button_text,
          aiAgentGlowEnabled: data.ai_agent_glow_enabled,
          aiAgentGlowIntensity: data.ai_agent_glow_intensity,
          aiAgentButtonSize: data.ai_agent_button_size,
          aiAgentButtonPaddingY: data.ai_agent_button_padding_y,
          aiAgentButtonBorderWidth: data.ai_agent_button_border_width,
          aiAgentButtonBorderColor: data.ai_agent_button_border_color,
          appearanceTheme: data.appearance_theme,
          saveContactBgColor: data.save_contact_bg_color,
          saveContactTextColor: data.save_contact_text_color,
          saveContactBorderRadius: data.save_contact_border_radius,
          mobileAppBgColor: data.mobile_app_bg_color,
          mobileAppTextColor: data.mobile_app_text_color,
          mobileAppBorderRadius: data.mobile_app_border_radius,
          mobileAppName: data.mobile_app_name,
          aiAgentBgColor: data.ai_agent_bg_color,
          aiAgentTextColor: data.ai_agent_text_color,
          aiAgentBorderRadius: data.ai_agent_border_radius,
          customShareText: data.custom_share_text,
          ctaLabel: data.cta_label,
          ctaUrl: data.cta_url,
          footerText: data.footer_text,
          status: data.status || 'ativo',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase na rota /api/cards/slug/:', e);
    }
  }

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

// Duplicar / Clonar Cartão (com novo slug exclusivo)
app.post('/api/cards/:id/duplicate', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const cards = readJson<any[]>(CARDS_FILE, []);
  const source = cards.find((c) => c.id === id);

  if (!source) {
    return res.status(404).json({ error: 'Cartão de origem não encontrado.' });
  }

  const requestedSlug = req.body?.slug ? String(req.body.slug).toLowerCase().trim() : '';
  let finalSlug = requestedSlug;

  if (!finalSlug || !/^[a-z0-9-]+$/.test(finalSlug)) {
    // Gera slug incremental a partir do original
    const baseSlug = source.slug.replace(/-copia(-\d+)?$/, '');
    let counter = 1;
    finalSlug = `${baseSlug}-copia`;
    while (cards.some((c) => c.slug === finalSlug)) {
      counter++;
      finalSlug = `${baseSlug}-copia-${counter}`;
    }
  } else {
    if (cards.some((c) => c.slug === finalSlug)) {
      return res.status(400).json({ error: 'Este slug já está em uso.' });
    }
  }

  const newCard = {
    ...source,
    id: Date.now(),
    slug: finalSlug,
    name: req.body?.name || `${source.name} (Cópia)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cards.push(newCard);
  writeJson(CARDS_FILE, cards);
  notifyCardUpdate(newCard, 'created');
  res.status(201).json(newCard);
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
          email_confirm: true,
          user_metadata: {
            email_verified: true,
          },
        });
        // Atualiza também via SQL direto para garantir bypass da confirmação de e-mail no Supabase Auth se necessário
        try {
          await supabaseAdmin.from('auth.users').update({ email_confirmed_at: new Date().toISOString() }).eq('id', id);
        } catch (e) {}
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
// 6. APIS DE CONFIGURAÇÕES DE POLÍTICAS DE CADASTRO E SISTEMA
// ----------------------------------------------------

// Obter configurações gerais do sistema
app.get('/api/system-settings', (req, res) => {
  setNoCacheHeaders(res);
  res.json(getSystemSettings());
});

// Atualizar configurações do sistema (Master Only)
app.put('/api/system-settings', (req, res) => {
  try {
    const current = getSystemSettings();
    const {
      requireMasterApproval,
      defaultRole,
      defaultPlan,
      degustacaoDays,
      allowPublicRegistration,
      masterWhatsApp,
      customWelcomeMessage,
      platformLogoUrl,
      platformTitle,
    } = req.body;

    const updated = {
      ...current,
      ...(requireMasterApproval !== undefined ? { requireMasterApproval: Boolean(requireMasterApproval) } : {}),
      ...(defaultRole !== undefined ? { defaultRole } : {}),
      ...(defaultPlan !== undefined ? { defaultPlan } : {}),
      ...(degustacaoDays !== undefined
        ? { degustacaoDays: Math.max(1, parseInt(degustacaoDays, 10) || 30) }
        : {}),
      ...(allowPublicRegistration !== undefined ? { allowPublicRegistration: Boolean(allowPublicRegistration) } : {}),
      ...(masterWhatsApp !== undefined ? { masterWhatsApp: String(masterWhatsApp).trim() } : {}),
      ...(customWelcomeMessage !== undefined ? { customWelcomeMessage: String(customWelcomeMessage) } : {}),
      ...(platformLogoUrl !== undefined ? { platformLogoUrl: String(platformLogoUrl).trim() } : {}),
      ...(platformTitle !== undefined ? { platformTitle: String(platformTitle).trim() } : {}),
      updatedAt: new Date().toISOString(),
    };

    writeJson(SYSTEM_SETTINGS_FILE, updated);
    return res.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Erro ao salvar configurações do sistema:', err);
    return res.status(500).json({ error: err.message || 'Erro ao salvar configurações.' });
  }
});

// Hook de Onboarding após auto-cadastro
app.post('/api/auth/onboarding-profile', async (req, res) => {
  try {
    const { userId, email, fullName } = req.body;
    if (!email || !userId) {
      return res.status(400).json({ error: 'Identificador e e-mail são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isMaster = MASTER_EMAILS.includes(cleanEmail);
    const settings = getSystemSettings();

    if (!isMaster && !settings.allowPublicRegistration) {
      return res.status(403).json({
        error: 'Novos auto-cadastros estão desativados pelo Administrador Master. Entre em contato para liberação.',
      });
    }

    const role = isMaster ? 'master' : (settings.defaultRole || 'cliente');
    const plan = isMaster ? 'corporativo' : (settings.defaultPlan || 'degustacao');
    const status = isMaster ? 'ativo' : (settings.requireMasterApproval ? 'pausado' : 'ativo');
    const degustacaoDays = settings.degustacaoDays || 30;
    const degustacaoExpiresAt = new Date(Date.now() + degustacaoDays * 86400000).toISOString();

    const profileData = {
      id: userId,
      email: cleanEmail,
      fullName: fullName || '',
      role,
      plan,
      status,
      degustacaoDays,
      degustacaoExpiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          email: cleanEmail,
          full_name: fullName || '',
          role,
          plan,
          status,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Falha ao sincronizar perfil de auto-cadastro com Supabase:', err);
      }
    }

    const localUsers = readJson<any[]>(USERS_FILE, []);
    const existingIndex = localUsers.findIndex(
      (u) => u.id === userId || u.email?.toLowerCase() === cleanEmail
    );

    if (existingIndex !== -1) {
      localUsers[existingIndex] = { ...localUsers[existingIndex], ...profileData };
    } else {
      localUsers.push(profileData);
    }
    writeJson(USERS_FILE, localUsers);

    return res.json({ success: true, profile: profileData, settings });
  } catch (err: any) {
    console.error('Erro ao processar perfil de cadastro:', err);
    return res.status(500).json({ error: err.message || 'Erro ao registrar perfil.' });
  }
});

// Aprovação rápida de usuário pelo Master (com 1 clique)
app.post('/api/admin/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const localUsers = readJson<any[]>(USERS_FILE, []);
    const userIndex = localUsers.findIndex((u) => u.id === id || String(u.id) === String(id));

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    localUsers[userIndex].status = 'ativo';
    localUsers[userIndex].updatedAt = new Date().toISOString();
    writeJson(USERS_FILE, localUsers);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('profiles').update({
          status: 'ativo',
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      } catch (err) {
        console.warn('Falha ao aprovar no Supabase:', err);
      }
    }

    return res.json({ success: true, message: 'Usuário aprovado e ativado com sucesso!', user: localUsers[userIndex] });
  } catch (err: any) {
    console.error('Erro ao aprovar usuário:', err);
    return res.status(500).json({ error: err.message || 'Erro ao aprovar usuário.' });
  }
});

// ----------------------------------------------------
// 7. BIBLIOTECA DE PAPÉIS DE PAREDE / FUNDOS DO SISTEMA
// ----------------------------------------------------

// Listar todas as pastas e fundos disponíveis
app.get('/api/wallpapers', (req, res) => {
  setNoCacheHeaders(res);
  const data = getWallpapersData();
  res.json(data);
});

// Criar pasta de fundos (Master)
app.post('/api/wallpapers/folders', (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome da pasta é obrigatório.' });
    }

    const data = getWallpapersData();
    const id = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
    
    if (data.folders.some((f: any) => f.id === id)) {
      return res.status(400).json({ error: 'Já existe uma categoria ou pasta com esse identificador.' });
    }

    const newFolder = {
      id,
      name: name.trim(),
      description: (description || '').trim(),
      icon: icon || 'Folder',
      order: data.folders.length + 1,
    };

    data.folders.push(newFolder);
    writeJson(WALLPAPERS_FILE, data);
    return res.status(201).json({ success: true, folder: newFolder, folders: data.folders });
  } catch (err: any) {
    console.error('Erro ao criar pasta de fundos:', err);
    return res.status(500).json({ error: err.message || 'Erro ao criar pasta.' });
  }
});

// Excluir pasta de fundos (Master)
app.delete('/api/wallpapers/folders/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'corporativo') {
      return res.status(400).json({ error: 'A pasta corporativa padrão não pode ser excluída.' });
    }

    const data = getWallpapersData();
    data.folders = data.folders.filter((f: any) => f.id !== id);
    // Remove os itens dessa pasta da biblioteca
    data.items = data.items.filter((item: any) => item.folderId !== id);
    writeJson(WALLPAPERS_FILE, data);
    return res.json({ success: true, folders: data.folders, items: data.items });
  } catch (err: any) {
    console.error('Erro ao excluir pasta:', err);
    return res.status(500).json({ error: err.message || 'Erro ao excluir pasta.' });
  }
});

// Adicionar múltiplos papéis de parede em lote (Batch Upload)
app.post('/api/wallpapers/items/batch', (req, res) => {
  try {
    const { items: batchItems, folderId: defaultFolderId } = req.body;

    if (!Array.isArray(batchItems) || batchItems.length === 0) {
      return res.status(400).json({ error: 'Nenhum item fornecido para upload em lote.' });
    }

    const data = getWallpapersData();
    const wallpapersDir = path.join(process.cwd(), 'public', 'wallpapers');
    if (!fs.existsSync(wallpapersDir)) {
      fs.mkdirSync(wallpapersDir, { recursive: true });
    }

    const newlyAddedItems: any[] = [];

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      const title = (item.title || `Fundo ${Date.now()}-${i + 1}`).trim();
      let finalUrl = item.url ? item.url.trim() : '';

      if (item.base64Data) {
        // Usa o base64 diretamente como Data URL para garantir 100% de persistência no JSON e Vercel
        finalUrl = item.base64Data;
        try {
          const match = item.base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (match) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const buffer = Buffer.from(match[2], 'base64');
            const cleanName = (item.fileName || title || 'wallpaper').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
            const savedFileName = `${Date.now()}-${i}-${cleanName}.${ext}`;
            const savePath = path.join(wallpapersDir, savedFileName);
            fs.writeFileSync(savePath, buffer);
          }
        } catch {
          // Ignora se o disco for somente leitura em serverless
        }
      }

      if (finalUrl) {
        const newItem = {
          id: `wp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          title: title,
          url: finalUrl,
          thumbnailUrl: finalUrl,
          folderId: item.folderId || defaultFolderId || (data.folders[0]?.id || 'corporativo'),
          recommendedTheme: item.recommendedTheme || 'personalizado',
          createdAt: new Date().toISOString(),
        };
        data.items.unshift(newItem);
        newlyAddedItems.push(newItem);
      }
    }

    writeJson(WALLPAPERS_FILE, data);
    return res.status(201).json({ success: true, addedCount: newlyAddedItems.length, items: data.items, newItems: newlyAddedItems });
  } catch (err: any) {
    console.error('Erro ao adicionar fundos em lote:', err);
    return res.status(500).json({ error: err.message || 'Erro ao adicionar fundos em lote.' });
  }
});

// Adicionar novo papel de parede / fundo (Master) - via URL ou Upload Base64 no public/wallpapers
app.post('/api/wallpapers/items', (req, res) => {
  try {
    const { title, url, base64Data, fileName, folderId, recommendedTheme } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Título do fundo é obrigatório.' });
    }

    let finalUrl = url ? url.trim() : '';

    // Se foi enviado arquivo base64, usa como Data URL para persistência garantida no JSON/Vercel
    if (base64Data) {
      finalUrl = base64Data;
      try {
        const match = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          const buffer = Buffer.from(match[2], 'base64');
          const cleanName = (fileName || 'wallpaper').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
          const savedFileName = `${Date.now()}-${cleanName}.${ext}`;
          const wallpapersDir = path.join(process.cwd(), 'public', 'wallpapers');
          if (!fs.existsSync(wallpapersDir)) {
            fs.mkdirSync(wallpapersDir, { recursive: true });
          }
          const savePath = path.join(wallpapersDir, savedFileName);
          fs.writeFileSync(savePath, buffer);
        }
      } catch {
        // Ignora se o disco for somente leitura
      }
    }

    if (!finalUrl) {
      return res.status(400).json({ error: 'Informe a URL da imagem (ou envie um arquivo).' });
    }

    const data = getWallpapersData();
    const newItem = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      url: finalUrl,
      thumbnailUrl: finalUrl,
      folderId: folderId || (data.folders[0]?.id || 'corporativo'),
      recommendedTheme: recommendedTheme || 'personalizado',
      createdAt: new Date().toISOString(),
    };

    data.items.unshift(newItem);
    writeJson(WALLPAPERS_FILE, data);
    return res.status(201).json({ success: true, item: newItem, items: data.items });
  } catch (err: any) {
    console.error('Erro ao adicionar fundo:', err);
    return res.status(500).json({ error: err.message || 'Erro ao adicionar fundo.' });
  }
});

// Excluir papel de parede da biblioteca (Master)
app.delete('/api/wallpapers/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = getWallpapersData();
    const item = data.items.find((i: any) => i.id === id);
    if (item && item.url.startsWith('/wallpapers/')) {
      const localFilePath = path.join(process.cwd(), 'public', item.url);
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) {}
      }
    }
    data.items = data.items.filter((i: any) => i.id !== id);
    writeJson(WALLPAPERS_FILE, data);
    return res.json({ success: true, items: data.items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao excluir fundo.' });
  }
});

// ----------------------------------------------------
// FORMULÁRIO SIMPLIFICADO DE CAPTAÇÃO (VENDEDORAS & CLIENTES)
// ----------------------------------------------------
function getOnboardingForms(): any[] {
  const existing = readJson<any[]>(ONBOARDING_FORMS_FILE, null);
  if (!existing) {
    // Exemplo de demonstração inicial para o Master visualizar
    const demoForms = [
      {
        id: 'form-demo-1',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'pendente',
        salesRepName: 'Carla Silveira',
        salesRepPhone: '(15) 99888-1234',
        fullName: 'Dra. Mariana Vasconcelos',
        jobTitle: 'Médica Dermatologista & Estética Avançada',
        companyName: 'Clínica Vasconcelos Pele & Bem-Estar',
        whatsappPhone: '(15) 99765-4321',
        secondaryPhone: '(15) 3232-1000',
        email: 'contato@clinicavasconcelos.com.br',
        city: 'Sorocaba',
        state: 'SP',
        fullAddress: 'Av. Antonio Carlos Comitre, 1200 - Sala 84 - Campolim',
        summaryBio: 'Dermatologia clínica, cirúrgica e procedimentos estéticos de alta tecnologia. Cuidando da saúde e da harmonia da sua pele.',
        photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
        logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=400&q=80',
        instagramHandle: '@dra.marianavasconcelos',
        websiteUrl: 'https://clinicavasconcelos.com.br',
        customLinkName: 'Agendamento Online via WhatsApp',
        customLinkUrl: 'https://wa.me/5515997654321',
        pixKey: 'contato@clinicavasconcelos.com.br',
        pixType: 'email',
        pixBeneficiary: 'Mariana Vasconcelos Sociedade Médica',
        preferredTheme: 'ouro_luxo',
        notes: 'Gostaria de tons dourados e preto sóbrio para passar sensação de luxo e sofisticação.',
      },
      {
        id: 'form-demo-2',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        status: 'pendente',
        salesRepName: 'Juliana Mendes',
        salesRepPhone: '(15) 99123-5566',
        fullName: 'Roberto Albuquerque',
        jobTitle: 'Consultor Imobiliário de Alto Padrão',
        companyName: 'Albuquerque Private Properties',
        whatsappPhone: '(11) 98765-4321',
        email: 'roberto@albuquerqueproperties.com',
        city: 'São Paulo',
        state: 'SP',
        fullAddress: 'Rua Oscar Freire, 950 - Jardins',
        summaryBio: 'Especialista em compra, venda e investimentos em imóveis de luxo nos Jardins, Itaim Bibi e Fazenda Boa Vista.',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        instagramHandle: '@roberto.luxurybroker',
        websiteUrl: 'https://albuquerqueproperties.com',
        customLinkName: 'Catálogo de Imóveis Exclusivos',
        customLinkUrl: 'https://albuquerqueproperties.com/catalogo',
        pixKey: '11987654321',
        pixType: 'telefone',
        pixBeneficiary: 'Roberto Albuquerque',
        preferredTheme: 'azul_corporativo',
        notes: 'Por favor incluir botão de chamada direta para o WhatsApp e vCard completo.',
      },
    ];
    writeJson(ONBOARDING_FORMS_FILE, demoForms);
    return demoForms;
  }
  return existing;
}

// Listar todos os formulários recebidos
app.get('/api/onboarding-forms', (req, res) => {
  const forms = getOnboardingForms();
  const sorted = [...forms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sorted);
});

// Salvar um novo formulário de onboarding (Público / Vendedora / Cliente)
app.post('/api/onboarding-forms', (req, res) => {
  try {
    const body = req.body || {};
    if (!body.fullName || !body.whatsappPhone) {
      return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios.' });
    }

    const forms = getOnboardingForms();
    const uploadsDir = path.join(process.cwd(), 'public', 'wallpapers');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let photoUrl = body.photoUrl || '';
    if (photoUrl && photoUrl.startsWith('data:image/')) {
      const match = photoUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const filename = `avatar-form-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
        photoUrl = `/wallpapers/${filename}`;
      }
    }

    let logoUrl = body.logoUrl || '';
    if (logoUrl && logoUrl.startsWith('data:image/')) {
      const match = logoUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const filename = `logo-form-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
        logoUrl = `/wallpapers/${filename}`;
      }
    }

    const newForm = {
      id: `form-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pendente',
      salesRepName: body.salesRepName ? String(body.salesRepName).trim() : '',
      salesRepPhone: body.salesRepPhone ? String(body.salesRepPhone).trim() : '',
      fullName: String(body.fullName).trim(),
      jobTitle: String(body.jobTitle || '').trim(),
      companyName: String(body.companyName || '').trim(),
      whatsappPhone: String(body.whatsappPhone).trim(),
      secondaryPhone: String(body.secondaryPhone || '').trim(),
      email: String(body.email || '').trim(),
      city: String(body.city || '').trim(),
      state: String(body.state || '').trim(),
      fullAddress: String(body.fullAddress || '').trim(),
      summaryBio: String(body.summaryBio || '').trim(),
      photoUrl,
      logoUrl,
      contentBackgroundUrl: String(body.contentBackgroundUrl || '').trim(),
      instagramHandle: String(body.instagramHandle || '').trim(),
      websiteUrl: String(body.websiteUrl || '').trim(),
      linkedinUrl: String(body.linkedinUrl || '').trim(),
      facebookUrl: String(body.facebookUrl || '').trim(),
      youtubeUrl: String(body.youtubeUrl || '').trim(),
      tiktokUrl: String(body.tiktokUrl || '').trim(),
      customLinkName: String(body.customLinkName || '').trim(),
      customLinkUrl: String(body.customLinkUrl || '').trim(),
      pixKey: String(body.pixKey || '').trim(),
      pixType: body.pixType || 'chave_aleatoria',
      pixBeneficiary: String(body.pixBeneficiary || '').trim(),
      preferredTheme: body.preferredTheme || 'azul_corporativo',
      notes: String(body.notes || '').trim(),
    };

    forms.unshift(newForm);
    writeJson(ONBOARDING_FORMS_FILE, forms);

    return res.status(201).json({
      success: true,
      message: 'Formulário enviado com sucesso!',
      form: newForm,
    });
  } catch (err: any) {
    console.error('Erro ao salvar formulário de onboarding:', err);
    return res.status(500).json({ error: err.message || 'Erro ao processar formulário.' });
  }
});

// Atualizar status / dados do formulário
app.patch('/api/onboarding-forms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const forms = getOnboardingForms();
    const index = forms.findIndex((f) => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }

    const { syncToCard, ...updates } = req.body;

    forms[index] = {
      ...forms[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeJson(ONBOARDING_FORMS_FILE, forms);

    // Se solicitado sincronizar com o cartão gerado ou se o cartão já foi criado
    let cardUpdated = null;
    if (syncToCard && (forms[index].generatedCardId || forms[index].generatedCardSlug)) {
      const cards = readJson<any[]>(CARDS_FILE, []);
      const cardIdx = cards.findIndex(
        (c) => c.id === forms[index].generatedCardId || c.slug === forms[index].generatedCardSlug
      );
      if (cardIdx !== -1) {
        if (updates.photoUrl !== undefined) {
          cards[cardIdx].imageUrl = updates.photoUrl;
        }
        if (updates.logoUrl !== undefined) {
          cards[cardIdx].companyLogoUrl = updates.logoUrl;
          if (updates.logoUrl) {
            cards[cardIdx].qrCodeIncludeLogo = true;
          }
        }
        if (updates.fullName !== undefined) {
          cards[cardIdx].name = updates.fullName;
        }
        if (updates.companyName !== undefined) {
          cards[cardIdx].brandName = updates.companyName;
        }
        cards[cardIdx].updatedAt = new Date().toISOString();
        writeJson(CARDS_FILE, cards);
        notifyCardUpdate(cards[cardIdx], 'updated');
        cardUpdated = cards[cardIdx];
      }
    }

    return res.json({ success: true, form: forms[index], card: cardUpdated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao atualizar formulário.' });
  }
});

// Sincronizar imagens ou dados tratados do formulário de volta para o Cartão Digital gerado
app.post('/api/onboarding-forms/:id/sync-to-card', (req, res) => {
  try {
    const { id } = req.params;
    const forms = getOnboardingForms();
    const form = forms.find((f) => f.id === id);
    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }

    if (!form.generatedCardId && !form.generatedCardSlug) {
      return res.status(400).json({ error: 'Este formulário ainda não possui um Cartão Digital gerado. Clique em "Gerar Cartão" primeiro.' });
    }

    const cards = readJson<any[]>(CARDS_FILE, []);
    const cardIdx = cards.findIndex(
      (c) => c.id === form.generatedCardId || c.slug === form.generatedCardSlug
    );

    if (cardIdx === -1) {
      return res.status(404).json({ error: 'O Cartão Digital correspondente não foi encontrado no sistema.' });
    }

    const { photoUrl, logoUrl } = req.body;
    const newPhoto = photoUrl !== undefined ? photoUrl : form.photoUrl;
    const newLogo = logoUrl !== undefined ? logoUrl : form.logoUrl;

    if (newPhoto !== undefined) {
      cards[cardIdx].imageUrl = newPhoto;
    }
    if (newLogo !== undefined) {
      cards[cardIdx].companyLogoUrl = newLogo;
      if (newLogo) {
        cards[cardIdx].qrCodeIncludeLogo = true;
      }
    }

    cards[cardIdx].updatedAt = new Date().toISOString();
    writeJson(CARDS_FILE, cards);
    notifyCardUpdate(cards[cardIdx], 'updated');

    // Atualiza também no formulário
    const formIdx = forms.findIndex((f) => f.id === id);
    if (formIdx !== -1) {
      if (newPhoto !== undefined) forms[formIdx].photoUrl = newPhoto;
      if (newLogo !== undefined) forms[formIdx].logoUrl = newLogo;
      forms[formIdx].updatedAt = new Date().toISOString();
      writeJson(ONBOARDING_FORMS_FILE, forms);
    }

    return res.json({
      success: true,
      message: 'Imagens e dados sincronizados com o Cartão Digital com sucesso!',
      card: cards[cardIdx],
      form: forms[formIdx],
    });
  } catch (err: any) {
    console.error('Erro ao sincronizar dados com o cartão:', err);
    return res.status(500).json({ error: err.message || 'Erro ao sincronizar com o cartão.' });
  }
});

// Excluir formulário de onboarding
app.delete('/api/onboarding-forms/:id', (req, res) => {
  try {
    const { id } = req.params;
    let forms = getOnboardingForms();
    forms = forms.filter((f) => f.id !== id);
    writeJson(ONBOARDING_FORMS_FILE, forms);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao excluir formulário.' });
  }
});

// ⚡ GERAR CARTÃO INSTANTÂNEO COM 1-CLIQUE A PARTIR DO FORMULÁRIO DO CLIENTE
app.post('/api/onboarding-forms/:id/convert-to-card', (req, res) => {
  try {
    const { id } = req.params;
    const forms = getOnboardingForms();
    const form = forms.find((f) => f.id === id);
    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }

    const cards = readJson<any[]>(CARDS_FILE, []);

    // Gera um slug elegante e único a partir do nome
    const cleanName = (form.fullName || 'cliente')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = cleanName;
    let counter = 1;
    while (cards.some((c) => c.slug === slug)) {
      counter++;
      slug = `${cleanName}-${counter}`;
    }

    // Configuração de temas visuais conforme preferência
    let backgroundColor = '#12375B';
    let buttonColor = '#1A7FBE';
    let bodyColor = '#EAF1F7';
    let contentColor = '#FFFFFF';
    let qrFgColor = '#12375B';
    let aiAgentBtnColor = '#0284c7';

    switch (form.preferredTheme) {
      case 'ouro_luxo':
        backgroundColor = '#18181B';
        buttonColor = '#D97706';
        bodyColor = '#09090B';
        contentColor = '#27272A';
        qrFgColor = '#D97706';
        aiAgentBtnColor = '#B45309';
        break;
      case 'esmeralda':
        backgroundColor = '#064E3B';
        buttonColor = '#059669';
        bodyColor = '#ECFDF5';
        contentColor = '#FFFFFF';
        qrFgColor = '#064E3B';
        aiAgentBtnColor = '#047857';
        break;
      case 'roxo_criativo':
        backgroundColor = '#4C1D95';
        buttonColor = '#7C3AED';
        bodyColor = '#F5F3FF';
        contentColor = '#FFFFFF';
        qrFgColor = '#4C1D95';
        aiAgentBtnColor = '#6D28D9';
        break;
      case 'vermelho_elegante':
        backgroundColor = '#881337';
        buttonColor = '#BE123C';
        bodyColor = '#FFF1F2';
        contentColor = '#FFFFFF';
        qrFgColor = '#881337';
        aiAgentBtnColor = '#9F1239';
        break;
      case 'rosa_moderno':
        backgroundColor = '#831843';
        buttonColor = '#DB2777';
        bodyColor = '#FDF2F8';
        contentColor = '#FFFFFF';
        qrFgColor = '#831843';
        aiAgentBtnColor = '#BE185D';
        break;
      case 'preto_minimalista':
        backgroundColor = '#0F172A';
        buttonColor = '#334155';
        bodyColor = '#020617';
        contentColor = '#1E293B';
        qrFgColor = '#0F172A';
        aiAgentBtnColor = '#475569';
        break;
      case 'azul_corporativo':
      default:
        backgroundColor = '#12375B';
        buttonColor = '#1A7FBE';
        bodyColor = '#EAF1F7';
        contentColor = '#FFFFFF';
        qrFgColor = '#12375B';
        aiAgentBtnColor = '#0284c7';
        break;
    }

    const newCard = {
      id: Date.now(),
      userId: 1,
      slug,
      name: form.fullName,
      jobTitle: form.jobTitle,
      brandName: form.companyName || form.fullName,
      phone: form.secondaryPhone || form.whatsappPhone,
      whatsappPhone: form.whatsappPhone,
      email: form.email,
      websiteUrl: form.websiteUrl || (form.customLinkUrl && form.customLinkUrl.startsWith('http') ? form.customLinkUrl : ''),
      address: form.fullAddress || '',
      city: form.city || '',
      state: form.state || '',
      country: 'Brasil',
      summary: form.summaryBio || `${form.jobTitle || 'Profissional'} na ${form.companyName || 'Átomos Infinity'}.`,
      instagramUrl: form.instagramHandle
        ? form.instagramHandle.startsWith('http')
          ? form.instagramHandle
          : `https://instagram.com/${form.instagramHandle.replace('@', '').trim()}`
        : '',
      linkedinUrl: form.linkedinUrl || '',
      facebookUrl: form.facebookUrl || '',
      youtubeUrl: form.youtubeUrl || '',
      
      // Chave PIX e dados de pagamento configurados
      ctaLabel: form.customLinkName || 'Falar no WhatsApp',
      ctaUrl: form.customLinkUrl || (form.whatsappPhone ? `https://wa.me/55${form.whatsappPhone.replace(/\D/g, '')}` : ''),
      footerText: `© ${new Date().getFullYear()} ${form.companyName || form.fullName}. Todos os direitos reservados.`,

      // Cores e estilo gerados
      appearanceTheme: form.preferredTheme || 'azul_corporativo',
      backgroundColor,
      headerOpacity: 100,
      buttonColor,
      bodyColor,
      contentColor,
      contentOpacity: 100,
      supportTextColor: '',
      summaryTextColor: '',
      qrCodeTextColor: '',
      qrCodeSectionBgColor: '',
      fontFamily: 'sans',

      // Assets
      imageUrl: form.photoUrl || '',
      companyLogoUrl: form.logoUrl || '',
      contentBackgroundImageUrl: form.contentBackgroundUrl || '',
      frameScale: 97,

      // QR Code
      qrCodeStyle: 'arredondado',
      qrCodeForegroundColor: qrFgColor,
      qrCodeBackgroundColor: '#FFFFFF',
      qrCodeFrameStyle: 'none',
      qrCodeFrameText: 'SCAN ME',
      qrCodeIncludeLogo: Boolean(form.logoUrl),

      // IA e PWA
      siteAiAgentEnabled: true,
      aiAgentUrl: form.whatsappPhone ? `https://wa.me/55${form.whatsappPhone.replace(/\D/g, '')}` : '',
      aiAgentButtonText: 'Falar com Atendente Virtual',
      aiAgentButtonColor: aiAgentBtnColor,
      aiAgentGlowEnabled: true,
      aiAgentGlowIntensity: 'medio',
      mobileAppName: form.companyName || form.fullName,

      // Gestão de Vencimento e Contato
      billingCustomerName: form.fullName,
      billingCustomerPhone: form.whatsappPhone,
      billingPixKey: form.pixKey || '',
      billingNotes: `Cadastrado via Formulário de Coleta de Clientes.\nVendedora responsável: ${form.salesRepName || 'Direto'} (${form.salesRepPhone || '-'}).\nNotas do cliente: ${form.notes || '-'}`,
      billingCycle: 'degustacao',
      billingDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

      status: 'ativo',
      inquiryEnabled: true,
      trackingEnabled: true,
      activityTrackingEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cards.push(newCard);
    writeJson(CARDS_FILE, cards);
    notifyCardUpdate(newCard, 'created');

    // Atualiza o formulário marcando como convertido
    const formIndex = forms.findIndex((f) => f.id === id);
    if (formIndex !== -1) {
      forms[formIndex].status = 'convertido';
      forms[formIndex].generatedCardId = newCard.id;
      forms[formIndex].generatedCardSlug = newCard.slug;
      forms[formIndex].convertedAt = new Date().toISOString();
      forms[formIndex].updatedAt = new Date().toISOString();
      writeJson(ONBOARDING_FORMS_FILE, forms);
    }

    return res.status(201).json({
      success: true,
      message: `Cartão de ${newCard.name} gerado com sucesso!`,
      card: newCard,
      form: forms[formIndex] || form,
    });
  } catch (err: any) {
    console.error('Erro ao converter formulário em cartão:', err);
    return res.status(500).json({ error: err.message || 'Erro ao gerar cartão.' });
  }
});

// Servir arquivos estáticos do diretório public e da galeria de wallpapers com prioridade máxima
const publicDir = path.join(process.cwd(), 'public');
const publicWallpapersDir = path.join(publicDir, 'wallpapers');
if (!fs.existsSync(publicWallpapersDir)) {
  fs.mkdirSync(publicWallpapersDir, { recursive: true });
}

// Rota explícita para entregar imagens da biblioteca com MIME type correto e sem cair no Vite SPA
app.get('/wallpapers/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(publicWallpapersDir, filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send('Imagem não encontrada na biblioteca.');
});

app.use('/wallpapers', express.static(publicWallpapersDir, {
  maxAge: '7d',
  immutable: true,
}));

app.use(express.static(publicDir));

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
