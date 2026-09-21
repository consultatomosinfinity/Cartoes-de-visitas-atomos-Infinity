import React, { useEffect, useState } from 'react';
import {
  Download,
  Share2,
  Bot,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Globe,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Star,
  Clock,
} from 'lucide-react';
import { DigitalCard } from '../types.ts';
import { initSupabase, mapDbToDigitalCard } from '../lib/supabase.ts';
import { parseAiAgentInput, getAiAgentButtonGlowClass, getAiAgentButtonPaddingY } from '../../shared/digital-card-ai-agent.ts';
import { getContrastTextColor, isConfiguredLink, hexToRgba, getCardContentContrastColors, isNeumorphismTheme, getNeumorphicCardStyles, isGlassmorphismTheme, getGlassmorphicCardStyles } from '../../shared/digital-card-appearance.ts';
import { downloadVCard } from '../../shared/digital-card-vcf.ts';
import { DigitalCardDualPorthole } from '../components/DigitalCardDualPorthole.tsx';
import { DigitalCardQrCode } from '../components/DigitalCardQrCode.tsx';
import { DigitalCardPwaInstall } from '../components/DigitalCardPwaInstall.tsx';
import { AiAgentModal } from '../components/AiAgentModal.tsx';
import { PixPaymentModal } from '../components/PixPaymentModal.tsx';
import { PixIcon } from '../components/PixIcon.tsx';
import { formatPixKeyForDisplay } from '../utils/pix.ts';
import { buildWhatsAppUrl, sanitizeWhatsAppText } from '../utils/whatsapp.ts';

// Utilitários para URLs diretas (dispensam redirecionamento intermediário do servidor e evitam erro de cartão não encontrado)
const getWhatsAppDirectUrl = (phone?: string | null): string => {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return '#';
  if (!cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
    cleanPhone = `55${cleanPhone}`;
  }
  return `https://wa.me/${cleanPhone}`;
};

const getExternalDirectUrl = (url?: string | null): string => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const getMapsDirectUrl = (cardData: DigitalCard): string => {
  if (cardData.googleMapsUrl && cardData.googleMapsUrl.trim()) {
    return getExternalDirectUrl(cardData.googleMapsUrl);
  }
  const parts = [
    cardData.address,
    cardData.addressNumber,
    cardData.city,
    cardData.state,
    cardData.country,
  ].filter(Boolean);
  if (parts.length > 0) {
    return `https://maps.google.com/?q=${encodeURIComponent(parts.join(', '))}`;
  }
  return '#';
};

const getGoogleReviewDirectUrl = (cardData: DigitalCard): string => {
  if (cardData.googleReviewUrl && cardData.googleReviewUrl.trim()) {
    return getExternalDirectUrl(cardData.googleReviewUrl);
  }
  return '#';
};

const getFooterTargetUrl = (url?: string | null): string => {
  if (!url) return 'https://consultatomosinfinity.com.br';
  const trimmed = url.trim();
  if (!trimmed) return 'https://consultatomosinfinity.com.br';
  if (trimmed.startsWith('/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const getInstagramDirectUrl = (url?: string | null): string => {
  if (!url) return '#';
  let trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('@')) trimmed = trimmed.substring(1);
  if (trimmed.startsWith('instagram.com/')) return `https://${trimmed}`;
  return `https://instagram.com/${trimmed}`;
};

const getLinkedinDirectUrl = (url?: string | null): string => {
  if (!url) return '#';
  let trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('linkedin.com/')) return `https://${trimmed}`;
  if (trimmed.startsWith('in/')) return `https://linkedin.com/${trimmed}`;
  return `https://linkedin.com/in/${trimmed}`;
};

const getFacebookDirectUrl = (url?: string | null): string => {
  if (!url) return '#';
  let trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('facebook.com/')) return `https://${trimmed}`;
  return `https://facebook.com/${trimmed}`;
};

const getYoutubeDirectUrl = (url?: string | null): string => {
  if (!url) return '#';
  let trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('youtube.com/') || trimmed.startsWith('youtu.be/')) return `https://${trimmed}`;
  if (trimmed.startsWith('@')) return `https://youtube.com/${trimmed}`;
  return `https://youtube.com/@${trimmed}`;
};

interface DigitalCardPublicProps {
  slug: string;
}

