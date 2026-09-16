import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { Download, Scan, Smartphone, ClipboardList, Camera, Sparkles } from 'lucide-react';
import {
  QrCodeStyle,
  QrCodeDotsStyle,
  QrCodeCornersSquareStyle,
  QrCodeCornersDotStyle,
  QrCodeFrameStyle,
} from '../types.ts';

interface DigitalCardQrCodeProps {
  slug: string;
  qrCodeStyle?: QrCodeStyle;
  foregroundColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  size?: number;
  showDownloadButton?: boolean;

  // Personalizações avançadas (Moldura, Forma, Cores e Logo)
  frameStyle?: QrCodeFrameStyle;
  frameText?: string;
  frameColor?: string;
  frameTextColor?: string;
  dotsStyle?: QrCodeDotsStyle;
  cornersSquareStyle?: QrCodeCornersSquareStyle;
  cornersSquareColor?: string;
  cornersDotStyle?: QrCodeCornersDotStyle;
  cornersDotColor?: string;
  gradientEnabled?: boolean;
  gradientType?: 'linear' | 'radial';
  gradientStartColor?: string;
  gradientEndColor?: string;
  transparentBg?: boolean;
  includeLogo?: boolean;
  logoSize?: number;
}

export const DigitalCardQrCode: React.FC<DigitalCardQrCodeProps> = ({
  slug,
  qrCodeStyle = 'quadrado',
  foregroundColor = '#12375B',
  backgroundColor = '#FFFFFF',
  logoUrl,
  size = 220,
  showDownloadButton = true,

  frameStyle = 'none',
  frameText = 'SCAN ME',
  frameColor = '#0F172A',
  frameTextColor = '#FFFFFF',
  dotsStyle,
  cornersSquareStyle,
  cornersSquareColor,
  cornersDotStyle,
  cornersDotColor,
  gradientEnabled = false,
  gradientType = 'linear',
  gradientStartColor,
  gradientEndColor,
  transparentBg = false,
  includeLogo = true,
  logoSize = 0.22,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const targetUrl = `${origin}/cartao/${slug}?src=qr`;

    const moduleStyle = dotsStyle || (
      qrCodeStyle === 'arredondado' ? 'rounded' : qrCodeStyle === 'pontilhado' ? 'dots' : 'square'
    );
    const cornerSquare = cornersSquareStyle || (qrCodeStyle === 'quadrado' ? 'square' : 'extra-rounded');
    const cornerDot = cornersDotStyle || (qrCodeStyle === 'quadrado' ? 'square' : 'dot');

    const dotsOptions: any = {
      type: moduleStyle,
    };

    if (gradientEnabled) {
      dotsOptions.gradient = {
        type: gradientType || 'linear',
        rotation: 45,
        colorStops: [
          { offset: 0, color: gradientStartColor || foregroundColor },
          { offset: 1, color: gradientEndColor || '#1A7FBE' },
        ],
      };
    } else {
      dotsOptions.color = foregroundColor;
    }

    const cornersSquareOptions: any = {
      type: cornerSquare,
      color: cornersSquareColor || foregroundColor,
    };

    const cornersDotOptions: any = {
      type: cornerDot,
      color: cornersDotColor || foregroundColor,
    };

    const bgOptions: any = {
      color: transparentBg ? 'transparent' : (backgroundColor || '#FFFFFF'),
    };

    const activeLogo = includeLogo ? (logoUrl || undefined) : undefined;

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: targetUrl,
      margin: 8,
      qrOptions: {
        errorCorrectionLevel: activeLogo ? 'H' : 'M',
      },
      image: activeLogo,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 4,
        imageSize: logoSize,
        hideBackgroundDots: true,
      },
      dotsOptions,
      cornersSquareOptions,
      cornersDotOptions,
      backgroundOptions: bgOptions,
    });

    setQrCodeInstance(qr);

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qr.append(qrRef.current);
      setIsReady(true);
    }
  }, [
    slug,
    qrCodeStyle,
    foregroundColor,
    backgroundColor,
    logoUrl,
    size,
    dotsStyle,
    cornersSquareStyle,
    cornersSquareColor,
    cornersDotStyle,
    cornersDotColor,
    gradientEnabled,
    gradientType,
    gradientStartColor,
    gradientEndColor,
    transparentBg,
    includeLogo,
    logoSize,
  ]);

  const handleDownload = (format: 'svg' | 'png') => {
    if (qrCodeInstance) {
      qrCodeInstance.download({
        name: `qr-cartao-${slug}`,
        extension: format,
      });
    }
  };

  const displayText = frameText?.trim() || 'SCAN ME';
  const effectiveFrameColor = frameColor || foregroundColor || '#0F172A';
  const effectiveFrameTextColor = frameTextColor || '#FFFFFF';

  // Renderizador com a moldura selecionada
  const renderQrWithFrame = () => {
    switch (frameStyle) {
      case 'badge_bottom':
        return (
          <div
            className="flex flex-col items-center p-3 rounded-2xl border-2 shadow-md transition-all max-w-[280px]"
            style={{
              borderColor: effectiveFrameColor,
              backgroundColor: transparentBg ? 'transparent' : '#FFFFFF',
            }}
          >
            <div ref={qrRef} className="flex items-center justify-center" />
            <div
              className="mt-2 px-4 py-1 rounded-full text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm"
              style={{
                backgroundColor: effectiveFrameColor,
                color: effectiveFrameTextColor,
              }}
            >
              <Scan size={12} />
              <span>{displayText}</span>
            </div>
          </div>
        );

      case 'badge_top':
        return (
          <div
            className="flex flex-col items-center p-3 rounded-2xl border-2 shadow-md transition-all max-w-[280px]"
            style={{
              borderColor: effectiveFrameColor,
              backgroundColor: transparentBg ? 'transparent' : '#FFFFFF',
            }}
          >
            <div
              className="mb-2 px-4 py-1 rounded-full text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm"
              style={{
                backgroundColor: effectiveFrameColor,
                color: effectiveFrameTextColor,
              }}
            >
              <Scan size={12} />
              <span>{displayText}</span>
            </div>
            <div ref={qrRef} className="flex items-center justify-center" />
          </div>
        );

      case 'phone':
        return (
          <div
            className="relative flex flex-col items-center pt-5 pb-4 px-3 rounded-[32px] border-4 shadow-xl max-w-[270px]"
            style={{
              borderColor: effectiveFrameColor,
              backgroundColor: effectiveFrameColor,
            }}
          >
            {/* Câmera / notch superior */}
            <div className="absolute top-2 w-14 h-1.5 bg-black/40 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900/80 mr-4" />
            </div>

            {/* Tela do celular com o QR Code */}
            <div
              className="rounded-2xl p-2 shadow-inner border border-slate-100 flex items-center justify-center"
              style={{ backgroundColor: transparentBg ? 'transparent' : '#FFFFFF' }}
            >
              <div ref={qrRef} className="flex items-center justify-center" />
            </div>

            {/* Badge de ação na base do telefone */}
            <div
              className="mt-3 px-3.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: effectiveFrameTextColor,
              }}
            >
              <Smartphone size={11} />
              <span>{displayText}</span>
            </div>
          </div>
        );

      case 'clipboard':
        return (
          <div
            className="relative flex flex-col items-center pt-7 pb-3 px-3 rounded-2xl border-2 shadow-lg max-w-[280px]"
            style={{
              borderColor: effectiveFrameColor,
              backgroundColor: `${effectiveFrameColor}15`,
            }}
          >
            {/* Presilha de metal superior */}
            <div
              className="absolute -top-3 px-4 py-1 rounded-md border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"
              style={{
                backgroundColor: effectiveFrameColor,
                color: effectiveFrameTextColor,
                borderColor: effectiveFrameColor,
              }}
            >
              <ClipboardList size={11} />
              <span>{displayText}</span>
            </div>

            {/* Folha de papel branca */}
            <div
              className="rounded-xl p-2.5 bg-white shadow-sm border border-slate-200 flex items-center justify-center"
            >
              <div ref={qrRef} className="flex items-center justify-center" />
            </div>
          </div>
        );

      case 'polaroid':
        return (
          <div
            className="flex flex-col items-center pt-3 px-3 pb-4 bg-white rounded-xl shadow-md border border-slate-200 max-w-[270px]"
          >
            <div
              className="p-1 rounded-lg border border-slate-100 flex items-center justify-center"
              style={{ backgroundColor: transparentBg ? 'transparent' : '#FFFFFF' }}
            >
              <div ref={qrRef} className="flex items-center justify-center" />
            </div>
            <div className="mt-2.5 text-center">
              <span
                className="text-xs font-black tracking-wider uppercase"
                style={{ color: effectiveFrameColor }}
              >
                {displayText}
              </span>
            </div>
          </div>
        );

      case 'circular':
        return (
          <div
            className="relative flex flex-col items-center p-3 rounded-full border-4 shadow-lg transition-all"
            style={{
              borderColor: effectiveFrameColor,
              backgroundColor: transparentBg ? 'transparent' : '#FFFFFF',
            }}
          >
            <div ref={qrRef} className="flex items-center justify-center" />
            <div
              className="absolute -bottom-2 px-3.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md flex items-center gap-1"
              style={{
                backgroundColor: effectiveFrameColor,
                color: effectiveFrameTextColor,
              }}
            >
              <Camera size={11} />
              <span>{displayText}</span>
            </div>
          </div>
        );

      case 'none':
      default:
        return (
          <div
            className="p-3 rounded-2xl shadow-inner border transition-all duration-200"
            style={{ backgroundColor: transparentBg ? 'transparent' : backgroundColor }}
          >
            <div ref={qrRef} className="flex items-center justify-center" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2">
      {renderQrWithFrame()}

      {showDownloadButton && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownload('svg')}
            disabled={!isReady}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            title="Download formato vetor SVG (alta definição)"
          >
            <Download size={13} />
            <span>SVG</span>
          </button>
          <button
            type="button"
            onClick={() => handleDownload('png')}
            disabled={!isReady}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            title="Download formato imagem PNG"
          >
            <Download size={13} />
            <span>PNG</span>
          </button>
        </div>
      )}
    </div>
  );
};
