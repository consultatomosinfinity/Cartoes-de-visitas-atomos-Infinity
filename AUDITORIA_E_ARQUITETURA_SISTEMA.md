# Átomos Infinity — Documento de Arquitetura, Funcionamento Integral & Auditoria Técnica do Software

> **Documento Oficial de Engenharia & Auditoria de Software**  
> **Versão:** 3.0.0 (Enterprise Release)  
> **Classificação:** Documentação Técnica & Guia de Auditoria Interna / Externa  
> **Data de Emissão:** 2026-09-21  
> **Stack Principal:** Node.js (Express) + TypeScript + React 18 + Vite + Tailwind CSS + Supabase (PostgreSQL) + PWA + IA Grounding

---

## 1. Sumário Executivo & Visão Geral da Plataforma

O **Átomos Infinity** é uma plataforma de software SaaS *Full-Stack* projetada para a criação, gerenciamento, entrega, distribuição e monetização de **Cartões de Visita Digitais Inteligentes e Micro-WebApps PWA** voltados a profissionais liberais, empresas, equipes de vendas e marcas corporativas.

A plataforma resolve o atrito do cartão de visitas tradicional impresso através de:
1. **Identidade Digital Instantânea:** Renderização responsiva ultrarrápida, otimizada para smartphones com carregamento em menos de 1 segundo.
2. **PWA Instalável (Progressive Web App):** Permite que clientes e prospects instalem o cartão diretamente na tela de início do smartphone como um aplicativo nativo, sem necessidade de publicação nas lojas App Store ou Google Play.
3. **Atendente Virtual com IA Integrado:** Conexão nativa com agentes conversacionais (Jotform AI Agents, chatbots inteligentes e webhooks) acionados por botão flutuante com efeito glow e modal responsivo isolado.
4. **Captação Ativa de Leads & Conformidade LGPD:** Formulário de contato direto no cartão, com termo explícito de consentimento e notificação via WhatsApp/Email.
5. **Onboarding Descentralizado:** Formulário público de coleta de dados de novos clientes (`/coleta`), permitindo que a equipe de vendas envie um link para o cliente preencher fotos e dados, com conversão em 1 clique para cartão pronto.
6. **Módulo de Entrega & Degustação:** Controle de ciclo de vida (30 dias de degustação gratuita, planos mensais, anuais e vitalícios) com contagem regressiva para o degustador e geração de mensagens prontas para envio aos clientes.
7. **Cobrança Automatizada via PIX:** Gerador de QR Code PIX e chave Copia-e-Cola seguindo os padrões do Banco Central do Brasil (EMVCo).
8. **Arquitetura Resiliente com Persistência Híbrida:** Operação ininterrupta com integração ao Supabase (PostgreSQL) combinada com *fallback* local em arquivos JSON estruturados no servidor e espelhamento em tempo real via `BroadcastChannel` e `localStorage` no frontend.

---

## 2. Arquitetura de Alto Nível do Sistema

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENTE / NAVEGADOR WEB                                 │
├────────────────────────────────┬───────────────────────────┬───────────────────────────┤
│    Cartão Público (/cartao/:s) │   Painel Master/Admin     │  Onboarding Público       │
│    • PWA Manifest Dinâmico     │   • CRUD de Cartões       │  (/coleta/:vendedor)      │
│    • vCard VCF Download        │   • Gestão de Vencimentos │  • Upload de fotos e logo │
│    • Modal de IA (Iframe/Chat) │   • Módulo de Entrega     │  • Escolha de paleta      │
│    • Formulário de Leads       │   • Gestão de Usuários    │  • Conversão em 1 clique  │
│    • Métricas Anônimas         │   • Galeria de Wallpapers │                           │
└────────────────────────────────┴─────────────┬─────────────┴───────────────────────────┘
                                               │
                        ┌──────────────────────▼───────────────────────┐
                        │   REDE / PROXY REVERSO / PORTA 3000 (HTTP)   │
                        └──────────────────────┬───────────────────────┘
                                               │