export const DigitalCardPublic: React.FC<DigitalCardPublicProps> = ({ slug }) => {
  // Inicialização imediata com dados pré-sincronizados do editor para auto-ajuste instantâneo (<1ms)
  const getInitialSyncedCard = (): DigitalCard | null => {
    try {
      const syncedRaw = localStorage.getItem('digital_card_synced');
      if (syncedRaw) {
        const synced = JSON.parse(syncedRaw);
        if (synced?.slug === slug && synced?.card) {
          return synced.card;
        }
      }
      const raw = localStorage.getItem('atomos_digital_cards');
      if (raw) {
        const list = JSON.parse(raw);
        const found = list.find((c: any) => c.slug === slug);
        if (found) return found;
      }
      const landingRaw = localStorage.getItem('atomos_landing_card');
      if (landingRaw) {
        const landing = JSON.parse(landingRaw);
        if (landing?.slug === slug) return landing;
      }
    } catch {}
    return null;
  };

  const initialSynced = getInitialSyncedCard();
  const [card, setCard] = useState<DigitalCard | null>(initialSynced);
  const [status, setStatus] = useState<'loading' | 'ativo' | 'pausado' | 'error'>(
    initialSynced ? (initialSynced.status === 'ativo' ? 'ativo' : 'pausado') : 'loading'
  );
  const [aiAgentModalOpen, setAiAgentModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);

  // Formulário de primeiro contato
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryConsent, setInquiryConsent] = useState(false);
  const [honeypotWebsite, setHoneypotWebsite] = useState(''); // Anti-spam
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Configurações globais do sistema (Master)
  const [systemSettings, setSystemSettings] = useState<{ footerLinkClickable?: boolean; footerLinkUrl?: string } | null>(() => {
    try {
      const cached = localStorage.getItem('atomos_system_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetch('/api/system-settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSystemSettings(data);
          try {
            localStorage.setItem('atomos_system_settings', JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Atualiza em tempo real as configurações visuais e meta-informações do cartão
  const applyCardData = (data: DigitalCard | null, newStatus: 'ativo' | 'pausado') => {
    if (newStatus === 'ativo' && data) {
      setCard(data);
      setStatus('ativo');

      // Título dinâmico da página
      const appOrName = data.mobileAppName || (data.brandName ? `${data.name} | ${data.brandName}` : data.name);
      document.title = appOrName;

      // Favicon e Ícone de Instalação do Cartão:
      // O Logo da Empresa serve como favicon do cartão gerado e é modificado de acordo com a Imagem do Ícone de Instalação carregada
      const cardFavicon = data.mobileIconUrl || data.companyLogoUrl || data.imageUrl || '/icon-192.png';

      // Atualiza dinamicamente o favicon na aba do navegador
      let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = cardFavicon;

      let shortcutLink = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
      if (!shortcutLink) {
        shortcutLink = document.createElement('link');
        shortcutLink.rel = 'shortcut icon';
        document.head.appendChild(shortcutLink);
      }
      shortcutLink.href = cardFavicon;

      // Atualiza ícone móvel (iOS Apple Touch Icon e atalhos)
      let appleIconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (!appleIconLink) {
        appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleIconLink);
      }
      appleIconLink.href = cardFavicon;

      // Atualiza manifesto PWA dinâmico por slug
      let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = `/cartao/${data.slug}/manifest.json?_t=${Date.now()}`;
    } else {
      setStatus('pausado');
      document.title = 'Cartão Indisponível';
    }
  };

  const loadCard = async (recordEvent = false) => {
    try {
      // 0. Verifica se temos cartão sincronizado recente no localStorage do editor para auto-ajuste imediato
      let localSyncedCard: DigitalCard | null = null;
      let localTimestamp = 0;
      try {
        const syncedRaw = localStorage.getItem('digital_card_synced');
        if (syncedRaw) {
          const synced = JSON.parse(syncedRaw);
          if (synced?.slug === slug && synced?.card) {
            localSyncedCard = synced.card;
            localTimestamp = synced.timestamp || 0;
          }
        }
      } catch {}

      if (localSyncedCard && localSyncedCard.status === 'ativo') {
        applyCardData(localSyncedCard, 'ativo');
      }

      // 1. Tenta carregar diretamente do banco Supabase (Fonte Canônica)
      try {
        const client = await initSupabase();
        if (client) {
          const { data, error } = await client
            .from('digital_cards')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

          if (!error && data) {
            const cardData = mapDbToDigitalCard(data);
            if (cardData.status === 'ativo') {
              applyCardData(cardData, 'ativo');

              if (recordEvent && cardData.id) {
                const params = new URLSearchParams(window.location.search);
                const isQr = params.get('src') === 'qr';
                const eventKind = isQr ? 'qr_open' : 'card_open';
                try {
                  void client.from('digital_card_events').insert([{
                    card_id: cardData.id,
                    kind: eventKind,
                  }]);
                } catch {}
              }
              return;
            } else {
              applyCardData(null, 'pausado');
              return;
            }
          }
        }
      } catch (sbErr) {
        console.warn('Busca no Supabase não obteve resultado, tentando canais alternativos:', sbErr);
      }

      // 2. Tenta API backend Express (/api/cards/slug/:slug)
      try {
        const res = await fetch(`/api/cards/slug/${encodeURIComponent(slug)}?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const json = await res.json();
            if (json?.data) {
              if (json?.status === 'ativo') {
                applyCardData(json.data, 'ativo');

                if (recordEvent) {
                  const params = new URLSearchParams(window.location.search);
                  const isQr = params.get('src') === 'qr';
                  const eventKind = isQr ? 'qr_open' : 'card_open';

                  fetch(`/api/cards/${encodeURIComponent(slug)}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kind: eventKind }),
                  }).catch(() => {});
                }
                return;
              } else if (json?.status === 'pausado') {
                applyCardData(null, 'pausado');
                return;
              }
            }
          }
        }
      } catch (apiErr) {
        // Silencioso em caso de erro na API Express
      }

      // 3. Fallback: Verifica sincronização recente no localStorage ('digital_card_synced')
      try {
        const syncedRaw = localStorage.getItem('digital_card_synced');
        if (syncedRaw) {
          const synced = JSON.parse(syncedRaw);
          if (synced?.slug === slug && synced.card) {
            if (synced.card.status === 'ativo') {
              applyCardData(synced.card, 'ativo');
              return;
            } else {
              applyCardData(null, 'pausado');
              return;
            }
          }
        }
      } catch {}

      // 4. Fallback: Verifica lista local no localStorage ('atomos_digital_cards')
      try {
        const localCardsRaw = localStorage.getItem('atomos_digital_cards');
        if (localCardsRaw) {
          const localCards = JSON.parse(localCardsRaw);
          const foundLocal = localCards.find((c: any) => c.slug === slug);
          if (foundLocal) {
            if (foundLocal.status === 'ativo') {
              applyCardData(foundLocal, 'ativo');
              return;
            } else {
              applyCardData(null, 'pausado');
              return;
            }
          }
        }
      } catch {}

      // 5. Se já possuímos um cartão ativo em memória, não desative por falha temporária
      setCard((prev) => {
        if (!prev) {
          applyCardData(null, 'pausado');
        }
        return prev;
      });
    } catch (err) {
      console.error('Erro ao buscar cartão:', err);
      setCard((prev) => {
        if (!prev) {
          setStatus('error');
        }
        return prev;
      });
    }
  };

  // Carregamento inicial e sincronização em tempo real (Auto-Ajuste multi-canal)
  useEffect(() => {
    // 1. Carga inicial
    loadCard(true);

    // 2. BroadcastChannel: Notificação instantânea entre abas (< 5ms)
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('digital_cards_sync');
        broadcastChannel.onmessage = (event) => {
          if (event.data?.slug === slug) {
            if (event.data.card) {
              if (event.data.card.status === 'ativo') {
                applyCardData(event.data.card, 'ativo');
              } else {
                applyCardData(null, 'pausado');
              }
            } else {
              loadCard(false);
            }
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel indisponível:', err);
      }
    }

    // 3. Storage Event: Sincronização entre abas e janelas do mesmo domínio
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'digital_card_synced' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.slug === slug) {
            if (payload.card) {
              if (payload.card.status === 'ativo') {
                applyCardData(payload.card, 'ativo');
              } else {
                applyCardData(null, 'pausado');
              }
            } else {
              loadCard(false);
            }
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Message Event: Comunicação direta de janela aberta pelo editor (window.opener / postMessage)
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CARD_UPDATED' && event.data?.slug === slug) {
        if (event.data?.card) {
          if (event.data.card.status === 'ativo') {
            applyCardData(event.data.card, 'ativo');
          } else {
            applyCardData(null, 'pausado');
          }
        }
      }
    };
    window.addEventListener('message', handleWindowMessage);

    // 5. Server-Sent Events (SSE): Atualização remota em tempo real
    let eventSource: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource(`/api/cards/live-updates?slug=${encodeURIComponent(slug)}`);
        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.action === 'updated' || data.action === 'created' || data.action === 'deleted') {
              if (data.slug === slug) {
                if (data.card && data.card.status === 'ativo') {
                  applyCardData(data.card, 'ativo');
                } else {
                  loadCard(false);
                }
              }
            }
          } catch {}
        };
      } catch (err) {
        console.warn('SSE indisponível:', err);
      }
    }

    // 6. Auto-ajuste imediato ao focar ou alternar para esta aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCard(false);
      }
    };
    const handleWindowFocus = () => {
      loadCard(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleWindowMessage);
      if (eventSource) {
        eventSource.close();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);

      // Restaura o favicon e título padrão ao sair do cartão
      const defaultIcon = '/icon-192.png';
      const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (iconLink) iconLink.href = defaultIcon;
      const shortcutLink = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
      if (shortcutLink) shortcutLink.href = defaultIcon;
    };
  }, [slug]);

  // Controle de exibição do Agente IA do site (body.card-hide-site-agent)
  useEffect(() => {
    if (card && !card.siteAiAgentEnabled) {
      document.body.classList.add('card-hide-site-agent');
    } else {
      document.body.classList.remove('card-hide-site-agent');
    }
    return () => {
      document.body.classList.remove('card-hide-site-agent');
    };
  }, [card]);

  // Registro do Service Worker para PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/card-sw.js', { scope: '/cartao/' }).catch(() => {});
    }
  }, []);

  // Handler de primeiro contato
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError(null);
    setInquirySuccess(false);

    if (!inquiryConsent) {
      setInquiryError('É necessário autorizar o contato para enviar a mensagem.');
      return;
    }

    if (!inquiryMessage || inquiryMessage.trim().length < 10) {
      setInquiryError('Por favor, escreva uma mensagem com pelo menos 10 caracteres.');
      return;
    }

    if (!inquiryEmail.trim() && !inquiryPhone.trim()) {
      setInquiryError('Por favor, informe seu e-mail ou WhatsApp para retorno.');
      return;
    }

    setInquirySubmitting(true);
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(slug)}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inquiryName,
          email: inquiryEmail,
          whatsappPhone: inquiryPhone,
          message: inquiryMessage,
          consent: inquiryConsent,
          website: honeypotWebsite, // Honeypot: se preenchido, é bot
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Não foi possível enviar a mensagem.');
      }

      setInquirySuccess(true);
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage('');
      setInquiryConsent(false);
    } catch (err: any) {
      setInquiryError(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  // Se carregando
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Se pausado ou inexistente: Regra de ouro da especificação
  // "Exibir página neutra sem dados pessoais. Ex.: 'Este cartão não está disponível no momento.'"
  if (status === 'pausado' || status === 'error' || !card) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2 font-heading">
            Cartão Indisponível
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Este cartão não está disponível no momento ou foi pausado pelo titular.
          </p>
          <a
            href="/painel/cartoes"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Acessar Painel de Cartões
          </a>
        </div>
      </main>
    );
  }

  // Configuração condicional estrita de controles com base em links/campos configurados
  const hasAiAgent = isConfiguredLink(card.aiAgentUrl);
  const aiAgentInfo = hasAiAgent ? parseAiAgentInput(card.aiAgentUrl) : null;

  // Canais de Contato
  const hasWhatsapp = isConfiguredLink(card.whatsappPhone);
  const hasPhone = isConfiguredLink(card.phone);
  const hasEmail = isConfiguredLink(card.email);
  const hasWebsite = isConfiguredLink(card.websiteUrl);
  const hasLocation = Boolean(
    (card.address && card.address.trim()) ||
    (card.city && card.city.trim()) ||
    isConfiguredLink(card.googleMapsUrl)
  );
  const hasGoogleReview = isConfiguredLink(card.googleReviewUrl);
  const hasPix = Boolean(card.pixKey && card.pixKey.trim());
  const hasBusinessHours = Boolean(card.businessHours && card.businessHours.trim() && !card.hideBusinessHours && card.businessHoursEnabled !== false);
  const hasContacts = hasWhatsapp || hasPhone || hasEmail || hasWebsite || hasLocation || hasGoogleReview || hasPix || hasBusinessHours;

  // Redes Sociais
  const hasInstagram = isConfiguredLink(card.instagramUrl);
  const hasLinkedin = isConfiguredLink(card.linkedinUrl);
  const hasFacebook = isConfiguredLink(card.facebookUrl);
  const hasYoutube = isConfiguredLink(card.youtubeUrl);
  const hasSocial = hasInstagram || hasLinkedin || hasFacebook || hasYoutube;

  // Resumo & CTA
  const hasSummary = Boolean(card.summary && card.summary.trim());
  const hasCta = Boolean(card.ctaLabel && card.ctaLabel.trim() && isConfiguredLink(card.ctaUrl));

  // Compartilhar WhatsApp com link dinâmico + timestamp para quebrar cache
  const timestamp = Date.now();
  const cardPublicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/cartao/${card.slug}?v=${timestamp}`
    : `/cartao/${card.slug}`;
  const whatsappShareText = sanitizeWhatsAppText(`Olá! Acabei de receber o cartão digital de ${card.name}.\nAcesse e salve o contato: ${cardPublicUrl}`);
  const whatsappShareUrl = buildWhatsAppUrl('', whatsappShareText);

  const headerTextColor = getContrastTextColor(card.backgroundColor);
  const actionButtonTextColor = getContrastTextColor(card.buttonColor);

  const isGlass = isGlassmorphismTheme(card.appearanceTheme);
  const isGlassDark = card.appearanceTheme === 'glass_dark';
  const glassStyles = getGlassmorphicCardStyles(isGlassDark);

  // Cores de contraste garantido para a área de conteúdo (formulário, consentimento, rótulos e rodapé)
  const contentContrast = getCardContentContrastColors({
    contentColor: card.contentColor,
    contentOpacity: card.contentOpacity,
    bodyColor: card.bodyColor,
    supportTextColor: card.supportTextColor,
    inquiryTextColor: card.inquiryTextColor,
  });

  // Cores de textos personalizadas por seção para manter legibilidade máxima
  const summaryTextColor = card.summaryTextColor || (contentContrast.isDarkBg ? '#F1F5F9' : (card.supportTextColor || '#475569'));
  const qrTitleColor = card.qrCodeTextColor || (card.qrCodeSectionBgColor ? getContrastTextColor(card.qrCodeSectionBgColor) : (contentContrast.isDarkBg ? '#FFFFFF' : '#1E293B'));
  const qrDescColor = card.qrCodeTextColor ? `${card.qrCodeTextColor}CC` : (card.qrCodeSectionBgColor ? `${getContrastTextColor(card.qrCodeSectionBgColor)}CC` : (contentContrast.isDarkBg ? '#E2E8F0CC' : '#64748B'));

  const getFontFamily = (font: string) => {
    switch (font) {
      case 'serif': return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
      case 'mono': return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
      case 'lato': return '"Lato", sans-serif';
      case 'poppins': return '"Poppins", sans-serif';
      case 'roboto': return '"Roboto", sans-serif';
      default: return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    }
  };

  // Registra clique externo anônimo para métricas sem interromper ou intermediar navegação
  const handleOutboundClick = (destination: string) => {
    if (!card) return;
    try {
      initSupabase().then((client) => {
        if (client && card.id) {
          void client.from('digital_card_events').insert([{
            card_id: card.id,
            kind: 'outbound_click',
            destination,
          }]);
        }
      }).catch(() => {});
    } catch {}

    try {
      fetch(`/api/cards/${encodeURIComponent(card.slug)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'outbound_click', destination }),
      }).catch(() => {});
    } catch {}
  };

  return (
    <main
      id="public-card-container"
      className="min-h-screen py-8 px-4 flex flex-col items-center justify-start card-transition"
      style={{
        backgroundColor: isGlass ? (isGlassDark ? '#090D16' : '#0F172A') : (card.bodyColor || '#EAF1F7'),
        fontFamily: getFontFamily(card.fontFamily || 'sans')
      }}
    >
      {/* Container Principal do Cartão Digital */}
      <div
        className="relative w-full max-w-[400px] sm:max-w-[390px] rounded-[2.5rem] shadow-2xl overflow-hidden card-transition flex flex-col mx-auto transition-all"
        style={{
          backdropFilter: isGlass ? glassStyles.backdropBlur : undefined,
          boxShadow: isGlass ? glassStyles.shadow : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: isGlass ? glassStyles.border : '1px solid rgba(0,0,0,0.05)',
        }}
      >
        {/* CAMADA DE IMAGEM DE FUNDO DO CARTÃO (se configurada - MODO CARTÃO INTEIRO) */}
        {card.contentBackgroundImageUrl && card.contentBackgroundPosition !== 'below_header' && (
          <div
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
            style={{
              opacity: (card.contentBackgroundImageOpacity ?? 100) / 100,
            }}
          >
            <img
              src={card.contentBackgroundImageUrl}
              alt="Fundo do cartão"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain transition-transform"
              style={{
                objectPosition: `${card.contentBackgroundImageFocusX ?? 50}% ${card.contentBackgroundImageFocusY ?? 50}%`,
                transform: `scale(${(card.contentBackgroundImageScale ?? 100) / 100})`,
                transformOrigin: `${card.contentBackgroundImageFocusX ?? 50}% ${card.contentBackgroundImageFocusY ?? 50}%`,
              }}
            />
          </div>
        )}

        {/* CAMADA DE CONTEÚDO DO CARTÃO (com cor, transparência alpha ou vidro) */}
        <div
          className="relative z-10 w-full flex flex-col flex-1 min-h-full transition-all"
          style={{
            backgroundColor: card.contentBackgroundPosition === 'below_header'
              ? 'transparent'
              : (isGlass ? glassStyles.cardBg : hexToRgba(card.contentColor || '#FFFFFF', (card.contentOpacity ?? 100) / 100)),
          }}
        >
          {/* 1. Header do Cartão com Fundo Colorido e Dual-Porthole */}
          {(() => {
            const headerBg = isGlass
              ? (isGlassDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.35)')
              : hexToRgba(card.backgroundColor || '#12375B', (card.headerOpacity ?? 100) / 100);

            return (
              <div
                className="pt-8 pb-6 px-6 text-center relative overflow-hidden transition-all"
                style={{
                  backgroundColor: headerBg,
                  backdropFilter: isGlass ? 'blur(12px)' : undefined,
                  borderBottom: isGlass ? glassStyles.borderSubtle : undefined,
                  color: headerTextColor,
                }}
              >
          {/* Dual Porthole: Foto circular + Logo da empresa */}
          <DigitalCardDualPorthole
            imageUrl={card.imageUrl}
            name={card.name}
            companyLogoUrl={card.companyLogoUrl}
            brandName={card.brandName}
            frameScale={card.frameScale || 97}
            imageFocusX={card.imageFocusX ?? 50}
            imageFocusY={card.imageFocusY ?? 50}
            companyLogoFocusX={card.companyLogoFocusX || 56}
            companyLogoFocusY={card.companyLogoFocusY || 67}
            borderColor={card.contentColor || '#FFFFFF'}
          />

          {/* 2. Nome da Marca / Empresa (h1 obrigatório) */}
          <h1 className="text-xl font-black tracking-tight uppercase font-heading mb-1 drop-shadow-xs">
            {card.brandName || card.name}
          </h1>

          {/* 3. Subtítulo com Nome do Colaborador e Cargo */}
          <p className="text-[15px] font-semibold opacity-95">
            {card.name}
          </p>
          {card.jobTitle && (
            <p className="text-[11px] opacity-80 mt-0.5 tracking-wide uppercase font-bold">
              {card.jobTitle}
            </p>
          )}
              </div>
            );
          })()}

        {/* CORPO DO CARTÃO (Abaixo do Header - A partir da linha da seta) */}
        <div
          className="relative flex-1 flex flex-col transition-all"
          style={{
            backgroundColor: card.contentBackgroundPosition === 'below_header'
              ? (isGlass ? glassStyles.cardBg : hexToRgba(card.contentColor || '#FFFFFF', (card.contentOpacity ?? 100) / 100))
              : undefined,
          }}
        >
          {/* CAMADA DE IMAGEM DE FUNDO - MODO ABAIXO DO HEADER */}
          {card.contentBackgroundImageUrl && card.contentBackgroundPosition === 'below_header' && (
            <div
              className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
              style={{
                opacity: (card.contentBackgroundImageOpacity ?? 100) / 100,
              }}
            >
              <img
                src={card.contentBackgroundImageUrl}
                alt="Fundo do corpo do cartão"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain transition-transform"
                style={{
                  objectPosition: `${card.contentBackgroundImageFocusX ?? 50}% ${card.contentBackgroundImageFocusY ?? 50}%`,
                  transform: `scale(${(card.contentBackgroundImageScale ?? 100) / 100})`,
                  transformOrigin: `${card.contentBackgroundImageFocusX ?? 50}% ${card.contentBackgroundImageFocusY ?? 50}%`,
                }}
              />
            </div>
          )}

          <div className="relative z-10 flex-1 flex flex-col">

        {/* 4. GRUPO DE BOTÕES DE AÇÃO (Ordem Obrigatória) */}
        {(() => {
          const isNeu = isNeumorphismTheme(card.appearanceTheme);
          const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
          const neuStyles = getNeumorphicCardStyles(isNeuDark);

          const globalRadius = card.buttonsBorderRadius ?? 16;
          const vcardRadius = card.vcardButtonBorderRadius ?? globalRadius;
          const whatsappRadius = card.whatsappButtonBorderRadius ?? globalRadius;
          const pwaRadius = card.pwaButtonBorderRadius ?? globalRadius;
          const aiAgentRadius = card.aiAgentButtonBorderRadius ?? globalRadius;

          const vcardBg = card.vcardButtonColor || card.buttonColor || (isNeu ? neuStyles.bg : '#1A7FBE');
          const vcardText = card.vcardButtonTextColor || (isNeu && !card.vcardButtonColor && !card.buttonColor ? neuStyles.textColor : getContrastTextColor(vcardBg));

          const whatsappBg = card.whatsappButtonColor || (isNeu ? neuStyles.bg : '#059669');
          const whatsappText = card.whatsappButtonTextColor || (isNeu && !card.whatsappButtonColor ? (isNeuDark ? '#34D399' : '#059669') : '#FFFFFF');

          const pwaBg = card.pwaButtonColor || (isNeu ? neuStyles.bg : '#0F172A');
          const pwaText = card.pwaButtonTextColor || (isNeu && !card.pwaButtonColor ? neuStyles.textColor : '#FFFFFF');

          const aiAgentBg = card.aiAgentButtonColor || (isNeu ? neuStyles.bg : '#7C3AED');
          const aiAgentText = card.aiAgentButtonTextColor || (isNeu && !card.aiAgentButtonColor ? (isNeuDark ? '#C084FC' : '#7C3AED') : '#FFFFFF');

          return (
            <div className="px-5 pt-3 pb-4 flex flex-col gap-2.5">
              {/* Ação 1: Salvar contato no celular (vCard .vcf) */}
              <button
                type="button"
                onClick={() => downloadVCard(card)}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-5 font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                style={{
                  backgroundColor: vcardBg,
                  color: vcardText,
                  borderRadius: `${vcardRadius}px`,
                  boxShadow: isNeu ? neuStyles.raised : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: isNeu ? neuStyles.border : undefined,
                }}
              >
                <Download size={18} />
                <span>Salvar contato no celular</span>
              </button>

              {/* Ação 2: Compartilhar no WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3 px-5 font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                style={{
                  backgroundColor: whatsappBg,
                  color: whatsappText,
                  borderRadius: `${whatsappRadius}px`,
                  boxShadow: isNeu ? neuStyles.raised : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: isNeu ? neuStyles.border : undefined,
                }}
              >
                <Share2 size={18} />
                <span>Compartilhar no WhatsApp</span>
              </a>

              {/* Ação 3: Instalar App no Celular */}
              <DigitalCardPwaInstall
                appName={card.mobileAppName || (card.brandName ? `${card.name} | ${card.brandName}` : card.name)}
                iconUrl={card.mobileIconUrl || card.companyLogoUrl || card.imageUrl || '/icon-192.png'}
                buttonClassName="w-full flex items-center justify-center gap-2.5 py-3 px-5 font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                style={{
                  backgroundColor: pwaBg,
                  color: pwaText,
                  borderRadius: `${pwaRadius}px`,
                  boxShadow: isNeu ? neuStyles.raised : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: isNeu ? neuStyles.border : undefined,
                }}
              />

              {/* Ação 4: Atendente Virtual (visível SOMENTE se aiAgentUrl configurado) */}
              {aiAgentInfo && (() => {
                const glowClass = getAiAgentButtonGlowClass(card.aiAgentGlowEnabled, card.aiAgentGlowIntensity);
                const paddingY = getAiAgentButtonPaddingY(card.aiAgentButtonSize, card.aiAgentButtonPaddingY);
                const borderWidth = card.aiAgentButtonBorderWidth || 0;
                const borderColor = card.aiAgentButtonBorderColor || '#C084FC';
                return (
                  <button
                    type="button"
                    onClick={() => setAiAgentModalOpen(true)}
                    className={`w-full flex items-center justify-center gap-2.5 px-5 font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden ${glowClass}`}
                    style={{
                      backgroundColor: aiAgentBg,
                      color: aiAgentText,
                      borderRadius: `${aiAgentRadius}px`,
                      paddingTop: `${paddingY}px`,
                      paddingBottom: `${paddingY}px`,
                      boxShadow: isNeu ? neuStyles.raised : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      borderWidth: borderWidth > 0 ? `${borderWidth}px` : (isNeu ? '1px' : undefined),
                      borderStyle: (borderWidth > 0 || isNeu) ? 'solid' : undefined,
                      borderColor: borderWidth > 0 ? borderColor : (isNeu ? (isNeuDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)') : undefined),
                    }}
                  >
                    <Bot size={paddingY >= 16 ? 21 : 19} className="shrink-0" />
                    <span>{card.aiAgentButtonText || 'Atendente Virtual'}</span>
                    {card.aiAgentGlowEnabled !== false && (
                      <Sparkles size={paddingY >= 16 ? 17 : 15} className="text-purple-200/90 shrink-0 ml-0.5" />
                    )}
                  </button>
                );
              })()}
            </div>
          );
        })()}

        {/* 5. Resumo Profissional (se preenchido) */}
        {hasSummary && (
          <div className="px-6 py-3 text-center border-t border-slate-100/50">
            <p className="text-[13px] leading-relaxed italic" style={{ color: summaryTextColor }}>
              "{card.summary}"
            </p>
          </div>
        )}

        {/* 6. Canais de Contato - Somente se houver canais configurados */}
        {hasContacts && (() => {
          const isNeu = isNeumorphismTheme(card.appearanceTheme);
          const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
          const neuStyles = getNeumorphicCardStyles(isNeuDark);

          const itemBg = isNeu ? neuStyles.bg : (contentContrast.isDarkBg ? 'rgba(255, 255, 255, 0.08)' : '#F8FAFC');
          const itemShadow = isNeu ? neuStyles.raisedSubtle : undefined;
          const itemBorder = isNeu ? neuStyles.border : (contentContrast.isDarkBg ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)');
          const itemTextColor = isNeu ? neuStyles.textColor : (contentContrast.isDarkBg ? '#F8FAFC' : '#1E293B');
          const itemSubtextColor = isNeu ? neuStyles.subtextColor : (contentContrast.isDarkBg ? '#94A3B8' : '#64748B');

          return (
            <div className="px-5 py-4 flex flex-col gap-2 border-t border-slate-100/50">
              <h2 className="text-xs font-black uppercase tracking-wider mb-1 px-1" style={{ color: card.supportTextColor || (isNeu ? (isNeuDark ? '#94A3B8' : '#1E293B') : (contentContrast.isDarkBg ? '#94A3B8' : '#334155')) }}>
                Canais de Comunicação
              </h2>

              {hasWhatsapp && (
                <a
                  href={getWhatsAppDirectUrl(card.whatsappPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleOutboundClick('whatsapp')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-all"
                  style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemTextColor }}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MessageCircle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: itemSubtextColor }}>WhatsApp Profissional</div>
                    <div className="text-[13px] font-semibold truncate" style={{ color: itemTextColor }}>
                      {card.whatsappPhone}
                    </div>
                  </div>
                </a>
              )}

              {hasPhone && (
                <a
                  href={`tel:${card.phone!.replace(/\s+/g, '')}`}
                  onClick={() => handleOutboundClick('phone')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-all"
                  style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemTextColor }}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: itemSubtextColor }}>Telefone</div>
                    <div className="text-[13px] font-semibold truncate" style={{ color: itemTextColor }}>
                      {card.phone}
                    </div>
                  </div>
                </a>
              )}

              {hasEmail && (
                <a
                  href={`mailto:${card.email}`}
                  onClick={() => handleOutboundClick('email')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-all"
                  style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemTextColor }}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: itemSubtextColor }}>E-mail</div>
                    <div className="text-[13px] font-semibold truncate" style={{ color: itemTextColor }}>
                      {card.email}
                    </div>
                  </div>
                </a>
              )}

              {hasWebsite && (
                <a
                  href={getExternalDirectUrl(card.websiteUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleOutboundClick('website')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-all"
                  style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemTextColor }}
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: itemSubtextColor }}>Website Oficial</div>
                    <div className="text-[13px] font-semibold truncate" style={{ color: itemTextColor }}>
                      {card.websiteUrl!.replace(/^https?:\/\//, '')}
                    </div>
                  </div>
                  <ExternalLink size={14} style={{ color: itemSubtextColor }} />
                </a>
              )}

              {hasLocation && (
                <a
                  href={getMapsDirectUrl(card)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleOutboundClick('maps')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-all"
                  style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemTextColor }}
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: itemSubtextColor }}>Localização</div>
                    <div className="text-[13px] font-semibold truncate" style={{ color: itemTextColor }}>
                      {[card.address, card.addressNumber, card.city, card.state].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <ExternalLink size={14} style={{ color: itemSubtextColor }} />
                </a>
              )}

              {hasGoogleReview && (
                <a
                  href={getGoogleReviewDirectUrl(card)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleOutboundClick('google_review')}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all shadow-xs group"
                  style={{
                    backgroundColor: isNeu ? itemBg : (contentContrast.isDarkBg ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7'),
                    boxShadow: itemShadow,
                    border: isNeu ? itemBorder : (contentContrast.isDarkBg ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FCD34D'),
                    color: itemTextColor,
                  }}
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Star size={18} className="fill-white text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: contentContrast.isDarkBg ? '#FDE68A' : '#78350F' }}
                      >
                        Avaliação no Google
                      </span>
                      <span
                        className="text-[11px] font-extrabold tracking-tighter"
                        style={{ color: contentContrast.isDarkBg ? '#F59E0B' : '#B45309' }}
                      >
                        ★★★★★
                      </span>
                    </div>
                    <div
                      className="text-[13px] font-bold truncate"
                      style={{ color: isNeu ? itemTextColor : (contentContrast.isDarkBg ? '#F8FAFC' : '#1E293B') }}
                    >
                      Avaliar no Google Maps
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 shadow-xs transition-colors group-hover:bg-amber-600">
                    <span className="tracking-wide">Avaliar</span>
                    <ExternalLink size={13} className="text-white" />
                  </div>
                </a>
              )}

              {/* Dias e Horários de Funcionamento / Atendimento */}
              {hasBusinessHours && (
                <div
                  className="flex items-start gap-3 p-3 rounded-xl transition-all shadow-xs"
                  style={{
                    backgroundColor: isNeu ? itemBg : (contentContrast.isDarkBg ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF'),
                    boxShadow: itemShadow,
                    border: isNeu ? itemBorder : (contentContrast.isDarkBg ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE'),
                    color: itemTextColor,
                  }}
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Clock size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: contentContrast.isDarkBg ? '#93C5FD' : '#1E40AF' }}
                      >
                        Horário de Atendimento
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: contentContrast.isDarkBg ? 'rgba(59, 130, 246, 0.25)' : '#DBEAFE',
                          color: contentContrast.isDarkBg ? '#BFDBFE' : '#1D4ED8',
                        }}
                      >
                        {card.businessHoursStatus || 'Funcionamento'}
                      </span>
                    </div>
                    <div
                      className="text-[12px] font-semibold leading-relaxed whitespace-pre-line"
                      style={{ color: isNeu ? itemTextColor : (contentContrast.isDarkBg ? '#F1F5F9' : '#1E293B') }}
                    >
                      {card.businessHours}
                    </div>
                  </div>
                </div>
              )}

              {/* Canal de Pagamento Rápido PIX */}
              {hasPix && (
                <button
                  type="button"
                  onClick={() => {
                    setPixModalOpen(true);
                    handleOutboundClick('pix');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all shadow-xs group text-left cursor-pointer"
                  style={{
                    backgroundColor: isNeu ? itemBg : (contentContrast.isDarkBg ? 'rgba(13, 148, 136, 0.15)' : '#F0FDFA'),
                    boxShadow: itemShadow,
                    border: isNeu ? itemBorder : (contentContrast.isDarkBg ? '1px solid rgba(13, 148, 136, 0.35)' : '1px solid #99F6E4'),
                    color: itemTextColor,
                  }}
                >
                  <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <PixIcon size={20} color="#FFFFFF" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: contentContrast.isDarkBg ? '#5EEAD4' : '#115E59' }}
                      >
                        Pagar via PIX
                      </span>
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: contentContrast.isDarkBg ? '#99F6E4' : '#0F766E' }}
                      >
                        (Instantâneo)
                      </span>
                    </div>
                    <div
                      className="text-[13px] font-bold font-mono truncate"
                      style={{ color: isNeu ? itemTextColor : (contentContrast.isDarkBg ? '#F0FDFA' : '#0F172A') }}
                    >
                      {formatPixKeyForDisplay(card.pixKey || '', card.pixType) || card.pixKey}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 shadow-xs transition-colors group-hover:bg-teal-700">
                    <span className="tracking-wide">Ver QR Code</span>
                  </div>
                </button>
              )}
            </div>
          );
        })()}

        {/* 7. Redes Sociais - Somente se houver links de redes preenchidos */}
        {hasSocial && (() => {
          const isNeu = isNeumorphismTheme(card.appearanceTheme);
          const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
          const neuStyles = getNeumorphicCardStyles(isNeuDark);

          return (
            <div className="px-6 py-4 border-t border-slate-100/50 text-center">
              <h2 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: card.supportTextColor || (isNeu ? (isNeuDark ? '#94A3B8' : '#1E293B') : (contentContrast.isDarkBg ? '#94A3B8' : '#334155')) }}>
                Redes Profissionais
              </h2>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {hasInstagram && (
                  <a
                    href={getInstagramDirectUrl(card.instagramUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleOutboundClick('instagram')}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-pink-100 hover:text-pink-600 text-slate-700 flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isNeu ? neuStyles.bg : undefined,
                      boxShadow: isNeu ? neuStyles.raisedSubtle : undefined,
                      border: isNeu ? neuStyles.border : undefined,
                      color: isNeu ? neuStyles.textColor : undefined,
                    }}
                    title="Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {hasLinkedin && (
                  <a
                    href={getLinkedinDirectUrl(card.linkedinUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleOutboundClick('linkedin')}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isNeu ? neuStyles.bg : undefined,
                      boxShadow: isNeu ? neuStyles.raisedSubtle : undefined,
                      border: isNeu ? neuStyles.border : undefined,
                      color: isNeu ? neuStyles.textColor : undefined,
                    }}
                    title="LinkedIn"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
                {hasFacebook && (
                  <a
                    href={getFacebookDirectUrl(card.facebookUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleOutboundClick('facebook')}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isNeu ? neuStyles.bg : undefined,
                      boxShadow: isNeu ? neuStyles.raisedSubtle : undefined,
                      border: isNeu ? neuStyles.border : undefined,
                      color: isNeu ? neuStyles.textColor : undefined,
                    }}
                    title="Facebook"
                  >
                    <Facebook size={18} />
                  </a>
                )}
                {hasYoutube && (
                  <a
                    href={getYoutubeDirectUrl(card.youtubeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleOutboundClick('youtube')}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-700 flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isNeu ? neuStyles.bg : undefined,
                      boxShadow: isNeu ? neuStyles.raisedSubtle : undefined,
                      border: isNeu ? neuStyles.border : undefined,
                      color: isNeu ? neuStyles.textColor : undefined,
                    }}
                    title="YouTube"
                  >
                    <Youtube size={18} />
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* 8. QR Code Estilizável */}
        <div
          className="px-6 py-4 border-t border-slate-100 text-center transition-colors"
          style={{
            backgroundColor: card.qrCodeSectionBgColor || undefined,
          }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: qrTitleColor }}>
            Conecte-se Rapidamente
          </h2>
          <p className="text-xs mb-2" style={{ color: qrDescColor }}>
            Aponte a câmera para salvar ou compartilhar este cartão
          </p>
          <DigitalCardQrCode
            slug={card.slug}
            qrCodeStyle={card.qrCodeStyle || 'arredondado'}
            foregroundColor={card.qrCodeForegroundColor || card.backgroundColor || '#12375B'}
            backgroundColor={card.qrCodeBackgroundColor || '#FFFFFF'}
            logoUrl={card.qrCodeLogoUrl || card.companyLogoUrl}
            size={200}
            showDownloadButton={true}
            frameStyle={card.qrCodeFrameStyle || 'none'}
            frameText={card.qrCodeFrameText || 'SCAN ME'}
            frameColor={card.qrCodeFrameColor || card.buttonColor || card.backgroundColor}
            frameTextColor={card.qrCodeFrameTextColor || '#FFFFFF'}
            dotsStyle={card.qrCodeDotsStyle}
            cornersSquareStyle={card.qrCodeCornersSquareStyle}
            cornersSquareColor={card.qrCodeCornersSquareColor}
            cornersDotStyle={card.qrCodeCornersDotStyle}
            cornersDotColor={card.qrCodeCornersDotColor}
            gradientEnabled={card.qrCodeGradientEnabled}
            gradientType={card.qrCodeGradientType}
            gradientStartColor={card.qrCodeGradientStartColor}
            gradientEndColor={card.qrCodeGradientEndColor}
            transparentBg={card.qrCodeTransparentBg}
            includeLogo={card.qrCodeIncludeLogo !== false}
            logoSize={card.qrCodeLogoSize || 0.22}
          />
        </div>

        {/* 9. Formulário de Primeiro Contato (se habilitado e não oculto) */}
        {(card.inquiryEnabled !== false && !card.hideInquiryForm) && (
          <div className="px-6 py-5 border-t border-slate-100/50">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 font-heading" style={{ color: contentContrast.titleColor }}>
              <Send size={15} className="text-sky-500" />
              <span>Enviar uma mensagem</span>
            </h2>
            <p className="text-xs mb-4" style={{ color: contentContrast.subtitleColor }}>
              Deixe um recado diretamente para {card.name}.
            </p>

            {inquirySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Mensagem enviada com sucesso!</div>
                  <div>Recebemos seu contato e responderemos em breve.</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3">
                {/* Honeypot field (oculto para humanos, preenchido por bots) */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypotWebsite}
                  onChange={(e) => setHoneypotWebsite(e.target.value)}
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />

                {card.inquiryShowName !== false && (() => {
                  const isNeu = isNeumorphismTheme(card.appearanceTheme);
                  const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
                  const neuStyles = getNeumorphicCardStyles(isNeuDark);
                  return (
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: contentContrast.labelColor }}>
                        Seu Nome (opcional)
                      </label>
                      <input
                        type="text"
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        maxLength={160}
                        placeholder="Ex: Maria Santos"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-900 transition-all"
                        style={{
                          backgroundColor: isNeu ? (isNeuDark ? '#14161D' : '#E0E5EC') : undefined,
                          boxShadow: isNeu ? neuStyles.inset : undefined,
                          border: isNeu ? neuStyles.border : undefined,
                          color: isNeu ? neuStyles.textColor : undefined,
                        }}
                      />
                    </div>
                  );
                })()}

                {(() => {
                  const isNeu = isNeumorphismTheme(card.appearanceTheme);
                  const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
                  const neuStyles = getNeumorphicCardStyles(isNeuDark);
                  const fieldBg = isNeu ? (isNeuDark ? '#14161D' : '#E0E5EC') : undefined;
                  const fieldShadow = isNeu ? neuStyles.inset : undefined;
                  const fieldBorder = isNeu ? neuStyles.border : undefined;
                  const fieldTextColor = isNeu ? neuStyles.textColor : undefined;

                  return (
                    <div className="grid grid-cols-1 gap-2">
                      {card.inquiryShowEmail !== false && (
                        <div>
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: contentContrast.labelColor }}>
                            E-mail *
                          </label>
                          <input
                            type="email"
                            value={inquiryEmail}
                            onChange={(e) => setInquiryEmail(e.target.value)}
                            maxLength={320}
                            placeholder="seu@email.com"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-900 transition-all"
                            style={{
                              backgroundColor: fieldBg,
                              boxShadow: fieldShadow,
                              border: fieldBorder,
                              color: fieldTextColor,
                            }}
                            required={card.inquiryShowEmail !== false}
                          />
                        </div>
                      )}
                      {card.inquiryShowPhone !== false && (
                        <div>
                          <label className="block text-[11px] font-semibold mb-1" style={{ color: contentContrast.labelColor }}>
                            WhatsApp *
                          </label>
                          <input
                            type="tel"
                            value={inquiryPhone}
                            onChange={(e) => setInquiryPhone(e.target.value)}
                            maxLength={32}
                            placeholder="(11) 99999-9999"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-900 transition-all"
                            style={{
                              backgroundColor: fieldBg,
                              boxShadow: fieldShadow,
                              border: fieldBorder,
                              color: fieldTextColor,
                            }}
                            required={card.inquiryShowPhone !== false}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {card.inquiryShowMessage !== false && (() => {
                  const isNeu = isNeumorphismTheme(card.appearanceTheme);
                  const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
                  const neuStyles = getNeumorphicCardStyles(isNeuDark);
                  return (
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: contentContrast.labelColor }}>
                        Mensagem * (mín. 10 caracteres)
                      </label>
                      <textarea
                        rows={3}
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        maxLength={1200}
                        placeholder="Olá, gostaria de saber mais sobre seus serviços..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-900 transition-all"
                        style={{
                          backgroundColor: isNeu ? (isNeuDark ? '#14161D' : '#E0E5EC') : undefined,
                          boxShadow: isNeu ? neuStyles.inset : undefined,
                          border: isNeu ? neuStyles.border : undefined,
                          color: isNeu ? neuStyles.textColor : undefined,
                        }}
                        required
                      />
                    </div>
                  );
                })()}

                {/* Consentimento Obrigatório com Alto Contraste Garantido */}
                {card.inquiryShowConsent !== false && (() => {
                  const isNeu = isNeumorphismTheme(card.appearanceTheme);
                  const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
                  const neuStyles = getNeumorphicCardStyles(isNeuDark);
                  return (
                    <div
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border transition-all"
                      style={{
                        backgroundColor: isNeu ? (isNeuDark ? '#14161D' : '#E0E5EC') : (contentContrast.isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'),
                        boxShadow: isNeu ? neuStyles.inset : undefined,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: isNeu ? (isNeuDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)') : (contentContrast.isDarkBg ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'),
                      }}
                    >
                      <input
                        type="checkbox"
                        id="consent-check"
                        checked={inquiryConsent}
                        onChange={(e) => setInquiryConsent(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0 w-4 h-4"
                        required
                      />
                      <label
                        htmlFor="consent-check"
                        className="text-xs font-medium cursor-pointer leading-snug select-none"
                        style={{ color: contentContrast.consentColor }}
                      >
                        Concordo em compartilhar meus dados de contato com {card.name} para fins de retorno desta mensagem.
                      </label>
                    </div>
                  );
                })()}

                {inquiryError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {inquiryError}
                  </div>
                )}

                {(() => {
                  const isNeu = isNeumorphismTheme(card.appearanceTheme);
                  const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
                  const neuStyles = getNeumorphicCardStyles(isNeuDark);
                  const submitBg = card.buttonColor || (isNeu ? neuStyles.bg : '#1A7FBE');
                  const submitText = card.buttonColor ? actionButtonTextColor : (isNeu ? neuStyles.textColor : actionButtonTextColor);

                  return (
                    <button
                      type="submit"
                      disabled={inquirySubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:brightness-105 active:scale-[0.99]"
                      style={{
                        backgroundColor: submitBg,
                        color: submitText,
                        boxShadow: isNeu ? neuStyles.raised : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: isNeu ? neuStyles.border : undefined,
                      }}
                    >
                      <Send size={13} />
                      <span>{inquirySubmitting ? 'Enviando...' : 'Enviar mensagem'}</span>
                    </button>
                  );
                })()}
              </form>
            )}
          </div>
        )}

        {/* 10. CTA Institucional (link externo) - Somente se configurado */}
        {hasCta && (
          <div className="px-6 py-4 border-t border-slate-100 text-center">
            <a
              href={getExternalDirectUrl(card.ctaUrl)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleOutboundClick('institutional')}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-colors shadow-xs"
            >
              <span>{card.ctaLabel}</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* 11. Footer com texto customizável e redirecionamento configurável */}
        {(() => {
          const isClickable = card.footerLinkEnabled !== undefined
            ? card.footerLinkEnabled
            : (systemSettings?.footerLinkClickable !== false);

          const rawUrl = (card.footerLinkUrl && card.footerLinkUrl.trim())
            || systemSettings?.footerLinkUrl
            || 'https://consultatomosinfinity.com.br';

          const targetUrl = getFooterTargetUrl(rawUrl);
          const isInternal = targetUrl.startsWith('/');

          return (
            <footer className="px-6 py-4 text-center border-t border-slate-200/60">
              {isClickable ? (
                <a
                  href={targetUrl}
                  target={isInternal ? '_self' : '_blank'}
                  rel={isInternal ? undefined : 'noopener noreferrer'}
                  onClick={() => handleOutboundClick('footer_link')}
                  className="inline-block text-[11px] font-medium transition-opacity hover:opacity-75 underline decoration-slate-400/50 underline-offset-2 cursor-pointer"
                  style={{ color: contentContrast.footerColor }}
                >
                  {card.footerText || 'Cartão digital disponibilizado por Átomos Infinity'}
                </a>
              ) : (
                <p className="text-[11px]" style={{ color: contentContrast.footerColor }}>
                  {card.footerText || 'Cartão digital disponibilizado por Átomos Infinity'}
                </p>
              )}
            </footer>
          );
        })()}
          </div>
        </div>
        </div>
      </div>

      {/* Modal do Atendente Virtual de IA */}
      <AiAgentModal
        isOpen={aiAgentModalOpen}
        onClose={() => setAiAgentModalOpen(false)}
        aiAgentInfo={aiAgentInfo}
        buttonText={card.aiAgentButtonText}
        headerColor={card.backgroundColor}
      />

      {/* Modal de Pagamento Rápido via PIX com QR Code */}
      <PixPaymentModal
        isOpen={pixModalOpen}
        onClose={() => setPixModalOpen(false)}
        pixKey={card.pixKey || ''}
        pixType={card.pixType}
        pixBeneficiary={card.pixBeneficiary || card.name}
        pixCity={card.pixCity || card.city || 'Brasil'}
        cardName={card.name}
        headerColor={card.backgroundColor}
      />
    </main>
  );
};
