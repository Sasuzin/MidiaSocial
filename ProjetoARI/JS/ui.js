/* =========================================================
   Bem Social — utilitários de interface
   (ícones, avatares, toasts, tema e transição de página)
   ========================================================= */

const UI = (() => {
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function icon(name, className = '') {
    return `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  /* ---------- Avatares ---------- */
  function hueFrom(text) {
    let hash = 0;
    for (const char of String(text)) hash = (hash * 31 + char.codePointAt(0)) % 360;
    return hash;
  }

  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  function paintAvatar(element, name, seed) {
    element.textContent = initials(name);
    element.style.setProperty('--hue', hueFrom(seed || name));
    element.setAttribute('aria-hidden', 'true');
  }

  /* ---------- Toasts ---------- */
  function toast(message, { type = 'info', action = null, duration = 3800 } = {}) {
    let region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.append(region);
    }

    const iconName = { success: 'check-circle', error: 'alert-circle' }[type] || 'info';
    const element = document.createElement('div');
    element.className = `toast toast-${type}`;
    element.setAttribute('role', type === 'error' ? 'alert' : 'status');
    element.innerHTML = `${icon(iconName)}<span class="toast-text"></span>`;
    element.querySelector('.toast-text').textContent = message;

    let timer = null;
    const dismiss = () => {
      clearTimeout(timer);
      if (element.classList.contains('is-leaving')) return;
      element.classList.add('is-leaving');
      setTimeout(() => element.remove(), reducedMotion() ? 0 : 260);
    };

    if (action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'toast-action';
      button.textContent = action.label;
      button.addEventListener('click', () => {
        action.onClick();
        dismiss();
      });
      element.append(button);
    }

    region.append(element);
    timer = setTimeout(dismiss, duration);
    return dismiss;
  }

  /* ---------- Navegação com fade ---------- */
  function navigate(url) {
    document.body.classList.add('is-leaving');
    setTimeout(() => window.location.assign(url), reducedMotion() ? 0 : 230);
  }

  /* ---------- Tema claro / escuro ---------- */
  function currentTheme() {
    const forced = document.documentElement.dataset.theme;
    if (forced) return forced;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function initThemeToggle(button) {
    if (!button) return;
    const sync = () => {
      const dark = currentTheme() === 'dark';
      button.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
      const label = dark ? 'Usar tema claro' : 'Usar tema escuro';
      button.setAttribute('aria-label', label);
      button.title = label;
    };

    button.addEventListener('click', () => {
      const apply = () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem('tema', next);
        } catch {
          /* sem armazenamento: o tema vale só para esta página */
        }
        sync();
      };
      if (document.startViewTransition && !reducedMotion()) document.startViewTransition(apply);
      else apply();
    });

    sync();
  }

  return { icon, hueFrom, initials, paintAvatar, toast, navigate, initThemeToggle, reducedMotion };
})();
