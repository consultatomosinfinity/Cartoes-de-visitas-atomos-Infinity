import React from 'react';
import { Route, Switch, useRoute } from 'wouter';
import { DigitalCardPublic } from './pages/DigitalCardPublic.tsx';
import { DigitalCardsManager } from './pages/DigitalCardsManager.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { ThemeToggle } from './components/ThemeToggle.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { AuthModal } from './components/AuthModal.tsx';

function PublicCardRoute() {
  const [, params] = useRoute<{ slug: string }>('/cartao/:slug');
  const slug = params ? params.slug : '';
  return <DigitalCardPublic slug={slug} />;
}

function ProtectedManagerRoute() {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
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

  return <DigitalCardsManager />;
}

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        {/* Rota pública do Cartão Digital por slug (Acesso Livre) */}
        <Route path="/cartao/:slug" component={PublicCardRoute} />

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
