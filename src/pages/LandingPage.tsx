import React, { useState, useEffect } from 'react';
import { safeApiCall } from '../lib/safeFetch';
import {
  Smartphone,
  Bot,
  QrCode,
  Download,
  Globe,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ExternalLink,
  Phone,
  Mail,
  Zap,
  Users,
  Compass,
  X,
  CreditCard,
  Lock,
  Crown,
  Edit,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import { DigitalCardLivePreview } from '../components/DigitalCardLivePreview.tsx';
import { DigitalCard } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

// Cartão padrão para exibição interativa na demonstração da landing page
const DEMO_CARD_FALLBACK: Partial<DigitalCard> = {
  id: 1,
  slug: 'jurandir-hora',
  name: 'Jurandir Hora',
  jobTitle: 'Diretor Executivo',
  brandName: 'Átomos Infinity',
  phone: '+55 (15) 99625-9353',
  email: 'consultatomosinfinity@gmail.com',
  whatsappPhone: '+55 (15) 99625-9353',
  websiteUrl: 'https://consultatomosinfinity.com.br',
  summary: 'Consultoria e inteligência estratégica empresarial pela Átomos Infinity.',
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
  aiAgentUrl: 'https://wa.me/5515996259353?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es',
  aiAgentButtonText: 'Atendente Virtual IA',
  aiAgentButtonColor: '#7C3AED',
  aiAgentGlowEnabled: true,
  trackingEnabled: true,
  activityTrackingEnabled: true,
  inquiryEnabled: true,
  status: 'ativo',
};

export const LandingPage: React.FC = () => {
  const { isMaster } = useAuth();
  const [demoCard, setDemoCard] = useState<Partial<DigitalCard>>(DEMO_CARD_FALLBACK);
  const [billingCycle, setBillingCycle] = useState<'quarterly' | 'semiannual' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<'card' | 'qr' | 'ai'>('card');
  const [degustacaoDays, setDegustacaoDays] = useState<number>(30);

  // Carrega o modelo padrão configurado pelo Master e configurações do sistema
  const fetchLandingCard = () => {
    fetch('/api/settings/landing-card')
      .then((res) => (res.ok ? res.json() : null))
      .then((card: Partial<DigitalCard> | null) => {
        if (card && card.name) {
          setDemoCard(card);
        } else {
          // Fallback para o primeiro cartão se existir
          fetch('/api/cards')
            .then((r) => (r.ok ? r.json() : []))
            .then((cards: DigitalCard[]) => {
              if (cards && cards.length > 0) {
                setDemoCard(cards[0]);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        // Fallback já definido
      });
  };

  useEffect(() => {
    fetchLandingCard();
    safeApiCall('/api/system-settings', undefined, null).then((settings) => {
      const localSettings = localStorage.getItem('atomos_system_settings') ? JSON.parse(localStorage.getItem('atomos_system_settings')!) : null;
      const finalSettings = settings || localSettings;
      if (finalSettings && typeof finalSettings.degustacaoDays === 'number') {
        setDegustacaoDays(finalSettings.degustacaoDays);
      }
    }).catch(() => {});

    // Sincronização em tempo real caso o Master altere o modelo em outra aba
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('digital_cards_sync');
        ch.onmessage = () => {
          fetchLandingCard();
          safeApiCall('/api/system-settings', undefined, null).then((settings) => {
            const localSettings = localStorage.getItem('atomos_system_settings') ? JSON.parse(localStorage.getItem('atomos_system_settings')!) : null;
            const finalSettings = settings || localSettings;
            if (finalSettings && typeof finalSettings.degustacaoDays === 'number') {
              setDegustacaoDays(finalSettings.degustacaoDays);
            }
          }).catch(() => {});
        };
        return () => {
          ch.close();
        };
      }
    } catch (e) {}
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 antialiased selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* Barra de Ação Rápida Exclusiva do Usuário Master */}
      {isMaster && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-sky-900 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <Crown size={14} className="text-amber-300 shrink-0" />
            <span className="truncate">
              <strong>Modo Master:</strong> Você está visualizando o modelo da demonstração (<em>{demoCard.name || 'Padrão'}</em>).
            </span>
          </div>
          <a
            href="/app?modo=landing-template"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] shadow-xs transition-all shrink-0 ml-2"
          >
            <Edit size={12} />
            <span>Editar Modelo da Landing Page</span>
          </a>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. CABEÇALHO / NAVBAR */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo e Nome da Marca */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-700 to-sky-500 text-white flex items-center justify-center font-bold shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
              <Layers size={22} />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white block font-heading">
                Cartão Digital
              </span>
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 tracking-wider uppercase block">
                Átomos Infinity
              </span>
            </div>
          </a>

          {/* Links de Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#recursos" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Recursos
            </a>
            <a href="#como-funciona" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Como Funciona
            </a>
            <a href="#demonstracao" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Demonstração
            </a>
            <a href="#planos" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Planos
            </a>
            <a href="#faq" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Dúvidas
            </a>
            <a href="/ajuda" className="text-sky-600 dark:text-sky-400 font-bold hover:underline transition-colors flex items-center gap-1">
              <span>Ajuda & Docs</span>
            </a>
          </nav>

          {/* Ações Topo: Alternador de Tema + Botão Painel */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle variant="header" />
            <a
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 px-2 py-1 transition-colors"
            >
              Entrar
            </a>
            <a
              href="/app"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-md shadow-sky-600/20 hover:shadow-sky-600/30 transition-all cursor-pointer"
            >
              <span>Acessar Painel</span>
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Botão Menu Mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle variant="header" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <div className="space-y-1 w-5"><span className="block h-0.5 w-full bg-current"></span><span className="block h-0.5 w-full bg-current"></span><span className="block h-0.5 w-full bg-current"></span></div>}
            </button>
          </div>
        </div>

        {/* Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
            <a
              href="#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Recursos
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Como Funciona
            </a>
            <a
              href="#demonstracao"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Demonstração
            </a>
            <a
              href="#planos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Planos
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Dúvidas
            </a>
            <a
              href="/ajuda"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-sky-600 dark:text-sky-400"
            >
              Central de Ajuda & Docs
            </a>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <a
                href="/app"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-sky-600 rounded-xl"
              >
                <span>Acessar Painel / Criar Cartão</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. HERO SECTION */}
      {/* ---------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Efeito sutil de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-100/50 via-sky-50/20 to-transparent dark:from-sky-950/20 dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Coluna Texto e Chamada de Valor */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge de Destaque */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Nova Geração de Networking Profissional</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] font-heading">
                Sua Identidade Profissional no{' '}
                <span className="text-sky-600 dark:text-orange-400 font-black">
                  Bolso do Seu Cliente
                </span>
              </h1>

              {/* Subtítulo */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Substitua de vez cartões de papel perdidos ou desatualizados. Tenha um <strong>aplicativo instalável direto no celular (PWA)</strong>, com <strong>Atendente Virtual com IA 24h</strong>, salvamento com 1 clique na agenda do smartphone e QR Code dinâmico com sua marca.
              </p>

              {/* Botões de Ação (CTAs) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="/app"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-98 rounded-xl shadow-lg shadow-sky-600/25 hover:shadow-sky-600/35 transition-all cursor-pointer"
                >
                  <Zap size={18} />
                  <span>Criar Meu Cartão Agora</span>
                  <ArrowRight size={18} />
                </a>

                <a
                  href={`/cartao/${demoCard.slug || 'jurandir-hora'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <ExternalLink size={17} className="text-sky-600 dark:text-sky-400" />
                  <span>Ver Cartão de Exemplo</span>
                </a>
              </div>

              {/* Indicadores de Confiança / Benefícios Rápidos */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sem App Store</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Salva na Agenda</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Atendente IA 24h</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">100% LGPD Seguro</span>
                </div>
              </div>
            </div>

            {/* Coluna Visual Demonstrativa: Mockup do Smartphone Realista */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[360px]">
                {/* Efeito de Brilho Suave */}
                <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-[3rem] blur-2xl -z-10" />

                {/* Badge Flutuante 1: PWA Instalável */}
                <div className="hidden sm:flex absolute -left-8 top-16 z-20 items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 flex items-center justify-center shrink-0">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Instalação Instantânea</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Ícone no Celular (PWA)</p>
                  </div>
                </div>

                {/* Badge Flutuante 2: Atendente Virtual IA */}
                <div className="hidden sm:flex absolute -right-8 bottom-24 z-20 items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Atendimento 24 Horas</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Inteligência Artificial</p>
                  </div>
                </div>

                {/* Frame do Smartphone Interativo */}
                <div className="rounded-[2.5rem] p-2 bg-slate-900 shadow-2xl border-4 border-slate-800">
                  <DigitalCardLivePreview card={demoCard} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. SEÇÃO DE RECURSOS PRINCIPAIS (FUNCIONALIDADES) */}
      {/* ---------------------------------------------------- */}
      <section id="recursos" className="py-20 bg-white dark:bg-slate-800/50 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cabeçalho da Seção */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Recursos de Alta Performance
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
              Tudo o que Você Precisa para se Conectar com Autoridade
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Projetado nos mínimos detalhes para transformar contatos casuais em parcerias e negócios duradouros.
            </p>
          </div>

          {/* Grid de 6 Recursos Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Recurso 1: PWA Instalável */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-4 hover:border-sky-300 dark:hover:border-sky-700 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                PWA / App Instalável no Celular
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Funciona direto no navegador e seu cliente pode <strong>adicionar à tela inicial</strong> do iPhone ou Android com um toque, sem precisar pesquisar ou baixar nada na App Store ou Google Play.
              </p>
            </div>

            {/* Recurso 2: Atendente Virtual IA */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-4 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Bot size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Atendente Virtual com IA Integrado
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Um assistente de conversação inteligente 24h por dia. Tira dúvidas imediatas dos seus clientes sobre sua atuação, qualifica o lead e direciona para o seu WhatsApp com contexto.
              </p>
            </div>

            {/* Recurso 3: QR Code Dinâmico com Logo */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <QrCode size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                QR Code Dinâmico e Imutável
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Personalize com o logo da sua empresa no centro, cantos arredondados e cores da sua marca. Seus dados mudam, mas o QR Code impresso continua funcionando para sempre.
              </p>
            </div>

            {/* Recurso 4: Salvamento de vCard (.vcf) */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Salvamento Direto na Agenda (vCard)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Com o botão "Salvar Contato", seu cliente grava seu nome completo, telefone, WhatsApp, e-mail, cargo, empresa e foto oficial diretamente na lista de contatos do smartphone.
              </p>
            </div>

            {/* Recurso 5: Favicon e Identidade Exclusiva */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-4 hover:border-amber-300 dark:hover:border-amber-700 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Favicon e Marca Personalizados
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                O logo da sua empresa aparece com destaque na aba do navegador como favicon e no ícone do aplicativo, conferindo credibilidade de nível corporativo ao seu cartão.
              </p>
            </div>

            {/* Recurso 6: Métricas e Formulário LGPD */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-4 hover:border-rose-300 dark:hover:border-rose-700 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Métricas Anônimas e Formulário LGPD
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Acompanhe visualizações e cliques em seus links sem invadir a privacidade do visitante, além de receber solicitações de contato direto no seu painel com consentimento claro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. SEÇÃO "COMO FUNCIONA" */}
      {/* ---------------------------------------------------- */}
      <section id="como-funciona" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Simplicidade em 3 Passos
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
              Como Funciona a Criação do Seu Cartão
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Em menos de 5 minutos, sua apresentação profissional estará pronta para ser compartilhada com o mundo.
            </p>
          </div>

          {/* Os 3 Passos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Passo 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-sky-600/30">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cadastre seus Dados
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Insira sua foto de perfil, logo da empresa, WhatsApp, e-mail, redes sociais, endereço e resumo profissional no painel intuitivo.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-sky-600/30">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Personalize Cores & IA
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ajuste a paleta de cores para combinar com sua marca, escolha o estilo do QR Code, ícone de instalação do app e conecte o Atendente Virtual.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-sky-600/30">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Compartilhe com 1 Toque
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Apresente seu QR Code na tela, use chips NFC por aproximação, envie pelo WhatsApp ou insira o link na sua bio das redes sociais.
              </p>
            </div>
          </div>

          {/* CTA Intermediário */}
          <div className="mt-12 text-center">
            <a
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>Experimentar no Painel Agora</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 5. SEÇÃO DEMONSTRAÇÃO & COMPARATIVO (PAPEL VS DIGITAL) */}
      {/* ---------------------------------------------------- */}
      <section id="demonstracao" className="py-20 bg-slate-100/70 dark:bg-slate-800/40 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Evolução do Networking
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
              Cartão de Papel vs. Cartão Digital Átomos Infinity
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Descubra por que líderes e consultores modernos abandonaram o papel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Cartão de Papel Tradicional */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-800/90 border border-rose-200 dark:border-rose-900/50 space-y-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Cartão de Papel</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Ultrapassado e Ineficiente</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>90% são jogados no lixo ou perdidos em gavetas na primeira semana.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Mudou o telefone ou endereço? É obrigado a reimprimir e jogar tudo fora.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>O cliente precisa digitar manualmente seus dados para salvar na agenda.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Nenhuma métrica sobre quem viu, clicou ou teve interesse.</span>
                </li>
              </ul>
            </div>

            {/* Cartão Digital Átomos Infinity */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-emerald-500/80 dark:border-emerald-500/60 space-y-5 shadow-lg relative">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                Recomendado
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Cartão Digital Interativo</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Sempre Atualizado e Inteligente</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 font-bold shrink-0 mt-0.5" />
                  <span><strong>Instala direto no celular</strong> como app sem ocupar espaço nem precisar de lojas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 font-bold shrink-0 mt-0.5" />
                  <span><strong>Salva na agenda com 1 toque</strong>: foto, WhatsApp, e-mail e cargo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 font-bold shrink-0 mt-0.5" />
                  <span><strong>Atendente Virtual com IA 24h</strong> tirando dúvidas e capturando leads.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 font-bold shrink-0 mt-0.5" />
                  <span><strong>Atualização instantânea</strong>: mude dados no painel e seu cartão atualiza na hora.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 6. SEÇÃO DE PLANOS E PREÇOS */}
      {/* ---------------------------------------------------- */}
      <section id="planos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 1. Banner de Degustação (Trial dinâmico) */}
          <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-600/20 relative overflow-hidden">
            {/* Efeitos decorativos de fundo */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
                  <Sparkles size={14} className="text-amber-300" />
                  <span>Degustação Gratuita de {degustacaoDays} Dias</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
                  Experimente {degustacaoDays === 30 ? '1 Mês' : `${degustacaoDays} Dias`} Grátis!
                </h3>
                <p className="text-sm sm:text-base text-sky-50 font-normal leading-relaxed">
                  Crie e use seu <strong>Cartão Digital por {degustacaoDays} dias sem compromisso</strong>. Sem cobrança antecipada e com acesso completo a todos os recursos desde o primeiro minuto.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <a
                  href="/app"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-black text-sky-900 bg-white hover:bg-slate-100 active:scale-98 rounded-2xl shadow-lg transition-all cursor-pointer"
                >
                  <span>Garantir Meus {degustacaoDays} Dias Grátis</span>
                  <ArrowRight size={18} className="text-sky-600" />
                </a>
              </div>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Investimento Inteligente
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
              Planos Transparentes para Você e sua Empresa
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Escolha a opção ideal para seu momento profissional. Inicie hoje mesmo seu teste gratuito.
            </p>

            {/* 2. Seletor de Ciclos de Pagamento (Tabs/Toggle): Trimestral, Semestral, Anual */}
            <div className="pt-6">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl max-w-xl mx-auto border border-slate-300/60 dark:border-slate-700">
                {/* Trimestral */}
                <button
                  type="button"
                  onClick={() => setBillingCycle('quarterly')}
                  className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    billingCycle === 'quarterly'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Trimestral</span>
                </button>

                {/* Semestral */}
                <button
                  type="button"
                  onClick={() => setBillingCycle('semiannual')}
                  className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    billingCycle === 'semiannual'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Semestral</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    10% de Desconto
                  </span>
                </button>

                {/* Anual */}
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    billingCycle === 'annual'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 border border-sky-500'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Anual</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                      billingCycle === 'annual'
                        ? 'bg-emerald-300 text-slate-950 font-black'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    20% de Desconto / Melhor Custo-Benefício
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Cards de Planos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plano 1: Profissional */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profissional</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Para autônomos e consultores</p>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                    {degustacaoDays} Dias Grátis
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-slate-400">R$</span>
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {billingCycle === 'annual' ? '29' : billingCycle === 'semiannual' ? '35' : '39'}
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {billingCycle === 'annual' && 'Faturado anualmente (R$ 348/ano — economize 20%)'}
                  {billingCycle === 'semiannual' && 'Faturado a cada 6 meses (R$ 210/semestre — 10% OFF)'}
                  {billingCycle === 'quarterly' && 'Faturado a cada 3 meses (R$ 117/trimestre)'}
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span><strong>1 Cartão Digital Profissional</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span><strong>PWA Instalável</strong> no Celular (sem lojas)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span><strong>Salvar vCard (.vcf)</strong> com 1 toque na agenda</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span><strong>QR Code Dinâmico e Imutável</strong> com Logo</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span><strong>Métricas de Acessos</strong> e cliques em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Atualizações ilimitadas pelo painel</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <a
                  href="/app"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors"
                >
                  <Sparkles size={14} />
                  <span>Começar Teste de {degustacaoDays === 30 ? '1 Mês' : `${degustacaoDays} Dias`} Grátis</span>
                </a>
              </div>
            </div>

            {/* Plano 2: Negócios & IA (Mais Popular) */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-800 border-2 border-sky-600 dark:border-sky-500 flex flex-col justify-between shadow-xl relative scale-102">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold bg-sky-600 text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles size={11} className="text-amber-300" />
                <span>Mais Popular</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Negócios & IA</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Com Atendente Virtual e Formulário</p>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {degustacaoDays} Dias Grátis
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-slate-400">R$</span>
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {billingCycle === 'annual' ? '59' : billingCycle === 'semiannual' ? '69' : '79'}
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {billingCycle === 'annual' && 'Faturado anualmente (R$ 708/ano — economize 20%)'}
                  {billingCycle === 'semiannual' && 'Faturado a cada 6 meses (R$ 414/semestre — 10% OFF)'}
                  {billingCycle === 'quarterly' && 'Faturado a cada 3 meses (R$ 237/trimestre)'}
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span><strong>Tudo incluído no Plano Profissional</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Sparkles size={14} className="text-purple-500 shrink-0" />
                    <span><strong>Atendente Virtual com IA Integrado</strong> (24h)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span><strong>Formulário de Contato Direto</strong> (100% LGPD)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Favicon e Ícones PWA Customizados com Logo</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Métricas Detalhadas de Redirecionamento</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Suporte Prioritário e Consultoria Átomos Infinity</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <a
                  href="/app"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/25 transition-all"
                >
                  <Sparkles size={14} className="text-amber-300" />
                  <span>Começar Teste de {degustacaoDays === 30 ? '1 Mês' : `${degustacaoDays} Dias`} Grátis</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* Plano 3: Corporativo / Equipes */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Corporativo & Equipes</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Para empresas e escritórios</p>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Sob Medida
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">Sob Medida</span>
                </div>
                <p className="text-[11px] text-slate-400">Condições especiais por volume de cartões</p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Multi-usuários com gestão centralizada</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Padronização visual e cores da marca</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Atendentes Virtuais IA dedicados por colaborador</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Integração de domínios corporativos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Gerente de contas e treinamento exclusivo</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <a
                  href="https://wa.me/5515996259353?text=Ol%C3%A1%2C%20gostaria%20de%20um%20or%C3%A7amento%20corporativo%20para%20minha%20empresa%20com%20per%C3%ADodo%20de%20degusta%C3%A7%C3%A3o"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
                >
                  <MessageCircle size={14} className="text-emerald-500" />
                  <span>Falar com Consultor</span>
                </a>
              </div>
            </div>
          </div>

          {/* 4. Nota Explicativa / Garantia de Degustação */}
          <div className="mt-12 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                <span>Garantia de Degustação Sem Compromisso</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  100% Grátis por {degustacaoDays} Dias
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Você testa a solução completa por {degustacaoDays === 30 ? '1 mês' : `${degustacaoDays} dias`} sem pagar nada. Ao final do período de degustação, escolha o ciclo (Trimestral, Semestral ou Anual) que preferir para manter seu cartão ativo.
              </p>
            </div>
            <a
              href="/app"
              className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
            >
              <span>Ativar Degustação</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 7. FAQ (PERGUNTAS FREQUENTES) */}
      {/* ---------------------------------------------------- */}
      <section id="faq" className="py-20 bg-white dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
              Perguntas Frequentes
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Respostas claras sobre como a tecnologia dos nossos cartões digitais funciona.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Meu cliente precisa baixar algum aplicativo na App Store ou Google Play?',
                a: 'Não! Essa é uma das maiores vantagens do nosso sistema PWA. Ao abrir o link ou ler o QR Code, o cartão abre instantaneamente no navegador do celular e já exibe a opção de adicionar à tela inicial como um app nativo, sem exigir senha de loja ou consumo de memória.',
              },
              {
                q: 'Como funciona o salvamento direto de contato (vCard)?',
                a: 'O cartão inclui um botão com tecnologia vCard padrão internacional. Quando o cliente toca em "Salvar Contato", o arquivo .vcf é lido pelo aplicativo de contatos do smartphone (iOS ou Android), preenchendo automaticamente nome, telefone, WhatsApp, cargo, e-mail e foto.',
              },
              {
                q: 'Se eu mudar de telefone ou de endereço, preciso trocar o QR Code?',
                a: 'Não. Os QR Codes gerados são vinculados ao seu endereço fixo (slug). Caso você altere telefones, e-mails, redes sociais ou até o logotipo no painel, tudo é atualizado em tempo real. O QR Code impresso no seu cartão físico continuará funcionando perfeitamente.',
              },
              {
                q: 'Como funciona o Atendente Virtual com Inteligência Artificial?',
                a: 'O Atendente Virtual pode ser acionado direto no cartão por um botão com brilho pulsante. Ele pode rodar um assistente conversacional inteligente para tirar dúvidas sobre sua consultoria, qualificar o interesse do visitante e convidá-lo a iniciar uma conversa no WhatsApp.',
              },
              {
                q: 'Posso usar o cartão com tags de aproximação NFC?',
                a: 'Sim, com total compatibilidade! Você pode gravar o link do seu cartão digital em qualquer chaveiro, cartão físico de PVC ou tag adesiva NFC. Ao aproximar do smartphone do seu cliente, o cartão abre instantaneamente na tela.',
              },
              {
                q: 'Os dados e acessos estão em conformidade com a LGPD?',
                a: 'Sim. As métricas coletadas pelo painel são 100% anônimas (sem armazenamento de endereços IP, geolocalização exata ou cookies espiões). Além disso, o formulário de contato inclui termo de consentimento explícito em estrito cumprimento da LGPD.',
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-sky-600 dark:text-sky-400 shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 8. BANNER CTA FINAL */}
      {/* ---------------------------------------------------- */}
      <section className="py-16 bg-gradient-to-br from-sky-900 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
            <Sparkles size={14} />
            <span>Modernize sua Presença Hoje</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight font-heading">
            Pronto para Causar uma Primeira Impressão Inesquecível?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Crie seu cartão agora mesmo, personalize as cores da sua empresa e comece a compartilhar com clientes e parceiros em poucos minutos.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl shadow-lg transition-all"
            >
              <span>Acessar Painel e Criar Cartão</span>
              <ArrowRight size={17} />
            </a>

            <a
              href="https://wa.me/5515996259353?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20Cart%C3%B5es%20Digitais%20%C3%81tomos%20Infinity"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-bold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
            >
              <MessageCircle size={17} className="text-emerald-400" />
              <span>Tirar Dúvidas no WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 9. RODAPÉ (FOOTER) INSTITUCIONAL */}
      {/* ---------------------------------------------------- */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Coluna 1: Marca & Apresentação */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2 text-white font-bold text-base font-heading">
                <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                  <Layers size={18} />
                </div>
                <span>Átomos Infinity</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Consultoria e inteligência estratégica empresarial. Soluções completas para posicionamento de marcas, networking digital e inovação corporativa.
              </p>
            </div>

            {/* Coluna 2: Navegação Rápida */}
            <div className="space-y-2">
              <p className="font-bold text-slate-200 text-xs uppercase tracking-wider">Navegação</p>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos Principais</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#demonstracao" className="hover:text-white transition-colors">Demonstração</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos & Preços</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Perguntas Frequentes</a></li>
                <li><a href="/ajuda" className="text-sky-400 font-bold hover:underline transition-colors flex items-center gap-1">Central de Ajuda & Docs</a></li>
              </ul>
            </div>

            {/* Coluna 3: Contato & Suporte */}
            <div className="space-y-2">
              <p className="font-bold text-slate-200 text-xs uppercase tracking-wider">Contato & Atendimento</p>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-2">
                  <Phone size={12} className="text-sky-400 shrink-0" />
                  <span>+55 (15) 99625-9353</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={12} className="text-sky-400 shrink-0" />
                  <span>consultatomosinfinity@gmail.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Globe size={12} className="text-sky-400 shrink-0" />
                  <a href="https://consultatomosinfinity.com.br" target="_blank" rel="noreferrer" className="hover:underline">
                    consultatomosinfinity.com.br
                  </a>
                </li>
              </ul>
            </div>

            {/* Coluna 4: Painel do Administrador */}
            <div className="space-y-3">
              <p className="font-bold text-slate-200 text-xs uppercase tracking-wider">Área do Cliente</p>
              <p className="text-[11px] text-slate-400">
                Já é cadastrado ou deseja editar seus cartões digitais?
              </p>
              <a
                href="/app"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
              >
                <span>Acessar Painel Administrativo</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* Barra Inferior de Direitos e LGPD */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>
              © 2026 Átomos Infinity. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck size={13} className="text-emerald-500" />
                Em estrita conformidade com a LGPD
              </span>
              <span>•</span>
              <a href="/app" className="hover:text-slate-300">Painel Admin</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
