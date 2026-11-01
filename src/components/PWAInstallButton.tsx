import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PythonTheme } from '../types';
import { Download, CheckCircle2, Share, PlusSquare, Laptop, Smartphone, X } from 'lucide-react';

export const CIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="btnCTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#79AADB" />
        <stop offset="100%" stopColor="#427EBC" />
      </linearGradient>
      <linearGradient id="btnCLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0062AD" />
        <stop offset="100%" stopColor="#00477D" />
      </linearGradient>
      <linearGradient id="btnCRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00477D" />
        <stop offset="100%" stopColor="#002B4D" />
      </linearGradient>
    </defs>
    <polygon points="256,62 424,159 424,353 256,450 88,353 88,159" fill="none" stroke="#85B7EB" strokeWidth="6" strokeOpacity="0.6" />
    <polygon points="256,66 420,161 256,256 92,161" fill="url(#btnCTop)" />
    <polygon points="92,161 256,256 256,446 92,351" fill="url(#btnCLeft)" />
    <polygon points="256,256 420,161 420,351 256,446" fill="url(#btnCRight)" />
    <line x1="256" y1="66" x2="256" y2="256" stroke="#A5CDFA" strokeWidth="3" strokeOpacity="0.4" />
    <line x1="92" y1="161" x2="256" y2="256" stroke="#A5CDFA" strokeWidth="3" strokeOpacity="0.3" />
    <line x1="256" y1="256" x2="420" y2="161" stroke="#001F3B" strokeWidth="3" strokeOpacity="0.4" />
    <line x1="256" y1="256" x2="256" y2="446" stroke="#001F3B" strokeWidth="3" strokeOpacity="0.5" />
    <path
      d="M 334 186 C 316 164 290 150 256 150 C 198 150 152 196 152 256 C 152 316 198 362 256 362 C 290 362 316 348 334 326 L 302 292 C 290 306 274 314 256 314 C 224 314 198 288 198 256 C 198 224 224 198 256 198 C 274 198 290 206 302 220 Z"
      fill="#FFFFFF"
    />
  </svg>
);

// Backward-compatible alias
export const PythonIcon = CIcon;

interface PWAInstallButtonProps {
  activeTheme: PythonTheme;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  activeTheme,
  compact = false,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="group flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold border transition-all shadow-sm hover:opacity-95 active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
        style={{
          backgroundColor: isInstalled
            ? activeTheme.colors.tabInactiveBg
            : activeTheme.colors.accent,
          borderColor: activeTheme.colors.accent,
          color: isInstalled
            ? activeTheme.colors.textPrimary
            : activeTheme.colors.accentText,
        }}
        title={
          isInstalled
            ? "IDE C est installé en PWA (Cliquez pour voir les options)"
            : "Installer IDE C en tant qu'application autonome (PWA)"
        }
      >
        <div className="relative flex items-center justify-center shrink-0">
          <CIcon className="w-4 h-4 transition-transform group-hover:scale-110 drop-shadow-xs" />
          {isInstalled && (
            <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black" />
          )}
        </div>
        {isInstalled ? (
          <>
            {!compact && (
              <>
                <span className="hidden xl:inline">PWA C Installée</span>
                <span className="hidden sm:inline xl:hidden">PWA C</span>
              </>
            )}
          </>
        ) : (
          <>
            {!compact && (
              <>
                <span className="hidden xl:inline">Installer PWA C</span>
                <span className="hidden sm:inline xl:hidden">Installer PWA</span>
              </>
            )}
            <Download className="w-3 h-3 shrink-0 opacity-80" />
          </>
        )}
      </button>

