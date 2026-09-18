import React from 'react';
import { Route, Switch, useRoute } from 'wouter';
import { DigitalCardPublic } from './pages/DigitalCardPublic.tsx';
import { DigitalCardsManager } from './pages/DigitalCardsManager.tsx';
import { DegustadorDeliveryPage } from './pages/DegustadorDeliveryPage.tsx';
import { DeliveryModule } from './pages/DeliveryModule.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { HelpPage } from './pages/HelpPage.tsx';
import { ClientOnboardingFormPage } from './pages/ClientOnboardingFormPage.tsx';
import { ThemeToggle } from './components/ThemeToggle.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { AuthModal } from './components/AuthModal.tsx';

function PublicCardRoute() {
  const [, params] = useRoute<{ slug: string }>('/cartao/:slug');
  const slug = params ? params.slug : '';
  return <DigitalCardPublic slug={slug} />;
}

function DegustadorRoute() {
  return <DegustadorDeliveryPage />;
}

function ProtectedManagerRoute() {
  const { user, profile, isMaster, isDegustador, loading, isConfigured, signOut } = useAuth();
  const [userCardSlug, setUserCardSlug] = React.useState<string | null>(null);
  const [cardLoading, setCardLoading] = React.useState(false);

  React.useEffect(() => {
    if (user && isDegustador) {
      setCardLoading(true);
      fetch('/api/cards')
        .then((r) => (r.ok ? r.json() : []))
        .then((cards: any[]) => {
          const userCard = cards.find(
            (c) => String(c.userId) === String(user.id) || c.user_id === user.id || c.email === user.email
          );
          if (userCard?.slug) {
            setUserCardSlug(userCard.slug);
          }
        })
        .catch(() => {})
        .finally(() => setCardLoading(false));
    }
  }, [user, isDegustador]);

  if (loading || (isDegustador && cardLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se o Supabase está configurado e o usuário não está logado, exige autenticação
  if (isConfigured && !user) {
    return <AuthModal isStandalonePage={true} initialMode="login" />;
  }

  // Se a conta está aguardando aprovação do Master (status pausado)
  if (profile?.status === 'pausado' && !isMaster) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 p-8 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 text-2xl">
            ⏳
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold">
            Aguardando Aprovação
          </div>
          <h2 className="text-xl font-black font-heading text-white">Conta em Análise</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Seu cadastro foi realizado e está aguardando a liberação do <strong>Administrador Master</strong> (Jurandir Hora / Átomos Infinity).
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <a
              href={`https://wa.me/5515996259353?text=${encodeURIComponent(
                `Olá Jurandir, criei meu cadastro (${user?.email}) no Átomos Infinity e gostaria de solicitar a liberação do meu acesso ao painel.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Solicitar Liberação no WhatsApp</span>
            </a>
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se o usuário possui a função Degustador, bloquear o acesso ao painel de gerenciamento/edição
  if (isDegustador) {
    if (userCardSlug) {
      return <DegustadorDeliveryPage userSlug={userCardSlug} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-900 border border-purple-500/30 p-8 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30 text-2xl">
            🍷
          </div>
          <h2 className="text-xl font-black font-heading text-white">Modo Degustação</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sua conta está configurada como <strong>Degustador</strong>. Você não possui acesso ao painel de edição, pois a criação, personalização, pausas e status do seu cartão digital são gerenciados exclusivamente pelo <strong>Administrador Master</strong>.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <a
              href="https://wa.me/5515996259353?text=Ol%C3%A1%20Jurandir,%20sou%20usu%C3%A1rio%20Degustador%20e%20gostaria%20de%20receber%20o%20link%20do%20meu%20cart%C3%A3o%20digital."
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              Falar com o Master no WhatsApp
            </a>
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <DigitalCardsManager />;
}

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        {/* Rota pública do Cartão Digital por slug (Acesso Livre) */}
        <Route path="/cartao/:slug" component={PublicCardRoute} />

        {/* Página de Entrega / Modo Degustador (Acesso Rápido ao Cartão & QR Code sem edição) */}
        <Route path="/degustador/:slug" component={DegustadorRoute} />
        <Route path="/degustacao/:slug" component={DegustadorRoute} />

        {/* Formulário Simplificado de Captação para Vendedoras & Clientes */}
        <Route path="/formulario" component={ClientOnboardingFormPage} />
        <Route path="/formulario/:salesRep" component={ClientOnboardingFormPage} />
        <Route path="/solicitar-cartao" component={ClientOnboardingFormPage} />
        <Route path="/coleta" component={ClientOnboardingFormPage} />
        <Route path="/onboarding-cliente" component={ClientOnboardingFormPage} />

        {/* Novo Módulo: Kit de Entrega Rápida 1-Clique WhatsApp & Coleta Descomplicada */}
        <Route path="/entrega" component={DeliveryModule} />
        <Route path="/entrega/:slug" component={DeliveryModule} />
        <Route path="/onboarding" component={DeliveryModule} />
        <Route path="/vencimentos" component={DeliveryModule} />
        <Route path="/cobrancas" component={DeliveryModule} />
        <Route path="/financeiro" component={DeliveryModule} />

        {/* Rotas de Autenticação */}
        <Route path="/login">
          {() => <AuthModal isStandalonePage={true} initialMode="login" onSuccess={() => window.location.href = '/app'} />}
        </Route>
        <Route path="/cadastro">
          {() => <AuthModal isStandalonePage={true} initialMode="register" onSuccess={() => window.location.href = '/app'} />}
        </Route>
        <Route path="/recuperar-senha">
          {() => <AuthModal isStandalonePage={true} initialMode="reset" />}
        </Route>

        {/* Rotas Protegidas do Painel de Gestão e Criação de Cartões */}
        <Route path="/app" component={ProtectedManagerRoute} />
        <Route path="/admin" component={ProtectedManagerRoute} />
        <Route path="/painel/cartoes" component={ProtectedManagerRoute} />
        <Route path="/painel" component={ProtectedManagerRoute} />

        {/* Rotas de Ajuda e Documentação */}
        <Route path="/ajuda" component={HelpPage} />
        <Route path="/doc" component={HelpPage} />
        <Route path="/documentacao" component={HelpPage} />

        {/* Rota Inicial /: Landing Page Comercial / Institucional */}
        <Route path="/" component={LandingPage} />

        {/* Fallback 404 */}
        <Route>
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center transition-colors">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-heading">Página não encontrada</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">O endereço solicitado não existe.</p>
              <div className="flex items-center justify-center gap-2">
                <a
                  href="/"
                  className="inline-flex px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Página Inicial
                </a>
                <a
                  href="/app"
                  className="inline-flex px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Acessar Painel
                </a>
              </div>
            </div>
          </div>
        </Route>
      </Switch>
      <ThemeToggle />
    </AuthProvider>
  );
}
