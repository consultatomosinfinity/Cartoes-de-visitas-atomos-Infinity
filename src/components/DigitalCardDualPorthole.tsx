import React from 'react';

interface DigitalCardDualPortholeProps {
  imageUrl?: string;
  name: string;
  companyLogoUrl?: string;
  brandName?: string;
  frameScale?: number;
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
  companyLogoFocusX = 56,
  companyLogoFocusY = 67,
  borderColor = '#FFFFFF',
}) => {
  const scaleFraction = Math.max(0.7, Math.min(1.2, frameScale / 100));

  return (
    <div className="relative inline-block mx-auto mb-4 select-none">
      {/* Moldura circular principal (Foto do Colaborador) */}
      <div
        className="relative rounded-full p-1.5 shadow-xl transition-transform duration-300"
        style={{
          backgroundColor: borderColor,
          transform: `scale(${scaleFraction})`,
        }}
      >
        <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center border-2 border-slate-100/30">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback para iniciais
                (e.target as HTMLElement).style.display = 'none';
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
