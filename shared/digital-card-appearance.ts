export interface CardThemeColors {
  backgroundColor: string;
  buttonColor: string;
  bodyColor: string;
  contentColor: string;
}

export interface CardVisualPreset {
  id: string;
  name: string;
  tag: string;
  desc: string;
  bg: string;
  accent: string;
  colors: CardThemeColors;
  category?: 'palette' | 'effect';
}

export const VISUAL_PRESETS: CardVisualPreset[] = [
  {
    id: 'azul_corporativo',
    name: 'Azul Corporativo',
    tag: 'Executivo & Confiável',
    desc: 'Ideal para advogados, diretores, empresas e consultorias.',
    bg: '#12375B',
    accent: '#1A7FBE',
    category: 'palette',
    colors: {
      backgroundColor: '#12375B',
      buttonColor: '#1A7FBE',
      bodyColor: '#EAF1F7',
      contentColor: '#FFFFFF',
    },
  },
  {
    id: 'ouro_luxo',
    name: 'Ouro & Preto Luxo',
    tag: 'VIP & Sofisticado',
    desc: 'Perfeito para clínicas premium, corretores de luxo e marcas exclusivas.',
    bg: '#18181B',
    accent: '#D97706',
    category: 'palette',
    colors: {
      backgroundColor: '#18181B',
      buttonColor: '#D97706',
      bodyColor: '#09090B',
      contentColor: '#18181B',
    },
  },
  {
    id: 'esmeralda',
    name: 'Verde Esmeralda',
    tag: 'Saúde & Natureza',
    desc: 'Excelente para nutricionistas, médicos, estética, finanças e sustentabilidade.',
    bg: '#064E3B',
    accent: '#059669',
    category: 'palette',
    colors: {
      backgroundColor: '#064E3B',
      buttonColor: '#059669',
      bodyColor: '#ECFDF5',
      contentColor: '#FFFFFF',
    },
  },
  {
    id: 'roxo_criativo',
    name: 'Roxo Criativo',
    tag: 'Tech & Inovador',
    desc: 'Para designers, programadores, marketing digital e agências.',
    bg: '#4C1D95',
    accent: '#7C3AED',
    category: 'palette',
    colors: {
      backgroundColor: '#4C1D95',
      buttonColor: '#7C3AED',
      bodyColor: '#F5F3FF',
      contentColor: '#FFFFFF',
    },
  },
  {
    id: 'vermelho_elegante',
    name: 'Vermelho & Vinho',
    tag: 'Elegância & Energia',
    desc: 'Ideal para gastronomia, direito, eventos e moda.',
    bg: '#881337',
    accent: '#BE123C',
    category: 'palette',
    colors: {
      backgroundColor: '#881337',
      buttonColor: '#BE123C',
      bodyColor: '#FFF1F2',
      contentColor: '#FFFFFF',
    },
  },
  {
    id: 'rosa_moderno',
    name: 'Rosa & Beleza',
    tag: 'Estética & Feminino',
    desc: 'Indicado para salões, biomédicas, micropigmentação e semijoias.',
    bg: '#831843',
    accent: '#DB2777',
    category: 'palette',
    colors: {
      backgroundColor: '#831843',
      buttonColor: '#DB2777',
      bodyColor: '#FDF2F8',
      contentColor: '#FFFFFF',
    },
  },
  {
    id: 'preto_minimalista',
    name: 'Preto & Grafite Clean',
    tag: 'Minimalista & Moderno',
    desc: 'Estilo dark mode universal para qualquer área profissional.',
    bg: '#0F172A',
    accent: '#38BDF8',
    category: 'palette',
    colors: {
      backgroundColor: '#0F172A',
      buttonColor: '#38BDF8',
      bodyColor: '#020617',
      contentColor: '#1E293B',
    },
  },
];

