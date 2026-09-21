---
name: kit-de-entrega-standalone
description: Blueprint e skill completo para desenvolvimento isolado do Kit de Entrega de Cartões Digitais Inteligentes (PWA, WhatsApp 1-Clique, Portal do Degustador, Coleta Rápida e Cobrança PIX).
---

# Skill: Kit de Entrega Standalone para Cartões Digitais & Micro-WebApps

Este documento define a especificação técnica completa, arquitetura de software, contratos de dados, regras de negócio e componentes de interface para construir do **zero absoluto** o **Módulo / Micro-SaaS de Kit de Entrega e Onboarding de Cartões Digitais**, de forma 100% desacoplada e independente.

---

## 1. Visão Geral & Proposta de Valor do Módulo

O **Kit de Entrega** é a ferramenta de fechamento e pós-venda que transforma a criação de um cartão digital em uma experiência imediata para o cliente final e para a equipe comercial.

### Principais Casos de Uso:
1. **Entrega em 1-Clique via WhatsApp:** Geração instantânea de texto comercial estruturado, links diretos, QR Code escaneável e passo a passo de instalação no celular (iOS e Android).
2. **Portal do Degustador (Trial / Onboarding):** Uma página pública dedicada (`/degustador/:slug` ou `/degustacao/:slug`) onde o cliente visualiza o status do seu período de teste de 30 dias, testa seu cartão e tem acesso ao botão de renovação e suporte.
3. **Formulário de Coleta Descomplicada (`/coleta`):** Link público enviado para o prospect ou preenchido pelo vendedor via WhatsApp para coletar foto, logo, redes sociais, contatos e preferências visuais.
4. **Clonagem Instantânea:** Criação de variações de cartões para sócios, filiais ou equipes inteiras em 3 segundos.
5. **Gestão de Vencimentos & Cobrança PIX:** Notificações de expiração de planos e geração de chave PIX Copia-e-Cola com QR Code EMVCo.

---

## 2. Stack Tecnológica Recomendada (Zero Dependencies Overhead)

- **Frontend:** React 18+ (Vite) ou Next.js (App Router), TypeScript, Tailwind CSS, Lucide React (ícones).
- **QR Code Engine:** `qr-code-styling` ou `qrcode.react` (com suporte a logo centralizado, estilos de pontos e molduras).
- **Backend / API:** Node.js (Express, Fastify ou Next.js Server Actions / API Routes).
- **Armazenamento:** PostgreSQL (Supabase / Prisma / Drizzle) ou arquivos JSON atômicos para microsserviços leves.
- **Roteamento:** Wouter, React Router v6 ou Next.js Routing.

---

## 3. Modelo de Dados & Tipos TypeScript (`types.ts`)

```typescript
export interface DigitalCard {
  id: number | string;
  userId?: string;
  slug: string;
  name: string;
  jobTitle?: string;
  brandName?: string;
  status: 'ativo' | 'inativo' | 'pausado' | 'degustacao';
  
  // Contatos
  phone?: string;
  email?: string;
  whatsappPhone?: string;
  websiteUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  googleMapsUrl?: string;
  summary?: string;

  // Redes Sociais
  instagramUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;

  // Atendente Virtual IA
  aiAgentUrl?: string;
  siteAiAgentEnabled?: boolean;
  aiAgentButtonText?: string;
  aiAgentButtonColor?: string;
  aiAgentButtonTextColor?: string;
  aiAgentGlowEnabled?: boolean;

  // Identidade Visual & Tema
  appearanceTheme?: string;
  backgroundColor?: string;
  buttonColor?: string;
  bodyColor?: string;
  contentColor?: string;
  contentOpacity?: number;
  imageUrl?: string;
  companyLogoUrl?: string;
  contentBackgroundImageUrl?: string;

  // QR Code
  qrCodeStyle?: string;
  qrCodeForegroundColor?: string;
  qrCodeBackgroundColor?: string;
  qrCodeLogoUrl?: string;
  qrCodeFrameStyle?: string;
  qrCodeFrameText?: string;

  // PWA
  mobileAppName?: string;
  mobileIconUrl?: string;

  // Faturamento & Ciclo de Vida
  billingCycle?: 'degustacao' | 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'vitalicio';
  trialDaysLeft?: number;
  expiresAt?: string;
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  pixBeneficiaryName?: string;
  pixCity?: string;
  planAmount?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface QuickOnboardingInput {
  name: string;
  slug?: string;
  jobTitle: string;
  brandName: string;
  phone: string;
  whatsappPhone: string;
  email: string;
  websiteUrl?: string;
  googleReviewUrl?: string;
  address?: string;
  city?: string;
  summary?: string;
  photoUrl?: string;
  logoUrl?: string;
  theme?: string;
}
```

