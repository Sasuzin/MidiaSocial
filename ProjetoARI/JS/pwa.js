/* =========================================================
   Bem Social — PWA
   Registra o service worker e cuida do botão "Instalar app".
   ========================================================= */

(() => {
  'use strict';

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  const isIos = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let installPrompt = null;

  function showInstallButtons(show) {
    document.querySelectorAll('[data-install-app]').forEach((button) => {
      button.hidden = !show;
    });
  }

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((error) => {
        console.warn('Não foi possível ativar o modo offline:', error);
      });
    });
  }

  /* ---------- Instalação ---------- */
  // Chrome, Edge e Android avisam quando o app pode ser instalado
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    showInstallButtons(true);
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    showInstallButtons(false);
    UI.toast('Bem Social instalado! Procure o ícone na sua tela inicial.', { type: 'success', duration: 5000 });
  });

  // O iPhone não tem esse aviso: mostramos o botão com as instruções
  if (isIos() && !isStandalone()) showInstallButtons(true);

  document.addEventListener('click', async (event) => {
    if (!event.target.closest('[data-install-app]')) return;

    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      showInstallButtons(false);
    } else if (isIos()) {
      UI.toast('No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.', { duration: 7000 });
    }
  });
})();
