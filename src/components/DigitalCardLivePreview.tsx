import React, { useState } from 'react';
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
  Smartphone,
  Wifi,
  Battery,
  ChevronDown,
  Sparkles,
  Star,
  Send,
} from 'lucide-react';
import { DigitalCard } from '../types.ts';
import { getContrastTextColor, isConfiguredLink, hexToRgba, getCardContentContrastColors, isNeumorphismTheme, getNeumorphicCardStyles, isGlassmorphismTheme, getGlassmorphicCardStyles } from '../../shared/digital-card-appearance.ts';
import { parseAiAgentInput, getAiAgentButtonGlowClass, getAiAgentButtonPaddingY } from '../../shared/digital-card-ai-agent.ts';
import { DigitalCardDualPorthole } from './DigitalCardDualPorthole.tsx';
import { DigitalCardQrCode } from './DigitalCardQrCode.tsx';
import { PixIcon } from './PixIcon.tsx';
import { PixPaymentModal } from './PixPaymentModal.tsx';
import { formatPixKeyForDisplay } from '../utils/pix.ts';

export type DeviceModel =
  | 'iphone-18-pro-max'
  | 'iphone-18-pro'
  | 'iphone-16-pro-max'
  | 'iphone-16-pro'
  | 'iphone-14-pro'
  | 'iphone-14-pro-max'
  | 'iphone-13'
  | 'iphone-12'
  | 'samsung-s26-ultra'
  | 'samsung-s25-ultra'
  | 'samsung-s25-plus'
  | 'samsung-a12';

interface DeviceConfig {
  id: DeviceModel;
  name: string;
  brand: 'Apple' | 'Samsung';
  screenSize: string;
  tag?: string;
  chassisWidth: string; // Tailwind max-w class
  outerRadius: string;
  innerRadius: string;
  borderWidth: string;
  borderColor: string;
  cutoutType:
    | 'notch-wide'
    | 'notch-compact'
    | 'dynamic-island'
    | 'dynamic-island-pro-max'
    | 'dynamic-island-large'
    | 'infinity-v'
    | 'infinity-o'
    | 'infinity-o-micro';
  time: string;
  buttonsStyle?: 'iphone-16' | 'iphone-classic' | 'samsung-ultra' | 'samsung-standard';
  isBoxy?: boolean;
}

