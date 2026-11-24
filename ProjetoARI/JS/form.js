/* =========================================================
   Bem Social — login e cadastro
   ========================================================= */

(() => {
  'use strict';

  // Já está logado? Vai direto para a linha do tempo.
  if (Store.getSessionUser()) {
    window.location.replace('home.html');
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);

  UI.initThemeToggle($('#themeToggle'));

  /* ---------- Abas (Entrar / Criar conta) ---------- */
  const card = $('.auth-card');
  const tabs = { login: $('#tab-login'), register: $('#tab-register') };
  const panels = { login: $('#loginForm'), register: $('#registerForm') };
  const copy = {
    login: ['Bem-vindo de volta', 'Entre para ver sua linha do tempo.'],
    register: ['Crie sua conta', 'Leva menos de um minuto, prometemos.'],
  };

  function showTab(name, { focus = false } = {}) {
    card.dataset.active = name;
    for (const key of Object.keys(tabs)) {
      const active = key === name;
      tabs[key].setAttribute('aria-selected', String(active));
      tabs[key].tabIndex = active ? 0 : -1;
      panels[key].hidden = !active;
    }
    $('#authTitle').textContent = copy[name][0];
    $('#authSubtitle').textContent = copy[name][1];

    const panel = panels[name];
    panel.classList.remove('panel-enter');
    void panel.offsetWidth; // reinicia a animação
    panel.classList.add('panel-enter');

    if (focus) panel.querySelector('input').focus();
  }

  tabs.login.addEventListener('click', () => showTab('login'));
  tabs.register.addEventListener('click', () => showTab('register'));

  // Setas do teclado entre as abas
  $('.segmented').addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const next = card.dataset.active === 'login' ? 'register' : 'login';
    showTab(next);
    tabs[next].focus();
  });

  document.querySelectorAll('[data-go]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showTab(link.dataset.go, { focus: true });
    });
  });

  const startOnRegister = window.location.hash === '#cadastro' || Store.getUsers().length === 0;
  showTab(startOnRegister ? 'register' : 'login');

  /* ---------- Mostrar / ocultar senha ---------- */
  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    const input = document.getElementById(button.dataset.togglePassword);
    button.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
      button.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      button.setAttribute('aria-pressed', String(show));
    });
  });

  /* ---------- Estado visual dos campos ---------- */
  function setFieldState(input, state, message = '') {
    const field = input.closest('.field');
    field.classList.toggle('is-error', state === 'error');
    field.classList.toggle('is-success', state === 'success');
    field.querySelector('.field-msg').textContent = message;
    if (state === 'error') input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function shake(element) {
    element.classList.remove('shake');
    void element.offsetWidth;
    element.classList.add('shake');
  }

  function setLoading(button, label) {
    button.disabled = true;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${label}</span>`;
  }

  /* ---------- Regras de validação ---------- */
  const onlyDigits = (value) => value.replace(/\D/g, '');

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function isValidCPF(value) {
    const cpf = onlyDigits(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    const digit = (length) => {
      let sum = 0;
      for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
  }

  function isValidPhone(digits) {
    if (!/^[1-9]{2}/.test(digits)) return false; // DDD
    if (digits.length === 11) return digits[2] === '9'; // celular
    if (digits.length === 10) return /[2-5]/.test(digits[2]); // fixo
    return false;
  }

  function maskCPF(value) {
    return onlyDigits(value)
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function maskPhone(value) {
    const d = onlyDigits(value).slice(0, 11);
    if (!d) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  /* ---------- Cadastro ---------- */
  const reg = {
    username: $('#username'),
    email: $('#email'),
    password: $('#password'),
    confirm: $('#password-two'),
    cpf: $('#CPF'),
    phone: $('#telefone'),
  };

  // Cada regra devolve: '' (ok), uma mensagem de erro, ou null (campo opcional vazio)
  const validators = {
    username(value) {
      const name = value.trim();
      if (!name) return 'Preencha seu nome.';
      if (name.length < 3) return 'O nome precisa ter pelo menos 3 letras.';
      if (name.length > 50) return 'O nome pode ter no máximo 50 letras.';
      if (!/^\p{L}[\p{L}\s'.-]*$/u.test(name)) return 'Use apenas letras no nome.';
      return '';
    },
    email(value) {
      const email = value.trim();
      if (!email) return 'Preencha seu email.';
      if (email.length > 30) return 'O email pode ter no máximo 30 caracteres.';
      if (!isEmail(email)) return 'Digite um email válido, ex: nome@email.com';
      if (Store.findUserByEmail(email)) return 'Este email já está cadastrado.';
      return '';
    },
    password(value) {
      if (!value) return 'Crie uma senha.';
      if (value.length < 6) return 'Mínimo de 6 caracteres.';
      if (!/\p{Lu}/u.test(value)) return 'Inclua ao menos 1 letra maiúscula.';
      if (!/\d/.test(value)) return 'Inclua ao menos 1 número.';
      return '';
    },
    confirm(value) {
      if (!value) return 'Confirme sua senha.';
      if (value !== reg.password.value) return 'As senhas não coincidem.';
      return '';
    },
    cpf(value) {
      const digits = onlyDigits(value);
      if (!digits) return 'Preencha seu CPF.';
      if (digits.length < 11) return 'O CPF precisa ter 11 números.';
      if (!isValidCPF(digits)) return 'CPF inválido. Confira os números.';
      if (Store.getUsers().some((user) => onlyDigits(user.CPF || '') === digits)) return 'Este CPF já está cadastrado.';
      return '';
    },
    phone(value) {
      const digits = onlyDigits(value);
      if (!digits) return null;
      if (digits.length < 10) return 'Telefone incompleto.';
      if (!isValidPhone(digits)) return 'Telefone inválido.';
      return '';
    },
  };

  const touched = new Set();

  function validate(key) {
    const input = reg[key];
    const error = validators[key](input.value);
    if (error === null) {
      setFieldState(input, null);
      return true;
    }
    setFieldState(input, error ? 'error' : 'success', error);
    return !error;
  }

  const rules = {
    len: $('[data-rule="len"]'),
    upper: $('[data-rule="upper"]'),
    num: $('[data-rule="num"]'),
  };

  function updateRules() {
    const value = reg.password.value;
    rules.len.classList.toggle('is-met', value.length >= 6);
    rules.upper.classList.toggle('is-met', /\p{Lu}/u.test(value));
    rules.num.classList.toggle('is-met', /\d/.test(value));
  }

  reg.cpf.addEventListener('input', () => {
    reg.cpf.value = maskCPF(reg.cpf.value);
  });

  reg.phone.addEventListener('input', () => {
    reg.phone.value = maskPhone(reg.phone.value);
  });

  for (const [key, input] of Object.entries(reg)) {
    input.addEventListener('blur', () => {
      if (input.value || touched.has(key)) {
        touched.add(key);
        validate(key);
      }
    });

    input.addEventListener('input', () => {
      if (touched.has(key)) validate(key);
      if (key === 'password') {
        updateRules();
        if (touched.has('confirm')) validate('confirm');
      }
    });
  }

  panels.register.addEventListener('submit', (event) => {
    event.preventDefault();

    const keys = Object.keys(reg);
    keys.forEach((key) => touched.add(key));
    const allValid = keys.map(validate).every(Boolean);

    if (!allValid) {
      shake(card);
      panels.register.querySelector('.field.is-error input')?.focus();
      return;
    }

    const user = {
      username: reg.username.value.trim().replace(/\s+/g, ' '),
      email: reg.email.value.trim().toLowerCase(),
      password: reg.password.value,
      CPF: reg.cpf.value,
      telefone: reg.phone.value,
      createdAt: Date.now(),
    };

    Store.addUser(user);
    Store.login(user.email);

    setLoading(panels.register.querySelector('button[type="submit"]'), 'Criando sua conta…');
    UI.toast(`Conta criada! Bem-vindo(a), ${user.username.split(' ')[0]}.`, { type: 'success' });
    setTimeout(() => UI.navigate('home.html'), 800);
  });

  /* ---------- Login ---------- */
  const loginEmail = $('#loginEmail');
  const loginPassword = $('#loginPassword');

  [loginEmail, loginPassword].forEach((input) => {
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('is-error')) setFieldState(input, null);
    });
  });

  panels.login.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    let ok = true;

    if (!email) {
      setFieldState(loginEmail, 'error', 'Informe seu email.');
      ok = false;
    } else if (!isEmail(email)) {
      setFieldState(loginEmail, 'error', 'Email inválido.');
      ok = false;
    } else {
      setFieldState(loginEmail, null);
    }

    if (!password) {
      setFieldState(loginPassword, 'error', 'Informe sua senha.');
      ok = false;
    } else {
      setFieldState(loginPassword, null);
    }

    if (!ok) {
      shake(card);
      return;
    }

    const user = Store.findUserByEmail(email);
    if (!user || user.password !== password) {
      setFieldState(loginEmail, 'error', '');
      setFieldState(loginPassword, 'error', 'Email ou senha incorretos.');
      shake(card);
      loginPassword.select();
      return;
    }

    Store.login(user.email);
    setLoading(panels.login.querySelector('button[type="submit"]'), 'Entrando…');
    UI.toast(`Olá de novo, ${user.username.split(' ')[0]}!`, { type: 'success' });
    setTimeout(() => UI.navigate('home.html'), 600);
  });
})();
