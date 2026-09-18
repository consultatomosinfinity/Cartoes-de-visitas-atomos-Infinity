import React, { useState } from 'react';

// Avatar padrão de alta simpatia e elegância profissional: gato cartoon de gravata
export const DEFAULT_AVATAR_URL = '/default-cat-avatar.jpg';

interface DigitalCardDualPortholeProps {
  imageUrl?: string;
  name: string;
  companyLogoUrl?: string;
  brandName?: string;
  frameScale?: number;
  imageFocusX?: number;
  imageFocusY?: number;
  companyLogoFocusX?: number;
  companyLogoFocusY?: number;
  borderColor?: string;
}

export const DigitalCardDualPorthole: React.FC<DigitalCardDualPortholeProps> = ({
  imageUrl,
  name,
  companyLogoUrl,
  brandName,
  frameScale = 97,
  imageFocusX = 50,
  imageFocusY = 50,
  companyLogoFocusX = 56,
  companyLogoFocusY = 67,
  borderColor = '#FFFFFF',
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const scaleFraction = Math.max(0.7, Math.min(1.2, frameScale / 100));
  const effectiveImageUrl = imageUrl && imageUrl.trim() ? imageUrl.trim() : DEFAULT_AVATAR_URL;

  return (
    <div className="relative inline-block mx-auto mb-4 select-none">
      {/* Moldura circular principal (Foto do Colaborador / Avatar Padrão) */}
      <div
        className="relative rounded-full p-1.5 shadow-xl transition-transform duration-300"
        style={{
          backgroundColor: borderColor,
          transform: `scale(${scaleFraction})`,
        }}
      >
        <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center border-2 border-slate-100/30">
          {!imageLoadError ? (
            <img
              src={effectiveImageUrl}
              alt={name || 'Avatar'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${imageFocusX}% ${imageFocusY}%`,
              }}
              onError={() => {
                if (effectiveImageUrl !== DEFAULT_AVATAR_URL) {
                  // Tenta o avatar padrão do gato de gravata antes de desistir
                  setImageLoadError(false);
                } else {
                  setImageLoadError(true);
                }
              }}
            />
          ) : (
            <span className="text-3xl font-bold text-slate-500 uppercase font-heading">
              {name ? name.slice(0, 2) : 'CD'}
            </span>
          )}
        </div>
      </div>

      {/* Segundo Porthole: Logo da Empresa sobreposto no canto inferior direito */}
      {companyLogoUrl && (
        <div
          className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full p-0.5 shadow-lg border-2 z-10 overflow-hidden flex items-center justify-center bg-white"
          style={{
            borderColor: borderColor,
          }}
          title={brandName || 'Logo da empresa'}
        >
          <img
            src={companyLogoUrl}
            alt={brandName || 'Logo'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full"
            style={{
              objectPosition: `${companyLogoFocusX}% ${companyLogoFocusY}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};
