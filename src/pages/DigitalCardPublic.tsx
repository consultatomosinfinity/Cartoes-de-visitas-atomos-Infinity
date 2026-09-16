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
} from 'lucide-react';
import { DigitalCard } from '../types.ts';
import { parseAiAgentInput, getAiAgentButtonGlowClass, getAiAgentButtonPaddingY } from '../../shared/digital-card-ai-agent.ts';
import { getContrastTextColor, isConfiguredLink, hexToRgba, getCardContentContrastColors } from '../../shared/digital-card-appearance.ts';
import { downloadVCard } from '../../shared/digital-card-vcf.ts';
import { DigitalCardDualPorthole } from '../components/DigitalCardDualPorthole.tsx';
import { DigitalCardQrCode } from '../components/DigitalCardQrCode.tsx';
import { DigitalCardPwaInstall } from '../components/DigitalCardPwaInstall.tsx';
import { AiAgentModal } from '../components/AiAgentModal.tsx';

interface DigitalCardPublicProps {
  slug: string;
}

export const DigitalCardPublic: React.FC<DigitalCardPublicProps> = ({ slug }) => {
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [status, setStatus] = useState<'loading' | 'ativo' | 'pausado' | 'error'>('loading');
  const [aiAgentModalOpen, setAiAgentModalOpen] = useState(false);

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
      // Sempre busca direto da rede com parâmetro de controle e cabeçalhos no-cache
      const res = await fetch(`/api/cards/slug/${encodeURIComponent(slug)}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const json = await res.json();

      if (json.status === 'ativo' && json.data) {
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
      } else {
        applyCardData(null, 'pausado');
      }
    } catch (err) {
      console.error('Erro ao buscar cartão:', err);
      setStatus('error');
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

    // 4. Server-Sent Events (SSE): Atualização remota em tempo real
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

    // 5. Auto-ajuste imediato ao focar ou alternar para esta aba
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
  const hasContacts = hasWhatsapp || hasPhone || hasEmail || hasWebsite || hasLocation;

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
  const whatsappShareText = `Olá! Acabei de receber o cartão digital de ${card.name}.\nAcesse e salve o contato: ${cardPublicUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

  const headerTextColor = getContrastTextColor(card.backgroundColor);
  const actionButtonTextColor = getContrastTextColor(card.buttonColor);

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

  return (
    <main
      id="public-card-container"
      className="min-h-screen py-8 px-4 flex flex-col items-center justify-start card-transition"
      style={{ backgroundColor: card.bodyColor || '#EAF1F7', fontFamily: getFontFamily(card.fontFamily || 'sans') }}
    >
      {/* Container Principal do Cartão Digital */}
      <div className="relative w-full max-w-[400px] sm:max-w-[390px] rounded-[2.5rem] shadow-2xl overflow-hidden card-transition flex flex-col border border-black/5 mx-auto">
        {/* CAMADA DE IMAGEM DE FUNDO DO CARTÃO (se configurada) */}
        {card.contentBackgroundImageUrl && (
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

        {/* CAMADA DE CONTEÚDO DO CARTÃO (com cor e transparência alpha) */}
        <div
          className="relative z-10 w-full flex flex-col flex-1 min-h-full"
          style={{
            backgroundColor: hexToRgba(card.contentColor || '#FFFFFF', (card.contentOpacity ?? 100) / 100),
          }}
        >
          {/* 1. Header do Cartão com Fundo Colorido e Dual-Porthole */}
          <div
            className="pt-8 pb-6 px-6 text-center relative overflow-hidden"
            style={{
              backgroundColor: hexToRgba(card.backgroundColor || '#12375B', (card.headerOpacity ?? 100) / 100),
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

        {/* 4. GRUPO DE BOTÕES DE AÇÃO (Ordem Obrigatória) */}
        {(() => {
          const globalRadius = card.buttonsBorderRadius ?? 16;
          const vcardRadius = card.vcardButtonBorderRadius ?? globalRadius;
          const whatsappRadius = card.whatsappButtonBorderRadius ?? globalRadius;
          const pwaRadius = card.pwaButtonBorderRadius ?? globalRadius;
          const aiAgentRadius = card.aiAgentButtonBorderRadius ?? globalRadius;

          const vcardBg = card.vcardButtonColor || card.buttonColor || '#1A7FBE';
          const vcardText = card.vcardButtonTextColor || getContrastTextColor(vcardBg);

          const whatsappBg = card.whatsappButtonColor || '#059669';
          const whatsappText = card.whatsappButtonTextColor || '#FFFFFF';

          const pwaBg = card.pwaButtonColor || '#0F172A';
          const pwaText = card.pwaButtonTextColor || '#FFFFFF';

          const aiAgentBg = card.aiAgentButtonColor || '#7C3AED';
          const aiAgentText = card.aiAgentButtonTextColor || '#FFFFFF';

          return (
            <div className="px-5 pt-3 pb-4 flex flex-col gap-2.5">
              {/* Ação 1: Salvar contato no celular (vCard .vcf) */}
              <button
                type="button"
                onClick={() => downloadVCard(card)}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-5 font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                style={{
                  backgroundColor: vcardBg,
                  color: vcardText,
                  borderRadius: `${vcardRadius}px`,
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
                className="w-full flex items-center justify-center gap-2.5 py-3 px-5 font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                style={{
                  backgroundColor: whatsappBg,
                  color: whatsappText,
                  borderRadius: `${whatsappRadius}px`,
                }}
              >
                <Share2 size={18} />
                <span>Compartilhar no WhatsApp</span>
              </a>

              {/* Ação 3: Instalar App no Celular */}
              <DigitalCardPwaInstall
                appName={card.mobileAppName || (card.brandName ? `${card.name} | ${card.brandName}` : card.name)}
                iconUrl={card.mobileIconUrl || card.companyLogoUrl || card.imageUrl || '/icon-192.png'}
                buttonClassName="w-full flex items-center justify-center gap-2.5 py-3 px-5 font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                style={{
                  backgroundColor: pwaBg,
                  color: pwaText,
                  borderRadius: `${pwaRadius}px`,
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
                      borderWidth: borderWidth > 0 ? `${borderWidth}px` : undefined,
                      borderStyle: borderWidth > 0 ? 'solid' : undefined,
                      borderColor: borderWidth > 0 ? borderColor : undefined,
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
          <div className="px-6 py-3 text-center border-t border-slate-100">
            <p className="text-[13px] leading-relaxed italic" style={{ color: summaryTextColor }}>
              "{card.summary}"
            </p>
          </div>
        )}

        {/* 6. Canais de Contato - Somente se houver canais configurados */}
        {hasContacts && (
          <div className="px-5 py-4 flex flex-col gap-2 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1 px-1" style={{ color: card.supportTextColor || '#94a3b8' }}>
              Canais de Comunicação
            </h2>

            {hasWhatsapp && (
              <a
                href={`/cartao/${card.slug}/ir/whatsapp`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MessageCircle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">WhatsApp Profissional</div>
                  <div className="text-[13px] font-semibold truncate text-slate-700">
                    {card.whatsappPhone}
                  </div>
                </div>
              </a>
            )}

            {hasPhone && (
              <a
                href={`tel:${card.phone!.replace(/\s+/g, '')}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">Telefone</div>
                  <div className="text-[13px] font-semibold truncate text-slate-700">
                    {card.phone}
                  </div>
                </div>
              </a>
            )}

            {hasEmail && (
              <a
                href={`mailto:${card.email}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">E-mail</div>
                  <div className="text-[13px] font-semibold truncate text-slate-700">
                    {card.email}
                  </div>
                </div>
              </a>
            )}

            {hasWebsite && (
              <a
                href={`/cartao/${card.slug}/ir/website`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">Website Oficial</div>
                  <div className="text-[13px] font-semibold truncate text-slate-700">
                    {card.websiteUrl!.replace(/^https?:\/\//, '')}
                  </div>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </a>
            )}

            {hasLocation && (
              <a
                href={`/cartao/${card.slug}/ir/maps`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">Localização</div>
                  <div className="text-[13px] font-semibold truncate text-slate-700">
                    {[card.address, card.addressNumber, card.city, card.state].filter(Boolean).join(', ')}
                  </div>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </a>
            )}
          </div>
        )}

        {/* 7. Redes Sociais - Somente se houver links de redes preenchidos */}
        {hasSocial && (
          <div className="px-6 py-4 border-t border-slate-100 text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: card.supportTextColor || '#94a3b8' }}>
              Redes Profissionais
            </h2>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {hasInstagram && (
                <a
                  href={`/cartao/${card.slug}/ir/instagram`}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-pink-100 hover:text-pink-600 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
                  title="Instagram"
                >
                  <Instagram size={18} />
                </a>
              )}
              {hasLinkedin && (
                <a
                  href={`/cartao/${card.slug}/ir/linkedin`}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
                  title="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
              )}
              {hasFacebook && (
                <a
                  href={`/cartao/${card.slug}/ir/facebook`}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
                  title="Facebook"
                >
                  <Facebook size={18} />
                </a>
              )}
              {hasYoutube && (
                <a
                  href={`/cartao/${card.slug}/ir/youtube`}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
                  title="YouTube"
                >
                  <Youtube size={18} />
                </a>
              )}
            </div>
          </div>
        )}

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

                {card.inquiryShowName !== false && (
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-900"
                    />
                  </div>
                )}

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
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-900"
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
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-900"
                        required={card.inquiryShowPhone !== false}
                      />
                    </div>
                  )}
                </div>

                {card.inquiryShowMessage !== false && (
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-900"
                      required
                    />
                  </div>
                )}

                {/* Consentimento Obrigatório com Alto Contraste Garantido */}
                {card.inquiryShowConsent !== false && (
                  <div
                    className="flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors"
                    style={{
                      backgroundColor: contentContrast.isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: contentContrast.isDarkBg ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
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
                )}

                {inquiryError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {inquiryError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 hover:brightness-105 active:scale-[0.99]"
                  style={{
                    backgroundColor: card.buttonColor || '#1A7FBE',
                    color: actionButtonTextColor,
                  }}
                >
                  <Send size={13} />
                  <span>{inquirySubmitting ? 'Enviando...' : 'Enviar mensagem'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* 10. CTA Institucional (link externo) - Somente se configurado */}
        {hasCta && (
          <div className="px-6 py-4 border-t border-slate-100 text-center">
            <a
              href={`/cartao/${card.slug}/ir/institutional`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-colors shadow-xs"
            >
              <span>{card.ctaLabel}</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* 11. Footer com texto customizável */}
        <footer className="px-6 py-4 text-center border-t border-slate-200/60">
          <p className="text-[11px]" style={{ color: contentContrast.footerColor }}>
            {card.footerText || 'Cartão Digital Profissional. Todos os direitos reservados.'}
          </p>
        </footer>
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
    </main>
  );
};
