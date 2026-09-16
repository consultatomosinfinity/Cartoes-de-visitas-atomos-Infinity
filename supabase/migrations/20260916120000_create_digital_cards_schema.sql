-- ==============================================================================
-- MIGRATION: Schema Completo do Gerador de Cartões Digitais Átomos Infinity
-- Suporte a Contas Master (consultatomosinfinity@gmail.com / atomoseletrotecnica@gmail.com),
-- Funções RBAC (Master, Admin, Colaborador, Cliente) e Gestão de Planos
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS DE USUÁRIOS (Vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'cliente' CHECK (role IN ('master', 'admin', 'colaborador', 'cliente')),
  plan TEXT DEFAULT 'degustacao' CHECK (plan IN ('degustacao', 'profissional', 'negocios_ia', 'corporativo')),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'bloqueado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona colunas role, plan e status se a tabela já existir previamente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'cliente' CHECK (role IN ('master', 'admin', 'colaborador', 'cliente'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan') THEN
    ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'degustacao' CHECK (plan IN ('degustacao', 'profissional', 'negocios_ia', 'corporativo'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'bloqueado'));
  END IF;
END $$;

-- 3. FUNÇÕES AUXILIARES DE VERIFICAÇÃO DE PRIVILÉGIOS (SECURITY DEFINER)
-- Evitam recursão em políticas RLS e identificam as contas Master designadas
CREATE OR REPLACE FUNCTION public.is_master(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND role = 'master'
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = check_user_id 
      AND LOWER(email) IN ('consultatomosinfinity@gmail.com', 'atomoseletrotecnica@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_master_or_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND role IN ('master', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = check_user_id 
      AND LOWER(email) IN ('consultatomosinfinity@gmail.com', 'atomoseletrotecnica@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Trigger para criar perfil automaticamente no cadastro com atribuição automática de Master
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT := 'cliente';
  assigned_plan TEXT := 'degustacao';
BEGIN
  -- Se o e-mail cadastrado for uma das contas Master designadas, assume automaticamente função 'master' e plano 'corporativo'
  IF LOWER(new.email) IN ('consultatomosinfinity@gmail.com', 'atomoseletrotecnica@gmail.com') THEN
    assigned_role := 'master';
    assigned_plan := 'corporativo';
  ELSE
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'cliente');
    assigned_plan := COALESCE(new.raw_user_meta_data->>'plan', 'degustacao');
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, plan, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    assigned_role,
    assigned_plan,
    'ativo'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE 
      WHEN LOWER(EXCLUDED.email) IN ('consultatomosinfinity@gmail.com', 'atomoseletrotecnica@gmail.com') THEN 'master'
      ELSE public.profiles.role
    END,
    plan = CASE 
      WHEN LOWER(EXCLUDED.email) IN ('consultatomosinfinity@gmail.com', 'atomoseletrotecnica@gmail.com') THEN 'corporativo'
      ELSE public.profiles.plan
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualiza perfis existentes das contas master designadas
UPDATE public.profiles
SET role = 'master', plan = 'corporativo', status = 'ativo'
WHERE LOWER(email) IN ('consultatomosinfinity@gmail.com', 'atomoseletrotecnica@gmail.com');

-- 4. TABELA PRINCIPAL DE CARTÕES DIGITAIS (PROJETOS)
CREATE TABLE IF NOT EXISTS public.digital_cards (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  job_title TEXT DEFAULT '',
  brand_name TEXT DEFAULT 'Átomos Infinity',
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado')),

  -- Contato
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  whatsapp_phone TEXT DEFAULT '',
  website_url TEXT DEFAULT '',

  -- Localização
  address TEXT DEFAULT '',
  address_number TEXT DEFAULT '',
  postal_code TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  country TEXT DEFAULT 'Brasil',
  google_maps_url TEXT DEFAULT '',

  -- Conteúdo & Bio
  summary TEXT DEFAULT '',

  -- Redes Sociais
  instagram_url TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',

  -- Atendente Virtual (IA integrado ao cartão)
  ai_agent_url TEXT DEFAULT '',
  site_ai_agent_enabled BOOLEAN DEFAULT FALSE,
  ai_agent_button_text TEXT DEFAULT 'Atendente Virtual',
  ai_agent_button_color TEXT DEFAULT '#7C3AED',
  ai_agent_button_text_color TEXT DEFAULT '#FFFFFF',
  ai_agent_glow_enabled BOOLEAN DEFAULT TRUE,
  ai_agent_glow_intensity TEXT DEFAULT 'medio',
  ai_agent_button_size TEXT DEFAULT 'padrao',
  ai_agent_button_padding_y INTEGER DEFAULT 12,
  ai_agent_button_border_width INTEGER DEFAULT 0,
  ai_agent_button_border_color TEXT DEFAULT '#A855F7',

  -- Aparência, Cores e Tipografia
  appearance_theme TEXT DEFAULT 'padrao',
  background_color TEXT DEFAULT '#12375B',
  header_opacity INTEGER DEFAULT 100,
  button_color TEXT DEFAULT '#1A7FBE',
  body_color TEXT DEFAULT '#EAF1F7',
  content_color TEXT DEFAULT '#FFFFFF',
  content_opacity INTEGER DEFAULT 100,
  font_family TEXT DEFAULT 'sans',
  support_text_color TEXT DEFAULT '#64748B',
  summary_text_color TEXT DEFAULT '',
  qr_code_text_color TEXT DEFAULT '#1E293B',
  qr_code_section_bg_color TEXT DEFAULT '',
  inquiry_text_color TEXT DEFAULT '',
  divider_color TEXT DEFAULT '#D7E0E7',
  divider_width INTEGER DEFAULT 1,
  contact_icon_color TEXT DEFAULT '#1A507F',
  contact_icon_size INTEGER DEFAULT 18,

  -- Botões de Ação Individuais
  buttons_border_radius INTEGER DEFAULT 16,
  vcard_button_color TEXT DEFAULT '#1A7FBE',
  vcard_button_text_color TEXT DEFAULT '#FFFFFF',
  vcard_button_border_radius INTEGER,
  whatsapp_button_color TEXT DEFAULT '#059669',
  whatsapp_button_text_color TEXT DEFAULT '#FFFFFF',
  whatsapp_button_border_radius INTEGER,
  pwa_button_color TEXT DEFAULT '#0F172A',
  pwa_button_text_color TEXT DEFAULT '#FFFFFF',
  pwa_button_border_radius INTEGER,

  -- QR Code
  qr_code_style TEXT DEFAULT 'arredondado',
  qr_code_foreground_color TEXT DEFAULT '#12375B',
  qr_code_background_color TEXT DEFAULT '#FFFFFF',
  qr_code_logo_url TEXT DEFAULT '',
  qr_code_include_logo BOOLEAN DEFAULT FALSE,
  qr_code_logo_size NUMERIC DEFAULT 0.22,
  qr_code_frame_style TEXT DEFAULT 'none',
  qr_code_frame_text TEXT DEFAULT 'SCAN ME',
  qr_code_frame_color TEXT DEFAULT '',
  qr_code_frame_text_color TEXT DEFAULT '#FFFFFF',
  qr_code_dots_style TEXT DEFAULT 'square',
  qr_code_corners_square_style TEXT DEFAULT 'square',
  qr_code_corners_square_color TEXT DEFAULT '',
  qr_code_corners_dot_style TEXT DEFAULT 'square',
  qr_code_corners_dot_color TEXT DEFAULT '',
  qr_code_gradient_enabled BOOLEAN DEFAULT FALSE,
  qr_code_gradient_type TEXT DEFAULT 'linear',
  qr_code_gradient_start_color TEXT DEFAULT '#12375B',
  qr_code_gradient_end_color TEXT DEFAULT '#1A7FBE',
  qr_code_transparent_bg BOOLEAN DEFAULT FALSE,

  -- Imagens & Assets Visuais
  image_url TEXT DEFAULT '',
  company_logo_url TEXT DEFAULT '',
  frame_scale INTEGER DEFAULT 97,
  company_logo_focus_x INTEGER DEFAULT 56,
  company_logo_focus_y INTEGER DEFAULT 67,
  content_background_image_url TEXT DEFAULT '',
  content_background_image_focus_x INTEGER DEFAULT 50,
  content_background_image_focus_y INTEGER DEFAULT 50,
  content_background_image_opacity INTEGER DEFAULT 100,
  content_background_image_scale INTEGER DEFAULT 100,

  -- PWA / Aplicativo Mobile
  mobile_app_name TEXT DEFAULT '',
  mobile_icon_url TEXT DEFAULT '',

  -- Rodapé e Chamada
  cta_label TEXT DEFAULT '',
  cta_url TEXT DEFAULT '',
  footer_text TEXT DEFAULT 'Cartão digital disponibilizado por Átomos Infinity',

  -- Rastreamento & Métricas
  tracking_enabled BOOLEAN DEFAULT FALSE,
  activity_tracking_enabled BOOLEAN DEFAULT TRUE,
  ga_measurement_id TEXT DEFAULT '',
  meta_pixel_id TEXT DEFAULT '',
  gtm_container_id TEXT DEFAULT '',

  -- Formulário de Contato / Primeiro Contato (100% LGPD)
  inquiry_enabled BOOLEAN DEFAULT TRUE,
  hide_inquiry_form BOOLEAN DEFAULT FALSE,
  inquiry_show_name BOOLEAN DEFAULT TRUE,
  inquiry_show_email BOOLEAN DEFAULT TRUE,
  inquiry_show_phone BOOLEAN DEFAULT TRUE,
  inquiry_show_message BOOLEAN DEFAULT TRUE,
  inquiry_show_consent BOOLEAN DEFAULT TRUE,

  -- Metadados de Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digital_cards_user_id ON public.digital_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_cards_slug ON public.digital_cards(slug);

-- 5. TABELA DE EVENTOS DE ACESSO E CLIQUES (Métricas)
CREATE TABLE IF NOT EXISTS public.digital_card_events (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  card_id BIGINT REFERENCES public.digital_cards(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL,
  destination TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_events_card_id ON public.digital_card_events(card_id);

-- 6. TABELA DE MENSAGENS / LEADS DO FORMULÁRIO DE CONTATO (LGPD)
CREATE TABLE IF NOT EXISTS public.digital_card_inquiries (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  card_id BIGINT REFERENCES public.digital_cards(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  whatsapp_phone TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'lido', 'arquivado')),
  consent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_inquiries_card_id ON public.digital_card_inquiries(card_id);

-- 7. TABELA DE HEALTH CHECK (Utilizada pelo Keep-Alive automatizado)
CREATE TABLE IF NOT EXISTS public.system_health (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'ok'
);

INSERT INTO public.system_health (id, status)
VALUES (1, 'ok')
ON CONFLICT (id) DO UPDATE SET checked_at = NOW(), status = 'ok';

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_card_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_card_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLICIES: PROFILES
-- 1. Usuário comum visualiza seu próprio perfil; Master e Admin visualizam TODOS os perfis.
-- 2. Usuário comum atualiza seu próprio perfil; Master e Admin atualizam qualquer perfil (papéis, planos, status).
-- 3. Exclusão de perfis permitida exclusivamente para Contas Master.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Perfis visíveis pelo próprio usuário ou por Master/Admin" ON public.profiles;
CREATE POLICY "Perfis visíveis pelo próprio usuário ou por Master/Admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_master_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Perfis editáveis pelo próprio usuário ou por Master/Admin" ON public.profiles;
CREATE POLICY "Perfis editáveis pelo próprio usuário ou por Master/Admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_master_or_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_master_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Perfis inseríveis pelo próprio usuário ou por Master/Admin" ON public.profiles;
CREATE POLICY "Perfis inseríveis pelo próprio usuário ou por Master/Admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR public.is_master_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuários podem excluir seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Perfis excluíveis exclusivamente por Master" ON public.profiles;
CREATE POLICY "Perfis excluíveis exclusivamente por Master"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_master(auth.uid()));

-- ------------------------------------------------------------------------------
-- POLICIES: DIGITAL_CARDS (Projetos de Cartões)
-- 1. Usuários autenticados acessam seus próprios cartões OU todos se forem Master/Admin.
-- 2. Visitantes anônimos visualizam apenas cartões com status = 'ativo'.
-- 3. Master/Admin pode criar, editar e excluir QUALQUER cartão.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Usuários autenticados podem ver apenas seus próprios cartões" ON public.digital_cards;
DROP POLICY IF EXISTS "Dono pode ver todos os seus cartões e público pode ver ativos" ON public.digital_cards;
DROP POLICY IF EXISTS "Usuários autenticados podem ver seus cartões ou todos se Master/Admin" ON public.digital_cards;
CREATE POLICY "Usuários autenticados podem ver seus cartões ou todos se Master/Admin"
  ON public.digital_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_master_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Visitantes anônimos podem visualizar apenas cartões ativos" ON public.digital_cards;
CREATE POLICY "Visitantes anônimos podem visualizar apenas cartões ativos"
  ON public.digital_cards FOR SELECT
  TO anon
  USING (status = 'ativo');

DROP POLICY IF EXISTS "Apenas usuário autenticado cria seus próprios cartões" ON public.digital_cards;
DROP POLICY IF EXISTS "Usuário autenticado cria seus próprios cartões ou Master para qualquer usuário" ON public.digital_cards;
CREATE POLICY "Usuário autenticado cria seus próprios cartões ou Master para qualquer usuário"
  ON public.digital_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas o dono pode atualizar seus próprios cartões" ON public.digital_cards;
DROP POLICY IF EXISTS "Dono ou Master/Admin pode atualizar cartões" ON public.digital_cards;
CREATE POLICY "Dono ou Master/Admin pode atualizar cartões"
  ON public.digital_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_master_or_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_master_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas o dono pode excluir seus próprios cartões" ON public.digital_cards;
DROP POLICY IF EXISTS "Dono ou Master/Admin pode excluir cartões" ON public.digital_cards;
CREATE POLICY "Dono ou Master/Admin pode excluir cartões"
  ON public.digital_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_master_or_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- POLICIES: DIGITAL_CARD_EVENTS (Métricas)
-- 1. Visitantes registram cliques/acessos em cartões ativos.
-- 2. Apenas o proprietário do cartão OU Master/Admin pode consultar as métricas.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Visitantes podem registrar eventos em cartões ativos" ON public.digital_card_events;
CREATE POLICY "Visitantes podem registrar eventos em cartões ativos"
  ON public.digital_card_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.digital_cards
      WHERE public.digital_cards.id = public.digital_card_events.card_id
        AND public.digital_cards.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "Apenas o dono do cartão pode consultar suas próprias métricas" ON public.digital_card_events;
DROP POLICY IF EXISTS "Dono ou Master/Admin pode consultar métricas do cartão" ON public.digital_card_events;
CREATE POLICY "Dono ou Master/Admin pode consultar métricas do cartão"
  ON public.digital_card_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_cards
      WHERE public.digital_cards.id = public.digital_card_events.card_id
        AND (public.digital_cards.user_id = auth.uid() OR public.is_master_or_admin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Apenas o dono do cartão pode excluir métricas dos seus cartões" ON public.digital_card_events;
DROP POLICY IF EXISTS "Dono ou Master/Admin pode excluir métricas dos seus cartões" ON public.digital_card_events;
CREATE POLICY "Dono ou Master/Admin pode excluir métricas dos seus cartões"
  ON public.digital_card_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_cards
      WHERE public.digital_cards.id = public.digital_card_events.card_id
        AND (public.digital_cards.user_id = auth.uid() OR public.is_master_or_admin(auth.uid()))
    )
  );

-- ------------------------------------------------------------------------------
-- POLICIES: DIGITAL_CARD_INQUIRIES (Formulário / Leads LGPD)
-- 1. Visitantes anônimos enviam mensagens em cartões ativos com formulário habilitado.
-- 2. Proprietário do cartão OU Master/Admin acessa, atualiza status ou exclui mensagens.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Visitantes podem enviar mensagens no formulário de cartões ativos" ON public.digital_card_inquiries;
CREATE POLICY "Visitantes podem enviar mensagens no formulário de cartões ativos"
  ON public.digital_card_inquiries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.digital_cards
      WHERE public.digital_cards.id = public.digital_card_inquiries.card_id
        AND public.digital_cards.status = 'ativo'
        AND public.digital_cards.inquiry_enabled = TRUE
    )
  );

DROP POLICY IF EXISTS "Apenas o dono do cartão pode ver as mensagens recebidas" ON public.digital_card_inquiries;
DROP POLICY IF EXISTS "Dono ou Master/Admin pode ver as mensagens recebidas" ON public.digital_card_inquiries;
CREATE POLICY "Dono ou Master/Admin pode ver as mensagens recebidas"
  ON public.digital_card_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_cards
      WHERE public.digital_cards.id = public.digital_card_inquiries.card_id
        AND (public.digital_cards.user_id = auth.uid() OR public.is_master_or_admin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Apenas o dono do cartão pode atualizar o status das mensagens" ON public.digital_card_inquiries;
DROP POLICY IF EXISTS "Dono ou Master/Admin pode atualizar o status das mensagens" ON public.digital_card_inquiries;
CREATE POLICY "Dono ou Master/Admin pode atualizar o status das mensagens"
  ON public.digital_card_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_cards
      WHERE public.digital_cards.id = public.digital_card_inquiries.card_id
        AND (public.digital_cards.user_id = auth.uid() OR public.is_master_or_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.digital_cards
      WHERE public.digital_cards.id = public.digital_card_inquiries.card_id
        AND (public.digital_cards.user_id = auth.uid() OR public.is_master_or_admin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Apenas o dono do cartão pode excluir mensagens recebidas" ON public.digital_card_inquiries;
DROP POLICY IF EXISTS "Dono ou Master/Admin pode excluir mensagens recebidas" ON public.digital_card_inquiries;
CREATE POLICY "Dono ou Master/Admin pode excluir mensagens recebidas"
  ON public.digital_card_inquiries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_cards
      WHERE public.digital_cards.id = public.digital_card_inquiries.card_id
        AND (public.digital_cards.user_id = auth.uid() OR public.is_master_or_admin(auth.uid()))
    )
  );

-- ------------------------------------------------------------------------------
-- POLICIES: SYSTEM_HEALTH (Keep-Alive)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir leitura anônima/autenticada do health check para keep-alive" ON public.system_health;
CREATE POLICY "Permitir leitura anônima/autenticada do health check para keep-alive"
  ON public.system_health FOR SELECT
  USING (TRUE);

-- ==============================================================================
-- CONFIGURAÇÃO DO STORAGE BUCKET 'card-assets'
-- Bucket privado com acesso estritamente isolado à pasta do usuário ou liberado para Master/Admin
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-assets', 'card-assets', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Usuários autenticados podem enviar arquivos para sua pasta" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar arquivos de sua pasta" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir arquivos de sua pasta" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem ler apenas arquivos da sua própria pasta" ON storage.objects;
DROP POLICY IF EXISTS "Usuários lêem sua própria pasta ou Master/Admin lê tudo" ON storage.objects;

-- 1. INSERT (Upload restrito à pasta do usuário ou Master/Admin)
CREATE POLICY "Usuários autenticados podem enviar arquivos para sua pasta"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'card-assets'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_master_or_admin(auth.uid()))
  );

-- 2. UPDATE (Atualização restrita à pasta do usuário ou Master/Admin)
CREATE POLICY "Usuários autenticados podem atualizar arquivos de sua pasta"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'card-assets'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_master_or_admin(auth.uid()))
  )
  WITH CHECK (
    bucket_id = 'card-assets'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_master_or_admin(auth.uid()))
  );

-- 3. DELETE (Exclusão restrita à pasta do usuário ou Master/Admin)
CREATE POLICY "Usuários autenticados podem excluir arquivos de sua pasta"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'card-assets'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_master_or_admin(auth.uid()))
  );

-- 4. SELECT (Leitura restrita à pasta do próprio usuário ou Master/Admin)
CREATE POLICY "Usuários lêem sua própria pasta ou Master/Admin lê tudo"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'card-assets'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_master_or_admin(auth.uid()))
  );
