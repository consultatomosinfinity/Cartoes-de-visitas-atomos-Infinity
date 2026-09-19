import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  Instagram,
  DollarSign,
  Palette,
  Sparkles,
  Share2,
  Copy,
  Check,
  Search,
  Filter,
  Trash2,
  Eye,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Send,
  Layers,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientOnboardingForm, OnboardingFormStatus, DigitalCard } from '../types.ts';

interface ClientOnboardingFormsManagerProps {
  onCardCreated?: (card: DigitalCard) => void;
  onOpenCard?: (slug: string) => void;
}

export function ClientOnboardingFormsManager({ onCardCreated, onOpenCard }: ClientOnboardingFormsManagerProps) {
  const [forms, setForms] = useState<ClientOnboardingForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OnboardingFormStatus>('all');
  
  // Modal de detalhes
  const [selectedForm, setSelectedForm] = useState<ClientOnboardingForm | null>(null);
  
  // Estados de ação
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customRepName, setCustomRepName] = useState('');
  const [copiedCustomLink, setCopiedCustomLink] = useState(false);

  // Helper para otimização de imagem no manager
  const optimizeImageFile = async (file: File, maxDimension = 1000, quality = 0.9): Promise<string> => {
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
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const downloadImage = async (url: string, filename: string) => {
    if (!url) return;
    try {
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleUploadEnhancedImage = async (formId: string, type: 'photo' | 'logo', file: File) => {
    try {
      const base64 = await optimizeImageFile(file, type === 'photo' ? 1000 : 800, 0.92);
      const payload = type === 'photo' ? { photoUrl: base64 } : { logoUrl: base64 };

      const res = await fetch(`/api/onboarding-forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, syncToCard: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setForms((prev) => prev.map((f) => (f.id === formId ? { ...f, ...payload, updatedAt: new Date().toISOString() } : f)));
        if (selectedForm && selectedForm.id === formId) {
          setSelectedForm((prev) => (prev ? { ...prev, ...payload } : null));
        }
        setActionSuccessMessage(
          `${type === 'photo' ? 'Foto de Perfil' : 'Logotipo'} melhorado(a) e enviado(a) com sucesso! ${
            data.card ? 'Sincronizado automaticamente com o Cartão Digital.' : ''
          }`
        );
        setTimeout(() => setActionSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setErrorMessage('Erro ao enviar imagem melhorada.');
    }
  };

  const handleSyncToCard = async (form: ClientOnboardingForm) => {
    try {
      const res = await fetch(`/api/onboarding-forms/${form.id}/sync-to-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: form.photoUrl, logoUrl: form.logoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar.');
      setActionSuccessMessage(`Foto e Logo sincronizados com sucesso no Cartão de "${form.fullName}"!`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao sincronizar com o cartão.');
    }
  };

  // Carregar formulários
  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/onboarding-forms');
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (err) {
      console.error('Erro ao carregar formulários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  // Conversão instantânea de formulário em Cartão Digital
  const handleConvertToCard = async (form: ClientOnboardingForm) => {
    try {
      setConvertingId(form.id);
      setErrorMessage(null);
      const res = await fetch(`/api/onboarding-forms/${form.id}/convert-to-card`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao converter formulário.');
      }

      setActionSuccessMessage(`Cartão "${data.card.name}" gerado com sucesso! Redirecionando para edição...`);
      fetchForms();

      if (onCardCreated && data.card) {
        setTimeout(() => {
          onCardCreated(data.card);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao gerar cartão.');
    } finally {
      setConvertingId(null);
    }
  };

  // Atualizar status do formulário
  const handleUpdateStatus = async (formId: string, newStatus: OnboardingFormStatus) => {
    try {
      const res = await fetch(`/api/onboarding-forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setForms((prev) =>
          prev.map((f) => (f.id === formId ? { ...f, status: newStatus, updatedAt: new Date().toISOString() } : f))
        );
        if (selectedForm && selectedForm.id === formId) {
          setSelectedForm((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  // Excluir formulário
  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Deseja realmente excluir este formulário preenchido?')) return;
    try {
      const res = await fetch(`/api/onboarding-forms/${formId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setForms((prev) => prev.filter((f) => f.id !== formId));
        if (selectedForm && selectedForm.id === formId) {
          setSelectedForm(null);
        }
      }
    } catch (err) {
      console.error('Erro ao excluir formulário:', err);
    }
  };

  // Copiar link padrão do formulário
  const publicFormUrl = typeof window !== 'undefined' ? `${window.location.origin}/formulario` : '/formulario';
  
  const handleCopyGeneralLink = () => {
    navigator.clipboard.writeText(publicFormUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Copiar link com vendedora específica
  const customFormUrl = customRepName.trim()
    ? `${publicFormUrl}?vendedora=${encodeURIComponent(customRepName.trim())}`
    : publicFormUrl;

  const handleCopyCustomLink = () => {
    navigator.clipboard.writeText(customFormUrl);
    setCopiedCustomLink(true);
    setTimeout(() => setCopiedCustomLink(false), 3000);
  };

  // Enviar link via WhatsApp
  const handleShareOnWhatsApp = (urlToShare: string, rep = '') => {
    const msg = encodeURIComponent(
      `Olá! Para criarmos seu *Cartão Digital Interativo*, preencha este formulário rápido em 2 minutos:\n\n👉 ${urlToShare}\n\nAssim que preencher, nossa equipe já recebe tudo pronto para gerar o seu cartão!`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  // Filtro de formulários
  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesStatus;

      const matchesSearch =
        (form.fullName || '').toLowerCase().includes(query) ||
        (form.companyName || '').toLowerCase().includes(query) ||
        (form.jobTitle || '').toLowerCase().includes(query) ||
        (form.whatsappPhone || '').includes(query) ||
        (form.salesRepName || '').toLowerCase().includes(query) ||
        (form.city || '').toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [forms, statusFilter, searchQuery]);

  // Contadores
  const stats = useMemo(() => {
    return {
      total: forms.length,
      pendentes: forms.filter((f) => f.status === 'pendente').length,
      em_producao: forms.filter((f) => f.status === 'em_producao').length,
      convertidos: forms.filter((f) => f.status === 'convertido').length,
      arquivados: forms.filter((f) => f.status === 'arquivado').length,
    };
  }, [forms]);

  const getStatusBadge = (status: OnboardingFormStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pendente / Novo
          </span>
        );
      case 'em_producao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300/50">
            <RefreshCw size={12} className="animate-spin text-sky-600" />
            Em Produção
          </span>
        );
      case 'convertido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/50">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Cartão Gerado
          </span>
        );
      case 'arquivado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">
            Arquivado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal com Links para Vendedoras & Clientes */}
      <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-700/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider text-sky-100 border border-white/20">
              <Sparkles size={13} className="text-amber-300" />
              <span>Coleta Express para Vendedoras & Clientes</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Geração de Cartão sem Transcrição Manual do WhatsApp
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
              Envie o link do formulário para o cliente ou para suas vendedoras. Quando o cliente preencher, você só precisa clicar em <strong className="text-white underline decoration-amber-400">⚡ Gerar Cartão</strong> e o sistema cria tudo automaticamente!
            </p>
          </div>

          {/* Ações de Compartilhamento de Link */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <div className="text-[11px] font-bold text-sky-100 uppercase tracking-wider">
              Link Público do Formulário:
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyGeneralLink}
                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-sky-900 font-black text-xs hover:bg-sky-50 transition-colors shadow-sm cursor-pointer"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareOnWhatsApp(publicFormUrl)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
                title="Enviar mensagem pronta no WhatsApp"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </button>

              <a
                href="/formulario"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Abrir formulário em nova aba"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>

        {/* Gerador de Link por Vendedora */}
        <div className="mt-5 pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
          <span className="font-bold text-sky-100 flex items-center gap-1.5 shrink-0">
            <User size={14} />
            Gerar Link com Nome de Vendedora:
          </span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ex: Carla Silveira ou Juliana"
              value={customRepName}
              onChange={(e) => setCustomRepName(e.target.value)}
              className="w-full max-w-xs px-3 py-1.5 rounded-xl bg-white/20 placeholder-sky-200 text-white font-bold text-xs border border-white/30 outline-none focus:bg-white/30"
            />
            {customRepName.trim() && (
              <>
                <button
                  type="button"
                  onClick={handleCopyCustomLink}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs transition-colors cursor-pointer shrink-0"
                >
                  {copiedCustomLink ? '✓ Copiado!' : 'Copiar Link da Vendedora'}
                </button>
                <button
                  type="button"
                  onClick={() => handleShareOnWhatsApp(customFormUrl, customRepName)}
                  className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shrink-0"
                  title="Enviar no WhatsApp com nome da vendedora"
                >
                  <MessageCircle size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alertas de Ação */}
      {actionSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:underline"
          >
            Fechar
          </button>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-sm font-bold flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-red-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-red-600 hover:underline"
          >
            Fechar
          </button>
        </motion.div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 shadow-sm'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Total Recebidos</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('pendente')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pendente'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-sm'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Novos / Pendentes</span>
            {stats.pendentes > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.pendentes}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('em_producao')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'em_producao'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 shadow-sm'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold text-sky-700 dark:text-sky-400 block">Em Produção</span>
          <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {stats.em_producao}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('convertido')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'convertido'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Convertidos em Cartão</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.convertidos}
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nome, Empresa, WhatsApp ou Vendedora..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={fetchForms}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Atualizar lista de formulários"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>

          <a
            href="/formulario"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Novo Formulário</span>
          </a>
        </div>
      </div>

      {/* Lista de Formulários */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-sky-500" />
          <p className="text-xs font-bold">Carregando formulários recebidos...</p>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center mx-auto">
            <FileText size={28} />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Nenhum formulário encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Compartilhe o link do formulário com seus clientes e vendedoras para começar a receber cadastros completos!'}
          </p>
          <button
            type="button"
            onClick={handleCopyGeneralLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors shadow-sm"
          >
            <Copy size={14} />
            <span>Copiar Link do Formulário</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form) => {
            const isConverting = convertingId === form.id;
            const waRaw = form.whatsappPhone.replace(/\D/g, '');

            return (
              <div
                key={form.id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-700/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Header do Card com Status & Data */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {getStatusBadge(form.status)}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Clock size={11} />
                      {new Date(form.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Foto, Nome e Empresa */}
                  <div className="flex items-start gap-3">
                    {form.photoUrl ? (
                      <img
                        src={form.photoUrl}
                        alt={form.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center font-black text-base shrink-0 border border-sky-200 dark:border-sky-800">
                        {form.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {form.fullName}
                      </h4>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                        {form.jobTitle || 'Profissional'}
                      </p>
                      {form.companyName && (
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <Building size={11} className="shrink-0" />
                          <span>{form.companyName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Detalhes Rápidos: WhatsApp, Vendedora, Tema */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 text-[11px]">WhatsApp:</span>
                      <a
                        href={`https://wa.me/55${waRaw}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <MessageCircle size={13} />
                        <span>{form.whatsappPhone}</span>
                      </a>
                    </div>

                    {form.salesRepName && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 text-[11px]">Vendedora:</span>
                        <span className="font-extrabold text-sky-700 dark:text-sky-300">
                          {form.salesRepName}
                        </span>
                      </div>
                    )}

                    {form.city && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 text-[11px]">Localização:</span>
                        <span className="font-semibold truncate max-w-[160px]">
                          {form.city} {form.state ? `- ${form.state}` : ''}
                        </span>
                      </div>
                    )}

                    {form.pixKey && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 text-[11px]">Chave PIX:</span>
                        <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                          {form.pixKey}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {/* Botão de Geração Instantânea */}
                  {form.status !== 'convertido' ? (
                    <button
                      type="button"
                      disabled={isConverting}
                      onClick={() => handleConvertToCard(form)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isConverting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Gerando Cartão...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} className="text-amber-300 fill-amber-300" />
                          <span>⚡ Gerar Cartão (1-Clique)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (form.generatedCardSlug && onOpenCard) {
                            onOpenCard(form.generatedCardSlug);
                          } else {
                            window.open(`/cartao/${form.generatedCardSlug || ''}`, '_blank');
                          }
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        <span>Ver Cartão Criado</span>
                      </button>

                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={() => handleConvertToCard(form)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors"
                        title="Gerar outro cartão deste formulário"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  )}

                  {/* Ações Secundárias */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedForm(form)}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye size={13} />
                      <span>Ver Ficha Completa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteForm(form.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Excluir formulário"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal com a Ficha Completa do Cliente */}
      <AnimatePresence>
        {selectedForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header do Modal */}
              <div className="p-6 bg-gradient-to-r from-sky-700 to-indigo-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight leading-tight">
                      Ficha de Coleta: {selectedForm.fullName}
                    </h3>
                    <span className="text-xs text-sky-200">
                      Enviado em {new Date(selectedForm.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedForm(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-lg"
                >
                  &times;
                </button>
              </div>

              {/* Corpo do Modal com Scroll */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
                {/* Status e Ações Rápidas */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Status atual:</span>
                    {getStatusBadge(selectedForm.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedForm.id, 'em_producao')}
                      className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 font-bold hover:bg-sky-200 text-[11px]"
                    >
                      Em Produção
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedForm.id, 'convertido')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold hover:bg-emerald-200 text-[11px]"
                    >
                      Concluído
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedForm.id, 'arquivado')}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 text-[11px]"
                    >
                      Arquivar
                    </button>
                  </div>
                </div>

                {/* Imagens (Foto e Logo) com opções para Baixar, Melhorar e Sincronizar */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Gerenciamento de Imagens (Foto & Logotipo)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Baixe para tratar no Canva/Photoshop, envie a versão melhorada e sincronize com o cartão.
                      </p>
                    </div>

                    {selectedForm.generatedCardId && (
                      <button
                        type="button"
                        onClick={() => handleSyncToCard(selectedForm)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                        title="Enviar fotos atuais diretamente para o Cartão Digital"
                      >
                        <Zap size={13} className="text-amber-300 fill-amber-300" />
                        <span>⚡ Sincronizar com o Cartão</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Foto de Perfil */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Foto de Perfil</span>
                      {selectedForm.photoUrl ? (
                        <div className="relative">
                          <img
                            src={selectedForm.photoUrl}
                            alt="Foto"
                            className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                          Sem Foto
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-1.5 w-full pt-1">
                        {selectedForm.photoUrl && (
                          <button
                            type="button"
                            onClick={() => downloadImage(selectedForm.photoUrl, `foto_${selectedForm.fullName.replace(/\s+/g, '_')}.jpg`)}
                            className="py-1 px-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                            title="Baixar foto para tratar"
                          >
                            <span>📥 Baixar</span>
                          </button>
                        )}
                        <label className="py-1 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors">
                          <span>✨ Upar Tratada</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadEnhancedImage(selectedForm.id, 'photo', file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Logotipo */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Logotipo da Empresa</span>
                      {selectedForm.logoUrl ? (
                        <div className="relative">
                          <img
                            src={selectedForm.logoUrl}
                            alt="Logo"
                            className="w-24 h-24 rounded-2xl object-contain bg-slate-100 dark:bg-slate-800 p-2 border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                          Sem Logo
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-1.5 w-full pt-1">
                        {selectedForm.logoUrl && (
                          <button
                            type="button"
                            onClick={() => downloadImage(selectedForm.logoUrl, `logo_${(selectedForm.companyName || selectedForm.fullName).replace(/\s+/g, '_')}.png`)}
                            className="py-1 px-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                            title="Baixar logotipo para tratar"
                          >
                            <span>📥 Baixar</span>
                          </button>
                        )}
                        <label className="py-1 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors">
                          <span>✨ Upar Tratado</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadEnhancedImage(selectedForm.id, 'logo', file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dados Pessoais & Contato */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Dados Profissionais & Contato
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nome:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedForm.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Cargo / Especialidade:</span>
                      <span className="font-semibold">{selectedForm.jobTitle || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Empresa / Clínica:</span>
                      <span className="font-semibold">{selectedForm.companyName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">WhatsApp:</span>
                      <a
                        href={`https://wa.me/55${selectedForm.whatsappPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <MessageCircle size={12} />
                        {selectedForm.whatsappPhone}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Telefone Secundário:</span>
                      <span className="font-semibold">{selectedForm.secondaryPhone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">E-mail:</span>
                      <span className="font-semibold">{selectedForm.email || '-'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Endereço / Localização:</span>
                      <span className="font-semibold">
                        {selectedForm.fullAddress || `${selectedForm.city || ''} ${selectedForm.state || ''}` || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio / Apresentação */}
                {selectedForm.summaryBio && (
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px] font-bold">Resumo / Bio:</span>
                    <p className="leading-relaxed">{selectedForm.summaryBio}</p>
                  </div>
                )}

                {/* Redes Sociais & Links */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Redes Sociais, Links & Chave PIX
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Instagram:</span>
                      <span className="font-semibold text-pink-600">{selectedForm.instagramHandle || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Site / Loja:</span>
                      <span className="font-semibold">{selectedForm.websiteUrl || '-'}</span>
                    </div>
                    {selectedForm.customLinkName && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[11px]">Botão de Ação Especial:</span>
                        <span className="font-bold text-sky-600">
                          {selectedForm.customLinkName} ({selectedForm.customLinkUrl || '-'})
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 block text-[11px]">Chave PIX:</span>
                      <span className="font-bold text-emerald-600">{selectedForm.pixKey || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Titular do PIX:</span>
                      <span className="font-semibold">{selectedForm.pixBeneficiary || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Preferência Visual e Observações */}
                <div className="space-y-2 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 dark:text-amber-300">Tema Visual Preferido:</span>
                    <span className="font-extrabold uppercase text-[11px] text-amber-700 dark:text-amber-400">
                      {selectedForm.preferredTheme || 'Azul Corporativo'}
                    </span>
                  </div>
                  {selectedForm.notes && (
                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-bold">
                        Notas / Pedidos do Cliente:
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300">{selectedForm.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedForm(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  disabled={convertingId === selectedForm.id}
                  onClick={() => handleConvertToCard(selectedForm)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Zap size={14} className="text-amber-300 fill-amber-300" />
                  <span>⚡ Gerar Cartão Digital Imediato</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