export const EFFECT_PRESETS: CardVisualPreset[] = [
  {
    id: 'neumorphism_light',
    name: 'Neumorfismo Claro',
    tag: 'Soft UI 3D',
    desc: 'Efeito tátil moderno com relevos e sombras suaves em relevo.',
    bg: '#E0E5EC',
    accent: '#94A3B8',
    category: 'effect',
    colors: {
      backgroundColor: '#E0E5EC',
      buttonColor: '#E0E5EC',
      bodyColor: '#E0E5EC',
      contentColor: '#E0E5EC',
    },
  },
  {
    id: 'neumorphism_dark',
    name: 'Neumorfismo Escuro',
    tag: 'Dark High-Tech',
    desc: 'Relevos profundos em grafite escuro com botões em baixo/alto relevo.',
    bg: '#181B22',
    accent: '#334155',
    category: 'effect',
    colors: {
      backgroundColor: '#181B22',
      buttonColor: '#181B22',
      bodyColor: '#181B22',
      contentColor: '#181B22',
    },
  },
  {
    id: 'glass_light',
    name: 'Glassmorphism Claro',
    tag: 'Vidro Translúcido',
    desc: 'Desfoque de fundo e efeito translúcido moderno com bordas de luz.',
    bg: 'rgba(255, 255, 255, 0.7)',
    accent: '#2563EB',
    category: 'effect',
    colors: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      buttonColor: '#2563EB',
      bodyColor: '#0F172A',
      contentColor: 'rgba(255, 255, 255, 0.55)',
    },
  },
  {
    id: 'glass_dark',
    name: 'Glassmorphism Escuro',
    tag: 'Vidro Noturno',
    desc: 'Visual ultra-moderno escuro com transparência e destaque roxo.',
    bg: 'rgba(15, 23, 42, 0.8)',
    accent: '#7C3AED',
    category: 'effect',
    colors: {
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      buttonColor: '#7C3AED',
      bodyColor: '#090D16',
      contentColor: 'rgba(30, 41, 59, 0.65)',
    },
  },
];

export const PRESET_THEMES: Record<string, CardThemeColors> = {
  padrao: {
    backgroundColor: '#12375B',
    buttonColor: '#1A7FBE',
    bodyColor: '#EAF1F7',
    contentColor: '#FFFFFF',
  },
  azul_corporativo: {
    backgroundColor: '#12375B',
    buttonColor: '#1A7FBE',
    bodyColor: '#EAF1F7',
    contentColor: '#FFFFFF',
  },
  ouro_luxo: {
    backgroundColor: '#18181B',
    buttonColor: '#D97706',
    bodyColor: '#09090B',
    contentColor: '#18181B',
  },
  esmeralda: {
    backgroundColor: '#064E3B',
    buttonColor: '#059669',
    bodyColor: '#ECFDF5',
    contentColor: '#FFFFFF',
  },
  verde: {
    backgroundColor: '#1B5E20',
    buttonColor: '#4CAF50',
    bodyColor: '#E8F5E9',
    contentColor: '#FFFFFF',
  },
  roxo_criativo: {
    backgroundColor: '#4C1D95',
    buttonColor: '#7C3AED',
    bodyColor: '#F5F3FF',
    contentColor: '#FFFFFF',
  },
  roxo: {
    backgroundColor: '#4A148C',
    buttonColor: '#AB47BC',
    bodyColor: '#F3E5F5',
    contentColor: '#FFFFFF',
  },
  vermelho_elegante: {
    backgroundColor: '#881337',
    buttonColor: '#BE123C',
    bodyColor: '#FFF1F2',
    contentColor: '#FFFFFF',
  },
  rosa_moderno: {
    backgroundColor: '#831843',
    buttonColor: '#DB2777',
    bodyColor: '#FDF2F8',
    contentColor: '#FFFFFF',
  },
  preto_minimalista: {
    backgroundColor: '#0F172A',
    buttonColor: '#38BDF8',
    bodyColor: '#020617',
    contentColor: '#1E293B',
  },
  escuro: {
    backgroundColor: '#1A1A2E',
    buttonColor: '#E94560',
    bodyColor: '#16213E',
    contentColor: '#0F172A',
  },
  neumorphism_light: {
    backgroundColor: '#E0E5EC',
    buttonColor: '#E0E5EC',
    bodyColor: '#E0E5EC',
    contentColor: '#E0E5EC',
  },
  neumorphism_dark: {
    backgroundColor: '#181B22',
    buttonColor: '#181B22',
    bodyColor: '#181B22',
    contentColor: '#181B22',
  },
  glass_light: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    buttonColor: '#2563EB',
    bodyColor: '#0F172A',
    contentColor: 'rgba(255, 255, 255, 0.55)',
  },
  glass_dark: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    buttonColor: '#7C3AED',
    bodyColor: '#090D16',
    contentColor: 'rgba(30, 41, 59, 0.65)',
  },
  personalizado: {
    backgroundColor: '#12375B',
    buttonColor: '#1A7FBE',
    bodyColor: '#EAF1F7',
    contentColor: '#FFFFFF',
  },
};

/**
 * Calcula a luminância relativa de uma cor hexadecimal (padrão sRGB/WCAG)
 */