      {/* Guide modal if browser didn't automatically trigger prompt or on iOS/Firefox */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-xl p-5 shadow-2xl border text-sm font-sans"
            style={{
              backgroundColor: activeTheme.colors.editorBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.textPrimary,
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: activeTheme.colors.border }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0 bg-[#111827]"
                  style={{ borderColor: '#00599C' }}
                >
                  <CIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Installer IDE C</h3>
                  <p className="text-xs opacity-75">Application Web Progressive (PWA)</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded hover:opacity-75 transition-opacity cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Icon Preview Card */}
              <div
                className="p-3 rounded-lg border text-xs flex items-center gap-3"
                style={{
                  backgroundColor: activeTheme.colors.tabInactiveBg,
                  borderColor: activeTheme.colors.border,
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#111827] border border-[#00599C]/60 shadow flex items-center justify-center shrink-0">
                  <CIcon className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-semibold text-xs">Icône PWA de l'application</div>
                  <p className="text-[11px] opacity-75 mt-0.5">
                    L'icône officielle C (bouclier hexagonal isométrique) s'affiche sur votre écran d'accueil, dock ou barre des tâches.
                  </p>
                </div>
              </div>

              {isInstalled ? (
                <div
                  className="p-3 rounded-lg border text-xs flex items-center gap-2"
                  style={{
                    backgroundColor: activeTheme.colors.tabInactiveBg,
                    borderColor: '#10b981',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    IDE C fonctionne déjà en mode PWA autonome sur cet appareil !
                  </span>
                </div>
              ) : (
                <p className="text-xs leading-relaxed opacity-90">
                  Installez IDE C sur votre appareil (PC, Mac, Android, iPad, iPhone) pour profiter du mode plein écran, d'une compilation ultra-rapide et de l'accès hors-ligne.
                </p>
              )}

              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs transition-all shadow-md active:scale-98 cursor-pointer"
                  style={{
                    backgroundColor: activeTheme.colors.accent,
                    color: activeTheme.colors.accentText,
                  }}
                >
                  <CIcon className="w-4 h-4 shrink-0" />
                  <span>Lancer l'installation directe</span>
                  <Download className="w-3.5 h-3.5 opacity-80" />
                </button>
              )}

              {/* Instructions per platform */}
              <div className="space-y-3 pt-1">
                {/* Android Chrome */}
                <div
                  className="p-3 rounded-lg border text-xs space-y-1.5"
                  style={{ backgroundColor: activeTheme.colors.tabInactiveBg, borderColor: activeTheme.colors.border }}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Sur Android (Google Chrome) :</span>
                  </div>
                  <p className="opacity-85 text-[11px] leading-relaxed">
                    Touchez les trois points verticaux <strong>⋮</strong> en haut à droite du navigateur, puis sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                  </p>
                </div>

                {/* Chrome / Edge Desktop */}
                <div
                  className="p-3 rounded-lg border text-xs space-y-1.5"
                  style={{ backgroundColor: activeTheme.colors.tabInactiveBg, borderColor: activeTheme.colors.border }}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Sur Chrome / Edge (Ordinateur) :</span>
                  </div>
                  <p className="opacity-85 text-[11px] leading-relaxed">
                    Cliquez sur l'icône d'installation <strong>⤓</strong> présente à droite dans la barre d'adresse du navigateur, ou ouvrez le menu <strong>⋮</strong> &gt; <strong>Installer IDE Python</strong>.
                  </p>
                </div>

                {/* iOS / iPadOS */}
                <div
                  className="p-3 rounded-lg border text-xs space-y-1.5"
                  style={{ backgroundColor: activeTheme.colors.tabInactiveBg, borderColor: activeTheme.colors.border }}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Sur iPhone & iPad (Safari) :</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 opacity-85 text-[11px] pl-1">
                    <li className="flex items-center gap-1">
                      <span>1. Touchez le bouton</span>
                      <Share className="w-3 h-3 inline text-sky-400" />
                      <span><strong>Partager</strong> dans Safari.</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span>2. Choisissez</span>
                      <PlusSquare className="w-3 h-3 inline text-sky-400" />
                      <span><strong>Sur l'écran d'accueil</strong>.</span>
                    </li>
                    <li>3. Validez avec <strong>Ajouter</strong> en haut à droite.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end" style={{ borderColor: activeTheme.colors.border }}>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded text-xs font-medium border hover:opacity-80 transition-opacity cursor-pointer"
                style={{
                  backgroundColor: activeTheme.colors.tabInactiveBg,
                  borderColor: activeTheme.colors.border,
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
