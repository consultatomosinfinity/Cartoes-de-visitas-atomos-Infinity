import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Download,
  QrCode,
  Smartphone,
  Phone,
  MessageCircle,
  Mail,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Globe,
  Lock,
} from 'lucide-react';
import { DigitalCard } from '../types.ts';
import { DigitalCardQrCode } from '../components/DigitalCardQrCode.tsx';
import { DigitalCardLivePreview } from '../components/DigitalCardLivePreview.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';

interface DegustadorDeliveryPageProps {
  userSlug?: string;
}

export const DegustadorDeliveryPage: React.FC<DegustadorDeliveryPageProps> = ({ userSlug }) => {
  const [, params] = useRoute<{ slug: string }>('/degustador/:slug');
  const [, paramsDegustacao] = useRoute<{ slug: string }>('/degustacao/:slug');
  const slug = userSlug || params?.slug || paramsDegustacao?.slug || '';

  const [card, setCard] = useState<DigitalCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Identificador de cartão não informado.');
      return;
    }

    setLoading(true);
    setError(null);

    // Busca dados do cartão público
    fetch(`/api/cards/slug/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.status === 'pausado') {
          setError('Este cartão digital encontra-se pausado no momento pelo Administrador Master.');
          setCard(null);
          return;
        }

        if (json && json.data) {
          setCard(json.data);
        } else {
          // Fallback para lista completa
          fetch('/api/cards')
            .then((r) => (r.ok ? r.json() : []))
            .then((allCards: DigitalCard[]) => {
              const found = allCards.find((c) => c.slug === slug);
              if (found) {
                if (found.status === 'pausado') {
                  setError('Este cartão digital encontra-se pausado no momento pelo Administrador Master.');
                } else {
                  setCard(found);
                }
              } else {
                setError('Cartão digital não encontrado.');
              }
            })
            .catch(() => {
              setError('Erro ao carregar dados do cartão.');
            });
        }
      })
      .catch(() => {
        setError('Erro na conexão com o servidor.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const cardUrl = typeof window !== 'undefined' ? `${window.location.origin}/cartao/${slug}` : `https://consultatomosinfinity.com.br/cartao/${slug}`;
  const deliveryUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (!cardUrl) return;
    navigator.clipboard.writeText(cardUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const shareText = `Olá! 👋\nAqui está o meu Cartão Digital Interativo Átomos Infinity.\n\n🔗 Acesse diretamente pelo link:\n${cardUrl}\n\nToque para salvar meu contato e falar comigo instantaneamente!`;

  const handleCopyShareMessage = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const masterWhatsAppUrl = `https://wa.me/5515996259353?text=${encodeURIComponent(
    `Olá Jurandir (Master Átomos Infinity), sou titular do cartão digital (${card?.name || slug}) no Modo Degustação e gostaria de solicitar alterações / informações sobre planos.`
  )}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Carregando seu Cartão Digital...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold font-heading text-white mb-2">Acesso Temporariamente Indisponível</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {error || 'Não foi possível carregar as informações deste cartão digital.'}
          </p>
          <div className="space-y-3">
            <a
              href="https://wa.me/5515996259353?text=Ol%C3%A1%20Jurandir,%20preciso%20de%20suporte%20com%20meu%20cart%C3%A3o%20digital."
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
            >
              <MessageCircle size={16} />
              <span>Falar com o Master no WhatsApp</span>
            </a>
            <a
              href="/"
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Voltar à Página Inicial
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Barra de Topo Institucional */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              Á
            </div>
            <div>
              <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Átomos Infinity</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  Modo Degustação
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Portal de Acesso e Divulgação do Titular</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cartão Ativo
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Banner de Boas-vindas ao Titular */}
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400/40 text-amber-300 font-bold text-xl flex items-center justify-center shrink-0">
                  {card.name.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Seu Cartão Digital Interativo está Pronto!</span>
                </div>
                <h1 className="text-2xl font-black font-heading text-white">{card.name}</h1>
                <p className="text-xs text-slate-300">{card.jobTitle || 'Profissional'} • {card.brandName || 'Átomos Infinity'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={`/cartao/${card.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink size={15} />
                <span>Abrir Cartão Digital</span>
              </a>
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid de 2 Colunas: Links & QR Code + Prévia ao Vivo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Ações, Link e QR Code (7 colunas) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bloco 1: Link Direto do Cartão */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Globe size={16} className="text-sky-400" />
                <span>Seu Link Oficial de Compartilhamento</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Envie este link para clientes, contatos, bio do Instagram, LinkedIn ou assinaturas de e-mail.
              </p>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 pl-3">
                <input
                  type="text"
                  readOnly
                  value={cardUrl}
                  className="bg-transparent text-xs text-amber-300 font-mono flex-1 outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleCopyShareMessage}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition font-medium cursor-pointer"
                >
                  {copiedMessage ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedMessage ? 'Mensagem copiada para o WhatsApp!' : 'Copiar texto pronto para divulgação'}</span>
                </button>

                <a
                  href={`/cartao/${card.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-bold"
                >
                  <span>Testar link agora</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Bloco 2: QR Code de Alta Resolução */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <QrCode size={16} className="text-purple-400" />
                    <span>Seu QR Code Exclusivo</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Utilize para imprimir em adesivos, crachás, banners ou exibir na tela do celular.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80">
                <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 shrink-0">
                  <DigitalCardQrCode
                    slug={card.slug}
                    qrCodeStyle={card.qrCodeStyle || 'arredondado'}
                    foregroundColor={card.qrCodeForegroundColor || '#12375B'}
                    backgroundColor={card.qrCodeBackgroundColor || '#FFFFFF'}
                    frameStyle={card.qrCodeFrameStyle || 'none'}
                    frameText={card.qrCodeFrameText || 'SCAN ME'}
                    frameColor={card.qrCodeFrameColor || '#0F172A'}
                    frameTextColor={card.qrCodeFrameTextColor || '#FFFFFF'}
                    dotsStyle={card.qrCodeDotsStyle}
                    cornersSquareStyle={card.qrCodeCornersSquareStyle}
                    cornersSquareColor={card.qrCodeCornersSquareColor}
                    cornersDotStyle={card.qrCodeCornersDotStyle}
                    cornersDotColor={card.qrCodeCornersDotColor}
                    gradientEnabled={card.qrCodeGradientEnabled}
                    gradientType={card.qrCodeGradientType}
                    gradientStartColor={card.qrCodeGradientStartColor}
                    gradientEndColor={card.qrCodeGradientEndColor}
                    includeLogo={card.qrCodeIncludeLogo !== false}
                    logoUrl={card.companyLogoUrl || card.imageUrl}
                    size={180}
                    showDownloadButton={false}
                  />
                </div>

                <div className="space-y-3 w-full text-center sm:text-left">
                  <div>
                    <h3 className="text-xs font-bold text-white">Pronto para Divulgação</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Ao escanear com a câmera de qualquer smartphone, o cliente será direcionado instantaneamente para o seu cartão interativo.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const canvas = document.querySelector('canvas');
                        if (canvas) {
                          const a = document.createElement('a');
                          a.download = `qrcode-${card.slug}.png`;
                          a.href = canvas.toDataURL('image/png');
                          a.click();
                        } else {
                          window.open(`/cartao/${card.slug}?src=qr`, '_blank');
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Baixar QR Code (PNG em Alta)</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>Copiar Link do Cartão</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: Informações do Modo Degustação e Suporte */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Lock size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <span>Gestão Centralizada pelo Master</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Você está no <strong>Modo Degustação</strong>. Todas as alterações cadastrais (dados, telefones, fotos, cores, botões de redes sociais e status) são gerenciadas com segurança pela equipe técnica da <strong>Átomos Infinity</strong>.
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      Precisa atualizar seus dados ou contratar um plano definitivo?
                    </span>
                    <a
                      href={masterWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition self-start sm:self-auto shrink-0"
                    >
                      <MessageCircle size={14} />
                      <span>Falar com o Master</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Prévia ao Vivo do Cartão Digital (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full sticky top-20">
              <div className="flex items-center justify-between w-full mb-3 px-1">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Smartphone size={15} className="text-amber-400" />
                  <span>Prévia Interativa do seu Cartão</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Modo Smartphone</span>
              </div>

              <div className="bg-slate-900/60 p-4 sm:p-6 rounded-3xl border border-slate-800 flex justify-center shadow-2xl">
                <DigitalCardLivePreview card={card} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Átomos Infinity — Soluções Estratégicas em Cartões Digitais Inteligentes.</p>
          <div className="flex items-center gap-4">
            <a href={`/cartao/${card.slug}`} className="hover:text-amber-400 transition">Ver Cartão</a>
            <a href={masterWhatsAppUrl} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">Suporte Técnico</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
