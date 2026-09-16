import React from 'react';
import { Route, Switch, useRoute } from 'wouter';
import { DigitalCardPublic } from './pages/DigitalCardPublic.tsx';
import { DigitalCardsManager } from './pages/DigitalCardsManager.tsx';
import { ThemeToggle } from './components/ThemeToggle.tsx';

function PublicCardRoute() {
  const [, params] = useRoute<{ slug: string }>('/cartao/:slug');
  const slug = params ? params.slug : '';
  return <DigitalCardPublic slug={slug} />;
}

export default function App() {
  return (
    <>
      <Switch>
        {/* Rota pública do Cartão Digital por slug */}
        <Route path="/cartao/:slug" component={PublicCardRoute} />

        {/* Painel de Gestão e Criação de Cartões */}
        <Route path="/painel/cartoes" component={DigitalCardsManager} />
        <Route path="/painel" component={DigitalCardsManager} />

        {/* Rota Inicial /: Painel com Pré-visualização e lista de cartões */}
        <Route path="/" component={DigitalCardsManager} />

        {/* Fallback 404 */}
        <Route>
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center transition-colors">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-heading">Página não encontrada</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">O endereço solicitado não existe.</p>
              <a
                href="/painel/cartoes"
                className="inline-flex px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Voltar ao Painel
              </a>
            </div>
          </div>
        </Route>
      </Switch>
      <ThemeToggle />
    </>
  );
}
