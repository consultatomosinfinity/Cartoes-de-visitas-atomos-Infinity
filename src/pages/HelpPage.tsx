import React, { useState, useEffect } from 'react';
import { HelpCenterModal, DOC_ARTICLES } from '../components/HelpCenterModal.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import { BookOpen, Search, ArrowLeft, ArrowRight, Layers, HelpCircle, Sparkles, MessageSquare } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Verifica se há parâmetro ?artigo= na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const artigo = params.get('artigo');
    if (artigo) {
      setSelectedArticleId(artigo);
      setModalOpen(true);
    }
  }, []);

  const filteredArticles = DOC_ARTICLES.filter((art) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      art.title.toLowerCase().includes(q) ||
      art.description.toLowerCase().includes(q) ||
      art.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleOpenArticle = (id: string) => {
    setSelectedArticleId(id);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-bold transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Início</span>
            </a>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                <BookOpen size={16} />
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white font-heading">
                Central de Ajuda Átomos Infinity
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/app"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Layers size={14} />
              <span className="hidden sm:inline">Acessar Painel</span>
            </a>
            <ThemeToggle variant="header" />
          </div>
        </div>
      </header>

      {/* Hero da Central de Ajuda com Busca */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-sky-50/50 via-white to-slate-50 dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800">
            <Sparkles size={14} />
            <span>Documentação Oficial e Tutoriais em .md</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
            Como podemos ajudar você hoje?
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Aprenda a criar cartões digitais profissionais, configurar Atendente Virtual com IA, personalizar QR Code e acompanhar métricas de leads.
          </p>

          {/* Barra de Busca Proeminente */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o assunto que deseja aprender (ex: QR Code, WhatsApp, Foto, PIX, IA)..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-lg shadow-sky-500/5 focus:outline-hidden focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Grid de Guias e Artigos */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={18} className="text-sky-600" />
            <span>Artigos e Manuais Disponíveis ({filteredArticles.length})</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Arquivos armazenados na pasta <strong>/doc</strong>
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 max-w-md mx-auto">
            <HelpCircle size={40} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Nenhum artigo encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Não encontramos resultados para "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArticles.map((art) => {
              const Icon = art.icon;
              return (
                <div
                  key={art.id}
                  onClick={() => handleOpenArticle(art.id)}
                  className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/10 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                        {art.filename}
                      </span>
                    </div>

                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      {art.category}
                    </span>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 mb-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {art.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {art.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
                    <span>Ler guia completo</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Banner de Atendimento e Suporte Humano */}
        <section className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-900 to-indigo-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-black">Precisa de suporte personalizado para sua empresa?</h3>
            <p className="text-xs sm:text-sm text-sky-200 max-w-xl">
              Nossa equipe de consultoria da Átomos Infinity pode auxiliar na configuração dos seus cartões, logomarcas e treinamento de IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="https://wa.me/5515996259353?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20cart%C3%A3o%20digital"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-md"
            >
              <MessageSquare size={16} />
              <span>WhatsApp de Suporte</span>
            </a>
            <a
              href="/app"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
            >
              <Layers size={16} />
              <span>Ir para o Painel</span>
            </a>
          </div>
        </section>
      </main>

      {/* Modal Interativo com Leitor e Busca */}
      <HelpCenterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialArticleId={selectedArticleId}
      />
    </div>
  );
};