export function getLuminance(hexColor: string): number {
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Retorna '#FFFFFF' ou '#0F172A' para garantir legibilidade WCAG AA máxima sobre a cor de fundo
 */
export function getContrastTextColor(hexColor?: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#FFFFFF';
  const lum = getLuminance(hexColor);
  return lum > 0.45 ? '#0F172A' : '#FFFFFF';
}

/**
 * Converte cor HEX para RGBA com canal alpha/opacidade entre 0 e 1 (ou 0 a 100%)
 */
export function hexToRgba(hexColor: string = '#FFFFFF', alpha: number = 1): string {
  if (!hexColor) return `rgba(255, 255, 255, ${alpha})`;
  
  // Se já for rgba ou rgb
  if (hexColor.startsWith('rgba') || hexColor.startsWith('rgb')) {
    return hexColor;
  }

  const cleanHex = hexColor.replace('#', '').trim();
  const normalizedAlpha = Math.max(0, Math.min(1, alpha > 1 ? alpha / 100 : alpha));

  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) || 255;
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) || 255;
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) || 255;
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
  }

  if (cleanHex.length === 6 || cleanHex.length === 8) {
    const r = parseInt(cleanHex.substring(0, 2), 16) || 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 255;
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
  }

  return hexColor;
}

/**
 * Verifica se um link ou canal foi preenchido de forma válida.
 * Retorna false para valores nulos, vazios, espaços ou schemas incompletos (http://, https://, etc.)
 */
export function isConfiguredLink(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (['http://', 'https://', '#', 'mailto:', 'tel:'].includes(lower)) return false;
  return true;
}

/**
 * Mistura duas cores hexadecimais com base na opacidade do topo (0 a 100)
 */
