export type DigitalCardStatus = 'ativo' | 'pausado';
export type QrCodeStyle = 'quadrado' | 'arredondado' | 'pontilhado';
export type QrCodeDotsStyle = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
export type QrCodeCornersSquareStyle = 'square' | 'extra-rounded' | 'dot';
export type QrCodeCornersDotStyle = 'square' | 'dot';
export type QrCodeFrameStyle = 'none' | 'badge_bottom' | 'badge_top' | 'phone' | 'clipboard' | 'polaroid' | 'circular';
export type EventKind = 'card_open' | 'qr_open' | 'outbound_click';
export type OutboundDestination =
  | 'website'
  | 'institutional'
  | 'instagram'
  | 'linkedin'
  | 'facebook'
  | 'youtube'
  | 'whatsapp'
  | 'maps'
  | 'ai_agent';
export type InquiryStatus = 'novo' | 'lido' | 'arquivado';

export type UserRole = 'master' | 'admin' | 'colaborador' | 'cliente';
export type UserPlan = 'degustacao' | 'profissional' | 'negocios_ia' | 'corporativo';
export type UserAccountStatus = 'ativo' | 'pausado' | 'bloqueado';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  plan: UserPlan;
  status: UserAccountStatus;
  cardsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DigitalCard {
  id: number;
  userId: number;
  slug: string;
  name: string;
  jobTitle: string;

  // Contato
  phone?: string;
  email?: string;
  whatsappPhone?: string;
  websiteUrl?: string;

  // Localização
  address?: string;
  addressNumber?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  googleMapsUrl?: string;

  // Conteúdo
  summary?: string;

  // Redes sociais
  instagramUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;

  // Ícones customizados das redes
  instagramIconKey?: string;
  instagramIconUrl?: string;
  linkedinIconKey?: string;
  linkedinIconUrl?: string;
  facebookIconKey?: string;
  facebookIconUrl?: string;
  youtubeIconKey?: string;
  youtubeIconUrl?: string;

  // Atendente Virtual (IA próprio do cartão)
  aiAgentUrl?: string;
  siteAiAgentEnabled: boolean;
  aiAgentButtonColor: string;
  aiAgentButtonTextColor?: string;
  aiAgentButtonText: string;
  aiAgentButtonBorderRadius?: number;
  aiAgentIconKey?: string;
  aiAgentIconUrl?: string;
  aiAgentGlowEnabled?: boolean;
  aiAgentGlowIntensity?: 'suave' | 'medio' | 'intenso';
  aiAgentButtonSize?: 'fino' | 'padrao' | 'espesso' | 'extra';
  aiAgentButtonPaddingY?: number;
  aiAgentButtonBorderWidth?: number;
  aiAgentButtonBorderColor?: string;

  // Arredondamento e cores individuais dos botões
  buttonsBorderRadius?: number; // Raio global dos botões (px)

  // Botão 1: Salvar contato no celular (vCard)
  vcardButtonColor?: string;
  vcardButtonTextColor?: string;
  vcardButtonBorderRadius?: number;

  // Botão 2: Compartilhar no WhatsApp
  whatsappButtonColor?: string;
  whatsappButtonTextColor?: string;
  whatsappButtonBorderRadius?: number;

  // Botão 3: Instalar aplicativo no celular (PWA)
  pwaButtonColor?: string;
  pwaButtonTextColor?: string;
  pwaButtonBorderRadius?: number;

  // Marca e aparência
  brandName: string;
  ctaLabel: string;
  ctaUrl: string;
  footerText: string;
  appearanceTheme: string;
  backgroundColor: string;
  headerOpacity?: number;
  buttonColor: string;
  bodyColor: string;
  contentColor: string;
  contentOpacity: number;
  supportTextColor?: string;
  summaryTextColor?: string;
  qrCodeTextColor?: string;
  qrCodeSectionBgColor?: string;
  inquiryTextColor?: string;
  fontFamily?: string;
  contactIconColor?: string;
  contactIconSize?: number;
  dividerColor?: string;
  dividerWidth?: number;

  // QR Code
  qrCodeStyle: QrCodeStyle;
  qrCodeForegroundColor: string;
  qrCodeBackgroundColor: string;
  qrCodeLogoKey?: string;
  qrCodeLogoUrl?: string;
  qrCodeFrameStyle?: QrCodeFrameStyle;
  qrCodeFrameText?: string;
  qrCodeFrameColor?: string;
  qrCodeFrameTextColor?: string;
  qrCodeDotsStyle?: QrCodeDotsStyle;
  qrCodeCornersSquareStyle?: QrCodeCornersSquareStyle;
  qrCodeCornersSquareColor?: string;
  qrCodeCornersDotStyle?: QrCodeCornersDotStyle;
  qrCodeCornersDotColor?: string;
  qrCodeGradientEnabled?: boolean;
  qrCodeGradientType?: 'linear' | 'radial';
  qrCodeGradientStartColor?: string;
  qrCodeGradientEndColor?: string;
  qrCodeTransparentBg?: boolean;
  qrCodeIncludeLogo?: boolean;
  qrCodeLogoSize?: number;

  // Assets visuais
  imageKey?: string;
  imageUrl?: string;
  companyLogoKey?: string;
  companyLogoUrl?: string;
  frameScale: number;
  companyLogoFocusX?: number;
  companyLogoFocusY?: number;
  contentBackgroundImageKey?: string;
  contentBackgroundImageUrl?: string;
  contentBackgroundImageFocusX?: number;
  contentBackgroundImageFocusY?: number;
  contentBackgroundImageOpacity?: number;
  contentBackgroundImageScale?: number;

  // PWA / mobile
  mobileAppName?: string;
  mobileIconKey?: string;
  mobileIconUrl?: string;

  // Rastreamento e métricas
  gaMeasurementId?: string;
  metaPixelId?: string;
  gtmContainerId?: string;
  trackingEnabled: boolean;
  activityTrackingEnabled: boolean;

  // Primeiro contato / Enviar mensagem
  inquiryEnabled: boolean;
  hideInquiryForm?: boolean; // Checkbox para ocultar a função "Enviar uma mensagem" com seus componentes
  inquiryShowName?: boolean;
  inquiryShowEmail?: boolean;
  inquiryShowPhone?: boolean;
  inquiryShowMessage?: boolean;
  inquiryShowConsent?: boolean;

  // Status e controle
  status: DigitalCardStatus;
  createdById?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalCardEvent {
  id: number;
  cardId: number;
  kind: EventKind;
  destination?: string;
  createdAt: string;
}

export interface DigitalCardInquiry {
  id: number;
  cardId: number;
  name?: string;
  email?: string;
  whatsappPhone?: string;
  message: string;
  status: InquiryStatus;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardMetrics {
  cardOpens: number;
  qrOpens: number;
  outboundClicks: number;
  destinations: Record<string, number>;
  inquiriesCount: number;
}
