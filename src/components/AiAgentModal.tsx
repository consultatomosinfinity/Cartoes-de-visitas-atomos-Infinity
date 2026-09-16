import React from 'react';
import { ArrowLeft, ExternalLink, X } from 'lucide-react';
import { ParsedAiAgent } from '../../shared/digital-card-ai-agent.ts';

interface AiAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiAgentInfo: ParsedAiAgent | null;
  buttonText?: string;
  headerColor?: string;
}

export const AiAgentModal: React.FC<AiAgentModalProps> = ({
  isOpen,
  onClose,
  aiAgentInfo,
  buttonText = 'Atendente Virtual',
  headerColor = '#12375B',
}) => {
  if (!isOpen || !aiAgentInfo) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <header
        className="flex items-center gap-3 px-4 py-3 text-white shadow-md z-10 select-none"
        style={{ backgroundColor: headerColor }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Voltar ao cartão</span>
        </button>

        <span className="flex-1 truncate text-sm font-bold text-center">
          {buttonText || 'Atendente Virtual'}
        </span>

        <a
          href={aiAgentInfo.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
          title="Abrir em uma nova aba do navegador"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Nova aba</span>
        </a>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 w-full bg-slate-100 relative">
        <iframe
          src={aiAgentInfo.embedUrl}
          title={buttonText || 'Atendente Virtual'}
          className="w-full h-full border-none bg-white"
          allow="microphone; camera; fullscreen; geolocation; clipboard-write"
        />
      </div>
    </div>
  );
};
