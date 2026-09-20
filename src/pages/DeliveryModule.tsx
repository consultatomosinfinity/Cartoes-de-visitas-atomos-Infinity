import React, { useState, useEffect, useCallback } from 'react';
import { useRoute } from 'wouter';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Share2,
  Smartphone,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
  Briefcase,
  Phone,
  Mail,
  Building,
  Globe,
  MessageCircle,
  FileSpreadsheet,
  Check,
  ChevronRight,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  FolderSync,
  Calendar,
  DollarSign,
  BellRing,
  Star,
} from 'lucide-react';
import { DigitalCard } from '../types.ts';
import { PRESET_THEMES, VISUAL_PRESETS } from '../../shared/digital-card-appearance.ts';
import { DigitalCardQrCode } from '../components/DigitalCardQrCode.tsx';
import { DigitalCardLivePreview } from '../components/DigitalCardLivePreview.tsx';
import { CardBillingAlertsManager } from '../components/CardBillingAlertsManager.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import { buildWhatsAppUrl, sanitizeWhatsAppText } from '../utils/whatsapp.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { initSupabase, mapDbToDigitalCard, mapDigitalCardToDb } from '../lib/supabase.ts';

export const DeliveryModule: React.FC = () => {
  const { user } = useAuth();
  const [, params] = useRoute<{ slug?: string }>('/entrega/:slug?');
  const [activeTab, setActiveTab] = useState<'kit' | 'coleta' | 'clonagem' | 'vencimentos'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('vencimento') || path.includes('cobranca') || path.includes('financeiro')) {
        return 'vencimentos';
      }
    }
    return 'kit';
  });
  
  // Lista de cartões existentes para seleção rápida
  const [cards, setCards] = useState<DigitalCard[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('atomos_digital_cards');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [selectedCardSlug, setSelectedCardSlug] = useState<string>(params?.slug || '');
  const [currentCard, setCurrentCard] = useState<DigitalCard | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [refreshingCards, setRefreshingCards] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Formulário de Coleta Rápida
  const [clientName, setClientName] = useState('');
  const [clientJobTitle, setClientJobTitle] = useState('');
  const [clientBrandName, setClientBrandName] = useState('Átomos Infinity');
  const [clientPhone, setClientPhone] = useState('');
  const [clientWhatsApp, setClientWhatsApp] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientWebsite, setClientWebsite] = useState('');
  const [clientGoogleReviewUrl, setClientGoogleReviewUrl] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientSummary, setClientSummary] = useState('');
  const [clientPhotoUrl, setClientPhotoUrl] = useState('');
  const [clientLogoUrl, setClientLogoUrl] = useState('');
  const [clientTheme, setClientTheme] = useState('padrao');
  const [customSlug, setCustomSlug] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Clonagem rápida
  const [cloneSourceId, setCloneSourceId] = useState<number | null>(null);
  const [cloneNewName, setCloneNewName] = useState('');
  const [cloneNewSlug, setCloneNewSlug] = useState('');
  const [cloning, setCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState<DigitalCard | null>(null);

  // Carrega cartões existentes para selector (Supabase + API + localStorage fallback)
  const fetchAllCards = useCallback(async () => {
    setRefreshingCards(true);
    try {
      let cardsData: DigitalCard[] = [];

      // 1. Tenta Supabase (se configurado)
      try {
        const client = await initSupabase();
        if (client) {
          const { data, error } = await client
            .from('digital_cards')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            cardsData = data.map(mapDbToDigitalCard);
          }
        }
      } catch (err) {
        console.warn('Kit de Entrega: Falha ao carregar do Supabase:', err);
      }

      // 2. Se não encontrou no Supabase, tenta API local (/api/cards)
      if (cardsData.length === 0) {
        try {
          const res = await fetch('/api/cards');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              cardsData = data;
            }
          }
        } catch (err) {
          console.warn('Kit de Entrega: Falha ao carregar /api/cards:', err);
        }
      }

      // 3. Fallback para localStorage
      if (cardsData.length === 0) {
        try {
          const raw = localStorage.getItem('atomos_digital_cards');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              cardsData = parsed;
            }
          }
        } catch (err) {
          console.warn('Kit de Entrega: Falha ao carregar localStorage:', err);
        }
      }

      if (cardsData.length > 0) {
        setCards(cardsData);
        try {
          localStorage.setItem('atomos_digital_cards', JSON.stringify(cardsData));
        } catch (e) {}

        setSelectedCardSlug((prev) => {
          if (prev && cardsData.some((c) => c.slug === prev)) {
            return prev;
          }
          if (params?.slug && cardsData.some((c) => c.slug === params.slug)) {
            return params.slug;
          }
          return cardsData[0].slug;
        });
      }
    } catch (err) {
      console.error('Erro ao carregar lista de cartões:', err);
    } finally {
      setRefreshingCards(false);
    }
  }, [params?.slug]);

  useEffect(() => {
    fetchAllCards();
  }, [fetchAllCards, user]);

  // Sincronização em tempo real entre abas e componentes
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('atomos_card_sync');
        channel.onmessage = (event) => {
          if (event.data && event.data.card) {
            const updatedCard: DigitalCard = event.data.card;
            setCards((prev) => {
              const idx = prev.findIndex((c) => c.id === updatedCard.id || c.slug === updatedCard.slug);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = updatedCard;
                return next;
              }
              return [updatedCard, ...prev];
            });
            if (updatedCard.slug === selectedCardSlug) {
              setCurrentCard(updatedCard);
            }
          }
        };
      }
    } catch (e) {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'atomos_digital_cards' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCards(parsed);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [selectedCardSlug]);

  // Atualiza slug se vier pela URL
  useEffect(() => {
    if (params?.slug) {
      setSelectedCardSlug(params.slug);
    }
  }, [params?.slug]);

  // Carrega dados do cartão selecionado para o Kit de Entrega
  useEffect(() => {
    if (!selectedCardSlug) {
      setCurrentCard(null);
      return;
    }

    let isMounted = true;
    setLoadingCard(true);

    const loadCard = async () => {
      // 1. Verifica no estado local de cartões
      const foundInMemory = cards.find((c) => c.slug === selectedCardSlug);
      if (foundInMemory) {
        if (isMounted) {
          setCurrentCard(foundInMemory);
          setLoadingCard(false);
        }
        return;
      }

      // 2. Tenta buscar no Supabase
      try {
        const client = await initSupabase();
        if (client) {
          const { data, error } = await client
            .from('digital_cards')
            .select('*')
            .eq('slug', selectedCardSlug)
            .maybeSingle();

          if (!error && data && isMounted) {
            const mapped = mapDbToDigitalCard(data);
            setCurrentCard(mapped);
            setCards((prev) => (prev.some((c) => c.slug === mapped.slug) ? prev : [mapped, ...prev]));
            setLoadingCard(false);
            return;
          }
        }
      } catch (e) {}

      // 3. Tenta buscar via API local (/api/cards/slug/...)
      try {
        const res = await fetch(`/api/cards/slug/${encodeURIComponent(selectedCardSlug)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && isMounted) {
            setCurrentCard(json.data);
            setCards((prev) => (prev.some((c) => c.slug === json.data.slug) ? prev : [json.data, ...prev]));
            setLoadingCard(false);
            return;
          }
        }
      } catch (e) {}

      // 4. Fallback localStorage
      try {
        const raw = localStorage.getItem('atomos_digital_cards');
        if (raw) {
          const parsed = JSON.parse(raw);
          const found = Array.isArray(parsed) && parsed.find((c: any) => c.slug === selectedCardSlug);
          if (found && isMounted) {
            setCurrentCard(found);
            setLoadingCard(false);
            return;
          }
        }
      } catch (e) {}

      if (isMounted) {
        setLoadingCard(false);
      }
    };

    loadCard();

    return () => {
      isMounted = false;
    };
  }, [selectedCardSlug, cards]);

  // URLs geradas
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://consultatomosinfinity.com.br';
  const cardUrl = currentCard ? `${origin}/cartao/${currentCard.slug}` : '';
  const degustadorUrl = currentCard ? `${origin}/degustador/${currentCard.slug}` : '';

  // Mensagem padronizada de WhatsApp pronta para o cliente (sem emojis que quebram a codificação)
  const generateWhatsAppMessage = () => {
    if (!currentCard) return '';
    const name = currentCard.name || 'Cliente';
    return sanitizeWhatsAppText(
      `Olá, *${name}*!\n\n` +
      `Seu *Cartão Digital Interativo Átomos Infinity* está 100% pronto para uso!\n\n` +
      `*Acesse agora pelo link exclusivo:*\n${cardUrl}\n\n` +
      `*Dica rápida de instalação no celular (PWA):*\n` +
      `1. Abra o link acima no Chrome (Android) ou Safari (iPhone);\n` +
      `2. Toque no botão *"Instalar aplicativo"* ou em *"Adicionar à Tela de Início"*;\n` +
      `3. Pronto! O ícone ficará disponível como um app exclusivo no seu celular.\n\n` +
      `*Seu Portal de Acesso Direto (Kit do Titular):*\n${degustadorUrl}\n\n` +
      `Qualquer dúvida ou caso queira atualizar informações, estamos à sua total disposição!`
    );
  };

  const handleCopyLink = () => {
    if (!cardUrl) return;
    navigator.clipboard.writeText(cardUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWhatsAppMessage = () => {
    const msg = generateWhatsAppMessage();
    navigator.clipboard.writeText(msg);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    const phone = currentCard?.whatsappPhone || currentCard?.phone || '';
    const url = buildWhatsAppUrl(phone, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Gerar slug automático com base no nome
  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  };

  const handleNameChange = (val: string) => {
    setClientName(val);
    if (!customSlug || customSlug === generateSlugFromName(clientName)) {
      setCustomSlug(generateSlugFromName(val));
    }
  };

  // Submissão do Formulário de Coleta Rápida
  const handleCreateDraftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingForm(true);
    setFormError(null);
    setFormSuccess(null);

    const slug = (customSlug || generateSlugFromName(clientName)).trim();
    if (!slug) {
      setFormError('Por favor defina um slug válido para o cartão.');
      setSubmittingForm(false);
      return;
    }

    try {
      const payload: Partial<DigitalCard> = {
        name: clientName,
        slug,
        jobTitle: clientJobTitle,
        brandName: clientBrandName || 'Átomos Infinity',
        phone: clientPhone,
        whatsappPhone: clientWhatsApp || clientPhone,
        email: clientEmail,
        websiteUrl: clientWebsite,
        googleReviewUrl: clientGoogleReviewUrl,
        address: clientAddress,
        city: clientCity,
        summary: clientSummary,
        imageUrl: clientPhotoUrl,
        companyLogoUrl: clientLogoUrl,
        appearanceTheme: clientTheme,
        backgroundColor: PRESET_THEMES[clientTheme]?.backgroundColor || '#12375B',
        buttonColor: PRESET_THEMES[clientTheme]?.buttonColor || '#1A7FBE',
        bodyColor: PRESET_THEMES[clientTheme]?.bodyColor || '#EAF1F7',
        contentColor: PRESET_THEMES[clientTheme]?.contentColor || '#FFFFFF',
        contentOpacity: 100,
        status: 'ativo',
        inquiryEnabled: true,
        activityTrackingEnabled: true,
        aiAgentButtonText: 'Atendente Virtual',
        aiAgentButtonColor: '#7C3AED',
        aiAgentGlowEnabled: true,
      };

      let createdCard: DigitalCard | null = null;

      // 1. Tenta salvar no Supabase (se autenticado ou cliente disponível)
      if (user) {
        try {
          const client = await initSupabase();
          if (client) {
            const dbPayload = mapDigitalCardToDb(payload as DigitalCard, user.id);
            const { data, error } = await client
              .from('digital_cards')
              .insert([dbPayload])
              .select()
              .single();
            if (!error && data) {
              createdCard = mapDbToDigitalCard(data);
            }
          }
        } catch (dbErr) {
          console.warn('Falha ao salvar no Supabase, tentando API:', dbErr);
        }
      }

      // 2. Tenta API local se não salvou no Supabase
      if (!createdCard) {
        try {
          const res = await fetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            createdCard = await res.json();
          }
        } catch (apiErr) {
          console.warn('Falha na API local:', apiErr);
        }
      }

      // 3. Fallback objeto local
      if (!createdCard) {
        createdCard = {
          ...payload,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as DigitalCard;
      }

      // Persiste no localStorage e dispara sync
      try {
        const raw = localStorage.getItem('atomos_digital_cards');
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(createdCard);
        localStorage.setItem('atomos_digital_cards', JSON.stringify(list));

        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const ch = new BroadcastChannel('atomos_card_sync');
          ch.postMessage({ type: 'created', card: createdCard });
          ch.close();
        }
      } catch (e) {}

      await fetchAllCards();
      setSelectedCardSlug(createdCard.slug);
      setCurrentCard(createdCard);
      setFormSuccess(`Cartão de ${createdCard.name} criado com sucesso com o link /cartao/${createdCard.slug}!`);
      
      // Limpa formulário
      setClientName('');
      setClientJobTitle('');
      setClientPhone('');
      setClientWhatsApp('');
      setClientEmail('');
      setClientWebsite('');
      setClientAddress('');
      setClientCity('');
      setClientSummary('');
      setClientPhotoUrl('');
      setClientLogoUrl('');
      setCustomSlug('');
      
      // Muda para aba do kit de entrega com o cartão novo
      setActiveTab('kit');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar cartão digital.');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Processo de Clonagem Rápida
  const handleCloneCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneSourceId) return;
    setCloning(true);
    setCloneSuccess(null);

    try {
      const sourceCard = cards.find((c) => c.id === cloneSourceId);
      let cloned: DigitalCard | null = null;

      // 1. Tenta API do servidor
      try {
        const res = await fetch(`/api/cards/${cloneSourceId}/duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cloneNewName.trim() || undefined,
            slug: cloneNewSlug.trim() || undefined,
          }),
        });

        if (res.ok) {
          cloned = await res.json();
        }
      } catch (apiErr) {}

      // 2. Se não duplicou via API e temos o cartão fonte
      if (!cloned && sourceCard) {
        const newSlug = (cloneNewSlug.trim() || `${sourceCard.slug}-copia-${Date.now().toString().slice(-4)}`);
        const newName = (cloneNewName.trim() || `${sourceCard.name} (Cópia)`);
        const payload: Partial<DigitalCard> = {
          ...sourceCard,
          name: newName,
          slug: newSlug,
        };
        delete (payload as any).id;

        if (user) {
          try {
            const client = await initSupabase();
            if (client) {
              const dbPayload = mapDigitalCardToDb(payload as DigitalCard, user.id);
              const { data, error } = await client
                .from('digital_cards')
                .insert([dbPayload])
                .select()
                .single();
              if (!error && data) {
                cloned = mapDbToDigitalCard(data);
              }
            }
          } catch (e) {}
        }

        if (!cloned) {
          cloned = {
            ...payload,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as DigitalCard;
        }
      }

      if (cloned) {
        try {
          const raw = localStorage.getItem('atomos_digital_cards');
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(cloned);
          localStorage.setItem('atomos_digital_cards', JSON.stringify(list));

          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const ch = new BroadcastChannel('atomos_card_sync');
            ch.postMessage({ type: 'created', card: cloned });
            ch.close();
          }
        } catch (e) {}

        await fetchAllCards();
        setCloneSuccess(cloned);
        setSelectedCardSlug(cloned.slug);
        setCurrentCard(cloned);
        setCloneNewName('');
        setCloneNewSlug('');
      } else {
        throw new Error('Não foi possível duplicar o cartão.');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao clonar cartão.');
    } finally {
      setCloning(false);
    }
  };

  // Atualização financeira de cartões a partir do módulo de cobranças
  const handleUpdateCardFromBilling = async (updatedCard: DigitalCard) => {
    try {
      // Atualiza no estado local de cartões
      setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
      if (currentCard?.id === updatedCard.id) {
        setCurrentCard(updatedCard);
      }

      try {
        const raw = localStorage.getItem('atomos_digital_cards');
        if (raw) {
          const list = JSON.parse(raw);
          const idx = list.findIndex((c: any) => c.id === updatedCard.id || c.slug === updatedCard.slug);
          if (idx !== -1) {
            list[idx] = updatedCard;
            localStorage.setItem('atomos_digital_cards', JSON.stringify(list));
          }
        }
      } catch (e) {}

      // Tenta Supabase
      if (user) {
        try {
          const client = await initSupabase();
          if (client && typeof updatedCard.id === 'number') {
            const dbPayload = mapDigitalCardToDb(updatedCard, user.id);
            await client.from('digital_cards').update(dbPayload).eq('id', updatedCard.id);
          }
        } catch (e) {}
      }

      // Envia para API se disponível
      await fetch(`/api/cards/${updatedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCard),
      }).catch(() => {});
    } catch (err) {
      console.error('Erro ao atualizar dados de cobrança:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Share2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Kit de Entrega & Onboarding Rápido</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Módulo 1-Clique
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Solução para vendedoras e clientes: Coleta simplificada, clonagem instantânea e entrega no WhatsApp sem atrito.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchAllCards}
              disabled={refreshingCards}
              title="Sincronizar / Atualizar lista de cartões"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/80 flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw size={13} className={refreshingCards ? 'animate-spin text-emerald-400' : ''} />
              <span className="hidden md:inline">Sincronizar</span>
            </button>
            <a
              href="/app"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700/80 flex items-center gap-1.5"
            >
              <span>Ir ao Painel Completo</span>
              <ExternalLink size={13} />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Navegação de Abas do Módulo */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('kit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'kit'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Send size={14} />
              <span>1. Kit de Entrega com 1 Clique (WhatsApp)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('coleta')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'coleta'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle size={14} />
              <span>2. Formulário Rápido de Coleta (Novo Cliente)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clonagem')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'clonagem'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderSync size={14} />
              <span>3. Clonagem Instantânea de Cartão</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vencimentos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vencimentos'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar size={14} />
              <span>4. Alertas de Vencimento & Cobrança (3 Meses)</span>
            </button>
          </div>

          {/* Seletor rápido de cartão */}
          {cards.length > 0 && activeTab === 'kit' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Cartão Selecionado:</span>
              <select
                value={selectedCardSlug}
                onChange={(e) => setSelectedCardSlug(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {cards.map((c) => (
                  <option key={c.id || c.slug} value={c.slug}>
                    {c.name} (/cartao/{c.slug})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ABA 1: KIT DE ENTREGA RÁPIDA COM 1 CLIQUE */}
        {activeTab === 'kit' && (
          <div className="space-y-6">
            {/* Mensagem de sucesso recente de criação ou clonagem */}
            {formSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold">{formSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormSuccess(null)}
                  className="text-emerald-400 hover:text-white text-[11px] font-bold underline"
                >
                  Dispensar
                </button>
              </div>
            )}

            {!currentCard && !loadingCard && (
              <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                  📇
                </div>
                <h3 className="text-base font-bold text-white">Nenhum Cartão Disponível</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Crie seu primeiro cartão usando o formulário de coleta rápida, ou clique em sincronizar caso já tenha criado no painel.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={fetchAllCards}
                    disabled={refreshingCards}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition"
                  >
                    <RefreshCw size={14} className={refreshingCards ? 'animate-spin text-emerald-400' : ''} />
                    <span>Sincronizar com Banco de Dados</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('coleta')}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition"
                  >
                    Preencher Formulário de Coleta
                  </button>
                </div>
              </div>
            )}

            {currentCard && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Coluna Esquerda: Ações de Entrega (WhatsApp, Links, QR Code, Instruções) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card Principal de Boas-Vindas e Disparo para WhatsApp */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold mb-2">
                          <CheckCircle2 size={13} />
                          <span>Pronto para Enviar ao Cliente</span>
                        </div>
                        <h2 className="text-xl font-black text-white font-heading">{currentCard.name}</h2>
                        <p className="text-xs text-slate-300">
                          {currentCard.jobTitle || 'Profissional'} • {currentCard.brandName || 'Átomos Infinity'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono">
                          /cartao/{currentCard.slug}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Destaque Máximo: Disparo 1-Clique WhatsApp */}
                    <div className="pt-2 pb-4">
                      <button
                        type="button"
                        onClick={handleOpenWhatsApp}
                        className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
                      >
                        <MessageCircle size={20} className="fill-slate-950" />
                        <span>Enviar Kit Completo no WhatsApp do Cliente</span>
                      </button>
                      <p className="text-[11px] text-slate-400 text-center mt-2">
                        Abre o WhatsApp com o link do cartão, o QR Code e instruções passo a passo de como fixar no celular como aplicativo!
                      </p>
                    </div>

                    {/* Links Diretos Copiáveis */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Link do Cartão</div>
                          <div className="text-xs text-sky-400 font-mono truncate">{cardUrl}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            title="Copiar Link Direto"
                          >
                            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                          <a
                            href={cardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            title="Abrir Cartão"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Portal do Titular (Degustador)</div>
                          <div className="text-xs text-purple-300 font-mono truncate">{degustadorUrl}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={degustadorUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40 transition"
                            title="Abrir Portal do Titular"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pré-Visualização e Cópia do Texto Formatado para WhatsApp */}
                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-emerald-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Mensagem Pronta para WhatsApp
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyWhatsAppMessage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                      >
                        {copiedMessage ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedMessage ? 'Copiado!' : 'Copiar Texto'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                      {generateWhatsAppMessage()}
                    </div>
                  </div>

                  {/* QR Code de Alta Resolução Pronto para Impressão ou Download */}
                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode size={16} className="text-sky-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          QR Code de Alta Qualidade
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400">Escaneável por qualquer câmera</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-white flex flex-col sm:flex-row items-center justify-center gap-6">
                      <DigitalCardQrCode
                        slug={currentCard.slug}
                        qrCodeStyle={currentCard.qrCodeStyle || 'quadrado'}
                        foregroundColor={currentCard.qrCodeForegroundColor || '#12375B'}
                        backgroundColor={currentCard.qrCodeBackgroundColor || '#FFFFFF'}
                        logoUrl={currentCard.qrCodeLogoUrl || currentCard.companyLogoUrl}
                        size={180}
                        showDownloadButton={true}
                        frameStyle={currentCard.qrCodeFrameStyle}
                        frameText={currentCard.qrCodeFrameText}
                        frameColor={currentCard.qrCodeFrameColor}
                        frameTextColor={currentCard.qrCodeFrameTextColor}
                        dotsStyle={currentCard.qrCodeDotsStyle}
                        cornersSquareStyle={currentCard.qrCodeCornersSquareStyle}
                        cornersSquareColor={currentCard.qrCodeCornersSquareColor}
                        cornersDotStyle={currentCard.qrCodeCornersDotStyle}
                        cornersDotColor={currentCard.qrCodeCornersDotColor}
                        gradientEnabled={currentCard.qrCodeGradientEnabled}
                        gradientType={currentCard.qrCodeGradientType}
                        gradientStartColor={currentCard.qrCodeGradientStartColor}
                        gradientEndColor={currentCard.qrCodeGradientEndColor}
                        transparentBg={currentCard.qrCodeTransparentBg}
                        includeLogo={currentCard.qrCodeIncludeLogo}
                        logoSize={currentCard.qrCodeLogoSize}
                      />

                      <div className="text-slate-800 space-y-2 max-w-xs text-center sm:text-left">
                        <h4 className="font-bold text-sm text-slate-900">Como o cliente pode usar o QR Code:</h4>
                        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                          <li>Imprimir em balcões de recepção ou mesas</li>
                          <li>Colocar no cartão de visitas físico impresso</li>
                          <li>Usar em banners, adesivos de vitrine ou veículos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Live Mockup do Cartão Pronto */}
                <div className="lg:col-span-5 sticky top-24">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone size={14} className="text-emerald-400" />
                      <span>Visualização Como o Cliente Verá</span>
                    </span>
                    <a
                      href={cardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <span>Abrir Cartão Real</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <DigitalCardLivePreview card={currentCard} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA 2: FORMULÁRIO RÁPIDO DE COLETA (NOVO CLIENTE) */}
        {activeTab === 'coleta' && (
          <div className="max-w-4xl mx-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-bold mb-2">
                  <User size={13} />
                  <span>Entrada Rápida de Dados</span>
                </div>
                <h2 className="text-xl font-black text-white font-heading">
                  Formulário Simplificado para Vendedoras & Clientes
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Preencha os dados essenciais que o cliente enviou por WhatsApp. O sistema cria automaticamente o cartão ativado e gera o Kit de Entrega pronto em 1 segundo!
                </p>

                {/* Banner de Envio Direto ao Cliente */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-sky-900/60 to-purple-900/60 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sparkles size={12} />
                      Dica de Produtividade: Não quer digitar tudo?
                    </span>
                    <p className="text-xs text-slate-200">
                      Envie o <strong>Link do Formulário Público</strong> para o próprio cliente ou vendedora preencher no celular:
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/formulario`;
                        navigator.clipboard.writeText(url);
                        alert('Link copiado: ' + url);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Copy size={13} />
                      <span>Copiar Link</span>
                    </button>
                    <a
                      href="/formulario"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition-colors flex items-center gap-1"
                    >
                      <ExternalLink size={13} />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateDraftCard} className="space-y-5">
                {/* 1. Dados Pessoais / Titular */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User size={14} className="text-sky-400" />
                    <span>Identificação Básica</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Nome Completo do Titular *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ex: Dra. Juliana Silveira"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Cargo / Profissão</label>
                      <input
                        type="text"
                        value={clientJobTitle}
                        onChange={(e) => setClientJobTitle(e.target.value)}
                        placeholder="Ex: Médica Dermatologista • CRM 12345"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Nome da Empresa / Clínica / Marca</label>
                      <input
                        type="text"
                        value={clientBrandName}
                        onChange={(e) => setClientBrandName(e.target.value)}
                        placeholder="Ex: Clínica Silveira & Bem-Estar"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Link URL do Cartão (/cartao/slug) *
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">/cartao/</span>
                        <input
                          type="text"
                          required
                          value={customSlug}
                          onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="juliana-silveira"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Contatos & Redes */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Phone size={14} className="text-emerald-400" />
                    <span>Contatos do Cliente</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Comercial (com DDD) *</label>
                      <input
                        type="text"
                        required
                        value={clientWhatsApp}
                        onChange={(e) => setClientWhatsApp(e.target.value)}
                        placeholder="Ex: (15) 99625-9353"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">E-mail Profissional</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="contato@clinica.com.br"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Site ou Redes Sociais</label>
                      <input
                        type="text"
                        value={clientWebsite}
                        onChange={(e) => setClientWebsite(e.target.value)}
                        placeholder="https://instagram.com/perfil"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span>Link de Avaliação no Google (Google Meu Negócio)</span>
                      </label>
                      <input
                        type="text"
                        value={clientGoogleReviewUrl}
                        onChange={(e) => setClientGoogleReviewUrl(e.target.value)}
                        placeholder="Ex: https://g.page/r/XXXXX/review ou link de pedir avaliações"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Endereço Físico (Rua, Número, Bairro)</label>
                      <input
                        type="text"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Cidade e Estado</label>
                      <input
                        type="text"
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        placeholder="Ex: São Paulo - SP"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Imagens e Apresentação */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Globe size={14} className="text-purple-400" />
                    <span>Apresentação & Tema Visual</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Breve Resumo / Biografia</label>
                    <textarea
                      rows={2}
                      value={clientSummary}
                      onChange={(e) => setClientSummary(e.target.value)}
                      placeholder="Ex: Especialista em estética avançada com mais de 10 anos de experiência..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">URL da Foto de Perfil (Opcional)</label>
                      <input
                        type="text"
                        value={clientPhotoUrl}
                        onChange={(e) => setClientPhotoUrl(e.target.value)}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Tema Visual Padrão</label>
                      <select
                        value={clientTheme}
                        onChange={(e) => setClientTheme(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        {VISUAL_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name} ({preset.tag})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={submittingForm}
                    className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle size={16} />
                    <span>{submittingForm ? 'Criando Cartão...' : 'Criar Cartão & Gerar Kit de Entrega'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ABA 3: CLONAGEM INSTANTÂNEA DE CARTÃO */}
        {activeTab === 'clonagem' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold mb-2">
                  <FolderSync size={13} />
                  <span>Clonagem Rápida</span>
                </div>
                <h2 className="text-xl font-black text-white font-heading">
                  Clonar Estrutura e Design de um Cartão Existente
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ideal para quando um cliente quer o mesmo estilo visual, cores, botões e atendente virtual de outro cartão já existente, bastando alterar o nome e contatos!
                </p>
              </div>

              {cloneSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <span>
                      Cartão clonado com sucesso: <strong>{cloneSuccess.name}</strong> (/cartao/{cloneSuccess.slug})!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kit')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Ver no Kit de Entrega
                  </button>
                </div>
              )}

              <form onSubmit={handleCloneCard} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Selecione o Cartão Modelo (Origem) *
                  </label>
                  <select
                    required
                    value={cloneSourceId || ''}
                    onChange={(e) => setCloneSourceId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">Selecione um cartão para duplicar...</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (/cartao/{c.slug}) - {c.brandName || 'Sem marca'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nome do Novo Titular (Opcional)
                    </label>
                    <input
                      type="text"
                      value={cloneNewName}
                      onChange={(e) => {
                        setCloneNewName(e.target.value);
                        if (!cloneNewSlug) {
                          setCloneNewSlug(generateSlugFromName(e.target.value));
                        }
                      }}
                      placeholder="Ex: Carlos Oliveira"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Novo Slug URL (Opcional)
                    </label>
                    <input
                      type="text"
                      value={cloneNewSlug}
                      onChange={(e) => setCloneNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="Ex: carlos-oliveira"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={cloning || !cloneSourceId}
                    className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FolderSync size={16} />
                    <span>{cloning ? 'Clonando...' : 'Clonar Cartão Agora'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ABA 4: ALERTA DE VENCIMENTOS & COBRANÇA WHATSAPP (3 MESES / 1-CLIQUE) */}
        {activeTab === 'vencimentos' && (
          <div className="max-w-6xl mx-auto">
            <CardBillingAlertsManager
              cards={cards}
              onUpdateCard={handleUpdateCardFromBilling}
              masterWhatsApp="5515996259353"
              masterPixKey="15996259353"
            />
          </div>
        )}
      </main>
    </div>
  );
};