export function blendHexColors(topHex: string = '#FFFFFF', bottomHex: string = '#EAF1F7', topOpacity: number = 100): string {
  const cleanTop = (topHex || '#FFFFFF').replace('#', '').trim();
  const cleanBottom = (bottomHex || '#EAF1F7').replace('#', '').trim();
  if (cleanTop.length !== 6 || cleanBottom.length !== 6) return topHex || '#FFFFFF';

  const alpha = Math.max(0, Math.min(1, topOpacity > 1 ? topOpacity / 100 : topOpacity));
  
  const rTop = parseInt(cleanTop.substring(0, 2), 16);
  const gTop = parseInt(cleanTop.substring(2, 4), 16);
  const bTop = parseInt(cleanTop.substring(4, 6), 16);

  const rBot = parseInt(cleanBottom.substring(0, 2), 16);
  const gBot = parseInt(cleanBottom.substring(2, 4), 16);
  const bBot = parseInt(cleanBottom.substring(4, 6), 16);

  const r = Math.round(alpha * rTop + (1 - alpha) * rBot);
  const g = Math.round(alpha * gTop + (1 - alpha) * gBot);
  const b = Math.round(alpha * bTop + (1 - alpha) * bBot);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Retorna cores de texto de alto contraste (WCAG) para a área de conteúdo do cartão digital,
 * garantindo legibilidade absoluta para títulos, rótulos de formulário, consentimento LGPD e rodapé,
 * independentemente da cor de fundo (clara ou escura) ou imagem aplicada.
 */
export function getCardContentContrastColors(options: {
  contentColor?: string;
  contentOpacity?: number;
  bodyColor?: string;
  supportTextColor?: string;
  inquiryTextColor?: string;
}) {
  const effectiveBg = blendHexColors(
    options.contentColor || '#FFFFFF',
    options.bodyColor || '#EAF1F7',
    options.contentOpacity ?? 100
  );
  const bgLuminance = getLuminance(effectiveBg);
  const isDarkBg = bgLuminance <= 0.45;

  // Cores padrão de alto contraste sobre o fundo
  const defaultPrimaryText = isDarkBg ? '#FFFFFF' : '#0F172A';
  const defaultLabelText = isDarkBg ? '#E2E8F0' : '#1E293B';
  const defaultConsentText = isDarkBg ? '#F8FAFC' : '#0F172A';
  const defaultMutedText = isDarkBg ? '#94A3B8' : '#334155';

  // Se o usuário especificou supportTextColor
  const userSupportColor = options.supportTextColor;
  const isUserSupportValid = userSupportColor && userSupportColor.startsWith('#') && (
    isDarkBg ? getLuminance(userSupportColor) > 0.32 : getLuminance(userSupportColor) < 0.68
  );

  // Se o usuário especificou inquiryTextColor
  const userInquiryColor = options.inquiryTextColor;
  const isUserInquiryValid = userInquiryColor && userInquiryColor.startsWith('#') && (
    isDarkBg ? getLuminance(userInquiryColor) > 0.32 : getLuminance(userInquiryColor) < 0.68
  );

  return {
    effectiveBg,
    isDarkBg,
    // Títulos de seção no conteúdo (ex: Enviar uma mensagem, Canais de comunicação)
    titleColor: isUserInquiryValid ? userInquiryColor : (isUserSupportValid ? userSupportColor : defaultPrimaryText),
    // Subtítulo descritivo ("Deixe um recado diretamente...")
    subtitleColor: isUserInquiryValid ? userInquiryColor : (isUserSupportValid ? userSupportColor : defaultMutedText),
    // Rótulos de campos ("Seu Nome", "E-mail *", "WhatsApp *", "Mensagem *")
    labelColor: isUserInquiryValid ? userInquiryColor : (isUserSupportValid ? userSupportColor : defaultLabelText),
    // Texto de consentimento ("Concordo em compartilhar meus dados...")
    consentColor: isUserInquiryValid ? userInquiryColor : (isUserSupportValid ? userSupportColor : defaultConsentText),
    // Rodapé
    footerColor: isUserSupportValid ? userSupportColor : defaultMutedText,
  };
}

/**
 * Verifica se um tema ou cartão é do estilo Neumorphism (Soft UI)
 */
export function isNeumorphismTheme(theme?: string): boolean {
  if (!theme) return false;
  const t = theme.toLowerCase().trim();
  return t === 'neumorphism_light' || t === 'neumorphism_dark' || t.startsWith('neumorphism') || t === 'soft_ui' || t === 'neumorfismo';
}

/**
 * Retorna as propriedades de relevo e sombra características do Neumorphism
 */
export function getNeumorphicCardStyles(isDark: boolean = false) {
  if (isDark) {
    return {
      bg: '#181B22',
      raised: '6px 6px 16px rgba(0, 0, 0, 0.75), -6px -6px 16px rgba(255, 255, 255, 0.04)',
      raisedSubtle: '3px 3px 8px rgba(0, 0, 0, 0.65), -3px -3px 8px rgba(255, 255, 255, 0.04)',
      inset: 'inset 3px 3px 7px rgba(0, 0, 0, 0.8), inset -3px -3px 7px rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      headerBorder: '1px solid rgba(255, 255, 255, 0.04)',
      textColor: '#F1F5F9',
      subtextColor: '#94A3B8',
    };
  }

  return {
    bg: '#E0E5EC',
    raised: '6px 6px 14px #b8b9be, -6px -6px 14px #ffffff',
    raisedSubtle: '3px 3px 8px #b8b9be, -3px -3px 8px #ffffff',
    inset: 'inset 3px 3px 6px #b8b9be, inset -3px -3px 6px #ffffff',
    border: '1px solid rgba(255, 255, 255, 0.75)',
    headerBorder: '1px solid rgba(255, 255, 255, 0.75)',
    textColor: '#0F172A',
    subtextColor: '#334155',
  };
}

/**
 * Verifica se um tema ou cartão é do estilo Glassmorphism (Glass UI)
 */
export function isGlassmorphismTheme(theme?: string): boolean {
  if (!theme) return false;
  const t = theme.toLowerCase().trim();
  return t === 'glass_light' || t === 'glass_dark' || t.startsWith('glass') || t === 'glassmorphism' || t === 'vidro';
}

/**
 * Retorna as propriedades de vidro fosco (backdrop-blur, border translúcido e brilho)
 */
export function getGlassmorphicCardStyles(isDark: boolean = false) {
  if (isDark) {
    return {
      bg: 'rgba(15, 23, 42, 0.65)',
      cardBg: 'rgba(30, 41, 59, 0.55)',
      backdropBlur: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderSubtle: '1px solid rgba(255, 255, 255, 0.08)',
      shadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      inset: 'rgba(15, 23, 42, 0.7)',
      textColor: '#F8FAFC',
      subtextColor: '#94A3B8',
    };
  }

  return {
    bg: 'rgba(255, 255, 255, 0.55)',
    cardBg: 'rgba(255, 255, 255, 0.65)',
    backdropBlur: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderSubtle: '1px solid rgba(255, 255, 255, 0.4)',
    shadow: '0 20px 40px rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    inset: 'rgba(240, 244, 248, 0.8)',
    textColor: '#1E293B',
    subtextColor: '#64748B',
  };
}

