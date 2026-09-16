export interface CardThemeColors {
  backgroundColor: string;
  buttonColor: string;
  bodyColor: string;
  contentColor: string;
}

export const PRESET_THEMES: Record<string, CardThemeColors> = {
  padrao: {
    backgroundColor: '#12375B',
    buttonColor: '#1A7FBE',
    bodyColor: '#EAF1F7',
    contentColor: '#FFFFFF',
  },
  escuro: {
    backgroundColor: '#1A1A2E',
    buttonColor: '#E94560',
    bodyColor: '#16213E',
    contentColor: '#0F172A',
  },
  verde: {
    backgroundColor: '#1B5E20',
    buttonColor: '#4CAF50',
    bodyColor: '#E8F5E9',
    contentColor: '#FFFFFF',
  },
  roxo: {
    backgroundColor: '#4A148C',
    buttonColor: '#AB47BC',
    bodyColor: '#F3E5F5',
    contentColor: '#FFFFFF',
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
  const defaultLabelText = isDarkBg ? '#E2E8F0' : '#334155';
  const defaultConsentText = isDarkBg ? '#F8FAFC' : '#1E293B';
  const defaultMutedText = isDarkBg ? '#94A3B8' : '#64748B';

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