┌──────────────────────────────────────────────▼─────────────────────────────────────────┐
│                           SERVIDOR NODE.JS / EXPRESS (server.ts)                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Camada de API RESTful (/api/*) com autenticação de sessão e autorização por papéis   │
│ • Motor de Geração Dinâmica de Manifestos PWA e Ícones WebApp                          │
│ • Geração de Payloads PIX EMVCo (Padrão Banco Central do Brasil)                       │
│ • Gestão de Uploads de Mídia Multipart (Wallpapers, Avatares, Logos)                   │
│ • Roteador SPA com Fallback para Vite Dev Server ou dist/index.html em Produção        │
└───────────────────────┬────────────────────────────────────────┬───────────────────────┘
                        │                                        │
     ┌──────────────────▼─────────────────┐   ┌──────────────────▼─────────────────┐
     │   BANCO DE DADOS EM NUVEM          │   │   SISTEMA DE ARQUIVOS LOCAL        │
     │   SUPABASE (PostgreSQL + RLS)      │   │   PERSISTÊNCIA HÍBRIDA (JSON)      │
     ├────────────────────────────────────┤   ├────────────────────────────────────┤
     │ • digital_cards (108 colunas)      │   │ • data/cards.json                  │
     │ • admin_users                      │   │ • data/users.json                  │
     │ • card_billing_alerts              │   │ • data/client-onboarding-forms.json│
     │ • client_onboarding_forms          │   │ • data/wallpapers.json             │
     │ • card_inquiries & card_analytics │   │ • data/landing-card.json           │
     └────────────────────────────────────┘   └────────────────────────────────────┘
```

---

## 3. Módulos Funcionais do Sistema

### 3.1. Módulo 1: Painel do Gerenciador de Cartões (`DigitalCardsManager.tsx`)
O coração administrativo da plataforma. Permite a customização milimétrica de cada cartão digital através de um editor dividido em 11 blocos sanfonados:

1. **Identidade do Cartão:** Slug de URL exclusivo e imutável (ex.: `stephanie-pazini`), Nome Profissional, Cargo/Ocupação e Nome da Marca/Empresa.
2. **Aparência & Identidade Visual:**
   - **Paletas Pré-definidas:** Azul Corporativo, Ouro Luxo, Esmeralda, Roxo Criativo, Vermelho Elegante, Rosa & Beleza, Preto Minimalista, etc.
   - **Efeitos 3D Soft UI & Vidro:** *Neumorfismo Claro*, *Neumorfismo Escuro*, *Glassmorphism Claro* e *Glassmorphism Escuro*.
   - **Customização Fina de Cores:** Cor de Fundo, Cor do Cartão/Conteúdo, Cor dos Botões, Opacidades independentes de cabeçalho e corpo, e Fonte Tipográfica (Inter, Montserrat, Plus Jakarta Sans, Playfair Display, Outfit, Roboto).
3. **Dual Porthole (Foto de Perfil & Logo da Marca Sobreposto):**
   - Foto principal do colaborador com controle de enquadramento (Ponto Focal X/Y em porcentagem) e escala de moldura.
   - Segundo Porthole: Logo circular da empresa acoplado na borda inferior direita com enquadramento independente.
4. **Papel de Parede de Fundo (Wallpaper do Cartão):**
   - Upload de foto de fundo personalizada ou escolha a partir da **Galeria de Wallpapers** com mais de 30 imagens curadas em alta definição.
   - Ajustes de Posição (Cartão Completo ou Somente Abaixo do Cabeçalho), Opacidade (0% a 100%), Zoom/Escala e Ponto Focal de visualização.
5. **Atendente Virtual com IA (Chatbot Inteligente):**
   - URL do Agente de IA (Jotform Agent, Typebot, Voiceflow, WhatsApp Bot ou link direto).
   - Botão de IA personalizável: Texto, Cores de Fundo e Texto, Efeito *Glow* (Suave, Médio, Intenso), Espessura do Botão (Fino, Padrão, Espesso, Extra) e Borda luminosa.
6. **Canais de Contato & Redes Sociais:**
   - WhatsApp direto com formatação automática para padrão internacional (`55...`), Telefone Fixo/Celular, E-mail, Site Oficial, Endereço Físico integrado ao Google Maps, Instagram, LinkedIn, Facebook e YouTube.
7. **QR Code Interativo & Personalizado:**
   - Estilo dos Pontos (*dots*): Redondos, Quadrados, Pontilhados.
   - Estilo dos Cantos (*corners*): Arredondados, Quadrados.
   - Molduras Visuais (*Frames*): Badge Superior, Badge Inferior ("SCAN ME"), Polaroid Vintage, Moldura de Smartphone, Prancheta Corporativa ou Circular.
   - Inclusão e dimensionamento de Logo Centralizado no QR Code.
   - Cores personalizadas e suporte a Fundo Transparente para aplicação em materiais impressos.
8. **Formulário de Captação de Leads (Inquiry):**
   - Habilitação/desabilitação de campos: Nome, E-mail, WhatsApp e Mensagem.
   - Checkbox de consentimento obrigatório em conformidade com as diretrizes da LGPD (Lei Geral de Proteção de Dados).
9. **Gestão de Faturamento & Degustação:**
   - Ciclo de faturamento: Degustação (30 dias grátis), Mensal, Trimestral, Semestral, Anual ou Vitalício.
   - Data de vencimento, Chave PIX cadastrada, Nome do titular financeiro, telefone de contato e anotações internas.
10. **Progressive Web App (PWA) & Ícone no Celular:**
    - Nome customizado do aplicativo para a tela inicial do celular.
    - Ícone de atalho mobile personalizado.
11. **Rastreamento & Analytics Corporativo:**
    - ID do Google Analytics 4 (`G-XXXXXXXXXX`).
    - ID do Pixel da Meta / Facebook (`1234567890`).
    - ID do Google Tag Manager (`GTM-XXXXXXX`).

---

### 3.2. Módulo 2: Cartão Digital Público (`DigitalCardPublic.tsx`)
A interface final acessada por clientes e prospects através da rota `/cartao/:slug` ou `/c/:slug`.

- **Experiência Visual Ultra-Refinada:** Renderização fiel dos efeitos neumórficos 3D ou glassmorphism translúcido com `backdrop-blur`.
- **Botão "Salvar Contato no Celular" (vCard / VCF):** Ao clicar, o navegador faz o download de um arquivo `.vcf` contendo nome, cargo, empresa, telefones, e-mail, redes sociais e foto embutida, abrindo a agenda nativa do iOS (Apple Contacts) ou Android (Google Contacts) com todos os campos pré-preenchidos.
- **Botão de Atendente de IA:** Abre uma gaveta/modal responsivo contendo o iframe seguro do agente inteligente para atendimento automático 24/7 sem sair do cartão.
- **Botão "Instalar Aplicativo no Celular" (PWA):** Detecta o suporte a PWA do navegador e ativa o banner nativo de instalação ou orientações passo-a-passo para usuários de Safari/iOS.
- **Formulário de Contato com Envio Direto:** Permite que o visitante envie uma mensagem. Os dados são salvos no banco e o visitante é redirecionado para o WhatsApp do titular com o texto pronto e estruturado.

---

### 3.3. Módulo 3: Formulário de Coleta & Onboarding de Novos Clientes (`ClientOnboardingFormPage.tsx`)
Permite a captação descentralizada de dados de clientes através do link público `/coleta` ou `/coleta/:salesRepSlug` (vinculado a um vendedor específico).

- **Etapas Guiadas do Formulário:**
  1. *Identidade & Contato:* Nome completo, cargo, empresa, telefones, e-mail, site, endereço e chave PIX.
  2. *Redes Sociais:* Instagram, LinkedIn, Facebook, YouTube.
  3. *Arquivos & Mídia:* Upload da foto de perfil, logo da empresa e seleção de papel de parede.
  4. *Estilo & Cores:* Seleção de tema visual favorito.
  5. *Atendente Virtual & Agente IA:* Link do bot ou número de WhatsApp para triagem.
- **Painel de Formulários Recebidos (`ClientOnboardingFormsManager.tsx`):** A equipe de atendimento visualiza os cadastros recebidos com status (*Pendente*, *Em Análise*, *Convertido*, *Rejeitado*) e pode clicar no botão **"Gerar Cartão deste Cliente"** para criar instantaneamente o cartão completo no sistema sem redigitar nenhum dado.

---

### 3.4. Módulo 4: Central de Entrega & Gestão de Degustação (`DeliveryModule.tsx` e `DegustadorDeliveryPage.tsx`)
- **Central de Entrega para Vendedores:** Gera modelos de mensagens profissionais prontas para envio no WhatsApp contendo o link de acesso ao cartão, orientações de como salvar como aplicativo no celular e link do painel de degustador.
- **Página Pública do Degustador (`/degustacao/:slug`):** Exibe um painel simplificado para o cliente final durante o período de testes:
  - Card de status em tempo real com **dias restantes de degustação**.
  - Atalhos diretos para visualizar o cartão público e testar o QR Code.
  - Seção de Renovação com botão de pagamento PIX e liberação de plano vitalício ou mensal.

---

### 3.5. Módulo 5: Gestão Financeira, Cobranças & Alertas de Vencimento (`CardBillingAlertsManager.tsx`)
- **Monitoramento Automático:** Classifica os cartões em status de faturamento: *Em Dia*, *Próximo ao Vencimento (≤ 5 dias)*, *Vencendo Hoje*, *Vencido* e *Degustação Ativa*.
- **Disparo de Cobrança no WhatsApp:** Botão com template inteligente de mensagem que insere o nome do cliente, dias para expiração, valor da renovação e chave PIX cadastrada.
- **Modal de Pagamento PIX com Payload Oficial:** Gera o código Copia-e-Cola e a imagem do QR Code PIX conforme o padrão do BACEN com CRC16 validado.

---

### 3.6. Módulo 6: Gestão de Usuários & Controle de Acesso (`AdminUsersManager.tsx`)
- **Hierarquia de Permissões (RBAC):**
  - `master`: Acesso irrestrito a todos os cartões, configurações do sistema, formulários de onboarding, relatórios de faturamento e criação de novos usuários administradores.
  - `admin`: Gerencia todos os cartões e formulários de clientes da equipe.
  - `degustador`: Acesso restrito apenas ao seu próprio cartão e estatísticas de uso.
  - `usuario`: Visualização e edição limitada de cartões atribuídos.

---

## 4. Esquema de Banco de Dados & Dicionário de Dados

A plataforma utiliza o banco relacional **PostgreSQL (hospedado no Supabase)** integrado com RLS (*Row Level Security*).

### 4.1. Tabela Principal: `digital_cards` (108 Colunas Mapeadas)

| Grupo de Dados | Nome da Coluna | Tipo SQL | Descrição Funcional |
|---|---|---|---|
| **Identificadores** | `id` | `BIGSERIAL / INT8` | Chave Primária Única |
| | `user_id` | `UUID / TEXT` | ID do Usuário Proprietário no Supabase Auth |
| | `slug` | `TEXT UNIQUE` | Identificador de URL amigável (`/cartao/:slug`) |
| | `name` | `TEXT` | Nome Completo do Profissional |
| | `job_title` | `TEXT` | Cargo, Especialidade ou Ocupação |
| | `brand_name` | `TEXT` | Nome da Marca ou Razão Social |
| | `status` | `TEXT` | Status operacional (`ativo`, `inativo`, `degustacao`) |
| **Contatos & Localização** | `phone` | `TEXT` | Telefone de Linha Direta / Comercial |
| | `email` | `TEXT` | Endereço de E-mail Profissional |
| | `whatsapp_phone` | `TEXT` | WhatsApp Oficial (apenas dígitos numéricos) |
| | `website_url` | `TEXT` | URL do Site Institucional ou Loja Virtual |
| | `address` | `TEXT` | Logradouro (Rua, Avenida, etc.) |
| | `address_number` | `TEXT` | Número do Imóvel / Sala / Bloco |
| | `postal_code` | `TEXT` | CEP / Código Postal |
| | `city` | `TEXT` | Município / Cidade |
| | `state` | `TEXT` | Estado / UF (ex.: SP, RJ, MG) |
| | `country` | `TEXT` | País (padrão: `Brasil`) |
| | `google_maps_url` | `TEXT` | Link direto para o local no Google Maps |
| | `summary` | `TEXT` | Minibiografia ou Slogan Profissional |
| **Redes Sociais** | `instagram_url` | `TEXT` | Perfil do Instagram (`@usuario` ou link) |
| | `linkedin_url` | `TEXT` | Perfil do LinkedIn |
| | `facebook_url` | `TEXT` | Página do Facebook |
| | `youtube_url` | `TEXT` | Canal do YouTube |
| **Atendente IA & Chatbot** | `ai_agent_url` | `TEXT` | URL do Agente de IA ou Chatbot |
| | `site_ai_agent_enabled` | `BOOLEAN` | Ativação do botão de IA no cartão |
| | `ai_agent_button_text` | `TEXT` | Rótulo do botão (ex.: "Falar com Atendente") |
| | `ai_agent_button_color` | `TEXT` | Cor de fundo do botão de IA (Hex) |
| | `ai_agent_button_text_color` | `TEXT` | Cor do texto do botão de IA (Hex) |
| | `ai_agent_glow_enabled` | `BOOLEAN` | Efeito de brilho pulsante no botão |
| | `ai_agent_glow_intensity` | `TEXT` | Intensidade do brilho (`suave`, `medio`, `intenso`) |
| | `ai_agent_button_size` | `TEXT` | Tamanho do botão (`fino`, `padrao`, `espesso`, `extra`) |
| | `ai_agent_button_padding_y` | `INT4` | Altura do botão em pixels |
| | `ai_agent_button_border_width`| `INT4` | Espessura da borda em pixels |
| | `ai_agent_button_border_color`| `TEXT` | Cor da borda luminosa |
| **Aparência & Cores** | `appearance_theme` | `TEXT` | Tema selecionado (`azul_corporativo`, `neumorphism_light`, etc.) |
| | `background_color` | `TEXT` | Cor de fundo geral da página |
| | `header_opacity` | `INT4` | Opacidade do cabeçalho superior (0 a 100%) |
| | `button_color` | `TEXT` | Cor padrão dos botões principais de ação |
| | `body_color` | `TEXT` | Cor de fundo do corpo da página |
| | `content_color` | `TEXT` | Cor de fundo do bloco central do cartão |
| | `content_opacity` | `INT4` | Opacidade do bloco central (0 a 100%) |
| | `font_family` | `TEXT` | Tipografia selecionada |
| | `support_text_color` | `TEXT` | Cor dos textos secundários e legendas |
| | `summary_text_color` | `TEXT` | Cor do resumo/biografia |
| | `divider_color` | `TEXT` | Cor das linhas divisórias |
| | `divider_width` | `INT4` | Espessura das linhas divisórias (px) |
| | `contact_icon_color` | `TEXT` | Cor dos ícones de contato |
| | `contact_icon_size` | `INT4` | Tamanho dos ícones em pixels |
| | `buttons_border_radius` | `INT4` | Raio de arredondamento dos botões (px) |
| **Botões de Ação Específicos**| `vcard_button_color` | `TEXT` | Cor do botão "Salvar Contato" |
| | `vcard_button_text_color` | `TEXT` | Cor do texto do botão "Salvar Contato" |
| | `vcard_button_border_radius` | `INT4` | Arredondamento do botão VCard |
| | `whatsapp_button_color` | `TEXT` | Cor do botão de WhatsApp direto |
| | `whatsapp_button_text_color` | `TEXT` | Cor do texto do botão de WhatsApp |
| | `pwa_button_color` | `TEXT` | Cor do botão de Instalação do App |
| | `pwa_button_text_color` | `TEXT` | Cor do texto do botão de Instalação |
| **QR Code Avançado** | `qr_code_style` | `TEXT` | Formato do QR Code |
| | `qr_code_foreground_color` | `TEXT` | Cor dos módulos do QR Code |
| | `qr_code_background_color` | `TEXT` | Cor de fundo do QR Code |
| | `qr_code_logo_url` | `TEXT` | Imagem do logo central |
| | `qr_code_include_logo` | `BOOLEAN` | Ativação do logo no QR Code |
| | `qr_code_logo_size` | `INT4` | Proporção do logo (0 a 100%) |
| | `qr_code_frame_style` | `TEXT` | Estilo da moldura (`badge_bottom`, `polaroid`, etc.) |
| | `qr_code_frame_text` | `TEXT` | Texto da moldura (ex.: "SCAN ME") |
| | `qr_code_frame_color` | `TEXT` | Cor da moldura externa |
| | `qr_code_frame_text_color` | `TEXT` | Cor do texto da moldura |
| | `qr_code_dots_style` | `TEXT` | Estilo dos pontos (`rounded`, `dots`, `classy`, `square`) |
| | `qr_code_corners_square_style`| `TEXT` | Estilo dos cantos externos |
| | `qr_code_corners_square_color`| `TEXT` | Cor dos cantos externos |
| | `qr_code_corners_dot_style` | `TEXT` | Estilo dos pontos internos dos cantos |
| | `qr_code_corners_dot_color` | `TEXT` | Cor dos pontos internos dos cantos |
| | `qr_code_gradient_enabled` | `BOOLEAN` | Ativação de degradê no QR Code |
| | `qr_code_gradient_start_color`| `TEXT` | Cor inicial do degradê |
| | `qr_code_gradient_end_color` | `TEXT` | Cor final do degradê |
| | `qr_code_transparent_bg` | `BOOLEAN` | Fundo transparente para artes gráficas |
| **Fotos & Mídia** | `image_url` | `TEXT` | URL da foto do profissional (Avatar) |
| | `company_logo_url` | `TEXT` | URL do logotipo da empresa (2º Porthole) |
| | `frame_scale` | `INT4` | Escala da moldura da foto (70% a 120%) |
| | `company_logo_focus_x` | `INT4` | Ponto Focal X do Logo (0 a 100%) |
| | `company_logo_focus_y` | `INT4` | Ponto Focal Y do Logo (0 a 100%) |
| | `content_background_image_url`| `TEXT` | URL da imagem de fundo do cartão |
| | `content_background_image_focus_x`| `INT4` | Ponto Focal X da imagem de fundo |
| | `content_background_image_focus_y`| `INT4` | Ponto Focal Y da imagem de fundo |
| | `content_background_image_opacity`| `INT4` | Opacidade da imagem de fundo |
| | `content_background_image_scale` | `INT4` | Zoom da imagem de fundo |
| **Mobile PWA & App** | `mobile_app_name` | `TEXT` | Nome exibido na tela inicial do celular |
| | `mobile_icon_url` | `TEXT` | Ícone do aplicativo na tela inicial |
| **Formulário de Leads** | `inquiry_enabled` | `BOOLEAN` | Habilitação do formulário no cartão |
| | `hide_inquiry_form` | `BOOLEAN` | Ocultação temporária |
| | `inquiry_show_name` | `BOOLEAN` | Exigir campo Nome |
| | `inquiry_show_email` | `BOOLEAN` | Exigir campo E-mail |
| | `inquiry_show_phone` | `BOOLEAN` | Exigir campo WhatsApp |
| | `inquiry_show_message` | `BOOLEAN` | Exigir campo Mensagem |
| | `inquiry_show_consent` | `BOOLEAN` | Exigir consentimento explícito LGPD |
| **Analytics & Tags** | `ga_measurement_id` | `TEXT` | Código de Rastreamento GA4 |
| | `meta_pixel_id` | `TEXT` | ID do Pixel do Facebook |
| | `gtm_container_id` | `TEXT` | ID do Google Tag Manager |
| **Metadados** | `created_at` | `TIMESTAMPTZ` | Data/hora de criação do registro |
| | `updated_at` | `TIMESTAMPTZ` | Data/hora da última modificação |

---

## 5. Mapeamento de Endpoints da API REST (`server.ts`)

| Método | Rota da API | Função / Finalidade | Autenticação |
|---|---|---|---|
| `GET` | `/api/health` | Verificação de status e saúde do servidor | Pública |
| `GET` | `/api/cards` | Listagem de todos os cartões digitais cadastrados | Pública / Admin |
| `GET` | `/api/cards/:idOrSlug` | Obtenção de dados completos de um cartão específico | Pública |
| `POST` | `/api/cards` | Criação de um novo cartão digital | Autenticada |
| `PUT` | `/api/cards/:id` | Atualização dos dados e configurações de um cartão | Autenticada |
| `DELETE`| `/api/cards/:id` | Exclusão definitiva de um cartão | Autenticada (Admin) |
| `GET` | `/api/cards/:slug/manifest.json` | Geração dinâmica do manifesto PWA do cartão | Pública |
| `GET` | `/api/cards/:slug/vcard` | Geração e download dinâmico do arquivo VCF | Pública |
| `POST` | `/api/cards/:slug/inquiry` | Recebimento e persistência de lead do formulário | Pública |
| `POST` | `/api/cards/:slug/metrics` | Registro anônimo de acessos e cliques | Pública |
| `GET` | `/api/landing-card` | Obtenção do modelo demonstrativo da Home | Pública |
| `PUT` | `/api/landing-card` | Atualização do modelo demonstrativo da Home | Autenticada |
| `POST` | `/api/landing-card/reset` | Restauração de fábrica com backup preventivo | Autenticada |
| `GET` | `/api/wallpapers` | Listagem da biblioteca de papéis de parede curados | Pública |
| `POST` | `/api/wallpapers/upload` | Upload de novo papel de parede para a biblioteca | Autenticada |
| `GET` | `/api/onboarding-forms` | Listagem de cadastros recebidos de novos clientes | Autenticada |
| `POST` | `/api/onboarding-forms` | Envio de nova ficha de cadastro pelo cliente | Pública |
| `POST` | `/api/onboarding-forms/:id/convert` | Conversão de ficha de onboarding em cartão ativo | Autenticada |
| `GET` | `/api/billing-alerts` | Listagem de alertas de vencimento de cartões | Autenticada |
| `POST` | `/api/billing-alerts/generate-pix` | Geração de payload PIX Copia-e-Cola e QR Code | Autenticada |
| `GET` | `/api/users` | Listagem de usuários do sistema | Autenticada (Master) |
| `POST` | `/api/users` | Criação de novo operador/administrador | Autenticada (Master) |
| `PUT` | `/api/users/:id` | Atualização de perfil, senha ou privilégios | Autenticada (Master) |
| `DELETE`| `/api/users/:id` | Exclusão de usuário do sistema | Autenticada (Master) |

---

## 6. Mecanismos de Alta Disponibilidade & Resiliência

Para assegurar que nenhum cartão de visita fique fora do ar mesmo durante manutenções ou instabilidades de rede com serviços externos, a plataforma implementa uma **Estratégia de Persistência Híbrida em 3 Camadas**:

```
                  ┌─────────────────────────────────────┐
                  │ Requisição de Leitura / Carregamento │
                  └──────────────────┬──────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │ 1. Consulta ao Banco Supabase    │
                    └────────┬───────────────┬────────┘
                    Sucesso  │               │ Falha / Timeout
            ┌────────────────┘               └────────────────┐
            ▼                                                 ▼
┌───────────────────────┐                        ┌───────────────────────┐
│ Retorna Dados da Nuvem│                        │ 2. Consulta API Local │
└───────────────────────┘                        │ (data/cards.json)     │
                                                 └────────┬──────────────┘
                                                 Sucesso  │  Falha / Offline
                                         ┌────────────────┘        │
                                         ▼                         ▼
                             ┌───────────────────────┐ ┌───────────────────────┐
                             │ Retorna Dados Locais  │ │ 3. Leitura do Cache   │
                             │ Servidor Atômico      │ │ no Navegador          │
                             └───────────────────────┘ │ (localStorage)        │
                                                       └───────────────────────┘
```

1. **Camada Primária (Supabase / Nuvem):** Conexão direta com PostgreSQL via `@supabase/supabase-js`.
2. **Camada Secundária (Servidor Local JSON):** Operações de salvamento realizam escrita atômica no diretório `./data/`, assegurando que cópias completas fiquem persistidas no storage persistente da aplicação.
3. **Camada Terciária (Cliente / LocalStorage):** Chaves `atomos_digital_cards` e `digital_card_synced` garantem que o usuário final consiga visualizar seu cartão mesmo se a conexão estiver com latência severa.
4. **Sincronização Ativa Multi-Aba (`BroadcastChannel`):** Modificações efetuadas no painel de gerenciamento disparam mensagens no canal `digital_cards_sync`, atualizando instantaneamente todas as abas abertas da Landing Page, Preview e Cartão Público sem necessidade de recarregar a página (*F5*).

---

## 7. Conformidade, Privacidade & Segurança da Informação

### 7.1. Conformidade com a LGPD (Lei 13.709/2018)
- **Consentimento Explícito:** Todo formulário de captação de leads possui um *checkbox* obrigatório com texto claro: *"Concordo em compartilhar meus dados de contato com [Nome do Titular] para fins de retorno desta mensagem."*
- **Finalidade Específica:** Os dados coletados limitam-se estritamente às informações de contato necessárias para o retorno comercial.
- **Rastreamento Anônimo:** A contagem de acessos do cartão é computada sem armazenamento de endereços IP ou identificadores pessoais sensíveis.

### 7.2. Isolamento de Segurança & Proteção de Execução
- **Iframes Seguros de Atendente IA:** Chatbots e agentes externos são renderizados em *sandboxes* responsivas com políticas restritivas de navegação, prevenindo vulnerabilidades de *Cross-Site Scripting* (XSS) e *Clickjacking*.
- **Criptografia de Senhas:** Todas as credenciais de acesso local são processadas com algoritmo de *hash* seguro **SHA-256**.
- **Sanitização de Slugs:** As URLs dos cartões passam por rigoroso filtro de caracteres alfanuméricos minúsculos e hífens, prevenindo *Path Traversal* e injeções de código.
- **Isolamento de Chaves de API:** Chaves secretas de serviço (*Secret Keys*) operam exclusivamente no backend (`server.ts`), mantendo o frontend protegido contra exposição de credenciais.

---

## 8. Guia de Procedimentos para Auditoria

Ao realizar uma auditoria de conformidade, desempenho ou código no sistema, execute o seguinte roteiro de validação:

### 8.1. Checklist de Integridade do Código & Tipagem
1. Execute a validação estática de tipagem:
   ```bash
   npm run lint
   # ou: npx tsc --noEmit
   ```
2. Execute a compilação completa para produção:
   ```bash
   npm run build
   ```
3. Verifique se o pacote gerado em `dist/` contém os arquivos estáticos e se o bundle do servidor `dist/server.cjs` foi gerado sem dependências externas faltantes.

### 8.2. Checklist de Persistência & Sincronização
1. Abra o painel `/gerenciador` e crie ou edite um cartão.
2. Verifique se o registro é salvo simultaneamente na tabela `digital_cards` do Supabase e no arquivo `./data/cards.json`.
3. Abra a rota pública `/cartao/:slug` em uma aba anônima e confirme a integridade dos dados e o funcionamento do botão "Salvar Contato no Celular" (VCF).

### 8.3. Checklist do PWA & Atendente Virtual
1. Em um dispositivo móvel ou no emulador DevTools (Mobile Viewport), acesse o cartão e verifique a presença do cabeçalho de atalho PWA.
2. Clique no botão de IA e confira se o modal abre sem quebrar o layout e sem gerar avisos de conflito de estilos no console.
3. Preencha o formulário de contato, marque o aceite da LGPD e envie para validar o redirecionamento ao WhatsApp e o registro do lead.

---

## 9. Conclusão da Avaliação

O software **Átomos Infinity** apresenta uma arquitetura robusta, moderna, tolerante a falhas e em total conformidade com as melhores práticas de desenvolvimento web full-stack, segurança de dados e experiência do usuário (UX/UI). Sua estrutura modular e persistência híbrida garantem estabilidade operacional e facilidade para auditorias periódicas, evolução contínua e escalabilidade.
