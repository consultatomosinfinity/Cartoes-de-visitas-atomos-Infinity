import React, { useState, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  RefreshCw,
  Search,
  Filter,
  Send,
  Copy,
  Check,
  Edit3,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Wallet,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info,
  X,
  BellRing
} from 'lucide-react';
import { DigitalCard, CardBillingCycle } from '../types.ts';
import { buildWhatsAppUrl, sanitizeWhatsAppText } from '../utils/whatsapp.ts';

interface CardBillingAlertsManagerProps {
  cards: DigitalCard[];
  onUpdateCard?: (updatedCard: DigitalCard) => Promise<void> | void;
  masterWhatsApp?: string;
  masterPixKey?: string;
}

export const CardBillingAlertsManager: React.FC<CardBillingAlertsManagerProps> = ({
  cards,
  onUpdateCard,
  masterWhatsApp = '5515996259353',
  masterPixKey = '15996259353',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'expiring_soon' | 'expired' | 'active' | 'quarterly' | 'monthly'>('all');
  
  // Modal de Cobrança WhatsApp
  const [billingModalCard, setBillingModalCard] = useState<DigitalCard | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'pre_expiry' | 'due_today' | 'post_expiry' | 'renewal_confirmed'>('pre_expiry');
  const [customPixKey, setCustomPixKey] = useState<string>(masterPixKey);
  const [customPixHolder, setCustomPixHolder] = useState<string>('Átomos Infinity / Jurandir');
  const [copiedText, setCopiedText] = useState(false);

  // Modal de Edição Financeira / Ciclo
  const [editingCard, setEditingCard] = useState<DigitalCard | null>(null);
  const [editCycle, setEditCycle] = useState<CardBillingCycle>('trimestral');
  const [editAmount, setEditAmount] = useState<number>(117.00);
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingCard, setSavingCard] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Helper para calcular a data de vencimento padrão se não configurada
  const getCardBillingData = (card: DigitalCard) => {
    const cycle: CardBillingCycle = card.billingCycle || 'trimestral';
    
    // Valor padrão baseado no ciclo
    let defaultAmount = 117.0; // Trimestral (R$ 39/mês x 3 = 117)
    if (cycle === 'mensal') defaultAmount = 39.0;
    if (cycle === 'semestral') defaultAmount = 210.0;
    if (cycle === 'anual') defaultAmount = 348.0;
    if (cycle === 'degustacao') defaultAmount = 0.0;
    
    const amount = card.billingAmount !== undefined ? card.billingAmount : defaultAmount;
    
    // Data de vencimento
    let dueDateStr = card.billingDueDate;
    if (!dueDateStr) {
      const createdDate = card.createdAt ? new Date(card.createdAt) : new Date();
      const targetDate = new Date(createdDate);
      if (cycle === 'mensal') targetDate.setMonth(targetDate.getMonth() + 1);
      else if (cycle === 'semestral') targetDate.setMonth(targetDate.getMonth() + 6);
      else if (cycle === 'anual') targetDate.setFullYear(targetDate.getFullYear() + 1);
      else if (cycle === 'degustacao') targetDate.setDate(targetDate.getDate() + 30);
      else targetDate.setMonth(targetDate.getMonth() + 3); // Trimestral padrão (3 meses)
      dueDateStr = targetDate.toISOString().split('T')[0];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusType: 'expired' | 'expiring_soon' | 'active' | 'degustacao' = 'active';
    if (cycle === 'degustacao') {
      statusType = 'degustacao';
    } else if (diffDays < 0) {
      statusType = 'expired';
    } else if (diffDays <= 7) {
      statusType = 'expiring_soon';
    } else {
      statusType = 'active';
    }

    const customerPhone = card.billingCustomerPhone || card.whatsappPhone || card.phone || '';
    const customerName = card.billingCustomerName || card.name || 'Cliente';

    return {
      cycle,
      amount,
      dueDateStr,
      diffDays,
      statusType,
      customerPhone,
      customerName,
    };
  };

  // Processa todos os cartões e métricas
  const processedCards = useMemo(() => {
    return cards.map((card) => {
      const billing = getCardBillingData(card);
      return {
        card,
        ...billing,
      };
    });
  }, [cards]);

  // Métricas Globais
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let activeCount = 0;
    let quarterlyCount = 0;

    processedCards.forEach((item) => {
      if (item.statusType === 'expiring_soon') expiringSoonCount++;
      if (item.statusType === 'expired') expiredCount++;
      if (item.statusType === 'active') activeCount++;
      if (item.cycle === 'trimestral') quarterlyCount++;
      totalRevenue += item.amount;
    });

    return {
      totalCards: processedCards.length,
      expiringSoonCount,
      expiredCount,
      activeCount,
      quarterlyCount,
      totalRevenue,
    };
  }, [processedCards]);

  // Filtros aplicados
  const filteredItems = useMemo(() => {
    return processedCards.filter((item) => {
      // Busca textual
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.card.name.toLowerCase().includes(query);
        const matchesCustomer = item.customerName.toLowerCase().includes(query);
        const matchesJob = (item.card.jobTitle || '').toLowerCase().includes(query);
        const matchesPhone = item.customerPhone.includes(query);
        const matchesSlug = item.card.slug.toLowerCase().includes(query);
        if (!matchesName && !matchesCustomer && !matchesJob && !matchesPhone && !matchesSlug) {
          return false;
        }
      }

      // Filtro de status
      if (filterStatus === 'expiring_soon') return item.statusType === 'expiring_soon';
      if (filterStatus === 'expired') return item.statusType === 'expired';
      if (filterStatus === 'active') return item.statusType === 'active';
      if (filterStatus === 'quarterly') return item.cycle === 'trimestral';
      if (filterStatus === 'monthly') return item.cycle === 'mensal';

      return true;
    });
  }, [processedCards, searchTerm, filterStatus]);

  // Formatação de data amigável (DD/MM/AAAA)
  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Abre modal de edição financeira
  const handleOpenEdit = (card: DigitalCard) => {
    const data = getCardBillingData(card);
    setEditingCard(card);
    setEditCycle(data.cycle);
    setEditAmount(data.amount);
    setEditDueDate(data.dueDateStr);
    setEditPhone(data.customerPhone);
    setEditCustomerName(data.customerName);
    setEditNotes(card.billingNotes || '');
  };

  // Salva alterações financeiras
  const handleSaveBilling = async () => {
    if (!editingCard) return;
    setSavingCard(true);
    try {
      const updated: DigitalCard = {
        ...editingCard,
        billingCycle: editCycle,
        billingAmount: editAmount,
        billingDueDate: editDueDate,
        billingCustomerName: editCustomerName,
        billingCustomerPhone: editPhone,
        billingNotes: editNotes,
        updatedAt: new Date().toISOString(),
      };

      if (onUpdateCard) {
        await onUpdateCard(updated);
      }

      setActionSuccessMessage(`Dados de cobrança de "${updated.name}" atualizados com sucesso!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setEditingCard(null);
    } catch (err) {
      console.error('Erro ao salvar cobrança:', err);
    } finally {
      setSavingCard(false);
    }
  };

  // Ação rápida: Renovar período (+3 Meses, +1 Mês, etc.)
  const handleQuickRenew = async (card: DigitalCard, monthsToAdd = 3) => {
    const data = getCardBillingData(card);
    const currentDue = new Date(data.dueDateStr + 'T00:00:00');
    
    // Se estiver muito atrasado, renova a partir de hoje; se em dia, soma ao vencimento
    const baseDate = currentDue < new Date() ? new Date() : currentDue;
    const newDueDate = new Date(baseDate);
    newDueDate.setMonth(newDueDate.getMonth() + monthsToAdd);
    const newDueDateStr = newDueDate.toISOString().split('T')[0];

    const updated: DigitalCard = {
      ...card,
      billingDueDate: newDueDateStr,
      billingLastRenewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateCard) {
      await onUpdateCard(updated);
    }

    setActionSuccessMessage(`Plano de "${card.name}" renovado por +${monthsToAdd} meses até ${formatDateBR(newDueDateStr)}!`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Gerador de mensagens personalizadas do WhatsApp
  const generateWhatsAppMessage = (card: DigitalCard, template: 'pre_expiry' | 'due_today' | 'post_expiry' | 'renewal_confirmed') => {
    const data = getCardBillingData(card);
    const formattedDate = formatDateBR(data.dueDateStr);
    const cycleLabel = 
      data.cycle === 'trimestral' ? 'Trimestral (3 meses)' :
      data.cycle === 'mensal' ? 'Mensal' :
      data.cycle === 'semestral' ? 'Semestral (6 meses)' :
      data.cycle === 'anual' ? 'Anual (12 meses)' : 'Degustação';
    
    const cardUrl = `${window.location.origin}/cartao/${card.slug}`;

    if (template === 'pre_expiry') {
      return sanitizeWhatsAppText(
        `Olá ${data.customerName}, tudo bem?\n\n` +
        `Passando para avisar que a mensalidade do seu plano *${cycleLabel}* do seu *Cartão Digital Interativo (${card.name})* vence em *${formattedDate}* (daqui a ${data.diffDays} dias).\n\n` +
        `• *Valor para renovação:* R$ ${data.amount.toFixed(2).replace('.', ',')}\n` +
        `• *Chave PIX:* ${customPixKey}\n` +
        `• *Titular:* ${customPixHolder}\n` +
        `• *Link do seu Cartão Ativo:* ${cardUrl}\n\n` +
        `Assim que realizar a transferência, basta enviar o comprovante por aqui para mantermos seus links, atendente virtual e QR Code sempre no ar. Obrigado pela parceria!`
      );
    }

    if (template === 'due_today') {
      return sanitizeWhatsAppText(
        `Olá ${data.customerName}!\n\n` +
        `Hoje (*${formattedDate}*) vence a renovação do plano *${cycleLabel}* do seu *Cartão Digital (${card.name})*.\n\n` +
        `• *Valor:* R$ ${data.amount.toFixed(2).replace('.', ',')}\n` +
        `• *Chave PIX:* ${customPixKey}\n` +
        `• *Titular:* ${customPixHolder}\n` +
        `• *Seu Cartão:* ${cardUrl}\n\n` +
        `Por gentileza, envie o comprovante para confirmarmos a renovação do seu próximo ciclo de 3 meses. Qualquer dúvida estamos à disposição!`
      );
    }

    if (template === 'post_expiry') {
      return sanitizeWhatsAppText(
        `Olá ${data.customerName}!\n\n` +
        `Identificamos que o período do seu Cartão Digital (*${card.name}*) venceu em *${formattedDate}* (${Math.abs(data.diffDays)} dias atrás).\n\n` +
        `Para garantir que seu cartão continue disponível online para seus clientes e nos links de divulgação, realize a renovação:\n\n` +
        `• *Valor do Plano:* R$ ${data.amount.toFixed(2).replace('.', ',')}\n` +
        `• *Chave PIX:* ${customPixKey}\n` +
        `• *Titular:* ${customPixHolder}\n\n` +
        `Envie o comprovante por aqui para reativarmos/estendermos seu acesso imediatamente. Obrigado!`
      );
    }

    // renewal_confirmed
    return sanitizeWhatsAppText(
      `Olá ${data.customerName}!\n\n` +
      `Recebemos seu pagamento com sucesso! Seu plano *${cycleLabel}* do *Cartão Digital (${card.name})* foi renovado até *${formattedDate}*.\n\n` +
      `Seus links, Atendente Virtual e QR Code continuam 100% ativos e velozes para seus contatos.\n\n` +
      `• *Acesse seu cartão:* ${cardUrl}\n\n` +
      `Muito obrigado pela confiança e ótimos negócios!`
    );
  };

  // Abre modal de envio de cobrança WhatsApp
  const handleOpenBillingModal = (card: DigitalCard) => {
    const data = getCardBillingData(card);
    if (data.diffDays < 0) {
      setSelectedTemplate('post_expiry');
    } else if (data.diffDays === 0) {
      setSelectedTemplate('due_today');
    } else {
      setSelectedTemplate('pre_expiry');
    }
    setBillingModalCard(card);
    setCopiedText(false);
  };

  // Gera o relatório consolidado da semana para o próprio Master
  const generateMasterWeeklyReport = () => {
    const expiring = processedCards.filter((c) => c.statusType === 'expiring_soon' || c.statusType === 'expired');
    if (expiring.length === 0) {
      return sanitizeWhatsAppText(`*RELATÓRIO DE COBRANÇA ÁTOMOS INFINITY*\n\nParabéns! Todos os clientes estão em dia neste momento. Nenhum vencimento pendente nos próximos 7 dias.`);
    }

    let report = `*RELATÓRIO DE VENCIMENTOS DA SEMANA (${expiring.length} PENDENTES)*\n\n`;
    expiring.forEach((item, index) => {
      const statusIcon = item.statusType === 'expired' ? '[VENCIDO]' : '[VENCE EM BREVE]';
      report += `${index + 1}. *${item.card.name}* (${item.customerName})\n`;
      report += `   • Status: ${statusIcon} (${item.diffDays < 0 ? Math.abs(item.diffDays) + 'd atrás' : 'em ' + item.diffDays + 'd'})\n`;
      report += `   • Vencimento: ${formatDateBR(item.dueDateStr)} | Ciclo: ${item.cycle}\n`;
      report += `   • Valor: R$ ${item.amount.toFixed(2).replace('.', ',')}\n`;
      report += `   • WhatsApp: ${item.customerPhone || 'Não informado'}\n\n`;
    });
    report += `• *Previsão de Recebimento:* R$ ${expiring.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2).replace('.', ',')}\n`;
    report += `• Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    return sanitizeWhatsAppText(report);
  };

  const handleCopyMasterReport = () => {
    const report = generateMasterWeeklyReport();
    navigator.clipboard.writeText(report);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleSendReportToMasterWhatsApp = () => {
    const report = generateMasterWeeklyReport();
    const url = buildWhatsAppUrl(masterWhatsApp, report);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast de sucesso */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between shadow-lg text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold">{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* CABEÇALHO DO MÓDULO COM MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Vencendo em Breve (Alerta) */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
              Vencem em até 7 dias
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-900 dark:text-amber-100">
                {metrics.expiringSoonCount}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">cartões</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <BellRing size={20} className={metrics.expiringSoonCount > 0 ? 'animate-bounce' : ''} />
          </div>
        </div>

        {/* Card 2: Vencidos / Pendentes */}
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-0.5">
              Vencidos / Atrasados
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-900 dark:text-rose-100">
                {metrics.expiredCount}
              </span>
              <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">a cobrar</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Card 3: Clientes Em Dia */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
              Em Dia / Ativos
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                {metrics.activeCount}
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">de {metrics.totalCards}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Card 4: Previsão Recorrente (Volume Trimestral) */}
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block mb-0.5">
              Receita dos Planos
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-sky-900 dark:text-sky-100">
                R$ {metrics.totalRevenue.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center border border-sky-200 dark:border-sky-800">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÃO DO MASTER: AVISOS PARA MIM & FILTROS */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-sky-600 dark:text-sky-400" />
              <span>Painel de Alertas de Vencimento & Cobrança (WhatsApp 1-Clique)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhe quem escolheu plano de 3 meses (trimestral), envie avisos automáticos e renove períodos facilmente.
            </p>
          </div>

          {/* Botões de Alerta para o Master */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMasterReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Copiar lista de vencimentos da semana para colar no seu bloco de notas"
            >
              {copiedText ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedText ? 'Copiado!' : 'Copiar Relatório da Semana'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendReportToMasterWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
              title="Enviar lista consolidada para seu próprio WhatsApp"
            >
              <Send size={14} />
              <span>Enviar Alerta para Meu WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, empresa ou fone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          {/* Abas de Filtros de Status */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto text-xs font-bold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({processedCards.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('expiring_soon')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'expiring_soon' ? 'bg-amber-500 text-white shadow-xs' : 'hover:text-amber-600'
              }`}
            >
              Vencem em 7d ({metrics.expiringSoonCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('expired')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'expired' ? 'bg-rose-500 text-white shadow-xs' : 'hover:text-rose-600'
              }`}
            >
              Vencidos ({metrics.expiredCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('quarterly')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'quarterly' ? 'bg-sky-600 text-white shadow-xs' : 'hover:text-sky-600'
              }`}
            >
              3 Meses ({metrics.quarterlyCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-emerald-600'
              }`}
            >
              Em Dia ({metrics.activeCount})
            </button>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE CARTÕES E COBRANÇA */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhum cartão encontrado neste filtro</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não há clientes com vencimentos pendentes para a busca realizada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isExpired = item.statusType === 'expired';
            const isExpiringSoon = item.statusType === 'expiring_soon';

            return (
              <div
                key={item.card.id}
                className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                  isExpired
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-400/30'
                    : isExpiringSoon
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-400/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Topo do Card: Identificação do Cliente */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.card.imageUrl || item.card.companyLogoUrl || '/default-cat-avatar.jpg'}
                        alt={item.card.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {item.card.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.card.jobTitle || item.card.brandName || 'Titular'}
                        </p>
                      </div>
                    </div>

                    {/* Tag de Status de Vencimento */}
                    {isExpired ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shrink-0">
                        Vencido há {Math.abs(item.diffDays)}d
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shrink-0 animate-pulse">
                        Vence em {item.diffDays}d
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Em Dia ({item.diffDays}d)
                      </span>
                    )}
                  </div>

                  {/* Informações do Plano & Valores */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-1.5 mb-3 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-[11px] font-medium text-slate-400">Ciclo do Plano:</span>
                      <span className="font-bold text-slate-900 dark:text-white capitalize">
                        {item.cycle === 'trimestral' ? 'Trimestral (3 meses)' : item.cycle}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-[11px] font-medium text-slate-400">Valor da Cobrança:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        R$ {item.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-[11px] font-medium text-slate-400">Data de Vencimento:</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {formatDateBR(item.dueDateStr)}
                      </span>
                    </div>

                    {item.customerPhone && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                        <span className="text-[11px] font-medium text-slate-400">WhatsApp:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.customerPhone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Ação do Card */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Botão de Cobrança WhatsApp (1-Clique) */}
                    <button
                      type="button"
                      onClick={() => handleOpenBillingModal(item.card)}
                      className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      title="Abrir gerador de mensagem de cobrança para WhatsApp"
                    >
                      <MessageCircle size={14} />
                      <span>Cobrar (1-Clique)</span>
                    </button>

                    {/* Botão Renovar +3 Meses */}
                    <button
                      type="button"
                      onClick={() => handleQuickRenew(item.card, item.cycle === 'mensal' ? 1 : item.cycle === 'anual' ? 12 : 3)}
                      className="w-full py-2 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Soma +3 meses ao vencimento e marca como renovado"
                    >
                      <RefreshCw size={13} />
                      <span>Renovar +{item.cycle === 'mensal' ? '1m' : item.cycle === 'anual' ? '1ano' : '3m'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item.card)}
                    className="w-full py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Configurar valor, data ou ciclo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: GERADOR & DISPARO DE COBRANÇA WHATSAPP (1-CLIQUE) */}
      {billingModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Cobrança WhatsApp — {billingModalCard.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mensagem personalizada com chave PIX e dados do cartão
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBillingModalCard(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Seleção do Tipo de Template */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selecione o Modelo de Mensagem:
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('pre_expiry')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedTemplate === 'pre_expiry'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🟡 Lembrete (5 a 7d antes)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('due_today')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedTemplate === 'due_today'
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-900 dark:text-sky-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  📅 Vence Hoje
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('post_expiry')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedTemplate === 'post_expiry'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🔴 Vencido / Cobrança
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('renewal_confirmed')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedTemplate === 'renewal_confirmed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ✅ Confirmação de Renovado
                </button>
              </div>
            </div>

            {/* Configuração Rápida da Chave PIX */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Chave PIX do Master:
                </label>
                <input
                  type="text"
                  value={customPixKey}
                  onChange={(e) => setCustomPixKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Nome do Titular PIX:
                </label>
                <input
                  type="text"
                  value={customPixHolder}
                  onChange={(e) => setCustomPixHolder(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Prévia do Texto da Mensagem */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Prévia do Texto para o Cliente:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const msg = generateWhatsAppMessage(billingModalCard, selectedTemplate);
                    navigator.clipboard.writeText(msg);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 3000);
                  }}
                  className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1"
                >
                  {copiedText ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={6}
                value={generateWhatsAppMessage(billingModalCard, selectedTemplate)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed resize-none focus:outline-none"
              />
            </div>

            {/* Botão de Disparo Direto */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBillingModalCard(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  const data = getCardBillingData(billingModalCard);
                  const msg = generateWhatsAppMessage(billingModalCard, selectedTemplate);
                  const phone = data.customerPhone || '';
                  const url = buildWhatsAppUrl(phone, msg);
                  window.open(url, '_blank', 'noopener,noreferrer');
                  setBillingModalCard(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Send size={15} />
                <span>Abrir WhatsApp do Cliente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIÇÃO DE PARÂMETROS FINANCEIROS */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center border border-sky-200 dark:border-sky-800">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Configuração Financeira — {editingCard.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ajuste o ciclo (3 meses), valor e data de vencimento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Ciclo do Plano */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ciclo de Cobrança / Mensalidade:
                </label>
                <select
                  value={editCycle}
                  onChange={(e) => {
                    const val = e.target.value as CardBillingCycle;
                    setEditCycle(val);
                    if (val === 'trimestral') setEditAmount(117.0);
                    if (val === 'mensal') setEditAmount(39.0);
                    if (val === 'semestral') setEditAmount(210.0);
                    if (val === 'anual') setEditAmount(348.0);
                    if (val === 'degustacao') setEditAmount(0.0);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="trimestral">Trimestral — 3 Meses (R$ 117,00 padrão)</option>
                  <option value="mensal">Mensal — 1 Mês (R$ 39,00)</option>
                  <option value="semestral">Semestral — 6 Meses (R$ 210,00)</option>
                  <option value="anual">Anual — 12 Meses (R$ 348,00)</option>
                  <option value="degustacao">Modo Degustação (Gratuito)</option>
                  <option value="vitalicio">Vitalício / Pago Único</option>
                </select>
              </div>

              {/* Valor do Plano */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Valor Cobrado (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Data do Vencimento:
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Nome do Contato & WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nome do Titular/Pagador:
                  </label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    WhatsApp para Cobrança:
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="15999999999"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Anotações Internas */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Anotações Internas (ex: pago em dinheiro, desconto concedido):
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ex: Cliente prefere pagar no dia 10..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveBilling}
                disabled={savingCard}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all cursor-pointer"
              >
                {savingCard ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{savingCard ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
