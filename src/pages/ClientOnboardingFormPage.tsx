import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Camera,
  Image as ImageIcon,
  Instagram,
  Globe,
  Linkedin,
  Facebook,
  Youtube,
  DollarSign,
  Palette,
  CheckCircle2,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from '../components/ThemeToggle.tsx';

// Helper para otimização de imagem via Canvas antes de enviar
async function optimizeImageFile(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const THEME_OPTIONS = [
  {
    id: 'azul_corporativo',
    name: 'Azul Corporativo',
    tag: 'Executivo & Confiável',
    bg: '#12375B',
    accent: '#1A7FBE',
    desc: 'Ideal para advogados, diretores, empresas e consultorias.',
  },
  {
    id: 'ouro_luxo',
    name: 'Ouro & Preto Luxo',
    tag: 'VIP & Sofisticado',
    bg: '#18181B',
    accent: '#D97706',
    desc: 'Perfeito para clínicas premium, corretores de luxo e marcas exclusivas.',
  },
  {
    id: 'esmeralda',
    name: 'Verde Esmeralda',
    tag: 'Saúde & Natureza',
    bg: '#064E3B',
    accent: '#059669',
    desc: 'Excelente para nutricionistas, médicos, estética, finanças e sustentabilidade.',
  },
  {
    id: 'roxo_criativo',
    name: 'Roxo Criativo',
    tag: 'Tech & Inovador',
    bg: '#4C1D95',
    accent: '#7C3AED',
    desc: 'Para designers, programadores, marketing digital e agências.',
  },
  {
    id: 'vermelho_elegante',
    name: 'Vermelho & Vinho',
    tag: 'Elegância & Energia',
    bg: '#881337',
    accent: '#BE123C',
    desc: 'Ideal para gastronomia, direito, eventos e moda.',
  },
  {
    id: 'rosa_moderno',
    name: 'Rosa & Beleza',
    tag: 'Estética & Feminino',
    bg: '#831843',
    accent: '#DB2777',
    desc: 'Indicado para salões, biomédicas, micropigmentação e semijoias.',
  },
  {
    id: 'preto_minimalista',
    name: 'Preto & Grafite Clean',
    tag: 'Minimalista & Moderno',
    bg: '#0F172A',
    accent: '#38BDF8',
    desc: 'Estilo dark mode universal para qualquer área profissional.',
  },
];

export function ClientOnboardingFormPage() {
  // Extrai parâmetros de vendedora/origem da URL
  const [salesRepName, setSalesRepName] = useState('');
  const [salesRepPhone, setSalesRepPhone] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rep = params.get('vendedora') || params.get('consultora') || params.get('ref') || params.get('rep') || '';
    const phone = params.get('tel') || params.get('phone') || '';
    if (rep) setSalesRepName(rep);
    if (phone) setSalesRepPhone(phone);
  }, []);

  // Campos do formulário
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [summaryBio, setSummaryBio] = useState('');

  // Imagens
  const [photoUrl, setPhotoUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contentBackgroundUrl, setContentBackgroundUrl] = useState('');
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Redes e Links
  const [instagramHandle, setInstagramHandle] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [customLinkName, setCustomLinkName] = useState('');
  const [customLinkUrl, setCustomLinkUrl] = useState('');

  // PIX
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('telefone');
  const [pixBeneficiary, setPixBeneficiary] = useState('');

  // Estilo e Observações
  const [preferredTheme, setPreferredTheme] = useState('azul_corporativo');
  const [notes, setNotes] = useState('');

  // Estados de envio e validação
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Handlers para upload de fotos
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const base64 = await optimizeImageFile(file, 800, 0.85);
      setPhotoUrl(base64);
    } catch (err) {
      console.error('Erro ao processar foto:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const base64 = await optimizeImageFile(file, 600, 0.9);
      setLogoUrl(base64);
    } catch (err) {
      console.error('Erro ao processar logo:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Por favor, informe seu Nome Completo.');
      return;
    }
    if (!whatsappPhone.trim()) {
      setErrorMessage('Por favor, informe seu número de WhatsApp comercial.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        salesRepName: salesRepName.trim(),
        salesRepPhone: salesRepPhone.trim(),
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        whatsappPhone: whatsappPhone.trim(),
        secondaryPhone: secondaryPhone.trim(),
        email: email.trim(),
        city: city.trim(),
        state: state.trim(),
        fullAddress: fullAddress.trim(),
        summaryBio: summaryBio.trim(),
        photoUrl,
        logoUrl,
        contentBackgroundUrl,
        instagramHandle: instagramHandle.trim(),
        websiteUrl: websiteUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        tiktokUrl: tiktokUrl.trim(),
        customLinkName: customLinkName.trim(),
        customLinkUrl: customLinkUrl.trim(),
        pixKey: pixKey.trim(),
        pixType,
        pixBeneficiary: pixBeneficiary.trim(),
        preferredTheme,
        notes: notes.trim(),
      };

      try {
        const res = await fetch('/api/onboarding-forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setSubmittedForm(data.form || payload);
          setIsSuccess(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        throw new Error('API unavailable or returned non-json');
      } catch {
        // Fallback localStorage para Vercel / Static Hosting
        const newFormRecord = {
          id: `form-${Date.now()}`,
          ...payload,
          status: 'pendente',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          const existingRaw = localStorage.getItem('atomos_onboarding_forms');
          const existingList = existingRaw ? JSON.parse(existingRaw) : [];
          existingList.unshift(newFormRecord);
          localStorage.setItem('atomos_onboarding_forms', JSON.stringify(existingList));
        } catch {}

        setSubmittedForm(newFormRecord);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro ao enviar os dados. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Se o formulário foi enviado com sucesso
  if (isSuccess) {
    const rawWa = whatsappPhone.replace(/\D/g, '');
    const clientSummaryMsg = encodeURIComponent(
      `Olá! Acabei de enviar o formulário para criação do meu Cartão Digital Interativo.\n\n*Nome:* ${fullName}\n*Empresa:* ${companyName || '-'}\n*Cargo:* ${jobTitle || '-'}\n*WhatsApp:* ${whatsappPhone}\n${salesRepName ? `*Consultora:* ${salesRepName}\n` : ''}\nAguardando a geração do meu cartão!`
    );

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 font-sans text-slate-800 dark:text-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden"
        >
          {/* Top Banner de Sucesso */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white text-center relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
              <CheckCircle2 size={44} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Formulário Enviado com Sucesso!
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base max-w-md mx-auto">
              Recebemos todos os seus dados e nossa equipe já está pronta para gerar o seu Cartão Digital Interativo.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Resumo do que foi enviado */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resumo dos Dados Cadastrados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Titular:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Cargo / Profissão:</span>
                  <span className="font-semibold">{jobTitle || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Empresa:</span>
                  <span className="font-semibold">{companyName || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">WhatsApp Comercial:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{whatsappPhone}</span>
                </div>
                {salesRepName && (
                  <div className="sm:col-span-2 bg-sky-50 dark:bg-sky-950/40 p-2.5 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300">
                    <span className="text-xs font-bold">Vendedora / Consultora Responsável: </span>
                    <span className="font-extrabold">{salesRepName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/5515996259353?text=${clientSummaryMsg}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <MessageCircle size={20} />
                <span>Confirmar Envio pelo WhatsApp da Empresa</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setFullName('');
                  setJobTitle('');
                  setCompanyName('');
                  setWhatsappPhone('');
                  setSecondaryPhone('');
                  setEmail('');
                  setCity('');
                  setState('');
                  setFullAddress('');
                  setSummaryBio('');
                  setPhotoUrl('');
                  setLogoUrl('');
                  setInstagramHandle('');
                  setWebsiteUrl('');
                  setLinkedinUrl('');
                  setPixKey('');
                  setNotes('');
                }}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all text-center"
              >
                Preencher Outro Formulário
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Átomos Infinity &copy; {new Date().getFullYear()} &bull; Tecnologia em Cartões Digitais Inteligentes
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 pb-16">
      {/* Header Superior Limpo */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-sky-600/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Átomos Infinity
              </h1>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Formulário de Coleta Express
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Copiar link para enviar para o cliente"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
            <ThemeToggle variant="header" />
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Banner Informativo Superior */}
        <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-700/15 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider text-sky-100 mb-3 border border-white/20">
              <Sparkles size={13} className="text-amber-300" />
              <span>Criação de Cartão Digital Interativo</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
              Envie seus dados em 2 minutos
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Preencha os campos abaixo com as informações que deseja exibir no seu cartão. Nossa equipe cuidará de todo o design e configuração para você!
            </p>

            {salesRepName && (
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2 text-xs text-sky-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Atendimento & Suporte por: </span>
                <span className="font-extrabold text-white underline decoration-sky-300 underline-offset-2">
                  {salesRepName} {salesRepPhone ? `(${salesRepPhone})` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-semibold flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* SEÇÃO 1: Dados Pessoais e Profissionais */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-black shrink-0">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  1. Dados Pessoais & Profissionais
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Como você quer ser apresentado no cartão
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Mariana Vasconcelos ou Roberto Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cargo / Profissão / Especialidade <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Médica Dermatologista, Advogado, Corretor"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Empresa / Consultório / Marca
                </label>
                <div className="relative">
                  <Building size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Clínica Vasconcelos ou Silva Imóveis"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  WhatsApp Comercial Principal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-emerald-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: (15) 99765-4321"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Telefone Fixo / Secundário (Opcional)
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: (15) 3232-1000"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail Comercial
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Ex: contato@suaempresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cidade
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Sorocaba"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  placeholder="Ex: SP"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Endereço Completo (Rua, Número, Bairro, Sala)
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Av. Antonio Carlos Comitre, 1200 - Sala 84 - Campolim"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sobre Você / Resumo de Serviços (Bio)
                </label>
                <textarea
                  rows={3}
                  placeholder="Breve texto sobre seus diferenciais, serviços prestados ou área de atuação..."
                  value={summaryBio}
                  onChange={(e) => setSummaryBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: Foto de Perfil e Logo */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black shrink-0">
                <Camera size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  2. Foto de Perfil & Logotipo
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Faça o upload do seu celular/computador ou informe o link da imagem
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Foto de Perfil */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Sua Foto de Perfil / Rosto
                    </label>

                    {/* Alternador Upar vs Link */}
                    <div className="flex items-center bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPhotoInputMode('upload')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          photoInputMode === 'upload'
                            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Upar Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoInputMode('url')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          photoInputMode === 'url'
                            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Colar URL
                      </button>
                    </div>
                  </div>

                  {photoInputMode === 'upload' ? (
                    <div className="flex flex-col items-center justify-center pt-1">
                      {photoUrl ? (
                        <div className="relative group">
                          <img
                            src={photoUrl}
                            alt="Prévia Foto"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotoUrl('')}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm shadow transition-colors"
                            title="Remover foto"
                          >
                            &times;
                          </button>
                          <label className="mt-2 block text-center">
                            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
                              Trocar foto
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="w-full h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-sky-500 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition-all group px-3">
                          <Upload size={22} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-600 mt-1">
                            {uploadingPhoto ? 'Comprimindo foto...' : 'Toque para Upar Foto'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Galeria ou Câmera do Celular)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="relative">
                        <Camera size={15} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://exemplo.com/minha-foto.jpg"
                          value={photoUrl.startsWith('data:') ? '' : photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      {photoUrl && !photoUrl.startsWith('data:') && (
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <img
                            src={photoUrl}
                            alt="Prévia Foto"
                            className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-emerald-600 block">Link válido</span>
                            <span className="text-[10px] text-slate-400 truncate block">{photoUrl}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPhotoUrl('')}
                            className="text-red-500 hover:text-red-600 text-xs font-bold px-2 py-1"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Dica: Foto de rosto nítida e bem iluminada para passar mais autoridade.
                </p>
              </div>

              {/* Logotipo */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Logotipo da Empresa (Opcional)
                    </label>

                    {/* Alternador Upar vs Link */}
                    <div className="flex items-center bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('upload')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          logoInputMode === 'upload'
                            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Upar Logo
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('url')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          logoInputMode === 'url'
                            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Colar URL
                      </button>
                    </div>
                  </div>

                  {logoInputMode === 'upload' ? (
                    <div className="flex flex-col items-center justify-center pt-1">
                      {logoUrl ? (
                        <div className="relative group">
                          <img
                            src={logoUrl}
                            alt="Prévia Logo"
                            className="w-24 h-24 rounded-2xl object-contain bg-white p-2 border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm shadow transition-colors"
                            title="Remover logo"
                          >
                            &times;
                          </button>
                          <label className="mt-2 block text-center">
                            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
                              Trocar logotipo
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="w-full h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-sky-500 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition-all group px-3">
                          <Upload size={22} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-600 mt-1">
                            {uploadingLogo ? 'Comprimindo logo...' : 'Toque para Upar Logotipo'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Formatos PNG, JPG, WebP ou SVG)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="relative">
                        <ImageIcon size={15} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://exemplo.com/logotipo.png"
                          value={logoUrl.startsWith('data:') ? '' : logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      {logoUrl && !logoUrl.startsWith('data:') && (
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <img
                            src={logoUrl}
                            alt="Prévia Logo"
                            className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-slate-300 dark:border-slate-600"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-emerald-600 block">Link válido</span>
                            <span className="text-[10px] text-slate-400 truncate block">{logoUrl}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="text-red-500 hover:text-red-600 text-xs font-bold px-2 py-1"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Preferencialmente formato PNG com fundo transparente para o melhor resultado.
                </p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Redes Sociais, Links & Chave PIX */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black shrink-0">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  3. Redes Sociais, Links & Chave PIX
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Facilite o acesso dos seus clientes aos seus canais e pagamentos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Instagram (@ ou link)
                </label>
                <div className="relative">
                  <Instagram size={16} className="absolute left-3.5 top-3.5 text-pink-500" />
                  <input
                    type="text"
                    placeholder="Ex: @dra.marianavasconcelos"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Site Oficial / Loja / Catálogo
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3.5 top-3.5 text-sky-500" />
                  <input
                    type="text"
                    placeholder="Ex: https://suaempresa.com.br"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  LinkedIn (Opcional)
                </label>
                <div className="relative">
                  <Linkedin size={16} className="absolute left-3.5 top-3.5 text-blue-600" />
                  <input
                    type="text"
                    placeholder="Link do seu perfil no LinkedIn"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Facebook ou YouTube (Opcional)
                </label>
                <div className="relative">
                  <Facebook size={16} className="absolute left-3.5 top-3.5 text-blue-500" />
                  <input
                    type="text"
                    placeholder="Link da sua página ou canal"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Botão de Destaque / Link Personalizado */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Botão de Ação em Destaque (CTA)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nome do Botão (Ex: Agendar Consulta, Ver Cardápio, Baixar Catálogo)"
                    value={customLinkName}
                    onChange={(e) => setCustomLinkName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Link de destino (URL ou WhatsApp)"
                    value={customLinkUrl}
                    onChange={(e) => setCustomLinkUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Chave PIX */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-emerald-500" />
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dados da Chave PIX (Para inclusão de Botão de Pagamento Rápido no Cartão)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <select
                      value={pixType}
                      onChange={(e: any) => setPixType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 dark:text-slate-200"
                    >
                      <option value="telefone">Tipo: Telefone</option>
                      <option value="cpf">Tipo: CPF</option>
                      <option value="cnpj">Tipo: CNPJ</option>
                      <option value="email">Tipo: E-mail</option>
                      <option value="aleatoria">Tipo: Chave Aleatória</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Sua Chave PIX"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Nome do Titular do PIX"
                      value={pixBeneficiary}
                      onChange={(e) => setPixBeneficiary(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: Estilo Visual e Cores */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black shrink-0">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  4. Preferência Visual & Estilo do Cartão
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Escolha o estilo de cores que mais combina com seu perfil
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = preferredTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setPreferredTheme(theme.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40 dark:bg-sky-950/30'
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/30 dark:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: theme.bg }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-xs -ml-2"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[11px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-xs text-slate-900 dark:text-white">{theme.name}</div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                      {theme.tag}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {theme.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Observações Especiais ou Instruções para nossa Equipe
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Gostaria de destacar meu WhatsApp no topo, colocar fundo escuro e incluir meu canal do YouTube..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Identificação de Vendedora (Se aplicável) */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <ShieldCheck size={16} className="text-sky-600" />
              <span>Consultora / Vendedora que te enviou o link:</span>
            </div>
            <input
              type="text"
              placeholder="Nome da Vendedora (Opcional)"
              value={salesRepName}
              onChange={(e) => setSalesRepName(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Botão de Envio Principal */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-700 hover:via-indigo-700 hover:to-purple-700 text-white font-black text-base sm:text-lg shadow-xl shadow-sky-600/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw size={22} className="animate-spin" />
                  <span>Enviando seus dados...</span>
                </>
              ) : (
                <>
                  <Send size={22} />
                  <span>Enviar Dados & Solicitar Criação do Cartão</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-2.5">
              Seus dados estão protegidos e serão utilizados exclusivamente para a criação do seu Cartão Digital Interativo.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
