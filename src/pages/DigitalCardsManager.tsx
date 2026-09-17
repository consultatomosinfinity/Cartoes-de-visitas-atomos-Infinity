import React, { useEffect, useState } from 'react';
import {
  User,
  Image as ImageIcon,
  Phone,
  MapPin,
  Palette,
  QrCode,
  Share2,
  BarChart3,
  MessageSquare,
  Send,
  Bot,
  Globe,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Layers,
  Smartphone,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Crosshair,
  RotateCcw,
  X,
  Sliders,
  Scan,
  Circle,
  Square,
  CircleDot,
  ClipboardList,
  Camera,
  Check,
  Download,
  Home,
  LogOut,
  Crown,
  Shield,
  Users,
  UserPlus,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { DigitalCard, CardMetrics, DigitalCardInquiry } from '../types.ts';
import { PRESET_THEMES } from '../../shared/digital-card-appearance.ts';
import { getAiAgentButtonGlowClass, getAiAgentButtonPaddingY, AiAgentGlowIntensity, AiAgentButtonSize } from '../../shared/digital-card-ai-agent.ts';
import { DigitalCardLivePreview } from '../components/DigitalCardLivePreview.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { initSupabase, uploadCardAsset, mapDbToDigitalCard, mapDigitalCardToDb } from '../lib/supabase.ts';
import { AdminUsersManager } from '../components/AdminUsersManager.tsx';
import { HelpCenterModal } from '../components/HelpCenterModal.tsx';

export const DigitalCardsManager: React.FC = () => {
  const { user, signOut, isConfigured, isMaster, isAdminOrMaster, role, plan } = useAuth();
  const [mainView, setMainView] = useState<'cards' | 'users'>('cards');
  const [cardUserFilter, setCardUserFilter] = useState<string | null>(null);
  const [cardUserFilterEmail, setCardUserFilterEmail] = useState<string | null>(null);
  const [cards, setCards] = useState<DigitalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<Partial<DigitalCard> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isEditingLandingTemplate, setIsEditingLandingTemplate] = useState(false);
  const [landingTemplateSuccessMessage, setLandingTemplateSuccessMessage] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<number>(1);
  const [qrActiveTab, setQrActiveTab] = useState<'moldura' | 'forma' | 'logo'>('moldura');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpArticleId, setHelpArticleId] = useState<string | undefined>(undefined);

  // Inicia no modo de edição do modelo da Landing Page se solicitado por URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('modo') === 'landing-template' || params.get('modelo') === 'landing') {
      handleStartEditLandingTemplate();
    }
  }, []);

  const handleStartEditLandingTemplate = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSaveSuccess(false);
      const res = await fetch('/api/settings/landing-card');
      if (res.ok) {
        const template = await res.json();
        setEditingCard(template);
        setIsEditingLandingTemplate(true);
        setIsNew(false);
        setActiveTab('editor');
        setMainView('cards');
      } else {
        throw new Error('Não foi possível carregar o modelo da Landing Page.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar modelo da landing page.');
    } finally {
      setLoading(false);
    }
  };

  const handleExitLandingTemplate = () => {
    setIsEditingLandingTemplate(false);
    if (cards.length > 0) {
      setEditingCard(cards[0]);
      loadCardDetails(cards[0].id);
    } else {
      handleNewCard();
    }
  };

  const handleSetCurrentAsLandingTemplate = async () => {
    if (!editingCard) return;
    const confirmMsg = `Deseja definir este cartão ("${editingCard.name || 'Sem nome'}") como o Modelo Oficial de Demonstração na Landing Page?`;
    if (!confirm(confirmMsg)) return;

    try {
      setSaving(true);
      const res = await fetch('/api/settings/landing-card', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCard),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao definir modelo da landing page.');

      broadcastCardUpdate({ ...(editingCard as DigitalCard), slug: editingCard.slug || 'jurandir-hora' });
      setSaveSuccess(true);
      setLandingTemplateSuccessMessage(`O cartão "${editingCard.name}" foi promovido com sucesso para Modelo Oficial da Landing Page!`);
      setTimeout(() => setLandingTemplateSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao definir cartão como modelo.');
    } finally {
      setSaving(false);
    }
  };

  // Métricas e mensagens do cartão selecionado
  const [metrics, setMetrics] = useState<CardMetrics | null>(null);
  const [inquiries, setInquiries] = useState<DigitalCardInquiry[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'metrics' | 'inquiries'>('editor');
  const [showPreview, setShowPreview] = useState(true);

  // Carrega todos os cartões (Supabase DB se autenticado, com fallback local)
  const fetchCards = async () => {
    try {
      setLoading(true);
      let cardsData: DigitalCard[] = [];

      if (user) {
        const client = await initSupabase();
        if (client) {
          const { data, error } = await client
            .from('digital_cards')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            cardsData = data.map(mapDbToDigitalCard);
          }
        }
      }

      // Se não há dados do Supabase ou usuário não autenticado, utiliza API local
      if (cardsData.length === 0 && !user) {
        const res = await fetch('/api/cards');
        if (res.ok) {
          cardsData = await res.json();
        }
      }

      setCards(cardsData);
      if (cardsData.length > 0 && !editingCard) {
        setEditingCard(cardsData[0]);
        loadCardDetails(cardsData[0].id);
      } else if (cardsData.length === 0 && user && !editingCard) {
        handleNewCard();
      }
    } catch (err) {
      console.error('Erro ao carregar cartões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  const loadCardDetails = async (cardId: number) => {
    try {
      const [resMetrics, resInquiries] = await Promise.all([
        fetch(`/api/cards/${cardId}/metrics`),
        fetch(`/api/cards/${cardId}/inquiries`),
      ]);
      if (resMetrics.ok) setMetrics(await resMetrics.json());
      if (resInquiries.ok) setInquiries(await resInquiries.json());
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
    }
  };

  const displayedCards = cardUserFilter
    ? cards.filter(
        (c) =>
          String(c.userId) === String(cardUserFilter) ||
          (c as any).user_id === cardUserFilter
      )
    : cards;

  const handleSelectCard = (c: DigitalCard) => {
    setEditingCard({ ...c });
    setIsNew(false);
    setSaveSuccess(false);
    setErrorMessage(null);
    loadCardDetails(c.id);
  };

  const handleNewCard = () => {
    const newTemplate: Partial<DigitalCard> = {
      name: '',
      slug: '',
      jobTitle: '',
      brandName: 'Átomos Infinity',
      status: 'ativo',
      phone: '',
      email: '',
      whatsappPhone: '',
      websiteUrl: '',
      address: '',
      city: '',
      state: '',
      summary: '',
      aiAgentUrl: '',
      aiAgentButtonText: 'Atendente Virtual',
      aiAgentButtonColor: '#7C3AED',
      aiAgentGlowEnabled: true,
      aiAgentGlowIntensity: 'medio',
      aiAgentButtonSize: 'padrao',
      aiAgentButtonPaddingY: 12,
      aiAgentButtonBorderWidth: 0,
      aiAgentButtonBorderColor: '#A855F7',
      siteAiAgentEnabled: false,
      appearanceTheme: 'padrao',
      backgroundColor: '#12375B',
      headerOpacity: 100,
      buttonColor: '#1A7FBE',
      bodyColor: '#EAF1F7',
      contentColor: '#FFFFFF',
      contentOpacity: 100,
      supportTextColor: '#64748B',
      summaryTextColor: '',
      qrCodeTextColor: '#1E293B',
      qrCodeSectionBgColor: '',
      fontFamily: 'sans',
      contentBackgroundImageUrl: '',
      contentBackgroundImageFocusX: 50,
      contentBackgroundImageFocusY: 50,
      contentBackgroundImageOpacity: 100,
      qrCodeStyle: 'quadrado',
      qrCodeForegroundColor: '#12375B',
      qrCodeBackgroundColor: '#FFFFFF',
      frameScale: 97,
      companyLogoFocusX: 56,
      companyLogoFocusY: 67,
      ctaLabel: '',
      ctaUrl: '',
      footerText: 'Cartão digital disponibilizado por Átomos Infinity',
      inquiryEnabled: true,
      activityTrackingEnabled: true,
    };
    setEditingCard(newTemplate);
    setIsNew(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    setActiveAccordion(1);
    setActiveTab('editor');
  };

  const handleThemeSelect = (themeKey: string) => {
    const preset = PRESET_THEMES[themeKey];
    if (preset && editingCard) {
      setEditingCard({
        ...editingCard,
        appearanceTheme: themeKey,
        backgroundColor: preset.backgroundColor,
        buttonColor: preset.buttonColor,
        bodyColor: preset.bodyColor,
        contentColor: preset.contentColor,
      });
    }
  };

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem selecionada é muito grande. Por favor selecione uma imagem de até 8MB.');
      return;
    }

    if (user) {
      try {
        const assetUrl = await uploadCardAsset(file, user.id, 'backgrounds');
        setEditingCard({
          ...editingCard,
          contentBackgroundImageUrl: assetUrl,
          contentBackgroundImageFocusX: editingCard.contentBackgroundImageFocusX ?? 50,
          contentBackgroundImageFocusY: editingCard.contentBackgroundImageFocusY ?? 50,
          contentBackgroundImageOpacity: editingCard.contentBackgroundImageOpacity ?? 100,
          appearanceTheme: 'personalizado',
        });
        return;
      } catch (err) {
        console.warn('Fallback base64 para imagem de fundo:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditingCard({
        ...editingCard,
        contentBackgroundImageUrl: result,
        contentBackgroundImageFocusX: editingCard.contentBackgroundImageFocusX ?? 50,
        contentBackgroundImageFocusY: editingCard.contentBackgroundImageFocusY ?? 50,
        contentBackgroundImageOpacity: editingCard.contentBackgroundImageOpacity ?? 100,
        appearanceTheme: 'personalizado',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleMobileIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem selecionada é muito grande. Por favor selecione uma imagem de até 8MB.');
      return;
    }

    if (user) {
      try {
        const assetUrl = await uploadCardAsset(file, user.id, 'icons');
        setEditingCard({
          ...editingCard,
          mobileIconUrl: assetUrl,
        });
        return;
      } catch (err) {
        console.warn('Fallback base64 para ícone mobile:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditingCard({
        ...editingCard,
        mobileIconUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem selecionada é muito grande. Por favor selecione uma imagem de até 8MB.');
      return;
    }

    if (user) {
      try {
        const assetUrl = await uploadCardAsset(file, user.id, 'photos');
        setEditingCard({
          ...editingCard,
          imageUrl: assetUrl,
        });
        return;
      } catch (err) {
        console.warn('Fallback base64 para foto de perfil:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditingCard({
        ...editingCard,
        imageUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem selecionada é muito grande. Por favor selecione uma imagem de até 8MB.');
      return;
    }

    if (user) {
      try {
        const assetUrl = await uploadCardAsset(file, user.id, 'logos');
        setEditingCard({
          ...editingCard,
          companyLogoUrl: assetUrl,
        });
        return;
      } catch (err) {
        console.warn('Fallback base64 para logotipo:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditingCard({
        ...editingCard,
        companyLogoUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFocusReticleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editingCard) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const focusX = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));
    const focusY = Math.round(Math.max(0, Math.min(100, (clickY / rect.height) * 100)));
    setEditingCard({
      ...editingCard,
      contentBackgroundImageFocusX: focusX,
      contentBackgroundImageFocusY: focusY,
      appearanceTheme: 'personalizado',
    });
  };

  // Notifica outras abas abertas em tempo real sobre alterações no cartão
  const broadcastCardUpdate = (card: DigitalCard) => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('digital_cards_sync');
        ch.postMessage({ type: 'CARD_UPDATED', slug: card.slug, card, timestamp: Date.now() });
        ch.close();
      }
    } catch (e) {
      console.warn('Erro no BroadcastChannel:', e);
    }

    try {
      localStorage.setItem(
        'digital_card_synced',
        JSON.stringify({ slug: card.slug, timestamp: Date.now(), card })
      );
    } catch (e) {}
  };

  // Auto-save debounced quando editingCard muda (se não for novo)
  useEffect(() => {
    if (!editingCard || (isNew && !isEditingLandingTemplate)) return;
    const timer = setTimeout(async () => {
      try {
        if (isEditingLandingTemplate) {
          const res = await fetch('/api/settings/landing-card', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingCard),
          });
          if (res.ok) {
            const json = await res.json();
            broadcastCardUpdate(json.template || (editingCard as DigitalCard));
          }
          return;
        }

        let updated: DigitalCard | null = null;
        if (user) {
          const client = await initSupabase();
          if (client) {
            const dbPayload = mapDigitalCardToDb(editingCard, user.id);
            const { data, error } = await client
              .from('digital_cards')
              .update(dbPayload)
              .eq('id', editingCard.id)
              .select()
              .single();
            if (!error && data) {
              updated = mapDbToDigitalCard(data);
            }
          }
        }

        if (!updated) {
          const res = await fetch(`/api/cards/${editingCard.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingCard),
          });
          if (res.ok) {
            updated = await res.json();
          }
        }

        if (updated) {
          broadcastCardUpdate(updated);
        }
      } catch (err) {
        console.error('Erro no auto-save:', err);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [editingCard]);

  const handleOpenPublicPage = async (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    if (editingCard && !isNew && editingCard.id) {
      try {
        const res = await fetch(`/api/cards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingCard),
        });
        if (res.ok) {
          const updated = await res.json();
          broadcastCardUpdate(updated);
        }
      } catch (err) {
        console.error('Erro ao salvar antes de abrir:', err);
      }
    }
    const targetName = `digital_card_public_${slug.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const win = window.open(`/cartao/${slug}?_t=${Date.now()}`, targetName);
    if (win && !win.closed) {
      try {
        win.focus();
      } catch (e) {}
    }
  };

  const handleResetToDefault = async () => {
    if (!editingCard) return;
    setResetting(true);
    setErrorMessage(null);

    // Se estiver editando o modelo da landing page, usa o reset oficial de fábrica
    if (isEditingLandingTemplate) {
      try {
        const res = await fetch('/api/settings/landing-card/reset', { method: 'POST' });
        const json = await res.json();
        if (res.ok && json.template) {
          setEditingCard(json.template);
          setSaveSuccess(true);
          setLandingTemplateSuccessMessage('Modelo padrão da Landing Page restaurado para as configurações de fábrica!');
          broadcastCardUpdate(json.template);
          setTimeout(() => setLandingTemplateSuccessMessage(null), 6000);
        }
      } catch (err: any) {
        console.error('Erro ao restaurar modelo da landing page:', err);
        setErrorMessage('Erro ao restaurar modelo da landing page.');
      } finally {
        setResetting(false);
        setShowResetModal(false);
      }
      return;
    }

    const resetData: Partial<DigitalCard> = {
      ...editingCard,
      // Remove todas as imagens (foto, logo, imagem de fundo e ícone do app)
      imageUrl: '',
      imageKey: '',
      companyLogoUrl: '',
      companyLogoKey: '',
      contentBackgroundImageUrl: '',
      contentBackgroundImageKey: '',
      mobileIconUrl: '',
      mobileIconKey: '',

      // Restaura a estrutura visual e paleta básica original
      appearanceTheme: 'padrao',
      backgroundColor: '#12375B',
      headerOpacity: 100,
      buttonColor: '#1A7FBE',
      bodyColor: '#EAF1F7',
      contentColor: '#FFFFFF',
      contentOpacity: 100,

      // Arredondamento e cores dos botões de ação restaurados para o padrão
      buttonsBorderRadius: 16,
      vcardButtonColor: '#1A7FBE',
      vcardButtonTextColor: '#FFFFFF',
      vcardButtonBorderRadius: undefined,
      whatsappButtonColor: '#059669',
      whatsappButtonTextColor: '#FFFFFF',
      whatsappButtonBorderRadius: undefined,
      pwaButtonColor: '#0F172A',
      pwaButtonTextColor: '#FFFFFF',
      pwaButtonBorderRadius: undefined,
      aiAgentButtonColor: '#7C3AED',
      aiAgentButtonTextColor: '#FFFFFF',
      aiAgentButtonBorderRadius: undefined,

      // Tipografia e textos secundários restaurados
      fontFamily: 'sans',
      supportTextColor: '#64748B',
      summaryTextColor: '',
      qrCodeTextColor: '',
      qrCodeSectionBgColor: '',
      inquiryTextColor: '',
      dividerColor: '',
      contactIconColor: '',

      // QR Code básico
      qrCodeStyle: 'arredondado',
      qrCodeForegroundColor: '#12375B',
      qrCodeBackgroundColor: '#FFFFFF',
      qrCodeLogoUrl: '',
      qrCodeLogoKey: '',
      qrCodeIncludeLogo: false,
      qrCodeGradientEnabled: false,
      qrCodeTransparentBg: false,

      // Moldura e posições
      frameScale: 97,
      companyLogoFocusX: 50,
      companyLogoFocusY: 50,
      contentBackgroundImageFocusX: 50,
      contentBackgroundImageFocusY: 50,
      contentBackgroundImageOpacity: 100,
      contentBackgroundImageScale: 100,

      // Primeiro contato / Formulário Enviar uma mensagem
      inquiryEnabled: true,
      hideInquiryForm: false,
      inquiryShowName: true,
      inquiryShowEmail: true,
      inquiryShowPhone: true,
      inquiryShowMessage: true,
      inquiryShowConsent: true,
    };

    try {
      if (!isNew && editingCard.id) {
        const res = await fetch(`/api/cards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resetData),
        });
        if (res.ok) {
          const updated = await res.json();
          setEditingCard(updated);
          broadcastCardUpdate(updated);
          await fetchCards();
        } else {
          setEditingCard(resetData);
        }
      } else {
        setEditingCard(resetData);
      }

      setSaveSuccess(true);
      setShowResetModal(false);
    } catch (err: any) {
      console.error('Erro ao restaurar padrão:', err);
      setErrorMessage('Erro ao restaurar o cartão para o padrão.');
    } finally {
      setResetting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      // Se estiver no modo de edição do modelo da Landing Page
      if (isEditingLandingTemplate) {
        const res = await fetch('/api/settings/landing-card', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingCard),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erro ao salvar modelo da landing page.');

        setSaveSuccess(true);
        setLandingTemplateSuccessMessage('Modelo padrão da Landing Page salvo e publicado com sucesso!');
        if (json.template) {
          setEditingCard(json.template);
        }
        broadcastCardUpdate(json.template || (editingCard as DigitalCard));
        setTimeout(() => setLandingTemplateSuccessMessage(null), 6000);
        return;
      }

      let savedCard: DigitalCard;

      if (user) {
        const client = await initSupabase();
        if (!client) throw new Error('Supabase não inicializado.');

        const dbPayload = mapDigitalCardToDb(editingCard, user.id);

        if (isNew || !editingCard.id) {
          const { data, error } = await client
            .from('digital_cards')
            .insert([dbPayload])
            .select()
            .single();
          if (error) throw error;
          savedCard = mapDbToDigitalCard(data);
        } else {
          const { data, error } = await client
            .from('digital_cards')
            .update(dbPayload)
            .eq('id', editingCard.id)
            .select()
            .single();
          if (error) throw error;
          savedCard = mapDbToDigitalCard(data);
        }
      } else {
        // Fallback local API
        const url = isNew ? '/api/cards' : `/api/cards/${editingCard.id}`;
        const method = isNew ? 'POST' : 'PUT';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingCard),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Erro ao salvar cartão.');
        }
        savedCard = json;
      }

      setSaveSuccess(true);
      setIsNew(false);
      setEditingCard(savedCard);
      broadcastCardUpdate(savedCard);
      await fetchCards();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCardStatus = async (c: DigitalCard) => {
    const newStatus = c.status === 'ativo' ? 'pausado' : 'ativo';
    try {
      if (user) {
        const client = await initSupabase();
        if (client) {
          const { data, error } = await client
            .from('digital_cards')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', c.id)
            .select()
            .single();
          if (!error && data) {
            const updated = mapDbToDigitalCard(data);
            if (editingCard?.id === c.id) {
              setEditingCard(updated);
            }
            broadcastCardUpdate(updated);
            await fetchCards();
            return;
          }
        }
      }

      const res = await fetch(`/api/cards/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...c, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (editingCard?.id === c.id) {
          setEditingCard(updated);
        }
        broadcastCardUpdate(updated);
        await fetchCards();
      }
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm('Tem certeza de que deseja excluir este cartão? O slug será liberado.')) return;
    try {
      if (user) {
        const client = await initSupabase();
        if (client) {
          const { error } = await client
            .from('digital_cards')
            .delete()
            .eq('id', id);
          if (error) throw error;
        }
      } else {
        await fetch(`/api/cards/${id}`, { method: 'DELETE' });
      }
      await fetchCards();
      if (editingCard?.id === id) {
        setEditingCard(null);
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-xs transition-colors">
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-3 min-h-[4.25rem] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center font-bold shadow-md shadow-sky-700/20 shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight whitespace-nowrap">
                  Painel de Cartões Digitais
                </h1>
                {isMaster && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs shrink-0">
                    <Crown size={12} className="text-amber-500" />
                    Master
                  </span>
                )}
                {!isMaster && role === 'admin' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
                    <Shield size={12} className="text-blue-500" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px] sm:max-w-[320px]">
                {user ? `Conectado como ${user.email}` : 'Gestão profissional e métricas'}
              </p>
            </div>
          </div>

          {/* Navegação entre Cartões, Modelo Landing Page e Gestão de Usuários (Master & Admin) */}
          {isAdminOrMaster && (
            <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsEditingLandingTemplate(false);
                  setMainView('cards');
                  if (cards.length > 0 && (!editingCard || isEditingLandingTemplate)) {
                    setEditingCard(cards[0]);
                    loadCardDetails(cards[0].id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mainView === 'cards' && !isEditingLandingTemplate
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>Cartões ({cards.length})</span>
              </button>

              {isMaster && (
                <button
                  type="button"
                  onClick={handleStartEditLandingTemplate}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isEditingLandingTemplate
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/40'
                  }`}
                  title="Editar o modelo de demonstração que aparece na Landing Page"
                >
                  <Sparkles size={14} className={isEditingLandingTemplate ? 'text-amber-300' : 'text-purple-600 dark:text-purple-400'} />
                  <span>Modelo Landing Page</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-100 font-black">
                    Demo
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsEditingLandingTemplate(false);
                  setMainView('users');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mainView === 'users'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Gestão de Usuários</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 font-extrabold">
                  Master
                </span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setHelpArticleId(undefined);
                setHelpModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 transition-colors shadow-xs cursor-pointer"
              title="Abrir Central de Ajuda e Documentação do Software"
            >
              <BookOpen size={15} className="text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Ajuda & Docs</span>
            </button>

            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
              title="Ir para a Página Inicial / Landing Page"
            >
              <Home size={15} className="text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Página Inicial</span>
            </a>

            <ThemeToggle variant="header" />

            <button
              type="button"
              onClick={handleNewCard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Cartão</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Sair da Conta (Logout)"
              >
                <LogOut size={15} />
                <span className="hidden md:inline">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navegação para Telas Menores que XL (Master & Admin) */}
      {isAdminOrMaster && (
        <div className="xl:hidden max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 pt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setIsEditingLandingTemplate(false);
              setMainView('cards');
              if (cards.length > 0 && (!editingCard || isEditingLandingTemplate)) {
                setEditingCard(cards[0]);
                loadCardDetails(cards[0].id);
              }
            }}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
              mainView === 'cards' && !isEditingLandingTemplate
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers size={14} />
            <span>Cartões ({cards.length})</span>
          </button>

          {isMaster && (
            <button
              type="button"
              onClick={handleStartEditLandingTemplate}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
                isEditingLandingTemplate
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              }`}
            >
              <Sparkles size={14} className={isEditingLandingTemplate ? 'text-amber-300' : 'text-purple-600'} />
              <span>Modelo Demo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsEditingLandingTemplate(false);
              setMainView('users');
            }}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
              mainView === 'users'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Crown size={14} />
            <span>Usuários</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {mainView === 'users' && isAdminOrMaster ? (
          <AdminUsersManager
            onSelectUserCards={(userId, email) => {
              setCardUserFilter(userId);
              setCardUserFilterEmail(email);
              setMainView('cards');
            }}
            onBackToCards={() => setMainView('cards')}
          />
        ) : (
          <>
            {/* Banner de filtro de usuário pelo Master se ativo */}
            {cardUserFilter && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3 text-xs font-semibold text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Filtro Master ativo: exibindo cartões vinculados a <strong>{cardUserFilterEmail}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCardUserFilter(null);
                    setCardUserFilterEmail(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition shadow-xs cursor-pointer"
                >
                  Ver Todos os Cartões ({cards.length})
                </button>
              </div>
            )}

            {/* Lista Horizontal de Cartões */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {cardUserFilter
                    ? `Cartões de ${cardUserFilterEmail} (${displayedCards.length})`
                    : isMaster
                    ? `Todos os Cartões da Plataforma (${displayedCards.length})`
                    : `Seus Cartões Ativos (${displayedCards.length})`}
                </h2>

                {isMaster && !cardUserFilter && (
                  <button
                    type="button"
                    onClick={() => setMainView('users')}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Users size={13} />
                    <span>Gerenciar Usuários & Planos</span>
                  </button>
                )}
              </div>

              {displayedCards.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                  Nenhum cartão cadastrado nesta visualização.{' '}
                  <button
                    type="button"
                    onClick={handleNewCard}
                    className="text-sky-600 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Clique aqui para criar um novo cartão.
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayedCards.map((c) => {
                    const isSelected = editingCard?.id === c.id && !isNew;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCard(c)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800 relative ${
                          isSelected
                            ? 'border-sky-600 ring-2 ring-sky-600/20 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border dark:border-slate-600">
                            {c.imageUrl ? (
                              <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-xs">
                                {c.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              /cartao/{c.slug}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardStatus(c);
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'ativo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.status === 'ativo' ? <Eye size={11} /> : <EyeOff size={11} />}
                            <span>{c.status === 'ativo' ? 'Ativo' : 'Pausado'}</span>
                          </button>

                          <a
                            href={`/cartao/${c.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => handleOpenPublicPage(e, c.slug)}
                            className="text-sky-600 hover:text-sky-700 flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <span>Abrir</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

        {/* Área de Edição e Pré-Visualização */}
        {editingCard && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda: Formulário em Acordeão */}
            <div className={`${showPreview ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs transition-all duration-300`}>
              {/* Tabs de Ação (Editor / Métricas / Mensagens) + Botão Recolher/Expandir Mockup */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-4 mb-5 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'editor'
                      ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Edit size={14} />
                  <span>{isNew ? 'Criando Cartão' : 'Configurações'}</span>
                </button>

                {!isNew && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('metrics')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === 'metrics'
                          ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <BarChart3 size={14} />
                      <span>Métricas Anônimas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('inquiries')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === 'inquiries'
                          ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <MessageSquare size={14} />
                      <span>Mensagens ({inquiries.length})</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setHelpArticleId('02-passo-a-passo');
                    setHelpModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/50 transition-colors cursor-pointer"
                  title="Abrir Guia Passo a Passo de Criação de Cartões"
                >
                  <HelpCircle size={14} className="text-sky-600" />
                  <span>Guia de Criação</span>
                </button>

                {/* Botões de Ação de Barra Superior */}
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                  {isMaster && !isEditingLandingTemplate && (
                    <button
                      type="button"
                      onClick={handleSetCurrentAsLandingTemplate}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-all cursor-pointer shadow-xs"
                      title="Copiar as configurações e imagens deste cartão para ser o modelo oficial da Landing Page"
                    >
                      <Sparkles size={13} className="text-purple-600" />
                      <span>Definir como Modelo da Home</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                    title={isEditingLandingTemplate ? "Restaurar o modelo da Landing Page para o padrão de fábrica" : "Voltar o cartão ao estado original sem imagens e com a estrutura básica"}
                  >
                    <RotateCcw size={13} className="text-slate-500 dark:text-slate-400" />
                    <span>{isEditingLandingTemplate ? 'Restaurar Padrão de Fábrica' : 'Restaurar Padrão (Default)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      showPreview
                        ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                    }`}
                    title={showPreview ? 'Ocultar mockup para expandir formulário' : 'Exibir mockup na lateral'}
                  >
                    <Smartphone size={14} />
                    <span>{showPreview ? 'Recolher Mockup' : 'Mostrar Mockup'}</span>
                  </button>
                </div>
              </div>

              {/* Banner Exclusivo: Editando Modelo da Landing Page */}
              {isEditingLandingTemplate && (
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-sky-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Crown size={12} />
                        <span>Modo Master: Modelo Padrão da Landing Page</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-snug mt-0.5">
                        As alterações feitas aqui definirão o cartão interativo, imagens, QR Code e botões da página inicial pública.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <a
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
                    >
                      <span>Ver Landing Page</span>
                      <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={handleExitLandingTemplate}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Voltar aos Meus Cartões
                    </button>
                  </div>
                </div>
              )}

              {landingTemplateSuccessMessage && (
                <div className="mb-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs flex items-center gap-2 shadow-xs">
                  <Sparkles size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="font-semibold">{landingTemplateSuccessMessage}</span>
                </div>
              )}

              {saveSuccess && !landingTemplateSuccessMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Cartão salvo com sucesso! As alterações já estão ao vivo.</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {activeTab === 'editor' && (
                <form onSubmit={handleSave} className="space-y-3">
                  {/* ACORDEÃO 1: IDENTIDADE */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 1 ? 0 : 1)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>1. Identidade do Cartão</span>
                      </div>
                      {activeAccordion === 1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 1 && (
                      <div className="p-4 space-y-3 bg-white dark:bg-slate-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              Slug da URL * (após /cartao/)
                            </label>
                            <input
                              type="text"
                              disabled={!isNew}
                              value={editingCard.slug || ''}
                              onChange={(e) =>
                                setEditingCard({ ...editingCard, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
                              }
                              placeholder="jurandir-hora"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 dark:disabled:bg-slate-900/50 disabled:text-slate-500 dark:disabled:text-slate-400"
                              required
                            />
                            {!isNew && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
                                O slug é imutável para não quebrar QR Codes físicos impressos.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              Nome do Profissional *
                            </label>
                            <input
                              type="text"
                              value={editingCard.name || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                              placeholder="Jurandir Hora"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              Cargo / Ocupação
                            </label>
                            <input
                              type="text"
                              value={editingCard.jobTitle || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, jobTitle: e.target.value })}
                              placeholder="Diretor Executivo"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              Empresa / Marca
                            </label>
                            <input
                              type="text"
                              value={editingCard.brandName || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, brandName: e.target.value })}
                              placeholder="Átomos Infinity"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Resumo Profissional
                          </label>
                          <textarea
                            rows={2}
                            value={editingCard.summary || ''}
                            onChange={(e) => setEditingCard({ ...editingCard, summary: e.target.value })}
                            placeholder="Breve biografia ou proposta de valor..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACORDEÃO 2: FOTO, LOGO E ÍCONE NO CELULAR (PWA) */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 2 ? 0 : 2)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ImageIcon size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>2. Foto, Logo da Empresa, Ícone no Celular & Favicon</span>
                      </div>
                      {activeAccordion === 2 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 2 && (
                      <div className="p-4 space-y-4 bg-white dark:bg-slate-900/40">
                        {/* Seção 1: Foto do Colaborador */}
                        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Foto do Colaborador
                            </label>
                            <div className="flex items-center gap-1.5">
                              <label className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer flex items-center gap-1 shadow-xs transition-colors">
                                <Upload size={12} />
                                <span>Carregar</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                              </label>
                              {editingCard.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setEditingCard({ ...editingCard, imageUrl: '' })}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Remover foto"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {editingCard.imageUrl ? (
                              <img
                                src={editingCard.imageUrl}
                                alt="Foto Preview"
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                                <ImageIcon size={18} />
                              </div>
                            )}
                            <input
                              type="url"
                              value={editingCard.imageUrl || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, imageUrl: e.target.value })}
                              placeholder="URL da foto (https://...)"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Foco Foto X ({editingCard.imageFocusX ?? 50}%)
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={editingCard.imageFocusX ?? 50}
                                onChange={(e) => setEditingCard({ ...editingCard, imageFocusX: parseInt(e.target.value, 10) })}
                                className="w-full cursor-pointer accent-sky-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Foco Foto Y ({editingCard.imageFocusY ?? 50}%)
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={editingCard.imageFocusY ?? 50}
                                onChange={(e) => setEditingCard({ ...editingCard, imageFocusY: parseInt(e.target.value, 10) })}
                                className="w-full cursor-pointer accent-sky-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Seção 2: Logo da Empresa (Topo, QR Code e Favicon Padrão) */}
                        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <label className="block text-[11px] font-bold text-slate-700">
                                  Logo da Empresa (Topo, QR Code & Favicon)
                                </label>
                                {editingCard.mobileIconUrl ? (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    Favicon modificado pelo Ícone de Instalação
                                  </span>
                                ) : editingCard.companyLogoUrl ? (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Favicon Ativo na Aba
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                Usado no topo, no centro do QR Code, como favicon da aba do navegador e por padrão como ícone no celular
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <label className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer flex items-center gap-1 shadow-xs transition-colors">
                                <Upload size={12} />
                                <span>Carregar</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCompanyLogoUpload}
                                  className="hidden"
                                />
                              </label>
                              {editingCard.companyLogoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setEditingCard({ ...editingCard, companyLogoUrl: '' })}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Remover logo"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {editingCard.companyLogoUrl ? (
                              <img
                                src={editingCard.companyLogoUrl}
                                alt="Logo Preview"
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 shadow-xs shrink-0 p-0.5"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                                <ImageIcon size={18} />
                              </div>
                            )}
                            <input
                              type="url"
                              value={editingCard.companyLogoUrl || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, companyLogoUrl: e.target.value })}
                              placeholder="URL da logo da empresa (https://...)"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Escala do Frame ({editingCard.frameScale || 97}%)
                              </label>
                              <input
                                type="range"
                                min="70"
                                max="120"
                                value={editingCard.frameScale || 97}
                                onChange={(e) => setEditingCard({ ...editingCard, frameScale: parseInt(e.target.value, 10) })}
                                className="w-full cursor-pointer accent-sky-600"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Foco Logo X ({editingCard.companyLogoFocusX ?? 56}%)
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={editingCard.companyLogoFocusX ?? 56}
                                onChange={(e) => setEditingCard({ ...editingCard, companyLogoFocusX: parseInt(e.target.value, 10) })}
                                className="w-full cursor-pointer accent-sky-600"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Foco Logo Y ({editingCard.companyLogoFocusY ?? 67}%)
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={editingCard.companyLogoFocusY ?? 67}
                                onChange={(e) => setEditingCard({ ...editingCard, companyLogoFocusY: parseInt(e.target.value, 10) })}
                                className="w-full cursor-pointer accent-sky-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Seção 3: ÍCONE E NOME PARA INSTALAÇÃO NO CELULAR (PWA) E FAVICON DA ABA */}
                        <div className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Smartphone size={18} className="text-sky-600 dark:text-sky-400 shrink-0" />
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                                  Instalação no Celular & Favicon da Aba do Navegador
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  O Logo da Empresa serve como favicon padrão. Ao carregar um ícone de instalação, ele modificará tanto o ícone no smartphone quanto o favicon do cartão
                                </p>
                              </div>
                            </div>

                            <div>
                              {editingCard.mobileIconUrl ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                  <Sparkles size={11} />
                                  <span>Ícone & Favicon Personalizado</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <Check size={11} />
                                  <span>Padrão: Logo da Empresa</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Pré-visualização Dupla: Ícone no Smartphone + Aba do Navegador com Favicon */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* 1. Ícone no Celular */}
                            <div className="p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3 shadow-xs">
                              <div className="relative">
                                <img
                                  src={
                                    editingCard.mobileIconUrl ||
                                    editingCard.companyLogoUrl ||
                                    editingCard.imageUrl ||
                                    '/icon-192.png'
                                  }
                                  alt="Ícone de Instalação"
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-md bg-white p-0.5 shrink-0"
                                />
                                {editingCard.mobileIconUrl && (
                                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky-500 rounded-full border-2 border-white dark:border-slate-900" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-400">
                                  Ícone no Smartphone
                                </p>
                                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate mt-0.5">
                                  {editingCard.mobileAppName ||
                                    (editingCard.brandName
                                      ? `${editingCard.name || 'Nome'} | ${editingCard.brandName}`
                                      : editingCard.name || 'Cartão Digital')}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {editingCard.mobileIconUrl ? 'Ícone personalizado' : 'Herdando Logo'}
                                </p>
                              </div>
                            </div>

                            {/* 2. Aba do Navegador com Favicon */}
                            <div className="p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-center shadow-xs">
                              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Globe size={11} className="text-sky-500 dark:text-sky-400" />
                                  Favicon na Aba
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                  {editingCard.mobileIconUrl ? 'Via Ícone Carregado' : (editingCard.companyLogoUrl ? 'Via Logo Empresa' : 'Padrão')}
                                </span>
                              </div>
                              {/* Mockup da Aba do Navegador */}
                              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                                <img
                                  src={
                                    editingCard.mobileIconUrl ||
                                    editingCard.companyLogoUrl ||
                                    editingCard.imageUrl ||
                                    '/icon-192.png'
                                  }
                                  alt="Favicon"
                                  referrerPolicy="no-referrer"
                                  className="w-4 h-4 rounded-xs object-contain bg-white shrink-0 border border-slate-200/60"
                                />
                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate flex-1">
                                  {editingCard.mobileAppName ||
                                    (editingCard.brandName
                                      ? `${editingCard.name || 'Nome'} | ${editingCard.brandName}`
                                      : editingCard.name || 'Cartão Digital')}
                                </span>
                                <span className="text-[9px] text-slate-400 shrink-0">✕</span>
                              </div>
                            </div>
                          </div>

                          {/* Controles do Ícone */}
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                Imagem do Ícone de Instalação (Atualiza também o Favicon)
                              </label>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <label className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer flex items-center gap-1 shadow-xs transition-colors">
                                  <Upload size={12} />
                                  <span>Carregar Nova Imagem</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleMobileIconUpload}
                                    className="hidden"
                                  />
                                </label>

                                {editingCard.imageUrl && editingCard.mobileIconUrl !== editingCard.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingCard({ ...editingCard, mobileIconUrl: editingCard.imageUrl })}
                                    className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Usar Foto
                                  </button>
                                )}

                                {editingCard.mobileIconUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingCard({ ...editingCard, mobileIconUrl: undefined })}
                                    className="px-2 py-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <RotateCcw size={11} />
                                    <span>Restaurar Logo da Empresa</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <input
                              type="url"
                              value={editingCard.mobileIconUrl || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, mobileIconUrl: e.target.value })}
                              placeholder={
                                editingCard.companyLogoUrl
                                  ? `Padrão: ${editingCard.companyLogoUrl}`
                                  : 'URL da imagem do ícone (https://...)'
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              O <strong>Logo da Empresa</strong> serve como favicon padrão do cartão gerado e ícone de instalação. Ao carregar uma imagem acima, você modifica tanto o ícone de instalação no celular quanto o favicon da aba do navegador.
                            </p>
                          </div>

                          {/* Nome do Aplicativo no Celular */}
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                Nome do Aplicativo no Celular / Botão de Instalação
                              </label>
                              {(!editingCard.mobileAppName ||
                                editingCard.mobileAppName !==
                                  (editingCard.brandName
                                    ? `${editingCard.name || ''} | ${editingCard.brandName}`
                                    : editingCard.name || '')) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultName = editingCard.brandName
                                      ? `${editingCard.name || ''} | ${editingCard.brandName}`
                                      : editingCard.name || '';
                                    setEditingCard({ ...editingCard, mobileAppName: defaultName });
                                  }}
                                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold cursor-pointer"
                                >
                                  Usar "{editingCard.name || 'Nome'}{editingCard.brandName ? ` | ${editingCard.brandName}` : ''}"
                                </button>
                              )}
                            </div>

                            <input
                              type="text"
                              value={editingCard.mobileAppName || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, mobileAppName: e.target.value })}
                              placeholder={
                                editingCard.brandName
                                  ? `${editingCard.name || 'Nome'} | ${editingCard.brandName}`
                                  : editingCard.name || 'Nome do Aplicativo'
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Texto do botão de ação: <em>"Instalar '{editingCard.mobileAppName || (editingCard.brandName ? `${editingCard.name || 'Nome'} | ${editingCard.brandName}` : editingCard.name || '...')}' no celular"</em>.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACORDEÃO 3: CONTATO */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 3 ? 0 : 3)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>3. Canais de Contato</span>
                      </div>
                      {activeAccordion === 3 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 3 && (
                      <div className="p-4 space-y-3 bg-white dark:bg-slate-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">WhatsApp</label>
                            <input
                              type="text"
                              value={editingCard.whatsappPhone || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, whatsappPhone: e.target.value })}
                              placeholder="+55 (15) 99625-9353"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Telefone Fixo / Celular</label>
                            <input
                              type="text"
                              value={editingCard.phone || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, phone: e.target.value })}
                              placeholder="+55 (15) 99625-9353"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">E-mail</label>
                            <input
                              type="email"
                              value={editingCard.email || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, email: e.target.value })}
                              placeholder="consultatomosinfinity@gmail.com"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Website Oficial</label>
                            <input
                              type="url"
                              value={editingCard.websiteUrl || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, websiteUrl: e.target.value })}
                              placeholder="https://consultatomosinfinity.com.br"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        {/* Atalho de Visibilidade do Formulário Enviar uma mensagem */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <Send size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />
                              <div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                  Formulário "Enviar uma mensagem"
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Captura recados e contatos de clientes no rodapé do cartão
                                </div>
                              </div>
                            </div>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={editingCard.hideInquiryForm === true || editingCard.inquiryEnabled === false}
                                onChange={(e) => {
                                  const isHidden = e.target.checked;
                                  setEditingCard({
                                    ...editingCard,
                                    hideInquiryForm: isHidden,
                                    inquiryEnabled: !isHidden,
                                  });
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                              />
                              <span>Ocultar do cartão</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACORDEÃO 4: LOCALIZAÇÃO */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 4 ? 0 : 4)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>4. Endereço e Localização</span>
                      </div>
                      {activeAccordion === 4 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 4 && (
                      <div className="p-4 space-y-3 bg-white dark:bg-slate-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Endereço</label>
                            <input
                              type="text"
                              value={editingCard.address || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, address: e.target.value })}
                              placeholder="Av. Paulista"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Número</label>
                            <input
                              type="text"
                              value={editingCard.addressNumber || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, addressNumber: e.target.value })}
                              placeholder="1000"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Cidade</label>
                            <input
                              type="text"
                              value={editingCard.city || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, city: e.target.value })}
                              placeholder="São Paulo"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Estado</label>
                            <input
                              type="text"
                              value={editingCard.state || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, state: e.target.value })}
                              placeholder="SP"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACORDEÃO 5: APARÊNCIA E CORES */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 5 ? 0 : 5)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Palette size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>5. Aparência e Cores (WCAG AA)</span>
                      </div>
                      {activeAccordion === 5 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 5 && (
                      <div className="p-4 space-y-5 bg-white dark:bg-slate-900/40">
                        {/* 1. Temas pré-definidos */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-2">
                            Temas Pré-definidos
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.keys(PRESET_THEMES).map((themeKey) => {
                              const t = PRESET_THEMES[themeKey];
                              const isCur = editingCard.appearanceTheme === themeKey;
                              return (
                                <button
                                  key={themeKey}
                                  type="button"
                                  onClick={() => handleThemeSelect(themeKey)}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    isCur ? 'border-sky-600 ring-2 ring-sky-600/20 bg-sky-50/40' : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: t.backgroundColor }} />
                                    <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: t.buttonColor }} />
                                    <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: t.bodyColor }} />
                                  </div>
                                  <div className="text-[11px] font-bold capitalize text-slate-700">
                                    {themeKey}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Cores das Camadas */}
                        <div className="pt-2 border-t border-slate-100">
                          <label className="block text-[11px] font-bold text-slate-700 mb-2">
                            Cores das Camadas
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Fundo Header */}
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Fundo Header</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={editingCard.backgroundColor || '#12375B'}
                                  onChange={(e) => setEditingCard({ ...editingCard, backgroundColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  value={editingCard.backgroundColor || '#12375B'}
                                  onChange={(e) => setEditingCard({ ...editingCard, backgroundColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>

                            {/* Fundo Cartão (atrás de botões e textos) */}
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Fundo Cartão</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={editingCard.contentColor || '#FFFFFF'}
                                  onChange={(e) => setEditingCard({ ...editingCard, contentColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  value={editingCard.contentColor || '#FFFFFF'}
                                  onChange={(e) => setEditingCard({ ...editingCard, contentColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>

                            {/* Cor do Botão */}
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Cor dos Botões</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={editingCard.buttonColor || '#1A7FBE'}
                                  onChange={(e) => setEditingCard({ ...editingCard, buttonColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  value={editingCard.buttonColor || '#1A7FBE'}
                                  onChange={(e) => setEditingCard({ ...editingCard, buttonColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>

                            {/* Fundo da Página (Body) */}
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Fundo da Página</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={editingCard.bodyColor || '#EAF1F7'}
                                  onChange={(e) => setEditingCard({ ...editingCard, bodyColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  value={editingCard.bodyColor || '#EAF1F7'}
                                  onChange={(e) => setEditingCard({ ...editingCard, bodyColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Nova Seção: Tipografia e Textos Secundários */}
                        <div className="pt-2 border-t border-slate-100">
                          <label className="block text-[11px] font-bold text-slate-700 mb-2">
                            Tipografia e Cores de Textos por Seção
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Fonte Principal</label>
                              <select
                                value={editingCard.fontFamily || 'sans'}
                                onChange={(e) => setEditingCard({ ...editingCard, fontFamily: e.target.value, appearanceTheme: 'personalizado' })}
                                className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-sky-500"
                              >
                                <option value="sans">Moderna (Padrão)</option>
                                <option value="serif">Elegante (Serif)</option>
                                <option value="mono">Técnica (Monospace)</option>
                                <option value="lato">Lato</option>
                                <option value="poppins">Poppins</option>
                                <option value="roboto">Roboto</option>
                              </select>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Cor dos Textos Gerais / Apoio</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={editingCard.supportTextColor || '#64748b'}
                                  onChange={(e) => setEditingCard({ ...editingCard, supportTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  value={editingCard.supportTextColor || '#64748b'}
                                  onChange={(e) => setEditingCard({ ...editingCard, supportTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold text-slate-600">Cor do Resumo Profissional</label>
                                <span className="text-[9px] text-slate-400">Sobre a foto/imagem</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={editingCard.summaryTextColor || editingCard.supportTextColor || '#475569'}
                                  onChange={(e) => setEditingCard({ ...editingCard, summaryTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  placeholder="Padrão apoio"
                                  value={editingCard.summaryTextColor || ''}
                                  onChange={(e) => setEditingCard({ ...editingCard, summaryTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold text-slate-600">Cor do Texto da Área QR Code</label>
                                <span className="text-[9px] text-slate-400">Título & instrução</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={editingCard.qrCodeTextColor || '#1e293b'}
                                  onChange={(e) => setEditingCard({ ...editingCard, qrCodeTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  placeholder="Ex: #1E293B"
                                  value={editingCard.qrCodeTextColor || ''}
                                  onChange={(e) => setEditingCard({ ...editingCard, qrCodeTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold text-slate-600">Cor do Formulário & Consentimento</label>
                                <span className="text-[9px] text-slate-400">Rótulos, termos e LGPD</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={editingCard.inquiryTextColor || editingCard.supportTextColor || '#1e293b'}
                                  onChange={(e) => setEditingCard({ ...editingCard, inquiryTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  placeholder="Auto contraste"
                                  value={editingCard.inquiryTextColor || ''}
                                  onChange={(e) => setEditingCard({ ...editingCard, inquiryTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                  className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                />
                                {editingCard.inquiryTextColor && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingCard({ ...editingCard, inquiryTextColor: '', appearanceTheme: 'personalizado' })}
                                    className="px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-800 border rounded bg-white shrink-0"
                                    title="Restaurar para auto contraste"
                                  >
                                    Auto
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Transparência Alpha das Cores de Fundo */}
                        <div className="pt-2 border-t border-slate-100">
                          <label className="block text-[11px] font-bold text-slate-700 mb-2">
                            Opacidade e Alpha das Cores de Fundo (Revela a Imagem)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Alpha do Fundo do Header */}
                            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span>Alpha Fundo Header (Foto e Títulos)</span>
                                <span className="font-mono text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md text-[11px]">
                                  {editingCard.headerOpacity ?? 100}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={editingCard.headerOpacity ?? 100}
                                onChange={(e) =>
                                  setEditingCard({
                                    ...editingCard,
                                    headerOpacity: Number(e.target.value),
                                    appearanceTheme: 'personalizado',
                                  })
                                }
                                className="w-full accent-sky-600 cursor-pointer"
                              />
                              <p className="text-[10px] text-slate-500 leading-tight">
                                Diminua a opacidade para que a imagem de fundo apareça atrás da foto e cabeçalho.
                              </p>
                            </div>

                            {/* Alpha do Fundo do Cartão (Conteúdo/Botões) */}
                            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span>Alpha Fundo Cartão (Botões e Textos)</span>
                                <span className="font-mono text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md text-[11px]">
                                  {editingCard.contentOpacity ?? 100}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={editingCard.contentOpacity ?? 100}
                                onChange={(e) =>
                                  setEditingCard({
                                    ...editingCard,
                                    contentOpacity: Number(e.target.value),
                                    appearanceTheme: 'personalizado',
                                  })
                                }
                                className="w-full accent-sky-600 cursor-pointer"
                              />
                              <p className="text-[10px] text-slate-500 leading-tight">
                                Diminua a opacidade para que a imagem de fundo apareça atrás dos botões e dados de contato.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 4. Imagem de Fundo por trás do Cartão (Via Link ou Upload do Dispositivo) */}
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Imagem de Fundo por trás do Cartão
                            </label>
                            {editingCard.contentBackgroundImageUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingCard({
                                    ...editingCard,
                                    contentBackgroundImageUrl: '',
                                    appearanceTheme: 'personalizado',
                                  })
                                }
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                              >
                                <X size={12} />
                                <span>Remover Imagem</span>
                              </button>
                            )}
                          </div>

                          {/* Controles de Entrada (Link ou Upload) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                <LinkIcon size={12} />
                                <span>Incluir via Link (URL da Imagem)</span>
                              </label>
                              <input
                                type="url"
                                placeholder="https://exemplo.com/fundo.jpg"
                                value={editingCard.contentBackgroundImageUrl || ''}
                                onChange={(e) =>
                                  setEditingCard({
                                    ...editingCard,
                                    contentBackgroundImageUrl: e.target.value,
                                    appearanceTheme: 'personalizado',
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                <Upload size={12} />
                                <span>Ou carregar do Dispositivo</span>
                              </label>
                              <label className="w-full flex items-center justify-center gap-2 px-3 py-1.5 border border-dashed border-sky-300 bg-sky-50/50 hover:bg-sky-50 rounded-xl text-xs font-bold text-sky-700 cursor-pointer transition-colors">
                                <Upload size={14} />
                                <span>Selecionar do Dispositivo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleBackgroundImageUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Quando uma imagem estiver definida: Ajuste do Ponto de Foco e Opacidade da Imagem */}
                          {editingCard.contentBackgroundImageUrl && (
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                  <Crosshair size={14} className="text-sky-600" />
                                  <span>Ajuste do Ponto de Foco da Imagem</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingCard({
                                      ...editingCard,
                                      contentBackgroundImageFocusX: 50,
                                      contentBackgroundImageFocusY: 50,
                                      appearanceTheme: 'personalizado',
                                    })
                                  }
                                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                                  title="Centralizar Ponto de Foco"
                                >
                                  <RotateCcw size={11} />
                                  <span>Centralizar (50%, 50%)</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                {/* Caixa Interativa de Ajuste 2D do Ponto de Foco */}
                                <div className="md:col-span-5 flex flex-col items-center">
                                  <div
                                    onClick={handleFocusReticleClick}
                                    className="relative w-full h-36 rounded-lg overflow-hidden border-2 border-sky-500 shadow-inner bg-slate-900 cursor-crosshair select-none group"
                                    title="Clique para posicionar o ponto focal da imagem"
                                  >
                                    <img
                                      src={editingCard.contentBackgroundImageUrl}
                                      alt="Prévia de Foco"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover pointer-events-none"
                                      style={{
                                        objectPosition: `${editingCard.contentBackgroundImageFocusX ?? 50}% ${editingCard.contentBackgroundImageFocusY ?? 50}%`,
                                      }}
                                    />
                                    {/* Mira Visual (Crosshair) */}
                                    <div
                                      className="absolute w-6 h-6 -ml-3 -mt-3 border-2 border-white rounded-full pointer-events-none shadow-md flex items-center justify-center bg-sky-500/40"
                                      style={{
                                        left: `${editingCard.contentBackgroundImageFocusX ?? 50}%`,
                                        top: `${editingCard.contentBackgroundImageFocusY ?? 50}%`,
                                      }}
                                    >
                                      <div className="w-1.5 h-1.5 bg-white rounded-full shadow-xs" />
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-slate-500 mt-1">
                                    Clique na imagem acima para mover a mira
                                  </span>
                                </div>

                                {/* Sliders Numéricos de Ponto de Foco e Opacidade */}
                                <div className="md:col-span-7 space-y-2.5">
                                  {/* Foco Horizontal (X) */}
                                  <div>
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                                      <span>Foco Horizontal (X)</span>
                                      <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 border rounded">
                                        {editingCard.contentBackgroundImageFocusX ?? 50}%
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={0}
                                      max={100}
                                      value={editingCard.contentBackgroundImageFocusX ?? 50}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          contentBackgroundImageFocusX: Number(e.target.value),
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full accent-sky-600 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-400">
                                      <span>0% (Esquerda)</span>
                                      <span>50% (Centro)</span>
                                      <span>100% (Direita)</span>
                                    </div>
                                  </div>

                                  {/* Foco Vertical (Y) */}
                                  <div>
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                                      <span>Foco Vertical (Y)</span>
                                      <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 border rounded">
                                        {editingCard.contentBackgroundImageFocusY ?? 50}%
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={0}
                                      max={100}
                                      value={editingCard.contentBackgroundImageFocusY ?? 50}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          contentBackgroundImageFocusY: Number(e.target.value),
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full accent-sky-600 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-400">
                                      <span>0% (Topo)</span>
                                      <span>50% (Centro)</span>
                                      <span>100% (Base)</span>
                                    </div>
                                  </div>

                                  {/* Opacidade da Imagem */}
                                  <div>
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                                      <span>Opacidade da Imagem de Fundo</span>
                                       <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 border rounded">
                                         {editingCard.contentBackgroundImageOpacity ?? 100}%
                                       </span>
                                     </div>
                                     <input
                                       type="range"
                                       min={0}
                                       max={100}
                                       value={editingCard.contentBackgroundImageOpacity ?? 100}
                                       onChange={(e) =>
                                         setEditingCard({
                                           ...editingCard,
                                           contentBackgroundImageOpacity: Number(e.target.value),
                                           appearanceTheme: 'personalizado',
                                         })
                                       }
                                       className="w-full accent-sky-600 cursor-pointer"
                                     />
                                   </div>

                                   {/* Zoom / Escala da Imagem */}
                                   <div>
                                     <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                                       <span>Zoom / Escala da Imagem</span>
                                       <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 border rounded">
                                         {editingCard.contentBackgroundImageScale ?? 100}%
                                       </span>
                                     </div>
                                     <input
                                       type="range"
                                       min={50}
                                       max={250}
                                       step={5}
                                       value={editingCard.contentBackgroundImageScale ?? 100}
                                       onChange={(e) =>
                                         setEditingCard({
                                           ...editingCard,
                                           contentBackgroundImageScale: Number(e.target.value),
                                           appearanceTheme: 'personalizado',
                                         })
                                       }
                                       className="w-full accent-sky-600 cursor-pointer"
                                     />
                                     <div className="flex justify-between text-[9px] text-slate-400">
                                       <span>50% (Zoom Out)</span>
                                       <span>100% (Normal)</span>
                                       <span>250% (Zoom In)</span>
                                     </div>

                                </div>
                              </div>
                            </div>
                            </div>
                          )}
                        </div>

                        {/* 5. Personalização dos Botões de Ação (Arredondamento e Cores) */}
                        <div className="pt-3 border-t border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-xs font-bold text-slate-800">
                                Personalização dos Botões de Ação
                              </label>
                              <p className="text-[11px] text-slate-500">
                                Ajuste o arredondamento dos cantos e personalize individualmente as cores de cada botão de ação.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCard({
                                  ...editingCard,
                                  buttonsBorderRadius: 16,
                                  vcardButtonColor: undefined,
                                  vcardButtonTextColor: undefined,
                                  vcardButtonBorderRadius: undefined,
                                  whatsappButtonColor: undefined,
                                  whatsappButtonTextColor: undefined,
                                  whatsappButtonBorderRadius: undefined,
                                  pwaButtonColor: undefined,
                                  pwaButtonTextColor: undefined,
                                  pwaButtonBorderRadius: undefined,
                                  aiAgentButtonColor: '#7C3AED',
                                  aiAgentButtonTextColor: undefined,
                                  aiAgentButtonBorderRadius: undefined,
                                  appearanceTheme: 'personalizado',
                                });
                              }}
                              className="text-[10px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1 bg-white hover:bg-slate-50 cursor-pointer"
                              title="Restaurar estilos e cantos padrões dos botões"
                            >
                              <RotateCcw size={11} />
                              <span>Restaurar Botões</span>
                            </button>
                          </div>

                          {/* Arredondamento Geral dos Botões (Border Radius) */}
                          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">
                                Arredondamento Geral dos Botões
                              </span>
                              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                                {editingCard.buttonsBorderRadius ?? 16}px
                              </span>
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={40}
                              step={1}
                              value={editingCard.buttonsBorderRadius ?? 16}
                              onChange={(e) =>
                                setEditingCard({
                                  ...editingCard,
                                  buttonsBorderRadius: Number(e.target.value),
                                  appearanceTheme: 'personalizado',
                                })
                              }
                              className="w-full accent-sky-600 cursor-pointer"
                            />

                            {/* Presets Rápidos de Arredondamento */}
                            <div className="flex items-center flex-wrap gap-1.5 pt-1">
                              {[
                                { label: 'Reto (0px)', radius: 0 },
                                { label: 'Suave (8px)', radius: 8 },
                                { label: 'Padrão (16px)', radius: 16 },
                                { label: 'Redondo (24px)', radius: 24 },
                                { label: 'Pílula (99px)', radius: 99 },
                              ].map((preset) => {
                                const isCurrent = (editingCard.buttonsBorderRadius ?? 16) === preset.radius;
                                return (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() =>
                                      setEditingCard({
                                        ...editingCard,
                                        buttonsBorderRadius: preset.radius,
                                        appearanceTheme: 'personalizado',
                                      })
                                    }
                                    className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                                      isCurrent
                                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {preset.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Grid dos 4 Botões com Controles Individuais */}
                          <div className="space-y-3">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Cores e Ajustes por Botão de Ação
                            </label>

                            {/* 1. Botão: Salvar contato no celular */}
                            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                                    <Download size={13} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">
                                    1. Salvar contato no celular (vCard)
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">Download do .vcf</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {/* Cor de Fundo */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor de Fundo</label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={editingCard.vcardButtonColor || editingCard.buttonColor || '#1A7FBE'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          vcardButtonColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.vcardButtonColor || editingCard.buttonColor || '#1A7FBE'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          vcardButtonColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Cor do Texto/Ícone */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor do Texto</label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={editingCard.vcardButtonTextColor || '#FFFFFF'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          vcardButtonTextColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.vcardButtonTextColor || '#FFFFFF'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          vcardButtonTextColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Arredondamento Individual Opcional */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-bold text-slate-500">Arredondamento</label>
                                    <span className="text-[9px] text-slate-400">
                                      {editingCard.vcardButtonBorderRadius !== undefined
                                        ? `${editingCard.vcardButtonBorderRadius}px`
                                        : `Global (${editingCard.buttonsBorderRadius ?? 16}px)`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={99}
                                      placeholder={`Padrão (${editingCard.buttonsBorderRadius ?? 16})`}
                                      value={editingCard.vcardButtonBorderRadius ?? ''}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          vcardButtonBorderRadius: e.target.value === '' ? undefined : Number(e.target.value),
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-2 py-1 text-[11px] border rounded bg-white"
                                    />
                                    {editingCard.vcardButtonBorderRadius !== undefined && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingCard({
                                            ...editingCard,
                                            vcardButtonBorderRadius: undefined,
                                            appearanceTheme: 'personalizado',
                                          })
                                        }
                                        className="p-1 text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                                        title="Usar raio global"
                                      >
                                        <X size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. Botão: Compartilhar no WhatsApp */}
                            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <Share2 size={13} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">
                                    2. Compartilhar no WhatsApp
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">Envio direto wa.me</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {/* Cor de Fundo */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor de Fundo</label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={editingCard.whatsappButtonColor || '#059669'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          whatsappButtonColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.whatsappButtonColor || '#059669'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          whatsappButtonColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Cor do Texto/Ícone */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor do Texto</label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={editingCard.whatsappButtonTextColor || '#FFFFFF'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          whatsappButtonTextColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.whatsappButtonTextColor || '#FFFFFF'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          whatsappButtonTextColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Arredondamento Individual Opcional */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-bold text-slate-500">Arredondamento</label>
                                    <span className="text-[9px] text-slate-400">
                                      {editingCard.whatsappButtonBorderRadius !== undefined
                                        ? `${editingCard.whatsappButtonBorderRadius}px`
                                        : `Global (${editingCard.buttonsBorderRadius ?? 16}px)`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={99}
                                      placeholder={`Padrão (${editingCard.buttonsBorderRadius ?? 16})`}
                                      value={editingCard.whatsappButtonBorderRadius ?? ''}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          whatsappButtonBorderRadius: e.target.value === '' ? undefined : Number(e.target.value),
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-2 py-1 text-[11px] border rounded bg-white"
                                    />
                                    {editingCard.whatsappButtonBorderRadius !== undefined && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingCard({
                                            ...editingCard,
                                            whatsappButtonBorderRadius: undefined,
                                            appearanceTheme: 'personalizado',
                                          })
                                        }
                                        className="p-1 text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                                        title="Usar raio global"
                                      >
                                        <X size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 3. Botão: Instalar no celular */}
                            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                                    <Smartphone size={13} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">
                                    3. Instalar no celular (PWA / Atalho)
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">Instalação direta</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {/* Cor de Fundo */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor de Fundo</label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={editingCard.pwaButtonColor || '#0F172A'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          pwaButtonColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.pwaButtonColor || '#0F172A'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          pwaButtonColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Cor do Texto/Ícone */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor do Texto</label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={editingCard.pwaButtonTextColor || '#FFFFFF'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          pwaButtonTextColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.pwaButtonTextColor || '#FFFFFF'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          pwaButtonTextColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Arredondamento Individual Opcional */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-bold text-slate-500">Arredondamento</label>
                                    <span className="text-[9px] text-slate-400">
                                      {editingCard.pwaButtonBorderRadius !== undefined
                                        ? `${editingCard.pwaButtonBorderRadius}px`
                                        : `Global (${editingCard.buttonsBorderRadius ?? 16}px)`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={99}
                                      placeholder={`Padrão (${editingCard.buttonsBorderRadius ?? 16})`}
                                      value={editingCard.pwaButtonBorderRadius ?? ''}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          pwaButtonBorderRadius: e.target.value === '' ? undefined : Number(e.target.value),
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-2 py-1 text-[11px] border rounded bg-white"
                                    />
                                    {editingCard.pwaButtonBorderRadius !== undefined && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingCard({
                                            ...editingCard,
                                            pwaButtonBorderRadius: undefined,
                                            appearanceTheme: 'personalizado',
                                          })
                                        }
                                        className="p-1 text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                                        title="Usar raio global"
                                      >
                                        <X size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 4. Botão: Atendente Virtual */}
                            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                                    <Bot size={13} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">
                                    4. Atendente Virtual (IA)
                                  </span>
                                </div>
                                <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1">
                                  <Sparkles size={11} /> {editingCard.aiAgentUrl ? 'Configurado' : 'Opcional'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {/* Cor de Fundo */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor de Fundo</label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={editingCard.aiAgentButtonColor || '#7C3AED'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          aiAgentButtonColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.aiAgentButtonColor || '#7C3AED'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          aiAgentButtonColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Cor do Texto/Ícone */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor do Texto</label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={editingCard.aiAgentButtonTextColor || '#FFFFFF'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          aiAgentButtonTextColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.aiAgentButtonTextColor || '#FFFFFF'}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          aiAgentButtonTextColor: e.target.value,
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-1.5 py-1 text-[11px] font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Arredondamento Individual Opcional */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-bold text-slate-500">Arredondamento</label>
                                    <span className="text-[9px] text-slate-400">
                                      {editingCard.aiAgentButtonBorderRadius !== undefined
                                        ? `${editingCard.aiAgentButtonBorderRadius}px`
                                        : `Global (${editingCard.buttonsBorderRadius ?? 16}px)`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={99}
                                      placeholder={`Padrão (${editingCard.buttonsBorderRadius ?? 16})`}
                                      value={editingCard.aiAgentButtonBorderRadius ?? ''}
                                      onChange={(e) =>
                                        setEditingCard({
                                          ...editingCard,
                                          aiAgentButtonBorderRadius: e.target.value === '' ? undefined : Number(e.target.value),
                                          appearanceTheme: 'personalizado',
                                        })
                                      }
                                      className="w-full px-2 py-1 text-[11px] border rounded bg-white"
                                    />
                                    {editingCard.aiAgentButtonBorderRadius !== undefined && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingCard({
                                            ...editingCard,
                                            aiAgentButtonBorderRadius: undefined,
                                            appearanceTheme: 'personalizado',
                                          })
                                        }
                                        className="p-1 text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                                        title="Usar raio global"
                                      >
                                        <X size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACORDEÃO 6: QR CODE PERSONALIZÁVEL */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 6 ? 0 : 6)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <QrCode size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>6. QR Code Personalizável (Moldura, Forma & Logo)</span>
                      </div>
                      {activeAccordion === 6 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 6 && (
                      <div className="p-4 space-y-4 bg-white dark:bg-slate-900/40">
                        {/* Sub-Abas do QR Code (Moldura | Forma | Logo) */}
                        <div className="flex border-b border-slate-200 gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => setQrActiveTab('moldura')}
                            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                              qrActiveTab === 'moldura'
                                ? 'border-sky-600 text-sky-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Scan size={14} />
                            <span>Moldura</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setQrActiveTab('forma')}
                            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                              qrActiveTab === 'forma'
                                ? 'border-sky-600 text-sky-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Sliders size={14} />
                            <span>Forma e Cores</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setQrActiveTab('logo')}
                            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                              qrActiveTab === 'logo'
                                ? 'border-sky-600 text-sky-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <ImageIcon size={14} />
                            <span>Logo Central</span>
                          </button>
                        </div>

                        {/* ABA 1: MOLDURA */}
                        {qrActiveTab === 'moldura' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-2">
                                Estilo da Moldura Externa
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { id: 'none', label: 'Sem Moldura', desc: 'Clássico limpo' },
                                  { id: 'badge_bottom', label: 'Badge Inferior', desc: 'Selo com texto abaixo' },
                                  { id: 'badge_top', label: 'Badge Superior', desc: 'Selo no topo' },
                                  { id: 'phone', label: 'Smartphone', desc: 'Mockup de celular' },
                                  { id: 'clipboard', label: 'Prancheta', desc: 'Com presilha executiva' },
                                  { id: 'polaroid', label: 'Polaroid', desc: 'Estilo moldura fotográfica' },
                                  { id: 'circular', label: 'Circular', desc: 'Aro redondo moderno' },
                                ].map((item) => {
                                  const isSelected = (editingCard.qrCodeFrameStyle || 'none') === item.id;
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => setEditingCard({ ...editingCard, qrCodeFrameStyle: item.id as any })}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-500 shadow-sm'
                                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-800">{item.label}</span>
                                        {isSelected && <Check size={14} className="text-sky-600" />}
                                      </div>
                                      <span className="text-[10px] text-slate-500 block leading-tight">{item.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Controles da Moldura (se diferente de 'none') */}
                            {(editingCard.qrCodeFrameStyle && editingCard.qrCodeFrameStyle !== 'none') && (
                              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Texto da Etiqueta / Selo
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={24}
                                    placeholder="Ex: SCAN ME, ESCANEIE-ME, MEU CONTATO"
                                    value={editingCard.qrCodeFrameText ?? 'SCAN ME'}
                                    onChange={(e) => setEditingCard({ ...editingCard, qrCodeFrameText: e.target.value })}
                                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 uppercase tracking-wider bg-white focus:ring-2 focus:ring-sky-500"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                      Cor da Moldura
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={editingCard.qrCodeFrameColor || editingCard.buttonColor || '#0F172A'}
                                        onChange={(e) => setEditingCard({ ...editingCard, qrCodeFrameColor: e.target.value })}
                                        className="w-8 h-8 rounded border cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        maxLength={7}
                                        value={editingCard.qrCodeFrameColor || editingCard.buttonColor || '#0F172A'}
                                        onChange={(e) => setEditingCard({ ...editingCard, qrCodeFrameColor: e.target.value })}
                                        className="w-24 px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setEditingCard({ ...editingCard, qrCodeFrameColor: editingCard.buttonColor || editingCard.backgroundColor || '#0F172A' })}
                                        className="text-[10px] text-sky-600 hover:underline font-medium"
                                      >
                                        Usar cor do cartão
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                      Cor do Texto da Moldura
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={editingCard.qrCodeFrameTextColor || '#FFFFFF'}
                                        onChange={(e) => setEditingCard({ ...editingCard, qrCodeFrameTextColor: e.target.value })}
                                        className="w-8 h-8 rounded border cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        maxLength={7}
                                        value={editingCard.qrCodeFrameTextColor || '#FFFFFF'}
                                        onChange={(e) => setEditingCard({ ...editingCard, qrCodeFrameTextColor: e.target.value })}
                                        className="w-24 px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ABA 2: FORMA E CORES */}
                        {qrActiveTab === 'forma' && (
                          <div className="space-y-4">
                            {/* 1. Estilo dos Módulos / Forma */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-2">
                                Estilo da Forma dos Pontos (Módulos)
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                  { id: 'square', label: 'Quadrado', desc: 'Padrão tradicional' },
                                  { id: 'dots', label: 'Pontilhado (Dots)', desc: 'Pontos circulares' },
                                  { id: 'rounded', label: 'Arredondado', desc: 'Cantos suaves' },
                                  { id: 'classy', label: 'Classy', desc: 'Estilo elegante' },
                                  { id: 'classy-rounded', label: 'Classy Arredondado', desc: 'Classy suave' },
                                  { id: 'extra-rounded', label: 'Extra Arredondado', desc: 'Cápsulas arredondadas' },
                                ].map((shape) => {
                                  const currentDots = editingCard.qrCodeDotsStyle || (
                                    editingCard.qrCodeStyle === 'arredondado' ? 'rounded' :
                                    editingCard.qrCodeStyle === 'pontilhado' ? 'dots' : 'square'
                                  );
                                  const isSelected = currentDots === shape.id;
                                  return (
                                    <button
                                      key={shape.id}
                                      type="button"
                                      onClick={() => setEditingCard({
                                        ...editingCard,
                                        qrCodeDotsStyle: shape.id as any,
                                        qrCodeStyle: shape.id === 'dots' ? 'pontilhado' : shape.id === 'rounded' ? 'arredondado' : 'quadrado',
                                      })}
                                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-500 shadow-sm'
                                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-bold text-slate-800">{shape.label}</span>
                                        {isSelected && <Check size={13} className="text-sky-600" />}
                                      </div>
                                      <span className="text-[10px] text-slate-500 block leading-tight">{shape.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 2. Cores da Forma e Fundo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              {/* Cor da Forma / Gradiente */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-[11px] font-bold text-slate-700">Cor da Forma (Módulos)</label>
                                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-slate-600">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(editingCard.qrCodeGradientEnabled)}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeGradientEnabled: e.target.checked })}
                                      className="rounded text-sky-600"
                                    />
                                    <span>Gradiente</span>
                                  </label>
                                </div>

                                {!editingCard.qrCodeGradientEnabled ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={editingCard.qrCodeForegroundColor || '#12375B'}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeForegroundColor: e.target.value })}
                                      className="w-8 h-8 rounded border cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.qrCodeForegroundColor || '#12375B'}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeForegroundColor: e.target.value })}
                                      className="w-full px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500 w-12">Início:</span>
                                      <input
                                        type="color"
                                        value={editingCard.qrCodeGradientStartColor || editingCard.qrCodeForegroundColor || '#12375B'}
                                        onChange={(e) => setEditingCard({ ...editingCard, qrCodeGradientStartColor: e.target.value })}
                                        className="w-7 h-7 rounded border cursor-pointer shrink-0"
                                      />
                                      <input
                                        type="text"
                                        maxLength={7}
                                        value={editingCard.qrCodeGradientStartColor || editingCard.qrCodeForegroundColor || '#12375B'}
                                        onChange={(e) => setEditingCard({ ...editingCard, qrCodeGradientStartColor: e.target.value })}
                                        className="w-full px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500 w-12">Fim:</span>
                                      <input
                                        type="color"
                                        value={editingCard.qrCodeGradientEndColor || '#1A7FBE'}
                                        onChange={(e) => setEditingCard({ ...editingCard, qrCodeGradientEndColor: e.target.value })}
                                        className="w-7 h-7 rounded border cursor-pointer shrink-0"
                                      />
                                      <input
                                        type="text"
                                        maxLength={7}
                                        value={editingCard.qrCodeGradientEndColor || '#1A7FBE'}
                                        onChange={(e) => setEditingCard({ ...editingCard, qrCodeGradientEndColor: e.target.value })}
                                        className="w-full px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Cor do Fundo */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-[11px] font-bold text-slate-700">Cor de Fundo</label>
                                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-slate-600">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(editingCard.qrCodeTransparentBg)}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeTransparentBg: e.target.checked })}
                                      className="rounded text-sky-600"
                                    />
                                    <span>Transparente</span>
                                  </label>
                                </div>

                                {!editingCard.qrCodeTransparentBg ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={editingCard.qrCodeBackgroundColor || '#FFFFFF'}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeBackgroundColor: e.target.value })}
                                      className="w-8 h-8 rounded border cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      value={editingCard.qrCodeBackgroundColor || '#FFFFFF'}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeBackgroundColor: e.target.value })}
                                      className="w-full px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                    />
                                  </div>
                                ) : (
                                  <div className="py-1 px-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                                    Fundo transparente ativado (adapta-se à superfície onde estiver).
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 3. Estilo e Cores dos Cantos (Borda e Centro) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              {/* Borda dos Cantos (Corners Square) */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <label className="block text-[11px] font-bold text-slate-700">
                                  Estilo da Borda dos Cantos (Olho Externo)
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[
                                    { id: 'square', label: 'Quadrado' },
                                    { id: 'extra-rounded', label: 'Arredondado' },
                                    { id: 'dot', label: 'Círculo' },
                                  ].map((opt) => {
                                    const isSel = (editingCard.qrCodeCornersSquareStyle || 'square') === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setEditingCard({ ...editingCard, qrCodeCornersSquareStyle: opt.id as any })}
                                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                                          isSel
                                            ? 'border-sky-600 bg-sky-50 text-sky-700'
                                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-1">Cor da borda dos cantos:</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={editingCard.qrCodeCornersSquareColor || editingCard.qrCodeForegroundColor || '#12375B'}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeCornersSquareColor: e.target.value })}
                                      className="w-6 h-6 rounded border cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      placeholder="Padrão módulos"
                                      value={editingCard.qrCodeCornersSquareColor || ''}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeCornersSquareColor: e.target.value })}
                                      className="w-full px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                    />
                                    {editingCard.qrCodeCornersSquareColor && (
                                      <button
                                        type="button"
                                        onClick={() => setEditingCard({ ...editingCard, qrCodeCornersSquareColor: '' })}
                                        className="text-[10px] text-slate-400 hover:text-slate-600"
                                      >
                                        Redefinir
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Centro dos Cantos (Corners Dot) */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <label className="block text-[11px] font-bold text-slate-700">
                                  Estilo do Centro dos Cantos (Pupila)
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {[
                                    { id: 'square', label: 'Quadrado' },
                                    { id: 'dot', label: 'Círculo / Ponto' },
                                  ].map((opt) => {
                                    const isSel = (editingCard.qrCodeCornersDotStyle || 'square') === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setEditingCard({ ...editingCard, qrCodeCornersDotStyle: opt.id as any })}
                                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                                          isSel
                                            ? 'border-sky-600 bg-sky-50 text-sky-700'
                                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-1">Cor do centro dos cantos:</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={editingCard.qrCodeCornersDotColor || editingCard.qrCodeForegroundColor || '#12375B'}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeCornersDotColor: e.target.value })}
                                      className="w-6 h-6 rounded border cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      maxLength={7}
                                      placeholder="Padrão módulos"
                                      value={editingCard.qrCodeCornersDotColor || ''}
                                      onChange={(e) => setEditingCard({ ...editingCard, qrCodeCornersDotColor: e.target.value })}
                                      className="w-full px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                    />
                                    {editingCard.qrCodeCornersDotColor && (
                                      <button
                                        type="button"
                                        onClick={() => setEditingCard({ ...editingCard, qrCodeCornersDotColor: '' })}
                                        className="text-[10px] text-slate-400 hover:text-slate-600"
                                      >
                                        Redefinir
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ABA 3: LOGO CENTRAL */}
                        {qrActiveTab === 'logo' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">Exibir Logo no Centro do QR Code</span>
                                <span className="text-[11px] text-slate-500">Adiciona a marca da empresa com correção de erro alta e fundo limpo</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={editingCard.qrCodeIncludeLogo !== false}
                                onChange={(e) => setEditingCard({ ...editingCard, qrCodeIncludeLogo: e.target.checked })}
                                className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                              />
                            </div>

                            {editingCard.qrCodeIncludeLogo !== false && (
                              <div className="space-y-3">
                                {/* Fonte do Logo */}
                                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Logo da Empresa (Automático)
                                  </label>
                                  {editingCard.companyLogoUrl ? (
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                      <img
                                        src={editingCard.companyLogoUrl}
                                        alt="Logo da empresa"
                                        className="w-10 h-10 object-contain rounded bg-white p-1 border shadow-xs"
                                      />
                                      <div>
                                        <span className="text-xs font-bold text-emerald-700 block">✓ Logo da Empresa Ativo</span>
                                        <span className="text-[10px] text-slate-500">Este logo cadastrado na seção 2 é inserido automaticamente no centro do QR Code.</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                                      Nenhum logo cadastrado na Seção 2 ainda. Você pode cadastrar o logo lá ou informar uma URL abaixo.
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Sobrescrever com Logo Específico do QR Code (Opcional)
                                  </label>
                                  <input
                                    type="url"
                                    value={editingCard.qrCodeLogoUrl || ''}
                                    onChange={(e) => setEditingCard({ ...editingCard, qrCodeLogoUrl: e.target.value })}
                                    placeholder="https://exemplo.com/logo-icone.png (deixe vazio para usar o logo da empresa)"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                  />
                                </div>

                                {/* Tamanho do Logo */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-slate-700">Tamanho do Logo Central</label>
                                    <span className="text-xs font-mono text-slate-600 font-bold">
                                      {Math.round((editingCard.qrCodeLogoSize ?? 0.22) * 100)}%
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.15"
                                    max="0.32"
                                    step="0.01"
                                    value={editingCard.qrCodeLogoSize ?? 0.22}
                                    onChange={(e) => setEditingCard({ ...editingCard, qrCodeLogoSize: Number(e.target.value) })}
                                    className="w-full accent-sky-600 cursor-pointer"
                                  />
                                  <div className="flex justify-between text-[9px] text-slate-400">
                                    <span>15% (Discreto)</span>
                                    <span>22% (Recomendado)</span>
                                    <span>32% (Destacado)</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Configurações da Área no Cartão (Cores da Seção) */}
                        <div className="pt-3 border-t border-slate-100">
                          <label className="block text-[11px] font-bold text-slate-700 mb-2">
                            Aparência da Seção QR Code no Cartão Digital
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                Cor do Texto da Seção
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingCard.qrCodeTextColor || '#1E293B'}
                                  onChange={(e) => setEditingCard({ ...editingCard, qrCodeTextColor: e.target.value })}
                                  className="w-7 h-7 rounded border cursor-pointer"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  placeholder="#1E293B"
                                  value={editingCard.qrCodeTextColor || ''}
                                  onChange={(e) => setEditingCard({ ...editingCard, qrCodeTextColor: e.target.value })}
                                  className="w-full px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold text-slate-600">Fundo da Seção QR Code</label>
                                {editingCard.qrCodeSectionBgColor && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingCard({ ...editingCard, qrCodeSectionBgColor: '' })}
                                    className="text-[9px] text-rose-500 hover:underline"
                                  >
                                    Transparente
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingCard.qrCodeSectionBgColor || '#FFFFFF'}
                                  onChange={(e) => setEditingCard({ ...editingCard, qrCodeSectionBgColor: e.target.value })}
                                  className="w-7 h-7 rounded border cursor-pointer"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  placeholder="Transparente"
                                  value={editingCard.qrCodeSectionBgColor || ''}
                                  onChange={(e) => setEditingCard({ ...editingCard, qrCodeSectionBgColor: e.target.value })}
                                  className="w-full px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACORDEÃO 7: REDES, MARCA & ATENDENTE VIRTUAL */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 7 ? 0 : 7)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Share2 size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>7. Redes, Marca & Atendente Virtual de IA</span>
                      </div>
                      {activeAccordion === 7 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 7 && (
                      <div className="p-4 space-y-4 bg-white dark:bg-slate-900/40">
                        {/* Redes Sociais */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700">Redes Sociais</span>
                            <span className="text-[10px] text-slate-400 font-medium">Os ícones só aparecem se o link for preenchido</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mb-3">
                            Campos em branco não farão parte da tela nem do mockup do cartão.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Instagram URL</label>
                              <input
                                type="url"
                                value={editingCard.instagramUrl || ''}
                                onChange={(e) => setEditingCard({ ...editingCard, instagramUrl: e.target.value })}
                                placeholder="https://instagram.com/..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">LinkedIn URL</label>
                              <input
                                type="url"
                                value={editingCard.linkedinUrl || ''}
                                onChange={(e) => setEditingCard({ ...editingCard, linkedinUrl: e.target.value })}
                                placeholder="https://linkedin.com/in/..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Facebook URL</label>
                              <input
                                type="url"
                                value={editingCard.facebookUrl || ''}
                                onChange={(e) => setEditingCard({ ...editingCard, facebookUrl: e.target.value })}
                                placeholder="https://facebook.com/..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">YouTube URL</label>
                              <input
                                type="url"
                                value={editingCard.youtubeUrl || ''}
                                onChange={(e) => setEditingCard({ ...editingCard, youtubeUrl: e.target.value })}
                                placeholder="https://youtube.com/@..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* CTA e Rodapé */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Texto do Botão CTA</label>
                            <input
                              type="text"
                              value={editingCard.ctaLabel || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, ctaLabel: e.target.value })}
                              placeholder="Conheça a Átomos Infinity"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Link do CTA</label>
                            <input
                              type="url"
                              value={editingCard.ctaUrl || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, ctaUrl: e.target.value })}
                              placeholder="https://consultatomosinfinity.com.br"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Texto do Rodapé</label>
                          <input
                            type="text"
                            value={editingCard.footerText || ''}
                            onChange={(e) => setEditingCard({ ...editingCard, footerText: e.target.value })}
                            placeholder="Cartão digital disponibilizado por Átomos Infinity"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        {/* SEÇÃO OBRIGATÓRIA: ATENDENTE VIRTUAL PRÓPRIO */}
                        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3">
                          <div className="flex items-center gap-2">
                            <Bot size={18} className="text-sky-700" />
                            <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                              Atendente Virtual de IA Próprio
                            </h3>
                          </div>
                          <p className="text-[11px] text-sky-800 leading-relaxed">
                            Aceita link direto do Jotform Agent, tag &lt;iframe&gt;, &lt;script&gt; ou qualquer URL de agente conversacional inteligente. <strong>Se este campo ficar em branco, o botão de Atendente Virtual não fará parte da tela do cartão.</strong>
                          </p>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Link ou Código de Incorporação
                            </label>
                            <textarea
                              rows={2}
                              value={editingCard.aiAgentUrl || ''}
                              onChange={(e) => setEditingCard({ ...editingCard, aiAgentUrl: e.target.value })}
                              placeholder="Cole o link do seu Atendente Virtual (ex: https://agent.jotform.com/...) ou o código <iframe>"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Texto do Botão (máx. 80 chars)
                              </label>
                              <input
                                type="text"
                                maxLength={80}
                                value={editingCard.aiAgentButtonText || 'Atendente Virtual'}
                                onChange={(e) => setEditingCard({ ...editingCard, aiAgentButtonText: e.target.value })}
                                placeholder="Atendente Virtual"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[11px] font-bold text-slate-700">
                                  Cor do Botão do Agente
                                </label>
                                <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1">
                                  <Sparkles size={11} /> {editingCard.aiAgentGlowEnabled !== false ? 'Glow Ativo' : 'Glow Inativo'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingCard.aiAgentButtonColor || '#7C3AED'}
                                  onChange={(e) => setEditingCard({ ...editingCard, aiAgentButtonColor: e.target.value })}
                                  className="w-8 h-8 rounded border cursor-pointer"
                                />
                                <input
                                  type="text"
                                  maxLength={7}
                                  value={editingCard.aiAgentButtonColor || '#7C3AED'}
                                  onChange={(e) => setEditingCard({ ...editingCard, aiAgentButtonColor: e.target.value })}
                                  className="w-24 px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingCard({ ...editingCard, aiAgentButtonColor: '#7C3AED' })}
                                  className="text-[10px] px-2 py-1 bg-purple-100 text-purple-800 font-semibold rounded hover:bg-purple-200 transition-colors"
                                  title="Restaurar roxo padrão (#7C3AED)"
                                >
                                  Roxo Padrão
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Seção de Efeito Glow e Tamanho / Espessura do Botão */}
                          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-purple-600" />
                                Estilo do Botão: Efeito Glow & Espessura
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Personalização em tempo real
                              </span>
                            </div>

                            {/* 1. Controle do Efeito Glow */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingCard.aiAgentGlowEnabled !== false}
                                    onChange={(e) => setEditingCard({ ...editingCard, aiAgentGlowEnabled: e.target.checked })}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-slate-700">
                                    Efeito Glow Ativo (Brilho e pulsação luminosa)
                                  </span>
                                </label>
                                {editingCard.aiAgentGlowEnabled !== false && (
                                  <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                    {editingCard.aiAgentGlowIntensity || 'médio'}
                                  </span>
                                )}
                              </div>

                              {editingCard.aiAgentGlowEnabled !== false && (
                                <div className="pl-6 pt-1">
                                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                                    Intensidade do Brilho (Glow):
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { key: 'suave', label: 'Suave', desc: 'Brilho discreto' },
                                      { key: 'medio', label: 'Médio (Padrão)', desc: 'Brilho equilibrado' },
                                      { key: 'intenso', label: 'Intenso', desc: 'Pulso marcante' },
                                    ].map((intensity) => {
                                      const isSelected = (editingCard.aiAgentGlowIntensity || 'medio') === intensity.key;
                                      return (
                                        <button
                                          key={intensity.key}
                                          type="button"
                                          onClick={() => setEditingCard({ ...editingCard, aiAgentGlowIntensity: intensity.key as AiAgentGlowIntensity })}
                                          className={`py-1.5 px-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                                            isSelected
                                              ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold shadow-xs'
                                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>{intensity.label}</span>
                                            {isSelected && <CheckCircle2 size={12} className="text-purple-600" />}
                                          </div>
                                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">{intensity.desc}</div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 2. Tamanho e Espessura do Botão */}
                            <div className="pt-2 border-t border-slate-200 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700">
                                  Espessura / Tamanho do Botão (Altura e Preenchimento)
                                </label>
                                <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg">
                                  {getAiAgentButtonPaddingY(editingCard.aiAgentButtonSize, editingCard.aiAgentButtonPaddingY)}px
                                </span>
                              </div>

                              {/* Predefinições de Espessura */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { key: 'fino', label: 'Fino / Compacto', px: 8 },
                                  { key: 'padrao', label: 'Padrão / Médio', px: 12 },
                                  { key: 'espesso', label: 'Espesso / Robusto', px: 16 },
                                  { key: 'extra', label: 'Extra Espesso', px: 20 },
                                ].map((preset) => {
                                  const currentPadding = getAiAgentButtonPaddingY(editingCard.aiAgentButtonSize, editingCard.aiAgentButtonPaddingY);
                                  const isSelected = currentPadding === preset.px;
                                  return (
                                    <button
                                      key={preset.key}
                                      type="button"
                                      onClick={() =>
                                        setEditingCard({
                                          ...editingCard,
                                          aiAgentButtonSize: preset.key as AiAgentButtonSize,
                                          aiAgentButtonPaddingY: preset.px,
                                        })
                                      }
                                      className={`py-1.5 px-2 rounded-xl text-xs border text-center transition-all cursor-pointer ${
                                        isSelected
                                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-xs'
                                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                      }`}
                                    >
                                      <div>{preset.label}</div>
                                      <div className="text-[10px] text-slate-500 font-normal">{preset.px}px altura</div>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Slider de ajuste fino de espessura */}
                              <div className="pt-1">
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                  <span>Ajuste fino da espessura vertical:</span>
                                  <span className="font-medium">
                                    {getAiAgentButtonPaddingY(editingCard.aiAgentButtonSize, editingCard.aiAgentButtonPaddingY)} px
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={6}
                                  max={24}
                                  step={1}
                                  value={getAiAgentButtonPaddingY(editingCard.aiAgentButtonSize, editingCard.aiAgentButtonPaddingY)}
                                  onChange={(e) => {
                                    const px = parseInt(e.target.value, 10);
                                    setEditingCard({
                                      ...editingCard,
                                      aiAgentButtonPaddingY: px,
                                      aiAgentButtonSize: px <= 9 ? 'fino' : px <= 14 ? 'padrao' : px <= 18 ? 'espesso' : 'extra',
                                    });
                                  }}
                                  className="w-full accent-purple-600 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>Fino (6px)</span>
                                  <span>Padrão (12px)</span>
                                  <span>Espesso (18px)</span>
                                  <span>Extra (24px)</span>
                                </div>
                              </div>

                              {/* Espessura do Contorno (Borda) */}
                              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Espessura do Contorno / Borda
                                  </label>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                      { w: 0, label: '0px' },
                                      { w: 1, label: '1px' },
                                      { w: 2, label: '2px' },
                                      { w: 3, label: '3px' },
                                    ].map((border) => {
                                      const isSelected = (editingCard.aiAgentButtonBorderWidth || 0) === border.w;
                                      return (
                                        <button
                                          key={border.w}
                                          type="button"
                                          onClick={() => setEditingCard({ ...editingCard, aiAgentButtonBorderWidth: border.w })}
                                          className={`py-1 text-xs rounded-lg border font-medium transition-all ${
                                            isSelected
                                              ? 'border-purple-600 bg-purple-100 text-purple-900 font-bold'
                                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                          }`}
                                        >
                                          {border.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {(editingCard.aiAgentButtonBorderWidth || 0) > 0 && (
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Cor do Contorno
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={editingCard.aiAgentButtonBorderColor || '#C084FC'}
                                        onChange={(e) => setEditingCard({ ...editingCard, aiAgentButtonBorderColor: e.target.value })}
                                        className="w-7 h-7 rounded border cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        maxLength={7}
                                        value={editingCard.aiAgentButtonBorderColor || '#C084FC'}
                                        onChange={(e) => setEditingCard({ ...editingCard, aiAgentButtonBorderColor: e.target.value })}
                                        className="w-20 px-2 py-1 text-xs font-mono border rounded uppercase bg-white"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 3. Pré-visualização ao vivo do botão */}
                            <div className="pt-2 border-t border-slate-200">
                              <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                                <span>Pré-visualização do Botão de IA:</span>
                                <span className="text-[10px] text-slate-500 font-normal">Visualização interativa</span>
                              </div>
                              <div className="p-4 bg-slate-900/90 rounded-2xl flex flex-col items-center justify-center">
                                {(() => {
                                  const glowClass = getAiAgentButtonGlowClass(editingCard.aiAgentGlowEnabled, editingCard.aiAgentGlowIntensity);
                                  const paddingY = getAiAgentButtonPaddingY(editingCard.aiAgentButtonSize, editingCard.aiAgentButtonPaddingY);
                                  const borderWidth = editingCard.aiAgentButtonBorderWidth || 0;
                                  const borderColor = editingCard.aiAgentButtonBorderColor || '#C084FC';
                                  return (
                                    <button
                                      type="button"
                                      className={`w-full max-w-xs flex items-center justify-center gap-2.5 px-4 rounded-2xl font-bold text-sm text-white relative transition-all cursor-pointer active:scale-95 ${glowClass}`}
                                      style={{
                                        backgroundColor: editingCard.aiAgentButtonColor || '#7C3AED',
                                        paddingTop: `${paddingY}px`,
                                        paddingBottom: `${paddingY}px`,
                                        borderWidth: borderWidth > 0 ? `${borderWidth}px` : undefined,
                                        borderStyle: borderWidth > 0 ? 'solid' : undefined,
                                        borderColor: borderWidth > 0 ? borderColor : undefined,
                                      }}
                                    >
                                      <Bot size={paddingY >= 16 ? 20 : 18} className="shrink-0" />
                                      <span>{editingCard.aiAgentButtonText || 'Atendente Virtual'}</span>
                                      {editingCard.aiAgentGlowEnabled !== false && (
                                        <Sparkles size={paddingY >= 16 ? 16 : 14} className="text-purple-200 shrink-0 ml-0.5" />
                                      )}
                                    </button>
                                  );
                                })()}
                                <p className="text-[10px] text-slate-400 mt-2">
                                  {editingCard.aiAgentGlowEnabled !== false
                                    ? `Glow: ${editingCard.aiAgentGlowIntensity || 'médio'} • Espessura: ${getAiAgentButtonPaddingY(editingCard.aiAgentButtonSize, editingCard.aiAgentButtonPaddingY)}px`
                                    : `Glow: Desativado • Espessura: ${getAiAgentButtonPaddingY(editingCard.aiAgentButtonSize, editingCard.aiAgentButtonPaddingY)}px`}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="site-agent-check"
                              checked={Boolean(editingCard.siteAiAgentEnabled)}
                              onChange={(e) => setEditingCard({ ...editingCard, siteAiAgentEnabled: e.target.checked })}
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <label htmlFor="site-agent-check" className="text-xs text-slate-700 cursor-pointer font-medium">
                              Exibir o agente de IA padrão do site neste cartão
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACORDEÃO 8: MÉTRICAS E PRIVACIDADE */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 8 ? 0 : 8)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>8. Métricas e Rastreamento Anônimo</span>
                      </div>
                      {activeAccordion === 8 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 8 && (
                      <div className="p-4 space-y-3 bg-white dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="track-activity"
                            checked={editingCard.activityTrackingEnabled !== false}
                            onChange={(e) => setEditingCard({ ...editingCard, activityTrackingEnabled: e.target.checked })}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <label htmlFor="track-activity" className="text-xs text-slate-700 font-medium cursor-pointer">
                            Rastrear aberturas de cartão e cliques de forma 100% anônima (sem cookies, sem IPs)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACORDEÃO 9: FORMULÁRIO ENVIAR UMA MENSAGEM */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 9 ? 0 : 9)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <MessageSquare size={16} className="text-sky-600 dark:text-sky-400" />
                        <span>9. Formulário "Enviar uma mensagem"</span>
                        {(editingCard.hideInquiryForm === true || editingCard.inquiryEnabled === false) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Oculto
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            Ativo
                          </span>
                        )}
                      </div>
                      {activeAccordion === 9 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {activeAccordion === 9 && (
                      <div className="p-4 space-y-4 bg-white dark:bg-slate-900/40">
                        {/* Checkbox Principal: Ocultar função Enviar uma mensagem com seus componentes */}
                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 transition-all">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              id="hide-inquiry-checkbox"
                              checked={editingCard.hideInquiryForm === true || editingCard.inquiryEnabled === false}
                              onChange={(e) => {
                                const isHidden = e.target.checked;
                                setEditingCard({
                                  ...editingCard,
                                  hideInquiryForm: isHidden,
                                  inquiryEnabled: !isHidden,
                                });
                              }}
                              className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500 cursor-pointer w-4 h-4 shrink-0"
                            />
                            <div className="flex-1">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                                <span>Ocultar a função "Enviar uma mensagem" com seus componentes do cartão</span>
                                {(editingCard.hideInquiryForm === true || editingCard.inquiryEnabled === false) && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                                    Oculto no Cartão
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Marque esta caixa para remover completamente o bloco de envio de mensagens do rodapé do cartão (incluindo título, campos de preenchimento, consentimento LGPD e botão de envio).
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Configurações detalhadas e componentes (somente visíveis quando o formulário não estiver oculto) */}
                        {!(editingCard.hideInquiryForm === true || editingCard.inquiryEnabled === false) ? (
                          <div className="space-y-4">
                            {/* Seleção de componentes visíveis do formulário */}
                            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                <span>Componentes Visíveis do Formulário</span>
                                <span className="text-[10px] text-slate-400 font-normal">Personalize quais campos aparecem no cartão</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={editingCard.inquiryShowName !== false}
                                    onChange={(e) => setEditingCard({ ...editingCard, inquiryShowName: e.target.checked })}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Campo "Seu Nome"</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={editingCard.inquiryShowEmail !== false}
                                    onChange={(e) => setEditingCard({ ...editingCard, inquiryShowEmail: e.target.checked })}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Campo "E-mail"</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={editingCard.inquiryShowPhone !== false}
                                    onChange={(e) => setEditingCard({ ...editingCard, inquiryShowPhone: e.target.checked })}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Campo "WhatsApp"</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={editingCard.inquiryShowMessage !== false}
                                    onChange={(e) => setEditingCard({ ...editingCard, inquiryShowMessage: e.target.checked })}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Campo "Mensagem"</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors sm:col-span-2">
                                  <input
                                    type="checkbox"
                                    checked={editingCard.inquiryShowConsent !== false}
                                    onChange={(e) => setEditingCard({ ...editingCard, inquiryShowConsent: e.target.checked })}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Caixa de Consentimento de Dados (LGPD)</span>
                                </label>
                              </div>
                            </div>

                            {/* Contraste e Cor dos Textos */}
                            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                Visibilidade dos Textos e Consentimento LGPD
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                O texto de consentimento <em>("Concordo em compartilhar meus dados de contato com {editingCard.name || 'o titular'}...")</em> conta com cálculo automático de contraste sobre o fundo (claro ou escuro) e fundo sutil para garantir 100% de legibilidade.
                              </p>
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                                  Cor Personalizada dos Textos:
                                </label>
                                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                  <input
                                    type="color"
                                    value={editingCard.inquiryTextColor || editingCard.supportTextColor || '#1e293b'}
                                    onChange={(e) => setEditingCard({ ...editingCard, inquiryTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                    className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                                  />
                                  <input
                                    type="text"
                                    maxLength={7}
                                    placeholder="Auto contraste (recomendado)"
                                    value={editingCard.inquiryTextColor || ''}
                                    onChange={(e) => setEditingCard({ ...editingCard, inquiryTextColor: e.target.value, appearanceTheme: 'personalizado' })}
                                    className="w-full px-2 py-1 text-[11px] font-mono border border-slate-200 dark:border-slate-700 rounded uppercase bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                  />
                                  {editingCard.inquiryTextColor && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingCard({ ...editingCard, inquiryTextColor: '', appearanceTheme: 'personalizado' })}
                                      className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 shrink-0 cursor-pointer"
                                      title="Restaurar para auto contraste"
                                    >
                                      Auto
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <span>A função "Enviar uma mensagem" está oculta. Ela não será exibida no cartão nem consumirá espaço no layout.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação do Formulário */}
                  <div className="pt-4 flex items-center justify-between gap-3">
                    {!isNew && !isEditingLandingTemplate && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(editingCard.id!)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={15} />
                        <span>Excluir Cartão</span>
                      </button>
                    )}

                    {isEditingLandingTemplate && (
                      <button
                        type="button"
                        onClick={handleExitLandingTemplate}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        Voltar aos Meus Cartões
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      className={`ml-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                        isEditingLandingTemplate
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                          : 'bg-sky-600 hover:bg-sky-700'
                      } disabled:opacity-50`}
                    >
                      {isEditingLandingTemplate ? <Sparkles size={16} className="text-amber-300" /> : <Save size={16} />}
                      <span>
                        {saving
                          ? 'Salvando...'
                          : isEditingLandingTemplate
                          ? 'Salvar Modelo da Landing Page'
                          : isNew
                          ? 'Criar Cartão'
                          : 'Salvar Alterações'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* Aba de Métricas Anônimas */}
              {activeTab === 'metrics' && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 font-heading">
                    Métricas 100% Anônimas de Engajamento
                  </h2>
                  <p className="text-xs text-slate-500">
                    Em total conformidade com privacidade: nenhum dado de IP, localização ou identificador pessoal é coletado.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-center">
                      <div className="text-2xl font-black text-sky-700 font-heading">
                        {metrics?.cardOpens || 0}
                      </div>
                      <div className="text-[11px] font-bold text-sky-900 mt-1">Aberturas Web</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                      <div className="text-2xl font-black text-emerald-700 font-heading">
                        {metrics?.qrOpens || 0}
                      </div>
                      <div className="text-[11px] font-bold text-emerald-900 mt-1">Leituras de QR</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                      <div className="text-2xl font-black text-indigo-700 font-heading">
                        {metrics?.outboundClicks || 0}
                      </div>
                      <div className="text-[11px] font-bold text-indigo-900 mt-1">Cliques em Links</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                      <div className="text-2xl font-black text-amber-700 font-heading">
                        {metrics?.inquiriesCount || 0}
                      </div>
                      <div className="text-[11px] font-bold text-amber-900 mt-1">Mensagens</div>
                    </div>
                  </div>

                  {metrics?.destinations && Object.keys(metrics.destinations).length > 0 && (
                    <div className="pt-3">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Cliques por Destino
                      </h3>
                      <div className="space-y-1.5">
                        {Object.entries(metrics.destinations).map(([dest, count]) => (
                          <div
                            key={dest}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border text-xs"
                          >
                            <span className="font-semibold capitalize text-slate-700">{dest}</span>
                            <span className="font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                              {count} {count === 1 ? 'clique' : 'cliques'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Aba de Mensagens de Primeiro Contato */}
              {activeTab === 'inquiries' && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 font-heading">
                    Mensagens Recebidas ({inquiries.length})
                  </h2>

                  {inquiries.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-slate-500 text-xs">
                      Nenhuma mensagem recebida ainda neste cartão.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">
                              {inq.name || 'Visitante sem nome'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(inq.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                            {inq.message}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                            {inq.email && (
                              <a href={`mailto:${inq.email}`} className="text-sky-600 hover:underline">
                                {inq.email}
                              </a>
                            )}
                            {inq.whatsappPhone && (
                              <a
                                href={`https://wa.me/${inq.whatsappPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:underline font-semibold"
                              >
                                WhatsApp: {inq.whatsappPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coluna Direita: Pré-Visualização ao Vivo (Live Preview) */}
            {showPreview && (
              <div className="lg:col-span-5 sticky top-20 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Pré-visualização ao vivo
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-medium underline cursor-pointer"
                      title="Recolher mockup para ampliar formulário"
                    >
                      (recolher)
                    </button>
                  </div>
                  {editingCard.slug && (
                    <a
                      href={`/cartao/${editingCard.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => handleOpenPublicPage(e, editingCard.slug)}
                      className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                    >
                      <span>Abrir em nova aba</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <DigitalCardLivePreview card={editingCard} />
              </div>
            )}
          </div>
        )}

        {/* Modal de Confirmação: Restaurar Cartão para a Estrutura Padrão (Default) */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center shrink-0">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Restaurar Cartão para o Padrão?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Voltar ao estado original sem imagens e com a estrutura básica.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Ao confirmar, esta ação executará as seguintes alterações visuais:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>Removerá todas as imagens:</strong> foto de perfil, logotipo da empresa, imagem de fundo e ícone do celular.
                  </li>
                  <li>
                    <strong>Estrutura básica original:</strong> restaurará a paleta padrão (#12375B / #1A7FBE / #FFFFFF) e as opacidades clássicas.
                  </li>
                  <li>
                    <strong>Botões de ação:</strong> restaurará o arredondamento de 16px e as cores originais dos 4 botões.
                  </li>
                  <li>
                    <strong>QR Code e Moldura:</strong> restaurará o formato arredondado sem logo interna e a escala de 97%.
                  </li>
                </ul>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Seus dados cadastrais (nome, cargo, telefone, e-mail, WhatsApp e links) serão PRESERVADOS intactos.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={resetting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black dark:bg-sky-600 dark:hover:bg-sky-700 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {resetting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Restaurando...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      <span>Sim, Restaurar para o Básico</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
        {/* Modal de Central de Ajuda e Documentação */}
        <HelpCenterModal
          isOpen={helpModalOpen}
          onClose={() => setHelpModalOpen(false)}
          initialArticleId={helpArticleId}
        />
      </div>
    </div>
  );
};