---

## 4. Utilitários Essenciais

### 4.1. Sanitizador de Mensagens & Construtor de Link WhatsApp (`utils/whatsapp.ts`)

O envio direto para o WhatsApp não pode conter caracteres especiais corrompidos e deve formatar números para o padrão E.164 internacional (`55 + DDD + Número`).

```typescript
export function sanitizeWhatsAppText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  // Limpa caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Adiciona DDI do Brasil (55) se o número começar com DDD brasileiro (ex: 11999998888)
  let finalPhone = cleanPhone;
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    finalPhone = `55${cleanPhone}`;
  }

  const encodedText = encodeURIComponent(sanitizeWhatsAppText(text));
  
  if (!finalPhone) {
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`;
}

export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}
```

### 4.2. Gerador de Mensagem do Kit de Entrega

```typescript
export function generateDeliveryMessage(card: DigitalCard, appBaseUrl: string): string {
  const cardUrl = `${appBaseUrl}/cartao/${card.slug}`;
  const degustadorUrl = `${appBaseUrl}/degustador/${card.slug}`;
  const name = card.name || 'Cliente';

  return sanitizeWhatsAppText(
    `Olá, *${name}*!\n\n` +
    `Seu *Cartão Digital Interativo* está 100% pronto para uso e compartilhado!\n\n` +
    `*Acesse agora pelo link exclusivo:*\n${cardUrl}\n\n` +
    `*Dica rápida de instalação no celular (PWA):*\n` +
    `1. Abra o link acima no Chrome (Android) ou Safari (iPhone);\n` +
    `2. Toque no botão *"Instalar aplicativo"* ou em *"Adicionar à Tela de Início"*;\n` +
    `3. Pronto! O ícone ficará disponível como um app exclusivo no seu celular.\n\n` +
    `*Seu Portal de Acesso Direto (Kit do Titular):*\n${degustadorUrl}\n\n` +
    `Qualquer dúvida ou caso queira atualizar informações, estamos à sua total disposição!`
  );
}
```

---

## 5. Gerador de vCard VCF 3.0 (`utils/vcard.ts`)

Exportação compatível com iOS Contacts e Android Google Contacts com download automático:

```typescript
export function generateVCardString(card: DigitalCard): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.name}`,
    `N:${card.name};;;;`,
  ];

  if (card.brandName) lines.push(`ORG:${card.brandName}`);
  if (card.jobTitle) lines.push(`TITLE:${card.jobTitle}`);
  if (card.phone) lines.push(`TEL;TYPE=WORK,VOICE:${card.phone}`);
  if (card.whatsappPhone) lines.push(`TEL;TYPE=CELL,VOICE:${card.whatsappPhone}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET,PREF:${card.email}`);
  if (card.websiteUrl) lines.push(`URL:${card.websiteUrl}`);
  if (card.summary) lines.push(`NOTE:${card.summary.replace(/\n/g, '\\n')}`);

  if (card.address || card.city || card.state) {
    lines.push(`ADR;TYPE=WORK:;;${card.address || ''};${card.city || ''};${card.state || ''};;;`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVCard(card: DigitalCard): void {
  const vcfContent = generateVCardString(card);
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${card.slug || 'contato'}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

---

## 6. Geração de QR Code com Logo Central e Moldura

Para implementar o componente `<DigitalCardQrCode />`:

```tsx
import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

interface QrProps {
  url: string;
  logoUrl?: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  frameText?: string;
}

