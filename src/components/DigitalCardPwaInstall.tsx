import React, { useEffect, useState } from 'react';
import { Smartphone, X, Share, MoreVertical, Check, ExternalLink, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface DigitalCardPwaInstallProps {
  appName?: string;
  iconUrl?: string;
  buttonClassName?: string;
  style?: React.CSSProperties;
  isSimulator?: boolean;
  onInstallClick?: () => void;
}

export const DigitalCardPwaInstall: React.FC<DigitalCardPwaInstallProps> = ({
  appName = 'Cartão Digital',
  iconUrl,
  buttonClassName,
  style,
  isSimulator = false,
  onInstallClick,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  useEffect(() => {
    // Detecta se já está rodando em modo standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone && !isSimulator) {
      setIsInstalled(true);
      return;
    }

    // Detecta iOS (iPhone / iPad / iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isSimulator]);

  const handleInstallClick = async () => {
    if (onInstallClick) {
      onInstallClick();
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error('Erro ao acionar instalação PWA:', err);
      }
      setDeferredPrompt(null);
    } else {
      // Abre modal informativo com orientações para Android, iOS e Computador
      setShowInstructionsModal(true);
    }
  };

  // Se já está instalado e não é o simulador, não precisa mostrar
  if (isInstalled && !isSimulator) {
    return null;
  }

  const defaultClasses =
    'w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-[0.99] transition-all cursor-pointer';

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={buttonClassName || defaultClasses}
        style={style}
        title={`Instalar "${appName}" no celular`}
      >
        <Smartphone size={isSimulator ? 14 : 18} className="shrink-0" />
        <span className="truncate">
          Instalar {appName ? `"${appName}" no celular` : 'no celular'}
        </span>
      </button>

      {/* Modal Interativo com Instruções de Instalação */}
      {showInstructionsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowInstructionsModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-slate-800 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setShowInstructionsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do App */}
            <div className="flex items-center gap-3 pr-6">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={appName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Smartphone size={24} />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate">
                  {appName}
                </h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Check size={12} className="text-emerald-600" />
                  <span>Aplicativo Web Rápido (PWA)</span>
                </p>
              </div>
            </div>

            {/* Instruções por Plataforma */}
            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Adicione à tela inicial do seu celular para acessar rapidamente como um aplicativo:
              </p>

              {/* Guia Android */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>No Android (Chrome / Samsung):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                  <li>
                    Toque nos <span className="font-semibold text-slate-800">3 pontinhos (⋮)</span> no topo do navegador
                  </li>
                  <li>
                    Selecione <span className="font-bold text-slate-900">"Instalar aplicativo"</span> ou <span className="font-bold text-slate-900">"Adicionar à tela inicial"</span>
                  </li>
                </ol>
              </div>

              {/* Guia iOS */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  <span>No iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                  <li>
                    Toque no botão <span className="font-semibold text-slate-800">Compartilhar</span> (ícone quadrado com seta para cima no rodapé)
                  </li>
                  <li>
                    Role para baixo e toque em <span className="font-bold text-slate-900">"Adicionar à Tela de Início"</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Botão Entendi */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer text-center shadow-xs"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
