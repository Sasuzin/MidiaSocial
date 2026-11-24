/* =========================================================
   Bem Social — linha do tempo
   ========================================================= */

(() => {
  'use strict';

  const user = Store.getSessionUser();
  if (!user) {
    window.location.replace('form.html');
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const { icon } = UI;

  const MAX_CHARS = 2000;
  const MB = 1024 * 1024;

  const MEDIA = {
    image: {
      label: 'Foto',
      icon: 'image',
      types: ['image/jpeg', 'image/png'],
      extensions: /\.(jpe?g|png)$/i,
      accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
      maxSize: 15 * MB,
      error: 'Escolha uma imagem no formato JPG ou PNG.',
    },
    video: {
      label: 'Vídeo',
      icon: 'video',
      types: ['video/mp4'],
      extensions: /\.mp4$/i,
      accept: '.mp4,video/mp4',
      maxSize: 100 * MB,
      error: 'Escolha um vídeo no formato MP4.',
    },
    audio: {
      label: 'Áudio',
      icon: 'music',
      types: ['audio/mpeg', 'audio/mp3'],
      extensions: /\.mp3$/i,
      accept: '.mp3,audio/mpeg',
      maxSize: 30 * MB,
      error: 'Escolha um áudio no formato MP3.',
    },
    drawing: { label: 'Desenho', icon: 'palette' },
  };

  const FILTERS = [
    { key: 'all', label: 'Tudo', icon: 'layers' },
    { key: 'text', label: 'Textos', icon: 'type' },
    { key: 'image', label: 'Fotos', icon: 'image' },
    { key: 'video', label: 'Vídeos', icon: 'video' },
    { key: 'audio', label: 'Áudios', icon: 'music' },
    { key: 'drawing', label: 'Desenhos', icon: 'palette' },
  ];

  const els = {
    posts: $('#posts'),
    empty: $('#emptyState'),
    emptyTitle: $('#emptyTitle'),
    emptyText: $('#emptyText'),
    feedCount: $('#feedCount'),
    feedSubtitle: $('#feedSubtitle'),
    form: $('#postForm'),
    text: $('#postText'),
    hint: $('#composerHint'),
    publish: $('#publishBtn'),
    meter: $('#charMeter'),
    ringFill: $('#ringFill'),
    charLeft: $('#charLeft'),
    attachment: $('#attachment'),
    fileInput: $('#fileInput'),
    locationBtn: $('#locationBtn'),
    locationPill: $('#locationPill'),
    locationText: $('#locationText'),
    stats: { posts: $('#statPosts'), drawings: $('#statDrawings'), likes: $('#statLikes') },
  };

  const state = {
    posts: [],
    filter: 'all',
    attachment: null, // { kind, blob, name, url }
    location: null, // { lat, lng }
    publishing: false,
  };

  const mediaUrls = new Map();

  /* =========================================================
     Perfil, topo e tema
     ========================================================= */
  const firstName = user.username.split(' ')[0];

  UI.paintAvatar($('#chipAvatar'), user.username, user.email);
  UI.paintAvatar($('#profileAvatar'), user.username, user.email);
  UI.paintAvatar($('#composerAvatar'), user.username, user.email);
  $('#chipName').textContent = user.username;
  $('#profileName').textContent = user.username;
  $('#profileEmail').textContent = user.email;
  els.text.placeholder = `No que você está pensando, ${firstName}?`;

  UI.initThemeToggle($('#themeToggle'));

  $('#logoutBtn').addEventListener('click', () => {
    Store.logout();
    UI.navigate('form.html');
  });

  /* =========================================================
     Utilidades
     ========================================================= */
  const kindOf = (post) => (post.media ? post.media.kind : 'text');
  const matchesFilter = (post) => state.filter === 'all' || kindOf(post) === state.filter;

  const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const UNITS = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  function timeAgo(timestamp) {
    const seconds = (timestamp - Date.now()) / 1000;
    if (Math.abs(seconds) < 45) return 'agora mesmo';
    for (const [unit, size] of UNITS) {
      if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
    }
    return relative.format(-1, 'minute');
  }

  const fullDate = (timestamp) =>
    new Date(timestamp).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

  function formatCoords({ lat, lng }) {
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lng >= 0 ? 'L' : 'O';
    return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
  }

  const mapLink = ({ lat, lng }) =>
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  function mediaUrl(post) {
    if (!mediaUrls.has(post.id)) mediaUrls.set(post.id, URL.createObjectURL(post.media.blob));
    return mediaUrls.get(post.id);
  }

  function releaseMediaUrl(id) {
    if (mediaUrls.has(id)) {
      URL.revokeObjectURL(mediaUrls.get(id));
      mediaUrls.delete(id);
    }
  }

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* =========================================================
     Editor de publicação
     ========================================================= */
  function autosize() {
    els.text.style.height = 'auto';
    els.text.style.height = `${els.text.scrollHeight}px`;
  }

  function updateComposer() {
    const raw = els.text.value;
    const content = raw.trim();
    const length = raw.length;

    // medidor de caracteres
    els.meter.hidden = length === 0;
    const remaining = MAX_CHARS - length;
    const circumference = 62.832;
    els.ringFill.style.strokeDashoffset = String(circumference * (1 - Math.min(length / MAX_CHARS, 1)));
    els.meter.classList.toggle('is-warn', remaining <= 200);
    els.meter.classList.toggle('is-full', remaining <= 0);
    els.charLeft.textContent = remaining <= 200 ? String(remaining) : '';
    els.meter.title = `${length} de ${MAX_CHARS} caracteres`;

    // só espaços não vale como texto
    els.hint.hidden = !(raw.length > 0 && content.length === 0);

    const hasContent = content.length > 0 || state.attachment !== null;
    els.publish.disabled = state.publishing || !hasContent || content.length > MAX_CHARS;
  }

  els.text.addEventListener('input', () => {
    autosize();
    updateComposer();
  });

  // Ctrl + Enter publica
  els.text.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !els.publish.disabled) {
      els.form.requestSubmit();
    }
  });

  /* ---------- Anexos ---------- */
  function setAttachment(attachment) {
    clearAttachment({ keepDrawing: true });
    attachment.url = URL.createObjectURL(attachment.blob);
    state.attachment = attachment;
    renderAttachment();
    updateComposer();
  }

  function clearAttachment({ keepDrawing = false } = {}) {
    const current = state.attachment;
    if (!current) return;
    URL.revokeObjectURL(current.url);
    state.attachment = null;
    if (current.kind === 'drawing' && !keepDrawing) DrawingStudio.reset();
    renderAttachment();
    updateComposer();
  }

  function renderAttachment() {
    const box = els.attachment;
    const attachment = state.attachment;
    box.className = 'attachment';
    box.replaceChildren();

    if (!attachment) {
      box.hidden = true;
      return;
    }

    const config = MEDIA[attachment.kind];
    box.classList.add(`is-${attachment.kind}`);

    if (attachment.kind === 'image' || attachment.kind === 'drawing') {
      const img = new Image();
      img.src = attachment.url;
      img.alt = attachment.kind === 'drawing' ? 'Pré-visualização do seu desenho' : 'Pré-visualização da foto';
      box.append(img);
    } else if (attachment.kind === 'video') {
      const video = document.createElement('video');
      video.src = attachment.url;
      video.controls = true;
      video.playsInline = true;
      box.append(video);
    } else {
      box.append(buildAudioTile(attachment.url, attachment.name));
    }

    const bar = document.createElement('div');
    bar.className = 'attachment-bar';
    bar.innerHTML = `
      <span class="glass-pill">${icon(config.icon)}${config.label}</span>
      <div class="attachment-actions">
        ${attachment.kind === 'drawing' ? `<button class="glass-pill" type="button" data-action="edit">${icon('pencil')}Editar</button>` : ''}
        <button class="glass-pill" type="button" data-action="remove" aria-label="Remover anexo">${icon('x')}Remover</button>
      </div>`;
    box.append(bar);
    box.hidden = false;
  }

  els.attachment.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'remove') clearAttachment();
    if (button.dataset.action === 'edit') DrawingStudio.open();
  });

  document.querySelectorAll('[data-media]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.media;
      els.fileInput.accept = MEDIA[kind].accept;
      els.fileInput.dataset.kind = kind;
      els.fileInput.value = '';
      els.fileInput.click();
    });
  });

  els.fileInput.addEventListener('change', () => {
    const file = els.fileInput.files[0];
    if (!file) return;
    const config = MEDIA[els.fileInput.dataset.kind];

    const validType = config.types.includes(file.type) || config.extensions.test(file.name);
    if (!validType) {
      UI.toast(config.error, { type: 'error' });
      return;
    }
    if (file.size > config.maxSize) {
      UI.toast(`Arquivo muito grande. O limite é de ${config.maxSize / MB} MB.`, { type: 'error' });
      return;
    }

    setAttachment({ kind: els.fileInput.dataset.kind, blob: file, name: file.name });
    els.text.focus();
  });

  /* ---------- Desenho ---------- */
  document.querySelectorAll('[data-open-drawing]').forEach((button) => {
    button.addEventListener('click', () => DrawingStudio.open());
  });

  DrawingStudio.onSave((blob) => {
    const isUpdate = state.attachment && state.attachment.kind === 'drawing';
    setAttachment({ kind: 'drawing', blob, name: 'desenho.png' });
    els.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => els.text.focus({ preventScroll: true }), 250);
    UI.toast(isUpdate ? 'Desenho atualizado!' : 'Desenho anexado! Escreva uma legenda e publique.', {
      type: 'success',
    });
  });

  /* ---------- Localização ---------- */
  function renderLocation() {
    const has = state.location !== null;
    els.locationPill.hidden = !has;
    els.locationBtn.setAttribute('aria-pressed', String(has));
    if (has) els.locationText.textContent = formatCoords(state.location);
  }

  els.locationBtn.addEventListener('click', () => {
    if (state.location) {
      state.location = null;
      renderLocation();
      return;
    }
    if (!('geolocation' in navigator)) {
      UI.toast('Seu navegador não oferece localização.', { type: 'error' });
      return;
    }

    els.locationBtn.classList.add('is-loading');
    els.locationBtn.disabled = true;
    const done = () => {
      els.locationBtn.classList.remove('is-loading');
      els.locationBtn.disabled = false;
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.location = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        };
        renderLocation();
        done();
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Permissão de localização negada pelo navegador.'
            : 'Não foi possível obter sua localização agora.';
        UI.toast(message, { type: 'error' });
        done();
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });

  $('#locationRemove').addEventListener('click', () => {
    state.location = null;
    renderLocation();
  });

  /* ---------- Publicar ---------- */
  function resetComposer() {
    els.text.value = '';
    autosize();
    clearAttachment({ keepDrawing: true });
    state.location = null;
    renderLocation();
    updateComposer();
  }

  function setPublishing(on) {
    state.publishing = on;
    els.publish.innerHTML = on
      ? '<span class="spinner" aria-hidden="true"></span><span>Publicando…</span>'
      : `<span>Publicar</span>${icon('send')}`;
    updateComposer();
  }

  els.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.publishing) return;

    const text = els.text.value.trim();
    const attachment = state.attachment;

    if (!text && !attachment) {
      UI.toast('Escreva algo ou adicione uma mídia para publicar.', { type: 'error' });
      return;
    }
    if (text.length > MAX_CHARS) {
      UI.toast(`O texto pode ter no máximo ${MAX_CHARS} caracteres.`, { type: 'error' });
      return;
    }

    const post = {
      id: Store.createId(),
      author: { email: user.email, name: user.username },
      text,
      media: attachment ? { kind: attachment.kind, blob: attachment.blob, name: attachment.name || '' } : null,
      location: state.location,
      likes: [],
      createdAt: Date.now(),
    };

    setPublishing(true);
    try {
      await Store.savePost(post);
    } catch (error) {
      console.error(error);
      UI.toast('Não foi possível publicar. Tente novamente.', { type: 'error' });
      setPublishing(false);
      return;
    }

    if (attachment && attachment.kind === 'drawing') DrawingStudio.reset();
    state.posts.unshift(post);
    resetComposer();
    setPublishing(false);

    if (matchesFilter(post)) {
      insertNewPost(post);
    } else {
      // o filtro atual esconderia o post novo: volta para "Tudo"
      setFilter('all', { animate: false });
      els.posts.querySelector(`[data-id="${post.id}"]`)?.classList.replace('no-anim', 'is-new');
    }
    updateCounts();
    UI.toast('Publicado na sua linha do tempo!', { type: 'success' });
  });

  /* =========================================================
     Linha do tempo
     ========================================================= */
  function buildAudioTile(url, name) {
    const tile = document.createElement('div');
    tile.className = 'audio-tile';
    tile.innerHTML = `
      <div class="audio-art">${icon('music')}</div>
      <div class="audio-info">
        <strong></strong>
        <audio controls preload="metadata"></audio>
      </div>`;
    tile.querySelector('strong').textContent = name || 'Áudio';
    tile.querySelector('audio').src = url;
    return tile;
  }

  function buildMedia(post) {
    const { kind, name } = post.media;
    const url = mediaUrl(post);
    const figure = document.createElement('figure');
    figure.className = `post-media post-media--${kind}`;

    if (kind === 'image' || kind === 'drawing') {
      const img = new Image();
      img.src = url;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = kind === 'drawing' ? `Desenho feito por ${post.author.name}` : `Foto publicada por ${post.author.name}`;
      figure.append(img);
      if (kind === 'drawing') {
        const badge = document.createElement('span');
        badge.className = 'glass-pill media-badge is-drawing';
        badge.innerHTML = `${icon('palette')}Desenho`;
        figure.append(badge);
      }
    } else if (kind === 'video') {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      figure.append(video);
    } else if (kind === 'audio') {
      figure.append(buildAudioTile(url, name));
    }
    return figure;
  }

  function buildPost(post, { index = 0, mode = 'list' } = {}) {
    const li = document.createElement('li');
    li.className = 'post card';
    li.dataset.id = post.id;
    if (mode === 'new') li.classList.add('is-new');
    else if (mode === 'static') li.classList.add('no-anim');
    else li.style.setProperty('--i', Math.min(index, 8));

    const own = post.author.email === user.email;
    const liked = post.likes.includes(user.email);
    const downloadable = post.media && (post.media.kind === 'drawing' || post.media.kind === 'image');

    li.innerHTML = `
      <header class="post-head">
        <span class="avatar avatar-lg"></span>
        <div class="post-meta">
          <strong class="post-author"></strong>
          <div class="post-sub">
            <time></time>
          </div>
        </div>
        ${own ? `<button class="btn-icon post-delete" type="button" aria-label="Excluir publicação" title="Excluir">${icon('trash')}</button>` : ''}
      </header>
      <footer class="post-actions">
        <button class="action action-like${liked ? ' is-liked' : ''}" type="button" aria-pressed="${liked}">
          ${icon('heart')}<span class="like-label"></span>
        </button>
      </footer>`;

    UI.paintAvatar(li.querySelector('.avatar'), post.author.name, post.author.email);

    const author = li.querySelector('.post-author');
    author.textContent = post.author.name;
    if (own) author.insertAdjacentHTML('beforeend', '<span class="post-you">você</span>');

    const time = li.querySelector('time');
    time.dateTime = new Date(post.createdAt).toISOString();
    time.dataset.ts = post.createdAt;
    time.textContent = timeAgo(post.createdAt);
    time.title = fullDate(post.createdAt);

    if (post.location) {
      const sub = li.querySelector('.post-sub');
      sub.insertAdjacentHTML('beforeend', '<span class="dot" aria-hidden="true"></span>');
      const link = document.createElement('a');
      link.className = 'post-location';
      link.href = mapLink(post.location);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = 'Ver no mapa';
      link.innerHTML = `${icon('map-pin')}<span></span>`;
      link.querySelector('span').textContent = formatCoords(post.location);
      sub.append(link);
    }

    const header = li.querySelector('.post-head');
    let anchor = header;
    if (post.text) {
      const p = document.createElement('p');
      p.className = 'post-text';
      p.textContent = post.text;
      anchor.after(p);
      anchor = p;
    }
    if (post.media) anchor.after(buildMedia(post));

    updateLikeButton(li.querySelector('.action-like'), post);

    if (downloadable) {
      const download = document.createElement('a');
      download.className = 'action';
      download.href = mediaUrl(post);
      download.download =
        post.media.kind === 'drawing' ? `bem-social-desenho-${post.id.slice(0, 8)}.png` : post.media.name || 'foto';
      download.innerHTML = `${icon('download')}<span>Baixar</span>`;
      li.querySelector('.post-actions').append(download);
    }

    return li;
  }

  function updateLikeButton(button, post) {
    const liked = post.likes.includes(user.email);
    const count = post.likes.length;
    button.classList.toggle('is-liked', liked);
    button.setAttribute('aria-pressed', String(liked));
    button.setAttribute('aria-label', `${liked ? 'Descurtir' : 'Curtir'} · ${plural(count, 'curtida', 'curtidas')}`);
    button.querySelector('.like-label').textContent = count > 0 ? String(count) : 'Curtir';
  }

  function renderFeed({ animate = true } = {}) {
    const visible = state.posts.filter(matchesFilter);
    els.posts.replaceChildren(
      ...visible.map((post, index) => buildPost(post, { index, mode: animate ? 'list' : 'static' }))
    );
    updateEmptyState(visible.length);
  }

  function insertNewPost(post) {
    els.posts.prepend(buildPost(post, { mode: 'new' }));
    updateEmptyState(els.posts.children.length);
  }

  function updateEmptyState(visibleCount) {
    els.empty.hidden = visibleCount > 0;
    if (visibleCount > 0) return;
    if (state.filter === 'all') {
      els.emptyTitle.textContent = 'Sua linha do tempo está vazia';
      els.emptyText.textContent = 'Que tal estrear com um texto — ou com um desenho feito por você?';
    } else {
      const filter = FILTERS.find((f) => f.key === state.filter);
      els.emptyTitle.textContent = `Nenhuma publicação em “${filter.label}”`;
      els.emptyText.textContent = 'Quando alguém publicar algo desse tipo, vai aparecer aqui.';
    }
  }

  function bump(element, value) {
    if (element.textContent === String(value)) return;
    element.textContent = value;
    element.classList.remove('bump');
    void element.offsetWidth;
    element.classList.add('bump');
  }

  function updateCounts() {
    const mine = state.posts.filter((post) => post.author.email === user.email);
    bump(els.stats.posts, mine.length);
    bump(els.stats.drawings, mine.filter((post) => kindOf(post) === 'drawing').length);
    bump(els.stats.likes, mine.reduce((sum, post) => sum + post.likes.length, 0));

    const counts = { all: state.posts.length };
    state.posts.forEach((post) => {
      const kind = kindOf(post);
      counts[kind] = (counts[kind] || 0) + 1;
    });
    document.querySelectorAll('.filter-count').forEach((badge) => {
      badge.textContent = counts[badge.dataset.count] || 0;
    });

    const visible = state.posts.filter(matchesFilter).length;
    els.feedCount.textContent = plural(visible, 'publicação', 'publicações');
    els.feedCount.hidden = visible === 0;
  }

  /* ---------- Filtros ---------- */
  function renderFilters() {
    document.querySelectorAll('[data-filter-list]').forEach((container) => {
      container.innerHTML = FILTERS.map(
        (filter) => `
        <button class="filter" type="button" data-filter="${filter.key}" aria-pressed="${filter.key === state.filter}">
          ${icon(filter.icon)}<span>${filter.label}</span><span class="filter-count" data-count="${filter.key}">0</span>
        </button>`
      ).join('');
    });
  }

  function setFilter(key, { animate = true } = {}) {
    state.filter = key;
    document.querySelectorAll('[data-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === key));
    });
    const filter = FILTERS.find((f) => f.key === key);
    els.feedSubtitle.textContent = key === 'all' ? 'Mais recentes primeiro' : `Mostrando: ${filter.label.toLowerCase()}`;
    renderFeed({ animate });
    updateCounts();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (button && button.dataset.filter !== state.filter) setFilter(button.dataset.filter);
  });

  /* ---------- Curtir e excluir ---------- */
  els.posts.addEventListener('click', (event) => {
    const item = event.target.closest('.post');
    if (!item) return;
    const post = state.posts.find((p) => p.id === item.dataset.id);
    if (!post) return;

    if (event.target.closest('.action-like')) toggleLike(post, event.target.closest('.action-like'));
    else if (event.target.closest('.post-delete')) removePost(post, item);
  });

  async function toggleLike(post, button) {
    const index = post.likes.indexOf(user.email);
    const liking = index === -1;
    if (liking) post.likes.push(user.email);
    else post.likes.splice(index, 1);

    updateLikeButton(button, post);
    if (liking) {
      button.classList.remove('pop');
      void button.offsetWidth;
      button.classList.add('pop');
    }
    updateCounts();

    try {
      await Store.savePost(post);
    } catch (error) {
      console.error(error);
      if (liking) post.likes.splice(post.likes.indexOf(user.email), 1);
      else post.likes.push(user.email);
      updateLikeButton(button, post);
      updateCounts();
      UI.toast('Não foi possível salvar a curtida.', { type: 'error' });
    }
  }

  function animateOut(element) {
    if (UI.reducedMotion() || !element.animate) return Promise.resolve();
    const height = element.offsetHeight;
    element.style.overflow = 'hidden';
    return element
      .animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.96)' },
        ],
        { duration: 180, easing: 'ease-in', fill: 'forwards' }
      )
      .finished.then(
        () =>
          element.animate(
            [
              { height: `${height}px`, marginBottom: '16px', paddingTop: getComputedStyle(element).paddingTop, paddingBottom: getComputedStyle(element).paddingBottom },
              { height: '0px', marginBottom: '0px', paddingTop: '0px', paddingBottom: '0px' },
            ],
            { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
          ).finished
      );
  }

  async function removePost(post, element) {
    try {
      await Store.deletePost(post.id);
    } catch (error) {
      console.error(error);
      UI.toast('Não foi possível excluir a publicação.', { type: 'error' });
      return;
    }

    state.posts = state.posts.filter((p) => p.id !== post.id);
    updateCounts();
    await animateOut(element);
    element.remove();
    releaseMediaUrl(post.id);
    updateEmptyState(els.posts.children.length);

    UI.toast('Publicação excluída.', {
      duration: 6000,
      action: {
        label: 'Desfazer',
        onClick: async () => {
          try {
            await Store.savePost(post);
          } catch (error) {
            console.error(error);
            UI.toast('Não foi possível restaurar.', { type: 'error' });
            return;
          }
          state.posts.push(post);
          state.posts.sort((a, b) => b.createdAt - a.createdAt);
          renderFeed({ animate: false });
          updateCounts();
          const restored = els.posts.querySelector(`[data-id="${post.id}"]`);
          if (restored) {
            restored.classList.remove('no-anim');
            restored.classList.add('is-new');
          }
        },
      },
    });
  }

  /* ---------- Estado vazio ---------- */
  $('#emptyWrite').addEventListener('click', () => {
    if (state.filter !== 'all') setFilter('all');
    els.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    els.text.focus({ preventScroll: true });
  });

  /* ---------- Tempo relativo sempre atualizado ---------- */
  setInterval(() => {
    els.posts.querySelectorAll('time[data-ts]').forEach((time) => {
      time.textContent = timeAgo(Number(time.dataset.ts));
    });
  }, 30000);

  /* =========================================================
     Início
     ========================================================= */
  renderFilters();
  updateComposer();

  Store.getPosts()
    .then((posts) => {
      state.posts = posts;
      renderFeed();
      updateCounts();
    })
    .catch((error) => {
      console.error(error);
      UI.toast('Não foi possível carregar as publicações deste navegador.', { type: 'error' });
      renderFeed();
      updateCounts();
    });
})();
