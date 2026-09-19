import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { X, Copy, Check, QrCode, ShieldCheck, ArrowRight, Smartphone, Sparkles, Building2, User } from 'lucide-react';
import { PixIcon } from './PixIcon.tsx';
import { generatePixBrCodePayload, formatPixKeyForDisplay } from '../utils/pix.ts';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixKey: string;
  pixType?: string;
  pixBeneficiary?: string;
  pixCity?: string;
  cardName?: string;
  headerColor?: string;
}

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  isOpen,
  onClose,
  pixKey,
  pixType = 'telefone',
  pixBeneficiary,
  pixCity = 'Brasil',
  cardName,
  headerColor = '#0f766e',
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstanceRef = useRef<QRCodeStyling | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [activeTab, setActiveTab] = useState<'qrcode' | 'copiacola'>('qrcode');

  const beneficiaryName = pixBeneficiary?.trim() || cardName?.trim() || 'Titular do Cartão';
  const formattedKey = formatPixKeyForDisplay(pixKey, pixType);

  // Gera o Payload padrão BR Code EMV oficial do Banco Central
  const brCodePayload = generatePixBrCodePayload({
    pixKey,
    pixType,
    pixBeneficiary: beneficiaryName,
    pixCity: pixCity || 'Brasil',
  });

  useEffect(() => {
    if (!isOpen || !brCodePayload) return;

    // Inicializa o gerador de QR Code com o estilo moderno oficial PIX
    const qrCode = new QRCodeStyling({
      width: 220,
      height: 220,
      type: 'svg',
      data: brCodePayload,
      dotsOptions: {
        color: '#0f766e',
        type: 'rounded',
      },
      cornersSquareOptions: {
        color: '#134e4a',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#32BCAD',
        type: 'dot',
      },
      backgroundOptions: {
        color: '#FFFFFF',
      },
      margin: 6,
    });

    qrCodeInstanceRef.current = qrCode;

    // Renderiza o QR Code após o container estar montado no DOM
    const timer = setTimeout(() => {
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
        qrCode.append(qrRef.current);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, brCodePayload]);

  const handleCopyKey = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey.trim());
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyPayload = () => {
    if (!brCodePayload) return;
    navigator.clipboard.writeText(brCodePayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  if (!isOpen || !pixKey) return null;

  const pixTypeLabels: Record<string, string> = {
    telefone: 'Telefone Celular',
    email: 'E-mail',
    cpf: 'CPF',
    cnpj: 'CNPJ',
    aleatoria: 'Chave Aleatória (EVP)',
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div
          className="relative px-6 py-4 text-white flex items-center justify-between shadow-xs select-none"
          style={{ backgroundColor: headerColor || '#0f766e' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <PixIcon size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Pagar via PIX</h3>
              <p className="text-[11px] text-teal-100/80">Transferência rápida e instantânea</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer text-white"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas: QR Code vs Copia e Cola */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <QrCode size={14} />
            <span>QR Code PIX</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copiacola')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'copiacola'
                ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Smartphone size={14} />
            <span>PIX Copia e Cola</span>
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Dados do Favorecido */}
          <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-200">
              <User size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Titular / Favorecido:</span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 pl-5.5 mt-0.5 break-words">
              {beneficiaryName}
            </p>
            {pixType && (
              <div className="flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 pl-5.5 mt-1 font-medium">
                <span>Tipo de Chave:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {pixTypeLabels[pixType] || pixType}
                </span>
              </div>
            )}
          </div>

          {activeTab === 'qrcode' ? (
            /* Visualização do QR Code */
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200/80 inline-block">
                <div ref={qrRef} className="flex items-center justify-center" />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Abra o aplicativo do seu banco, escolha <strong>Pagar com PIX</strong> e aponte a câmera para o QR Code acima.
              </p>
            </div>
          ) : (
            /* Visualização do Código Copia e Cola */
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Código PIX (BR Code oficial):
                </label>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all max-h-28 overflow-y-auto leading-relaxed">
                  {brCodePayload}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {copiedPayload ? (
                  <>
                    <Check size={16} className="text-teal-200" />
                    <span>Código Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copiar Código PIX Copia e Cola</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Bloco da Chave PIX Individual com Botão de Copiar */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Chave PIX:</span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">1 Clique para copiar</span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="flex-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-100 truncate px-2">
                {formattedKey || pixKey}
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
                title="Copiar apenas a chave"
              >
                {copiedKey ? (
                  <>
                    <Check size={14} className="text-white" />
                    <span>Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck size={14} className="text-teal-600 dark:text-teal-400" />
          <span>Pagamento direto e seguro entre contas bancárias</span>
        </div>
      </div>
    </div>
  );
};
