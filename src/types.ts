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

export type UserRole = 'master' | 'admin' | 'colaborador' | 'cliente' | 'degustador';
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
  degustacaoDays?: number;
  degustacaoExpiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  requireMasterApproval: boolean; // Se true, novos cadastros entram como 'pausado' aguardando aprovação
  defaultRole: UserRole; // 'cliente' ou 'degustador'
  defaultPlan: UserPlan; // 'degustacao', 'profissional', etc.
  degustacaoDays: number; // Ex: 30 dias (padrão), 7, 14, 15, 60, etc.
  allowPublicRegistration: boolean; // Se true, cadastro público aberto; se false, apenas Master cadastra
  masterWhatsApp?: string; // WhatsApp de contato do Master
  customWelcomeMessage?: string;
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
  imageFocusX?: number;
  imageFocusY?: number;
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

  // Gestão de Mensalidade, Recorrência e Vencimento (Billing & Expiry)
  billingCycle?: CardBillingCycle;
  billingAmount?: number;
  billingStartDate?: string;
  billingDueDate?: string;
  billingPixKey?: string;
  billingCustomerName?: string;
  billingCustomerPhone?: string;
  billingNotes?: string;
  billingLastRenewedAt?: string;
}

export type CardBillingCycle = 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'degustacao' | 'vitalicio';

export interface CardBillingSummary {
  totalCards: number;
  activeCards: number;
  expiringSoonCards: number; // Próximos 7 dias
  expiredCards: number;
  monthlyRevenueEstimate: number;
  quarterlyRevenueEstimate: number;
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

export interface WallpaperItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  folderId: string;
  recommendedTheme?: string;
  createdAt?: string;
}

export interface WallpaperFolder {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

// Formulário Simplificado de Captação para Vendedoras & Clientes (Onboarding Express)
export type OnboardingFormStatus = 'pendente' | 'em_producao' | 'convertido' | 'arquivado';

export interface ClientOnboardingForm {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OnboardingFormStatus;
  
  // Vendedora / Consultora / Origem
  salesRepName?: string;
  salesRepPhone?: string;

  // Dados Pessoais & Profissionais
  fullName: string;
  jobTitle: string;
  companyName: string;
  whatsappPhone: string;
  secondaryPhone?: string;
  email: string;
  
  // Localização
  city?: string;
  state?: string;
  fullAddress?: string;

  // Sobre & Resumo
  summaryBio?: string;

  // Imagens (Base64 ou URLs)
  photoUrl?: string; // Foto de perfil / Avatar
  logoUrl?: string;  // Logo da empresa
  contentBackgroundUrl?: string; // Papel de parede ou fundo

  // Redes Sociais & Links
  instagramHandle?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  customLinkName?: string; // Ex: "Catálogo", "Agendamento", "Cardápio"
  customLinkUrl?: string;

  // Dados Financeiros / PIX
  pixKey?: string;
  pixType?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  pixBeneficiary?: string;

  // Preferências Visuais & Estilo
  preferredTheme?: string;
  notes?: string;

  // Cartão gerado a partir do formulário
  generatedCardId?: number;
  generatedCardSlug?: string;
  convertedAt?: string;
}

