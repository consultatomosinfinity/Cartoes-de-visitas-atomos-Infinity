import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { DigitalCard, UserProfile, UserRole, UserPlan, UserAccountStatus } from '../types.ts';

// Variáveis de ambiente client-side Vite (caso fornecidas no build)
const ENV_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const ENV_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

let supabaseInstance: SupabaseClient | null = null;
let cachedConfig: { supabaseUrl: string; supabasePublishableKey: string } | null = null;

// Inicializa ou obtém a instância do Supabase
export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const targetUrl = url || cachedConfig?.supabaseUrl || ENV_URL;
  const targetKey = key || cachedConfig?.supabasePublishableKey || ENV_KEY;

  if (!targetUrl || !targetKey || targetUrl.includes('your-project-id')) {
    return null;
  }

  if (!supabaseInstance || (url && key)) {
    supabaseInstance = createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'atomos_supabase_auth_token',
      },
    });
  }

  return supabaseInstance;
}

// Carrega configurações do servidor (/api/config) se não estiverem no bundle
export async function initSupabase(): Promise<SupabaseClient | null> {
  if (supabaseInstance) return supabaseInstance;

  // Se já temos no import.meta.env
  if (ENV_URL && ENV_KEY && !ENV_URL.includes('your-project-id')) {
    return getSupabaseClient(ENV_URL, ENV_KEY);
  }

  // Busca do backend /api/config
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const config = await res.json();
      if (config.supabaseUrl && config.supabasePublishableKey) {
        cachedConfig = config;
        return getSupabaseClient(config.supabaseUrl, config.supabasePublishableKey);
      }
    }
  } catch (err) {
    console.warn('Não foi possível obter configuração remota do Supabase:', err);
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (ENV_URL && ENV_KEY && !ENV_URL.includes('your-project-id')) ||
    (cachedConfig?.supabaseUrl && cachedConfig?.supabasePublishableKey)
  );
}

// --------------------------------------------------------------------------
// Funções de Autenticação Supabase (Auth)
// --------------------------------------------------------------------------

