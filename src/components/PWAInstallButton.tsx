import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PythonTheme } from '../types';
import { Download, CheckCircle2, Share, PlusSquare, Laptop, Smartphone, X } from 'lucide-react';

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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all shadow-sm hover:opacity-90 active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
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
            ? "IDE Python est installé en PWA (Cliquez pour voir les options)"
            : "Installer IDE Python en tant qu'application autonome (PWA)"
        }
      >
        {isInstalled ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            {!compact && (
              <>
                <span className="hidden xl:inline">PWA Installée</span>
                <span className="hidden sm:inline xl:hidden">PWA</span>
              </>
            )}
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 shrink-0 animate-bounce" />
            {!compact && (
              <>
                <span className="hidden xl:inline">Installer PWA</span>
                <span className="hidden sm:inline xl:hidden">Installer</span>
              </>
            )}
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
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: activeTheme.colors.accent, color: activeTheme.colors.accentText }}
                >
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Installer IDE Python</h3>
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
                    IDE Python fonctionne déjà en mode PWA autonome sur cet appareil !
                  </span>
                </div>
              ) : (
                <p className="text-xs leading-relaxed opacity-90">
                  Installez IDE Python sur votre appareil (PC, Mac, Android, iPad, iPhone) pour profiter du mode plein écran, d'une exécution ultra-rapide et de l'accès hors-ligne.
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
                  <Download className="w-4 h-4" />
                  Lancer l'installation directe
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