const DEVICES: DeviceConfig[] = [
  {
    id: 'iphone-18-pro-max',
    name: 'iPhone 18 Pro Max',
    brand: 'Apple',
    screenSize: '6.9"',
    tag: 'Mais Novo · Flagship',
    chassisWidth: 'max-w-[385px]',
    outerRadius: 'rounded-[3.3rem]',
    innerRadius: 'rounded-[2.75rem]',
    borderWidth: 'border-[4px]',
    borderColor: 'border-neutral-800 bg-neutral-950',
    cutoutType: 'dynamic-island-pro-max',
    time: '09:41',
    buttonsStyle: 'iphone-16',
  },
  {
    id: 'iphone-18-pro',
    name: 'iPhone 18 Pro',
    brand: 'Apple',
    screenSize: '6.3"',
    tag: 'Mais Novo',
    chassisWidth: 'max-w-[360px]',
    outerRadius: 'rounded-[3.1rem]',
    innerRadius: 'rounded-[2.55rem]',
    borderWidth: 'border-[4px]',
    borderColor: 'border-stone-800 bg-stone-950',
    cutoutType: 'dynamic-island',
    time: '09:41',
    buttonsStyle: 'iphone-16',
  },
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    screenSize: '6.9"',
    tag: 'Flagship',
    chassisWidth: 'max-w-[385px]',
    outerRadius: 'rounded-[3.2rem]',
    innerRadius: 'rounded-[2.65rem]',
    borderWidth: 'border-[5px]',
    borderColor: 'border-neutral-800 bg-neutral-950',
    cutoutType: 'dynamic-island-pro-max',
    time: '09:41',
    buttonsStyle: 'iphone-16',
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    brand: 'Apple',
    screenSize: '6.3"',
    chassisWidth: 'max-w-[360px]',
    outerRadius: 'rounded-[3rem]',
    innerRadius: 'rounded-[2.45rem]',
    borderWidth: 'border-[5px]',
    borderColor: 'border-stone-800 bg-stone-950',
    cutoutType: 'dynamic-island',
    time: '09:41',
    buttonsStyle: 'iphone-16',
  },
  {
    id: 'samsung-s26-ultra',
    name: 'Galaxy S26 Ultra',
    brand: 'Samsung',
    screenSize: '6.9"',
    tag: 'Mais Novo · Flagship',
    chassisWidth: 'max-w-[385px]',
    outerRadius: 'rounded-[1.2rem]',
    innerRadius: 'rounded-[0.9rem]',
    borderWidth: 'border-[4px]',
    borderColor: 'border-zinc-800 bg-zinc-950',
    cutoutType: 'infinity-o-micro',
    time: '12:45',
    buttonsStyle: 'samsung-ultra',
    isBoxy: true,
  },
  {
    id: 'samsung-s25-ultra',
    name: 'Galaxy S25 Ultra',
    brand: 'Samsung',
    screenSize: '6.9"',
    tag: 'Flagship',
    chassisWidth: 'max-w-[385px]',
    outerRadius: 'rounded-[1.25rem]', // Formato ergonômico moderno da linha Ultra
    innerRadius: 'rounded-[0.95rem]',
    borderWidth: 'border-[4px]',
    borderColor: 'border-zinc-800 bg-zinc-950',
    cutoutType: 'infinity-o-micro',
    time: '12:45',
    buttonsStyle: 'samsung-ultra',
    isBoxy: true,
  },
  {
    id: 'samsung-s25-plus',
    name: 'Galaxy S25+ / S25',
    brand: 'Samsung',
    screenSize: '6.7"',
    tag: 'Novo',
    chassisWidth: 'max-w-[365px]',
    outerRadius: 'rounded-[2.7rem]',
    innerRadius: 'rounded-[2.15rem]',
    borderWidth: 'border-[5px]',
    borderColor: 'border-zinc-800 bg-zinc-900',
    cutoutType: 'infinity-o',
    time: '12:45',
    buttonsStyle: 'samsung-standard',
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 / 15 Pro',
    brand: 'Apple',
    screenSize: '6.1"',
    chassisWidth: 'max-w-[355px]',
    outerRadius: 'rounded-[2.8rem]',
    innerRadius: 'rounded-[2.1rem]',
    borderWidth: 'border-[7px]',
    borderColor: 'border-slate-900 bg-slate-950',
    cutoutType: 'dynamic-island',
    time: '09:41',
    buttonsStyle: 'iphone-classic',
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    brand: 'Apple',
    screenSize: '6.7"',
    chassisWidth: 'max-w-[385px]',
    outerRadius: 'rounded-[3rem]',
    innerRadius: 'rounded-[2.3rem]',
    borderWidth: 'border-[8px]',
    borderColor: 'border-slate-900 bg-slate-950',
    cutoutType: 'dynamic-island-large',
    time: '09:41',
    buttonsStyle: 'iphone-classic',
  },
  {
    id: 'iphone-13',
    name: 'iPhone 13 / 13 Pro',
    brand: 'Apple',
    screenSize: '6.1"',
    chassisWidth: 'max-w-[350px]',
    outerRadius: 'rounded-[2.6rem]',
    innerRadius: 'rounded-[1.9rem]',
    borderWidth: 'border-[8px]',
    borderColor: 'border-slate-800 bg-slate-900',
    cutoutType: 'notch-compact',
    time: '09:41',
    buttonsStyle: 'iphone-classic',
  },
  {
    id: 'iphone-12',
    name: 'iPhone 12',
    brand: 'Apple',
    screenSize: '6.1"',
    chassisWidth: 'max-w-[345px]',
    outerRadius: 'rounded-[2.4rem]',
    innerRadius: 'rounded-[1.75rem]',
    borderWidth: 'border-[8px]',
    borderColor: 'border-slate-800 bg-slate-900',
    cutoutType: 'notch-wide',
    time: '09:41',
    buttonsStyle: 'iphone-classic',
  },
  {
    id: 'samsung-a12',
    name: 'Galaxy A12',
    brand: 'Samsung',
    screenSize: '6.5"',
    chassisWidth: 'max-w-[355px]',
    outerRadius: 'rounded-[2.1rem]',
    innerRadius: 'rounded-[1.5rem]',
    borderWidth: 'border-[9px]',
    borderColor: 'border-zinc-700 bg-zinc-800',
    cutoutType: 'infinity-v',
    time: '12:45',
    buttonsStyle: 'samsung-standard',
  },
];

interface DigitalCardLivePreviewProps {
  card: Partial<DigitalCard>;
}