export async function authSignUp(email: string, password: string, fullName?: string) {
  const client = await initSupabase();
  if (!client) throw new Error('Supabase não configurado.');

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function authSignIn(email: string, password: string) {
  const client = await initSupabase();
  if (!client) throw new Error('Supabase não configurado.');

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function authSignOut() {
  const client = await initSupabase();
  if (!client) return;

  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function authResetPassword(email: string) {
  const client = await initSupabase();
  if (!client) throw new Error('Supabase não configurado.');

  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/app`,
  });

  if (error) throw error;
  return data;
}

export async function authGetSession(): Promise<Session | null> {
  const client = await initSupabase();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  return data.session;
}

export async function authGetUser(): Promise<User | null> {
  const client = await initSupabase();
  if (!client) return null;

  const { data } = await client.auth.getUser();
  return data.user;
}

// --------------------------------------------------------------------------
// Contas Master Designadas e Funções Administrativas
// --------------------------------------------------------------------------

export const MASTER_EMAILS = [
  'consultatomosinfinity@gmail.com',
  'atomoseletrotecnica@gmail.com',
];

export function isMasterEmail(email?: string | null): boolean {
  if (!email) return false;
  return MASTER_EMAILS.includes(email.trim().toLowerCase());
}

// Busca o perfil do usuário na tabela profiles
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const client = await initSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao buscar perfil:', error.message);
      return null;
    }

    if (!data) return null;

    const email = data.email || '';
    const isMaster = isMasterEmail(email);

    return {
      id: data.id,
      email,
      fullName: data.full_name || '',
      role: (isMaster ? 'master' : (data.role || 'cliente')) as UserRole,
      plan: (isMaster ? 'corporativo' : (data.plan || 'degustacao')) as UserPlan,
      status: (data.status || 'ativo') as UserAccountStatus,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Exceção ao buscar perfil:', err);
    return null;
  }
}

// Lista todos os perfis (Permitido para Master / Admin pela RLS)
export async function getAllProfiles(): Promise<UserProfile[]> {
  const client = await initSupabase();

  try {
    if (client) {
      const { data: profiles, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && profiles) {
        // Busca contagem de cartões por usuário para enriquecer a listagem
        const { data: cards } = await client.from('digital_cards').select('id, user_id');
        const cardCountByUser: Record<string, number> = {};
        if (cards) {
          cards.forEach((c: any) => {
            const uid = String(c.user_id);
            cardCountByUser[uid] = (cardCountByUser[uid] || 0) + 1;
          });
        }

        return profiles.map((p: any) => {
          const isMaster = isMasterEmail(p.email);
          return {
            id: p.id,
            email: p.email,
            fullName: p.full_name || '',
            role: (isMaster ? 'master' : (p.role || 'cliente')) as UserRole,
            plan: (isMaster ? 'corporativo' : (p.plan || 'degustacao')) as UserPlan,
            status: (p.status || 'ativo') as UserAccountStatus,
            cardsCount: cardCountByUser[String(p.id)] || 0,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          };
        });
      }
    }

    // Fallback para API do backend
    const session = await authGetSession();
    const token = session?.access_token || '';
    const res = await fetch('/api/admin/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (err) {
    console.warn('Exceção ao buscar todos os perfis:', err);
    return [];
  }
}

// Atualiza o perfil de um usuário (Role, Plano, Status, Nome)
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const client = await initSupabase();
  const session = await authGetSession();
  const token = session?.access_token || '';

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.fullName !== undefined) updatePayload.full_name = updates.fullName;
  if (updates.role !== undefined) updatePayload.role = updates.role;
  if (updates.plan !== undefined) updatePayload.plan = updates.plan;
  if (updates.status !== undefined) updatePayload.status = updates.status;

  if (client) {
    const { error } = await client
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (!error) return;
  }

  // Tenta via backend /api/admin/users/:id
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Erro ao atualizar usuário');
  }
}

// Exclui um usuário (Master Only)
export async function deleteUserAccount(userId: string): Promise<void> {
  const session = await authGetSession();
  const token = session?.access_token || '';

  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao excluir usuário');
  }
}

// Cria um novo usuário através da API administrativa
export async function createNewUser(userData: {
  email: string;
  password?: string;
  fullName?: string;
  role: UserRole;
  plan: UserPlan;
}): Promise<any> {
  const session = await authGetSession();
  const token = session?.access_token || '';

  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao criar usuário');
  }

  return await res.json();
}

// Redefine senha do usuário
export async function adminResetUserPassword(userId: string, email: string, newPassword?: string): Promise<{ message: string }> {
  const session = await authGetSession();
  const token = session?.access_token || '';

  const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, newPassword }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao redefinir senha');
  }

  return await res.json();
}

// --------------------------------------------------------------------------
// Utilitário de Upload para o Storage Bucket 'card-assets'
// --------------------------------------------------------------------------

export async function uploadCardAsset(
  file: File,
  userId: string,
  folder: 'photos' | 'logos' | 'backgrounds' | 'icons'
): Promise<string> {
  const client = await initSupabase();
  if (!client) throw new Error('Supabase Storage não configurado.');

  const fileExt = file.name.split('.').pop() || 'png';
  const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${userId}/${folder}/${cleanFileName}`;

  const { error: uploadError } = await client.storage
    .from('card-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Tenta obter URL pública ou URL assinada com validade estendida (1 ano)
  const { data: publicUrlData } = client.storage.from('card-assets').getPublicUrl(filePath);
  if (publicUrlData && publicUrlData.publicUrl) {
    return publicUrlData.publicUrl;
  }

  const { data: signedData, error: signError } = await client.storage
    .from('card-assets')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 ano

  if (signError || !signedData) {
    throw signError || new Error('Erro ao gerar URL do arquivo enviado.');
  }

  return signedData.signedUrl;
}

// --------------------------------------------------------------------------
// Mapeamento Bidirecional: CamelCase (App Types) <-> Snake_Case (Supabase DB)
// --------------------------------------------------------------------------

export function mapDbToDigitalCard(row: any): DigitalCard {
  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    name: row.name || '',
    jobTitle: row.job_title || '',
    brandName: row.brand_name || 'Átomos Infinity',
    status: row.status || 'ativo',
    phone: row.phone || '',
    email: row.email || '',
    whatsappPhone: row.whatsapp_phone || '',
    websiteUrl: row.website_url || '',
    address: row.address || '',
    addressNumber: row.address_number || '',
    postalCode: row.postal_code || '',
    city: row.city || '',
    state: row.state || '',
    country: row.country || 'Brasil',
    googleMapsUrl: row.google_maps_url || '',
    summary: row.summary || '',
    instagramUrl: row.instagram_url || '',
    linkedinUrl: row.linkedin_url || '',
    facebookUrl: row.facebook_url || '',
    youtubeUrl: row.youtube_url || '',
    aiAgentUrl: row.ai_agent_url || '',
    siteAiAgentEnabled: Boolean(row.site_ai_agent_enabled),
    aiAgentButtonText: row.ai_agent_button_text || 'Atendente Virtual',
    aiAgentButtonColor: row.ai_agent_button_color || '#7C3AED',
    aiAgentButtonTextColor: row.ai_agent_button_text_color || '#FFFFFF',
    aiAgentGlowEnabled: row.ai_agent_glow_enabled !== false,
    aiAgentGlowIntensity: row.ai_agent_glow_intensity || 'medio',
    aiAgentButtonSize: row.ai_agent_button_size || 'padrao',
    aiAgentButtonPaddingY: row.ai_agent_button_padding_y ?? 12,
    aiAgentButtonBorderWidth: row.ai_agent_button_border_width ?? 0,
    aiAgentButtonBorderColor: row.ai_agent_button_border_color || '#A855F7',
    appearanceTheme: row.appearance_theme || 'padrao',
    backgroundColor: row.background_color || '#12375B',
    headerOpacity: row.header_opacity ?? 100,
    buttonColor: row.button_color || '#1A7FBE',
    bodyColor: row.body_color || '#EAF1F7',
    contentColor: row.content_color || '#FFFFFF',
    contentOpacity: row.content_opacity ?? 100,
    fontFamily: row.font_family || 'sans',
    supportTextColor: row.support_text_color || '#64748B',
    summaryTextColor: row.summary_text_color || '',
    qrCodeTextColor: row.qr_code_text_color || '#1E293B',
    qrCodeSectionBgColor: row.qr_code_section_bg_color || '',
    inquiryTextColor: row.inquiry_text_color || '',
    dividerColor: row.divider_color || '#D7E0E7',
    dividerWidth: row.divider_width ?? 1,
    contactIconColor: row.contact_icon_color || '#1A507F',
    contactIconSize: row.contact_icon_size ?? 18,
    buttonsBorderRadius: row.buttons_border_radius ?? 16,
    vcardButtonColor: row.vcard_button_color || '#1A7FBE',
    vcardButtonTextColor: row.vcard_button_text_color || '#FFFFFF',
    vcardButtonBorderRadius: row.vcard_button_border_radius,
    whatsappButtonColor: row.whatsapp_button_color || '#059669',
    whatsappButtonTextColor: row.whatsapp_button_text_color || '#FFFFFF',
    whatsappButtonBorderRadius: row.whatsapp_button_border_radius,
    pwaButtonColor: row.pwa_button_color || '#0F172A',
    pwaButtonTextColor: row.pwa_button_text_color || '#FFFFFF',
    pwaButtonBorderRadius: row.pwa_button_border_radius,
    qrCodeStyle: row.qr_code_style || 'arredondado',
    qrCodeForegroundColor: row.qr_code_foreground_color || '#12375B',
    qrCodeBackgroundColor: row.qr_code_background_color || '#FFFFFF',
    qrCodeLogoUrl: row.qr_code_logo_url || '',
    qrCodeIncludeLogo: Boolean(row.qr_code_include_logo),
    qrCodeLogoSize: Number(row.qr_code_logo_size || 0.22),
    qrCodeFrameStyle: row.qr_code_frame_style || 'none',
    qrCodeFrameText: row.qr_code_frame_text || 'SCAN ME',
    qrCodeFrameColor: row.qr_code_frame_color || '',
    qrCodeFrameTextColor: row.qr_code_frame_text_color || '#FFFFFF',
    qrCodeDotsStyle: row.qr_code_dots_style || 'square',
    qrCodeCornersSquareStyle: row.qr_code_corners_square_style || 'square',
    qrCodeCornersSquareColor: row.qr_code_corners_square_color || '',
    qrCodeCornersDotStyle: row.qr_code_corners_dot_style || 'square',
    qrCodeCornersDotColor: row.qr_code_corners_dot_color || '',
    qrCodeGradientEnabled: Boolean(row.qr_code_gradient_enabled),
    qrCodeGradientType: row.qr_code_gradient_type || 'linear',
    qrCodeGradientStartColor: row.qr_code_gradient_start_color || '#12375B',
    qrCodeGradientEndColor: row.qr_code_gradient_end_color || '#1A7FBE',
    qrCodeTransparentBg: Boolean(row.qr_code_transparent_bg),
    imageUrl: row.image_url || '',
    companyLogoUrl: row.company_logo_url || '',
    frameScale: row.frame_scale ?? 97,
    companyLogoFocusX: row.company_logo_focus_x ?? 56,
    companyLogoFocusY: row.company_logo_focus_y ?? 67,
    contentBackgroundImageUrl: row.content_background_image_url || '',
    contentBackgroundImageFocusX: row.content_background_image_focus_x ?? 50,
    contentBackgroundImageFocusY: row.content_background_image_focus_y ?? 50,
    contentBackgroundImageOpacity: row.content_background_image_opacity ?? 100,
    contentBackgroundImageScale: row.content_background_image_scale ?? 100,
    mobileAppName: row.mobile_app_name || '',
    mobileIconUrl: row.mobile_icon_url || '',
    ctaLabel: row.cta_label || '',
    ctaUrl: row.cta_url || '',
    footerText: row.footer_text || 'Cartão digital disponibilizado por Átomos Infinity',
    trackingEnabled: Boolean(row.tracking_enabled),
    activityTrackingEnabled: row.activity_tracking_enabled !== false,
    gaMeasurementId: row.ga_measurement_id || '',
    metaPixelId: row.meta_pixel_id || '',
    gtmContainerId: row.gtm_container_id || '',
    inquiryEnabled: row.inquiry_enabled !== false,
    hideInquiryForm: Boolean(row.hide_inquiry_form),
    inquiryShowName: row.inquiry_show_name !== false,
    inquiryShowEmail: row.inquiry_show_email !== false,
    inquiryShowPhone: row.inquiry_show_phone !== false,
    inquiryShowMessage: row.inquiry_show_message !== false,
    inquiryShowConsent: row.inquiry_show_consent !== false,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapDigitalCardToDb(card: Partial<DigitalCard>, userId: string): any {
  const dbData: any = {
    user_id: userId,
    slug: (card.slug || '').toLowerCase().trim(),
    name: card.name || 'Novo Cartão',
    job_title: card.jobTitle || '',
    brand_name: card.brandName || 'Átomos Infinity',
    status: card.status || 'ativo',
    phone: card.phone || '',
    email: card.email || '',
    whatsapp_phone: card.whatsappPhone || '',
    website_url: card.websiteUrl || '',
    address: card.address || '',
    address_number: card.addressNumber || '',
    postal_code: card.postalCode || '',
    city: card.city || '',
    state: card.state || '',
    country: card.country || 'Brasil',
    google_maps_url: card.googleMapsUrl || '',
    summary: card.summary || '',
    instagram_url: card.instagramUrl || '',
    linkedin_url: card.linkedinUrl || '',
    facebook_url: card.facebookUrl || '',
    youtube_url: card.youtubeUrl || '',
    ai_agent_url: card.aiAgentUrl || '',
    site_ai_agent_enabled: Boolean(card.siteAiAgentEnabled),
    ai_agent_button_text: card.aiAgentButtonText || 'Atendente Virtual',
    ai_agent_button_color: card.aiAgentButtonColor || '#7C3AED',
    ai_agent_button_text_color: card.aiAgentButtonTextColor || '#FFFFFF',
    ai_agent_glow_enabled: card.aiAgentGlowEnabled !== false,
    ai_agent_glow_intensity: card.aiAgentGlowIntensity || 'medio',
    ai_agent_button_size: card.aiAgentButtonSize || 'padrao',
    ai_agent_button_padding_y: card.aiAgentButtonPaddingY ?? 12,
    ai_agent_button_border_width: card.aiAgentButtonBorderWidth ?? 0,
    ai_agent_button_border_color: card.aiAgentButtonBorderColor || '#A855F7',
    appearance_theme: card.appearanceTheme || 'padrao',
    background_color: card.backgroundColor || '#12375B',
    header_opacity: card.headerOpacity ?? 100,
    button_color: card.buttonColor || '#1A7FBE',
    body_color: card.bodyColor || '#EAF1F7',
    content_color: card.contentColor || '#FFFFFF',
    content_opacity: card.contentOpacity ?? 100,
    font_family: card.fontFamily || 'sans',
    support_text_color: card.supportTextColor || '#64748B',
    summary_text_color: card.summaryTextColor || '',
    qr_code_text_color: card.qrCodeTextColor || '#1E293B',
    qr_code_section_bg_color: card.qrCodeSectionBgColor || '',
    inquiry_text_color: card.inquiryTextColor || '',
    divider_color: card.dividerColor || '#D7E0E7',
    divider_width: card.dividerWidth ?? 1,
    contact_icon_color: card.contactIconColor || '#1A507F',
    contact_icon_size: card.contactIconSize ?? 18,
    buttons_border_radius: card.buttonsBorderRadius ?? 16,
    vcard_button_color: card.vcardButtonColor || '#1A7FBE',
    vcard_button_text_color: card.vcardButtonTextColor || '#FFFFFF',
    vcard_button_border_radius: card.vcardButtonBorderRadius,
    whatsapp_button_color: card.whatsappButtonColor || '#059669',
    whatsapp_button_text_color: card.whatsappButtonTextColor || '#FFFFFF',
    whatsapp_button_border_radius: card.whatsappButtonBorderRadius,
    pwa_button_color: card.pwaButtonColor || '#0F172A',
    pwa_button_text_color: card.pwaButtonTextColor || '#FFFFFF',
    pwa_button_border_radius: card.pwaButtonBorderRadius,
    qr_code_style: card.qrCodeStyle || 'arredondado',
    qr_code_foreground_color: card.qrCodeForegroundColor || '#12375B',
    qr_code_background_color: card.qrCodeBackgroundColor || '#FFFFFF',
    qr_code_logo_url: card.qrCodeLogoUrl || '',
    qr_code_include_logo: Boolean(card.qrCodeIncludeLogo),
    qr_code_logo_size: card.qrCodeLogoSize ?? 0.22,
    qr_code_frame_style: card.qrCodeFrameStyle || 'none',
    qr_code_frame_text: card.qrCodeFrameText || 'SCAN ME',
    qr_code_frame_color: card.qrCodeFrameColor || '',
    qr_code_frame_text_color: card.qrCodeFrameTextColor || '#FFFFFF',
    qr_code_dots_style: card.qrCodeDotsStyle || 'square',
    qr_code_corners_square_style: card.qrCodeCornersSquareStyle || 'square',
    qr_code_corners_square_color: card.qrCodeCornersSquareColor || '',
    qr_code_corners_dot_style: card.qrCodeCornersDotStyle || 'square',
    qr_code_corners_dot_color: card.qrCodeCornersDotColor || '',
    qr_code_gradient_enabled: Boolean(card.qrCodeGradientEnabled),
    qr_code_gradient_type: card.qrCodeGradientType || 'linear',
    qr_code_gradient_start_color: card.qrCodeGradientStartColor || '#12375B',
    qr_code_gradient_end_color: card.qrCodeGradientEndColor || '#1A7FBE',
    qr_code_transparent_bg: Boolean(card.qrCodeTransparentBg),
    image_url: card.imageUrl || '',
    company_logo_url: card.companyLogoUrl || '',
    frame_scale: card.frameScale ?? 97,
    company_logo_focus_x: card.companyLogoFocusX ?? 56,
    company_logo_focus_y: card.companyLogoFocusY ?? 67,
    content_background_image_url: card.contentBackgroundImageUrl || '',
    content_background_image_focus_x: card.contentBackgroundImageFocusX ?? 50,
    content_background_image_focus_y: card.contentBackgroundImageFocusY ?? 50,
    content_background_image_opacity: card.contentBackgroundImageOpacity ?? 100,
    content_background_image_scale: card.contentBackgroundImageScale ?? 100,
    mobile_app_name: card.mobileAppName || '',
    mobile_icon_url: card.mobileIconUrl || '',
    cta_label: card.ctaLabel || '',
    cta_url: card.ctaUrl || '',
    footer_text: card.footerText || 'Cartão digital disponibilizado por Átomos Infinity',
    tracking_enabled: Boolean(card.trackingEnabled),
    activity_tracking_enabled: card.activityTrackingEnabled !== false,
    ga_measurement_id: card.gaMeasurementId || '',
    meta_pixel_id: card.metaPixelId || '',
    gtm_container_id: card.gtmContainerId || '',
    inquiry_enabled: card.inquiryEnabled !== false,
    hide_inquiry_form: Boolean(card.hideInquiryForm),
    inquiry_show_name: card.inquiryShowName !== false,
    inquiry_show_email: card.inquiryShowEmail !== false,
    inquiry_show_phone: card.inquiryShowPhone !== false,
    inquiry_show_message: card.inquiryShowMessage !== false,
    inquiry_show_consent: card.inquiryShowConsent !== false,
    updated_at: new Date().toISOString(),
  };

  return dbData;
}