export const StandaloneQrCode: React.FC<QrProps> = ({
  url,
  logoUrl,
  size = 240,
  fgColor = '#0F172A',
  bgColor = '#FFFFFF',
  frameText = 'SCAN ME'
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    qrCodeInstance.current = new QRCodeStyling({
      width: size,
      height: size,
      data: url,
      image: logoUrl || undefined,
      dotsOptions: {
        color: fgColor,
        type: 'rounded',
      },
      backgroundOptions: {
        color: bgColor,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 6,
        imageSize: 0.35,
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        color: fgColor,
      },
      cornersDotOptions: {
        type: 'dot',
        color: fgColor,
      },
    });

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCodeInstance.current.append(qrRef.current);
    }
  }, [url, logoUrl, size, fgColor, bgColor]);

  const handleDownload = (format: 'png' | 'svg' = 'png') => {
    qrCodeInstance.current?.download({
      name: 'cartao-qr-code',
      extension: format,
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl shadow-md border border-slate-200">
      <div ref={qrRef} />
      {frameText && (
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">
          {frameText}
        </span>
      )}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => handleDownload('png')}
          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
        >
          Baixar PNG
        </button>
        <button
          onClick={() => handleDownload('svg')}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
        >
          Baixar SVG
        </button>
      </div>
    </div>
  );
};
```

---

## 7. Mapeamento de Rotas do Kit de Entrega Standalone

| Rota | Tipo | Descrição |
|---|---|---|
| `/entrega/:slug?` | Painel Operador | Tela do Kit de Entrega com seleção de cartão, botões de cópia, disparo WhatsApp, clonagem e coleta rápida |
| `/degustador/:slug` | Página Pública | Portal do Titular/Degustador mostrando dias restantes, links de teste e botão de contato/renovação |
| `/coleta/:salesRep?` | Formulário Público | Ficha de onboarding simplificada para o cliente enviar seus dados |
| `/cartao/:slug` | Cartão Digital | Visualização pública do cartão com botões de VCF, PWA e WhatsApp |

---

## 8. Estrutura do Painel de Entrega com 4 Abas (`DeliveryModule.tsx`)

```tsx
import React, { useState } from 'react';
import { Send, PlusCircle, FolderSync, Calendar } from 'lucide-react';

export const StandaloneDeliveryModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kit' | 'coleta' | 'clonagem' | 'vencimentos'>('kit');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header com Abas */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-black text-lg">⚡ Kit de Entrega Rápido</span>
          </div>
          
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('kit')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'kit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send size={14} />
              1. Enviar Kit (WhatsApp)
            </button>
            <button
              onClick={() => setActiveTab('coleta')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'coleta' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle size={14} />
              2. Coleta Rápida
            </button>
            <button
              onClick={() => setActiveTab('clonagem')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'clonagem' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderSync size={14} />
              3. Clonagem
            </button>
            <button
              onClick={() => setActiveTab('vencimentos')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'vencimentos' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={14} />
              4. Vencimentos & PIX
            </button>
          </nav>
        </div>
      </header>

      {/* Conteúdo das Abas */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Renderize os submódulos de acordo com activeTab */}
      </main>
    </div>
  );
};
```

---

## 9. Algoritmo de Clonagem Instantânea

Para duplicar um cartão e customizar apenas o novo nome e slug:

```typescript
export function cloneCard(sourceCard: DigitalCard, newName: string, newSlug: string): DigitalCard {
  return {
    ...sourceCard,
    id: Date.now(),
    name: newName,
    slug: newSlug,
    phone: '',
    whatsappPhone: '',
    email: '',
    imageUrl: '',
    status: 'degustacao',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

---

## 10. Passos para Construir do Zero em um Novo Repositório

1. **Inicialização do Projeto:**
   ```bash
   npm create vite@latest kit-de-entrega -- --template react-ts
   cd kit-de-entrega
   npm install lucide-react tailwindcss @tailwindcss/vite wouter qr-code-styling
   ```
2. **Adicionar arquivos de tipos e utilitários:**
   - Crie `src/types.ts` com a interface `DigitalCard`.
   - Crie `src/utils/whatsapp.ts` com as funções de sanitização e link do WhatsApp.
   - Crie `src/utils/vcard.ts` para download do VCF.
3. **Criar os Componentes:**
   - `src/components/StandaloneQrCode.tsx`
   - `src/pages/DeliveryModule.tsx` (Painel Operador)
   - `src/pages/DegustadorDeliveryPage.tsx` (Portal do Cliente)
   - `src/pages/QuickOnboardingForm.tsx` (Coleta Pública)
4. **Persistência:**
   - Conecte a um banco Supabase ou utilize endpoints REST locais no Express (`/api/cards`).

Este skill contém todas as especificações e códigos fundamentais para recriar o Kit de Entrega completo de maneira independente e profissional.