export const DigitalCardLivePreview: React.FC<DigitalCardLivePreviewProps> = ({ card }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<DeviceModel>('iphone-18-pro-max');
  const [brandFilter, setBrandFilter] = useState<'all' | 'Apple' | 'Samsung'>('all');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);

  const headerTextColor = getContrastTextColor(card.backgroundColor || '#12375B');
  const actionButtonTextColor = getContrastTextColor(card.buttonColor || '#1A7FBE');

  const isGlass = isGlassmorphismTheme(card.appearanceTheme);
  const isGlassDark = card.appearanceTheme === 'glass_dark';
  const glassStyles = getGlassmorphicCardStyles(isGlassDark);

  const bgStyle = isGlass
    ? glassStyles.cardBg
    : hexToRgba(card.contentColor || '#FFFFFF', (card.contentOpacity ?? 100) / 100);

  const headerBg = isGlass
    ? (isGlassDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.35)')
    : hexToRgba(card.backgroundColor || '#12375B', (card.headerOpacity ?? 100) / 100);

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

  // Controles e canais condicionais baseados no preenchimento de endereços/links
  const hasAiAgent = isConfiguredLink(card.aiAgentUrl);
  const aiAgentInfo = hasAiAgent ? parseAiAgentInput(card.aiAgentUrl) : null;

  const hasWhatsapp = isConfiguredLink(card.whatsappPhone);
  const hasPhone = isConfiguredLink(card.phone);
  const hasEmail = isConfiguredLink(card.email);
  const hasWebsite = isConfiguredLink(card.websiteUrl);
  const hasAddress = Boolean(
    (card.address && card.address.trim()) ||
    (card.city && card.city.trim()) ||
    isConfiguredLink(card.googleMapsUrl)
  );
  const hasGoogleReview = isConfiguredLink(card.googleReviewUrl);
  const hasPix = Boolean(card.pixKey && card.pixKey.trim());
  const hasContacts = hasWhatsapp || hasPhone || hasEmail || hasWebsite || hasAddress || hasGoogleReview || hasPix;

  const hasInstagram = isConfiguredLink(card.instagramUrl);
  const hasLinkedin = isConfiguredLink(card.linkedinUrl);
  const hasFacebook = isConfiguredLink(card.facebookUrl);
  const hasYoutube = isConfiguredLink(card.youtubeUrl);
  const hasSocial = hasInstagram || hasLinkedin || hasFacebook || hasYoutube;

  const hasSummary = Boolean(card.summary && card.summary.trim());
  const hasCta = Boolean(card.ctaLabel && card.ctaLabel.trim() && isConfiguredLink(card.ctaUrl));

  const currentDevice = DEVICES.find((d) => d.id === selectedDeviceId) || DEVICES[2];

  const filteredDevices =
    brandFilter === 'all'
      ? DEVICES
      : DEVICES.filter((d) => d.brand === brandFilter);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Barra de Seleção de Dispositivo Recolhível */}
      <div className="w-full mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200">
        {/* Cabeçalho do seletor (sempre visível e clicável para expandir/recolher) */}
        <button
          type="button"
          onClick={() => setIsSelectorOpen(!isSelectorOpen)}
          className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
          aria-expanded={isSelectorOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/40">
              <Smartphone size={15} />
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dispositivo:</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentDevice.name}
              </span>
              {currentDevice.tag && (
                <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/50 px-1.5 py-0.2 rounded-md shrink-0">
                  {currentDevice.tag}
                </span>
              )}
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                {currentDevice.brand} · {currentDevice.screenSize}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold shrink-0 ml-2">
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hidden sm:inline">
              {isSelectorOpen ? 'Ocultar modelos' : 'Alterar modelo'}
            </span>
            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              {isSelectorOpen ? <ChevronDown size={14} className="rotate-180 transition-transform duration-200" /> : <ChevronDown size={14} className="transition-transform duration-200" />}
            </div>
          </div>
        </button>

        {/* Conteúdo Recolhível */}
        {isSelectorOpen && (
          <div className="p-3 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5 animate-in fade-in duration-150">
            {/* Filtro por Marca */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Escolha o Mockup
              </span>
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setBrandFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    brandFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilter('Apple')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    brandFilter === 'Apple' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Apple
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilter('Samsung')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    brandFilter === 'Samsung' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Samsung
                </button>
              </div>
            </div>

            {/* Grid de Modelos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {filteredDevices.map((dev) => {
                const isSelected = dev.id === selectedDeviceId;
                return (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => {
                      setSelectedDeviceId(dev.id);
                      setIsSelectorOpen(false); // Recolhe automaticamente após escolher para economizar espaço
                    }}
                    className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-600/20 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs truncate">{dev.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between w-full mt-0.5 gap-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        {dev.brand} · {dev.screenSize}
                      </span>
                      {dev.tag && (
                        <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.2 rounded-xs shrink-0">
                          {dev.tag.replace(' · Flagship', '')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CHASSIS DO SMARTPHONE COM MOCKUP REALISTA */}
      <div className="relative w-full flex justify-center py-2 select-none">
        {/* Simulação de Botões Físicos Laterais no Chassis */}
        <div
          id="phone-mockup-frame"
          className={`relative w-full ${currentDevice.chassisWidth} ${currentDevice.outerRadius} p-2.5 sm:p-3 shadow-2xl ${currentDevice.borderWidth} ${currentDevice.borderColor} transition-all duration-300`}
        >
          {/* Botões do iPhone 16 (Action Button, Volume Up, Volume Down, Power Button e Camera Control) */}
          {currentDevice.buttonsStyle === 'iphone-16' && (
            <>
              {/* Botão de Ação (topo esquerdo) */}
              <div className="absolute -left-[9px] top-20 w-[4px] h-5 bg-neutral-600 rounded-l-xs border-y border-l border-neutral-700" title="Botão de Ação" />
              {/* Volume + e Volume - */}
              <div className="absolute -left-[9px] top-28 w-[4px] h-10 bg-neutral-600 rounded-l-xs border-y border-l border-neutral-700" title="Aumentar Volume" />
              <div className="absolute -left-[9px] top-40 w-[4px] h-10 bg-neutral-600 rounded-l-xs border-y border-l border-neutral-700" title="Diminuir Volume" />
              {/* Botão Lateral Power */}
              <div className="absolute -right-[9px] top-24 w-[4px] h-14 bg-neutral-600 rounded-r-xs border-y border-r border-neutral-700" title="Botão Lateral" />
              {/* Novo Controle de Câmera (Camera Control - Face táctil capacitiva no canto inferior direito) */}
              <div className="absolute -right-[9px] top-44 w-[4px] h-12 bg-neutral-500 rounded-r-xs border-y border-r border-neutral-400/80 ring-1 ring-neutral-700/50" title="Camera Control" />
            </>
          )}

          {/* Botões do iPhone Clássico */}
          {currentDevice.buttonsStyle === 'iphone-classic' && (
            <>
              <div className="absolute -left-[11px] top-20 w-[3px] h-6 bg-slate-700 rounded-l-sm" />
              <div className="absolute -left-[11px] top-29 w-[3px] h-10 bg-slate-700 rounded-l-sm" />
              <div className="absolute -left-[11px] top-42 w-[3px] h-10 bg-slate-700 rounded-l-sm" />
              <div className="absolute -right-[11px] top-28 w-[3px] h-14 bg-slate-700 rounded-r-sm" />
            </>
          )}

          {/* Botões do Samsung Ultra (Chassi de Titânio Flat + Tecla de Volume e Energia no lado direito + S-Pen slot) */}
          {currentDevice.buttonsStyle === 'samsung-ultra' && (
            <>
              {/* Tecla de Volume Dupla na direita */}
              <div className="absolute -right-[8px] top-22 w-[4px] h-16 bg-zinc-600 rounded-r-xs border-y border-r border-zinc-500" title="Volume" />
              {/* Tecla Lateral Liga/Desliga */}
              <div className="absolute -right-[8px] top-42 w-[4px] h-10 bg-zinc-600 rounded-r-xs border-y border-r border-zinc-500" title="Energia" />
              {/* Detalhe da S-Pen no canto inferior esquerdo */}
              <div className="absolute -bottom-[6px] left-6 w-5 h-[3px] bg-zinc-700 rounded-b-xs border-x border-b border-zinc-600" title="Compartimento S-Pen" />
            </>
          )}

          {/* Botões do Samsung Standard */}
          {currentDevice.buttonsStyle === 'samsung-standard' && (
            <>
              <div className="absolute -right-[9px] top-24 w-[3px] h-14 bg-zinc-600 rounded-r-xs" />
              <div className="absolute -right-[9px] top-42 w-[3px] h-9 bg-zinc-600 rounded-r-xs" />
            </>
          )}

          {/* STATUS BAR E RECORTE DO DISPOSITIVO (NOTCH / DYNAMIC ISLAND / PUNCH-HOLE) */}
          <div className="relative w-full z-20 mb-1 px-3 pt-1 flex items-center justify-between text-[11px] font-bold tracking-tight text-slate-800 dark:text-slate-200">
            {/* Hora */}
            <span className="w-12 text-left font-mono">{currentDevice.time}</span>

            {/* Recorte Específico do Modelo */}
            <div className="flex-1 flex justify-center">
              {/* iPhone 16 Pro Max: Dynamic Island Pro Max com acabamento ultra-fino e sensores */}
              {currentDevice.cutoutType === 'dynamic-island-pro-max' && (
                <div className="w-26 h-5 bg-black rounded-full flex items-center justify-between px-2 text-[8px] text-white shadow-md ring-1 ring-neutral-900">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-neutral-900 ring-1 ring-neutral-800" />
                    <div className="w-1 h-1 rounded-full bg-blue-950/60" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              )}

              {/* iPhone 16 Pro / 14 Pro: Dynamic Island */}
              {currentDevice.cutoutType === 'dynamic-island' && (
                <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2 text-[8px] text-white shadow-md ring-1 ring-neutral-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}

              {/* iPhone 14 Pro Max: Dynamic Island expandida */}
              {currentDevice.cutoutType === 'dynamic-island-large' && (
                <div className="w-28 h-5.5 bg-black rounded-full flex items-center justify-between px-2.5 text-[8px] text-white shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}

              {/* Samsung Galaxy S25 / S26 Ultra: Micro Infinity-O (Câmera de abertura ultra-fina centralizada) */}
              {currentDevice.cutoutType === 'infinity-o-micro' && (
                <div className="w-2.5 h-2.5 rounded-full bg-black ring-1 ring-zinc-800 flex items-center justify-center shadow-xs">
                  <div className="w-1 h-1 rounded-full bg-sky-900" />
                </div>
              )}

              {/* Samsung Galaxy S25+ / S25: Infinity-O padrão */}
              {currentDevice.cutoutType === 'infinity-o' && (
                <div className="w-3 h-3 rounded-full bg-black ring-1 ring-zinc-800 flex items-center justify-center shadow-xs">
                  <div className="w-1 h-1 rounded-full bg-blue-900" />
                </div>
              )}

              {/* Samsung Galaxy A12: Infinity-V (Waterdrop notch) */}
              {currentDevice.cutoutType === 'infinity-v' && (
                <div className="w-5 h-3.5 bg-zinc-800 rounded-b-full -mt-1 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-950" />
                </div>
              )}

              {/* iPhone 13: Notch compacto */}
              {currentDevice.cutoutType === 'notch-compact' && (
                <div className="w-28 h-4 bg-slate-900 rounded-b-xl flex items-center justify-center -mt-1 shadow-xs">
                  <div className="w-9 h-1 bg-slate-800 rounded-full" />
                </div>
              )}

              {/* iPhone 12: Notch clássico largo */}
              {currentDevice.cutoutType === 'notch-wide' && (
                <div className="w-36 h-4 bg-slate-900 rounded-b-xl flex items-center justify-center -mt-1 shadow-xs">
                  <div className="w-12 h-1 bg-slate-800 rounded-full" />
                </div>
              )}
            </div>

            {/* Ícones de Rede e Bateria */}
            <div className="w-12 flex items-center justify-end gap-1 text-slate-700 dark:text-slate-300">
              <Wifi size={12} />
              <Battery size={13} />
            </div>
          </div>

          {/* SIMULAÇÃO DE ABA DO NAVEGADOR MOBILE (com Favicon Dinâmico do Cartão) */}
          <div className="mx-1 mb-1.5 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 shadow-xs">
            <img
              src={card.mobileIconUrl || card.companyLogoUrl || card.imageUrl || '/default-cat-avatar.jpg'}
              alt="Favicon"
              referrerPolicy="no-referrer"
              className="w-3.5 h-3.5 rounded-xs object-contain shrink-0 bg-white border border-slate-200/60"
            />
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">
              {card.mobileAppName || (card.brandName ? `${card.name || 'Cartão'} | ${card.brandName}` : card.name || 'Cartão Digital')}
            </span>
            <span className="text-[9px] text-slate-400 font-mono shrink-0">cartao/{card.slug || 'perfil'}</span>
          </div>

          {/* TELA INTERNA DO DISPOSITIVO */}
          <div
            className={`w-full ${currentDevice.innerRadius} overflow-y-auto max-h-[620px] shadow-inner text-slate-800 no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col relative`}
            style={{
              backgroundColor: isGlassmorphismTheme(card.appearanceTheme)
                ? (card.appearanceTheme === 'glass_dark' ? '#090D16' : '#0F172A')
                : (card.bodyColor || '#EAF1F7'),
              fontFamily: getFontFamily(card.fontFamily || 'sans')
            }}
          >
            {/* Container do Cartão com suporte a Imagem de Fundo (se configurada) */}
            <div className="relative w-full flex flex-col min-h-full">
              {/* CAMADA DE IMAGEM DE FUNDO DO CARTÃO (atrás de tudo no cartão) */}
              {card.contentBackgroundImageUrl && (
                <div
                  className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
                  style={{
                    opacity: (card.contentBackgroundImageOpacity ?? 100) / 100,
                  }}
                >
                  <img
                    src={card.contentBackgroundImageUrl}
                    alt="Imagem de fundo do cartão"
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
                  backgroundColor: bgStyle,
                  backdropFilter: isGlass ? glassStyles.backdropBlur : undefined,
                  boxShadow: isGlass ? glassStyles.shadow : undefined,
                  border: isGlass ? glassStyles.border : undefined,
                }}
              >
                    {/* Header com Dual Porthole */}
                    <div
                      className="pt-5 pb-4 px-4 text-center relative transition-all"
                      style={{
                        backgroundColor: headerBg,
                        backdropFilter: isGlass ? 'blur(12px)' : undefined,
                        borderBottom: isGlass ? glassStyles.borderSubtle : undefined,
                        color: headerTextColor,
                      }}
                    >
                      <DigitalCardDualPorthole
                        imageUrl={card.imageUrl}
                        name={card.name || 'Nome'}
                        companyLogoUrl={card.companyLogoUrl}
                        brandName={card.brandName}
                        frameScale={card.frameScale || 97}
                        imageFocusX={card.imageFocusX ?? 50}
                        imageFocusY={card.imageFocusY ?? 50}
                        companyLogoFocusX={card.companyLogoFocusX || 56}
                        companyLogoFocusY={card.companyLogoFocusY || 67}
                        borderColor={card.contentColor || '#FFFFFF'}
                      />

                      <h1 className="text-base sm:text-lg font-black tracking-tight uppercase font-heading">
                        {card.brandName || card.name || 'Sua Empresa'}
                      </h1>
                      <p className="text-xs sm:text-sm font-semibold opacity-95">
                        {card.name || 'Seu Nome Completo'}
                      </p>
                      {card.jobTitle && (
                        <p className="text-[10px] sm:text-[11px] opacity-80 mt-0.5 tracking-wider uppercase font-medium">
                          {card.jobTitle}
                        </p>
                      )}
                    </div>

              {/* Botões de Ação */}
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
                const vcardText = card.vcardButtonTextColor || (isNeu && !card.vcardButtonColor && !card.buttonColor ? neuStyles.textColor : actionButtonTextColor);

                const whatsappBg = card.whatsappButtonColor || (isNeu ? neuStyles.bg : '#059669');
                const whatsappText = card.whatsappButtonTextColor || (isNeu && !card.whatsappButtonColor ? (isNeuDark ? '#34D399' : '#059669') : '#FFFFFF');

                const pwaBg = card.pwaButtonColor || (isNeu ? neuStyles.bg : '#0F172A');
                const pwaText = card.pwaButtonTextColor || (isNeu && !card.pwaButtonColor ? neuStyles.textColor : '#FFFFFF');

                const aiAgentBg = card.aiAgentButtonColor || (isNeu ? neuStyles.bg : '#7C3AED');
                const aiAgentText = card.aiAgentButtonTextColor || (isNeu && !card.aiAgentButtonColor ? (isNeuDark ? '#C084FC' : '#7C3AED') : '#FFFFFF');

                return (
                  <div className="px-3.5 py-3 flex flex-col gap-2.5">
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 font-bold text-xs transition-all"
                      style={{
                        backgroundColor: vcardBg,
                        color: vcardText,
                        borderRadius: `${Math.round(vcardRadius * 0.85)}px`,
                        boxShadow: isNeu ? neuStyles.raised : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        border: isNeu ? neuStyles.border : undefined,
                      }}
                    >
                      <Download size={14} />
                      <span>Salvar contato no celular</span>
                    </button>

                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 font-bold text-xs transition-all"
                      style={{
                        backgroundColor: whatsappBg,
                        color: whatsappText,
                        borderRadius: `${Math.round(whatsappRadius * 0.85)}px`,
                        boxShadow: isNeu ? neuStyles.raised : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        border: isNeu ? neuStyles.border : undefined,
                      }}
                    >
                      <Share2 size={14} />
                      <span>Compartilhar no WhatsApp</span>
                    </button>

                    {/* Botão de Instalar no Celular */}
                    {(() => {
                      const appDisplayName = card.mobileAppName || (card.brandName ? `${card.name} | ${card.brandName}` : card.name);
                      return (
                        <button
                          type="button"
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 font-bold text-xs transition-all"
                          style={{
                            backgroundColor: pwaBg,
                            color: pwaText,
                            borderRadius: `${Math.round(pwaRadius * 0.85)}px`,
                            boxShadow: isNeu ? neuStyles.raised : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            border: isNeu ? neuStyles.border : undefined,
                          }}
                        >
                          <Smartphone size={14} />
                          <span className="truncate">Instalar "{appDisplayName}" no celular</span>
                        </button>
                      );
                    })()}

                    {aiAgentInfo && (() => {
                      const glowClass = getAiAgentButtonGlowClass(card.aiAgentGlowEnabled, card.aiAgentGlowIntensity);
                      const basePaddingY = getAiAgentButtonPaddingY(card.aiAgentButtonSize, card.aiAgentButtonPaddingY);
                      const previewPaddingY = Math.max(6, Math.round(basePaddingY * 0.8));
                      const borderWidth = card.aiAgentButtonBorderWidth || 0;
                      const borderColor = card.aiAgentButtonBorderColor || '#C084FC';
                      return (
                        <button
                          type="button"
                          className={`w-full flex items-center justify-center gap-2 px-3 font-bold text-xs relative overflow-hidden transition-all ${glowClass}`}
                          style={{
                            backgroundColor: aiAgentBg,
                            color: aiAgentText,
                            borderRadius: `${Math.round(aiAgentRadius * 0.85)}px`,
                            paddingTop: `${previewPaddingY}px`,
                            paddingBottom: `${previewPaddingY}px`,
                            boxShadow: isNeu ? neuStyles.raised : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            borderWidth: borderWidth > 0 ? `${Math.max(1, Math.round(borderWidth * 0.8))}px` : (isNeu ? '1px' : undefined),
                            borderStyle: (borderWidth > 0 || isNeu) ? 'solid' : undefined,
                            borderColor: borderWidth > 0 ? borderColor : (isNeu ? (isNeuDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)') : undefined),
                          }}
                        >
                          <Bot size={previewPaddingY >= 13 ? 16 : 14} className="shrink-0" />
                          <span>{card.aiAgentButtonText || 'Atendente Virtual'}</span>
                          {card.aiAgentGlowEnabled !== false && (
                            <Sparkles size={previewPaddingY >= 13 ? 14 : 12} className="text-purple-200/90 shrink-0 ml-0.5" />
                          )}
                        </button>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Resumo */}
              {hasSummary && (
                <div className="px-4 py-2 text-center border-t border-slate-100/50">
                  <p className="text-xs leading-relaxed italic" style={{ color: summaryTextColor }}>
                    "{card.summary}"
                  </p>
                </div>
              )}

              {/* Contatos - Somente se houver canais preenchidos */}
              {hasContacts && (() => {
                const isNeu = isNeumorphismTheme(card.appearanceTheme);
                const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
                const neuStyles = getNeumorphicCardStyles(isNeuDark);
                const itemBg = isNeu ? neuStyles.bg : (contentContrast.isDarkBg ? 'rgba(255, 255, 255, 0.08)' : '#F8FAFC');
                const itemShadow = isNeu ? neuStyles.raisedSubtle : undefined;
                const itemBorder = isNeu ? neuStyles.border : (contentContrast.isDarkBg ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)');
                const itemColor = isNeu ? neuStyles.textColor : (contentContrast.isDarkBg ? '#F8FAFC' : '#1E293B');

                return (
                  <div className="px-3.5 py-3 flex flex-col gap-2 border-t border-slate-100/50">
                    {hasWhatsapp && (
                      <div
                        className="flex items-center gap-2 p-2 rounded-xl text-xs transition-all"
                        style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemColor }}
                      >
                        <MessageCircle size={14} className="text-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{card.whatsappPhone}</span>
                      </div>
                    )}
                    {hasPhone && (
                      <div
                        className="flex items-center gap-2 p-2 rounded-xl text-xs transition-all"
                        style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemColor }}
                      >
                        <Phone size={14} className="text-blue-500 shrink-0" />
                        <span className="truncate font-medium">{card.phone}</span>
                      </div>
                    )}
                    {hasEmail && (
                      <div
                        className="flex items-center gap-2 p-2 rounded-xl text-xs transition-all"
                        style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemColor }}
                      >
                        <Mail size={14} className="text-indigo-500 shrink-0" />
                        <span className="truncate font-medium">{card.email}</span>
                      </div>
                    )}
                    {hasWebsite && (
                      <div
                        className="flex items-center gap-2 p-2 rounded-xl text-xs transition-all"
                        style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemColor }}
                      >
                        <Globe size={14} className="text-sky-500 shrink-0" />
                        <span className="truncate font-medium">{card.websiteUrl}</span>
                      </div>
                    )}
                    {hasAddress && (
                      <div
                        className="flex items-center gap-2 p-2 rounded-xl text-xs transition-all"
                        style={{ backgroundColor: itemBg, boxShadow: itemShadow, border: itemBorder, color: itemColor }}
                      >
                        <MapPin size={14} className="text-rose-500 shrink-0" />
                        <span className="truncate font-medium">
                          {[card.address, card.addressNumber, card.city, card.state].filter(Boolean).join(', ') || 'Localização no Google Maps'}
                        </span>
                      </div>
                    )}
                    {hasGoogleReview && (
                      <div
                        className="flex items-center justify-between gap-2 p-2 rounded-xl text-xs transition-all"
                        style={{
                          backgroundColor: isNeu ? itemBg : (contentContrast.isDarkBg ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7'),
                          boxShadow: itemShadow,
                          border: isNeu ? itemBorder : (contentContrast.isDarkBg ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FCD34D'),
                          color: itemColor,
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Star size={11} className="fill-white text-white" />
                          </div>
                          <div className="min-w-0">
                            <span
                              className="truncate font-bold block text-[11px]"
                              style={{ color: isNeu ? itemColor : (contentContrast.isDarkBg ? '#FDE68A' : '#78350F') }}
                            >
                              Avaliar no Google
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                          Avaliar ↗
                        </span>
                      </div>
                    )}
                    {hasPix && (
                      <button
                        type="button"
                        onClick={() => setIsPixModalOpen(true)}
                        className="w-full flex items-center justify-between gap-2 p-2 rounded-xl text-xs transition-all shadow-2xs text-left cursor-pointer group"
                        style={{
                          backgroundColor: isNeu ? itemBg : (contentContrast.isDarkBg ? 'rgba(13, 148, 136, 0.15)' : '#F0FDFA'),
                          boxShadow: itemShadow,
                          border: isNeu ? itemBorder : (contentContrast.isDarkBg ? '1px solid rgba(13, 148, 136, 0.35)' : '1px solid #99F6E4'),
                          color: itemColor,
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <PixIcon size={12} color="#FFFFFF" />
                          </div>
                          <div className="min-w-0">
                            <span
                              className="truncate font-bold block text-[11px]"
                              style={{ color: isNeu ? itemColor : (contentContrast.isDarkBg ? '#5EEAD4' : '#115E59') }}
                            >
                              Pagar via PIX
                            </span>
                            <span
                              className="text-[10px] font-mono truncate block font-semibold"
                              style={{ color: isNeu ? itemColor : (contentContrast.isDarkBg ? '#F0FDFA' : '#0F172A') }}
                            >
                              {formatPixKeyForDisplay(card.pixKey || '', card.pixType) || card.pixKey}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-white bg-teal-600 group-hover:bg-teal-700 px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                          QR Code ↗
                        </span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Redes Sociais - Somente se houver redes preenchidas */}
              {hasSocial && (() => {
                const isNeu = isNeumorphismTheme(card.appearanceTheme);
                const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
                const neuStyles = getNeumorphicCardStyles(isNeuDark);

                return (
                  <div className="px-4 py-3 border-t border-slate-100/50 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      {hasInstagram && (
                        <div
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isNeu ? neuStyles.bg : undefined,
                            boxShadow: isNeu ? neuStyles.raisedSubtle : undefined,
                            border: isNeu ? neuStyles.border : undefined,
                            color: isNeu ? neuStyles.textColor : undefined,
                          }}
                          title="Instagram"
                        >
                          <Instagram size={14} />
                        </div>
                      )}
                      {hasLinkedin && (
                        <div
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isNeu ? neuStyles.bg : undefined,
                            boxShadow: isNeu ? neuStyles.raisedSubtle : undefined,
                            border: isNeu ? neuStyles.border : undefined,
                            color: isNeu ? neuStyles.textColor : undefined,
                          }}
                          title="LinkedIn"
                        >
                          <Linkedin size={14} />
                        </div>
                      )}
                      {hasFacebook && (
                        <div
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isNeu ? neuStyles.bg : undefined,
                            boxShadow: isNeu ? neuStyles.raisedSubtle : undefined,
                            border: isNeu ? neuStyles.border : undefined,
                            color: isNeu ? neuStyles.textColor : undefined,
                          }}
                          title="Facebook"
                        >
                          <Facebook size={14} />
                        </div>
                      )}
                      {hasYoutube && (
                        <div
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isNeu ? neuStyles.bg : undefined,
                            boxShadow: isNeu ? neuStyles.raisedSubtle : undefined,
                            border: isNeu ? neuStyles.border : undefined,
                            color: isNeu ? neuStyles.textColor : undefined,
                          }}
                          title="YouTube"
                        >
                          <Youtube size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* QR Code */}
              <div
                className="px-4 py-3 border-t border-slate-100 text-center transition-colors"
                style={{
                  backgroundColor: card.qrCodeSectionBgColor || undefined,
                }}
              >
                <p className="text-[10px] font-bold uppercase mb-1.5" style={{ color: qrTitleColor }}>QR Code</p>
                <DigitalCardQrCode
                  slug={card.slug || 'preview'}
                  qrCodeStyle={card.qrCodeStyle || 'quadrado'}
                  foregroundColor={card.qrCodeForegroundColor || card.backgroundColor || '#12375B'}
                  backgroundColor={card.qrCodeBackgroundColor || '#FFFFFF'}
                  logoUrl={card.qrCodeLogoUrl || card.companyLogoUrl}
                  size={120}
                  showDownloadButton={false}
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

              {/* Formulário de Primeiro Contato (se habilitado e não oculto) */}
              {card.inquiryEnabled !== false && !card.hideInquiryForm && (() => {
                const isNeu = isNeumorphismTheme(card.appearanceTheme);
                const isNeuDark = card.appearanceTheme === 'neumorphism_dark';
                const neuStyles = getNeumorphicCardStyles(isNeuDark);

                const fieldBg = isNeu ? (isNeuDark ? '#14161D' : '#E0E5EC') : undefined;
                const fieldShadow = isNeu ? neuStyles.inset : undefined;
                const fieldBorder = isNeu ? neuStyles.border : undefined;

                const submitBg = card.buttonColor || (isNeu ? neuStyles.bg : '#1A7FBE');
                const submitText = card.buttonColor ? actionButtonTextColor : (isNeu ? neuStyles.textColor : actionButtonTextColor);

                return (
                  <div className="px-4 py-3 border-t border-slate-100/50">
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: contentContrast.titleColor }}>
                      <Send size={12} className="text-sky-500" />
                      <span>Enviar uma mensagem</span>
                    </div>
                    <p className="text-[10px] mb-2.5" style={{ color: contentContrast.subtitleColor }}>
                      Deixe um recado diretamente para {card.name || 'o titular'}.
                    </p>

                    <div className="space-y-2">
                      {card.inquiryShowName !== false && (
                        <div>
                          <label className="block text-[10px] font-semibold mb-0.5" style={{ color: contentContrast.labelColor }}>
                            Seu Nome (opcional)
                          </label>
                          <div
                            className="w-full px-2.5 py-1.5 text-[10px] rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition-all"
                            style={{ backgroundColor: fieldBg, boxShadow: fieldShadow, border: fieldBorder }}
                          >
                            Ex: Maria Santos
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1.5">
                        {card.inquiryShowEmail !== false && (
                          <div>
                            <label className="block text-[10px] font-semibold mb-0.5" style={{ color: contentContrast.labelColor }}>
                              E-mail *
                            </label>
                            <div
                              className="w-full px-2 py-1.5 text-[10px] rounded-lg border border-slate-200 bg-slate-50 text-slate-400 truncate transition-all"
                              style={{ backgroundColor: fieldBg, boxShadow: fieldShadow, border: fieldBorder }}
                            >
                              seu@email.com
                            </div>
                          </div>
                        )}
                        {card.inquiryShowPhone !== false && (
                          <div>
                            <label className="block text-[10px] font-semibold mb-0.5" style={{ color: contentContrast.labelColor }}>
                              WhatsApp *
                            </label>
                            <div
                              className="w-full px-2 py-1.5 text-[10px] rounded-lg border border-slate-200 bg-slate-50 text-slate-400 truncate transition-all"
                              style={{ backgroundColor: fieldBg, boxShadow: fieldShadow, border: fieldBorder }}
                            >
                              (11) 99999-9999
                            </div>
                          </div>
                        )}
                      </div>

                      {card.inquiryShowMessage !== false && (
                        <div>
                          <label className="block text-[10px] font-semibold mb-0.5" style={{ color: contentContrast.labelColor }}>
                            Mensagem *
                          </label>
                          <div
                            className="w-full px-2.5 py-1.5 text-[10px] rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition-all"
                            style={{ backgroundColor: fieldBg, boxShadow: fieldShadow, border: fieldBorder }}
                          >
                            Olá, gostaria de saber mais...
                          </div>
                        </div>
                      )}

                      {/* Consentimento Obrigatório com Alto Contraste */}
                      {card.inquiryShowConsent !== false && (
                        <div
                          className="flex items-start gap-1.5 p-2 rounded-lg border transition-all"
                          style={{
                            backgroundColor: isNeu ? (isNeuDark ? '#14161D' : '#E0E5EC') : (contentContrast.isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'),
                            borderColor: isNeu ? undefined : (contentContrast.isDarkBg ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'),
                            boxShadow: isNeu ? neuStyles.inset : undefined,
                            border: isNeu ? neuStyles.border : undefined,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            readOnly
                            className="mt-0.5 rounded border-slate-300 text-sky-600 shrink-0 w-3.5 h-3.5"
                          />
                          <label
                            className="text-[10px] font-medium leading-snug cursor-default select-none"
                            style={{ color: contentContrast.consentColor }}
                          >
                            Concordo em compartilhar meus dados de contato com {card.name || 'o titular'} para fins de retorno desta mensagem.
                          </label>
                        </div>
                      )}

                      <button
                        type="button"
                        className="w-full py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                        style={{
                          backgroundColor: submitBg,
                          color: submitText,
                          boxShadow: isNeu ? neuStyles.raised : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          border: isNeu ? neuStyles.border : undefined,
                        }}
                      >
                        <Send size={11} />
                        <span>Enviar mensagem</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* CTA - Somente se configurado com label e link */}
              {hasCta && (
                <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                  <span className="text-[11px] font-bold text-slate-700 underline">
                    {card.ctaLabel}
                  </span>
                </div>
              )}

              {/* Rodapé */}
              <div className="px-4 py-2.5 text-center border-t border-slate-200/60">
                <p className="text-[10px]" style={{ color: contentContrast.footerColor }}>
                  {card.footerText || 'Cartão Digital Profissional'}
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* BARRA INFERIOR / HOME INDICATOR */}
          <div className="w-full pt-2 flex justify-center items-center">
            {currentDevice.brand === 'Apple' ? (
              // Barra de início do iOS
              <div className="w-32 h-1 bg-slate-500/50 rounded-full" />
            ) : currentDevice.isBoxy ? (
              // Barra de navegação One UI moderna (Galaxy S Ultra)
              <div className="w-24 h-1 bg-zinc-600/60 rounded-full" />
            ) : (
              // 3 botões sutis da linha Galaxy A
              <div className="flex items-center gap-6 text-[10px] text-zinc-500/70">
                <span>|||</span>
                <span className="w-2.5 h-2.5 rounded-xs border border-zinc-500/70 inline-block" />
                <span>&lt;</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Interativo de Pagamento PIX no Preview */}
      <PixPaymentModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        pixKey={card.pixKey || ''}
        pixType={card.pixType}
        pixBeneficiary={card.pixBeneficiary || card.name}
        pixCity={card.pixCity || card.city || 'Brasil'}
        cardName={card.name}
        headerColor={card.backgroundColor || '#0f766e'}
      />
    </div>
  );
};
