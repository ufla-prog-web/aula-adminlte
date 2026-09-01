(() => {
  'use strict';

  const qs = (selector, parent = document) => parent.querySelector(selector);
  const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const isMobile = () => window.matchMedia('(max-width: 991.98px)').matches;

  function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('casasegura-theme', theme);
    qsa('[data-theme-icon]').forEach((icon) => {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    });
    window.dispatchEvent(new CustomEvent('casasegura:themechange', { detail: theme }));
  }

  window.showToast = function (message, type = 'success', title = 'CasaSegura') {
    const container = qs('#toastContainer');
    if (!container) return;
    const iconMap = { success: 'check-circle-fill', danger: 'x-circle-fill', warning: 'exclamation-triangle-fill', info: 'info-circle-fill' };
    const toast = document.createElement('div');
    toast.className = 'toast border-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
      <div class="toast-header">
        <i class="bi bi-${iconMap[type] || iconMap.info} text-${type} me-2"></i>
        <strong class="me-auto">${title}</strong>
        <small>agora</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fechar"></button>
      </div>
      <div class="toast-body">${message}</div>`;
    container.appendChild(toast);
    const instance = bootstrap.Toast.getOrCreateInstance(toast, { delay: 3800 });
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
    instance.show();
  };

  function initLayout() {
    qsa('[data-ui-toggle="sidebar"]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        if (isMobile()) document.body.classList.toggle('sidebar-open');
        else document.body.classList.toggle('sidebar-collapse');
      });
    });

    qs('#sidebarOverlay')?.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
    window.addEventListener('resize', () => {
      if (!isMobile()) document.body.classList.remove('sidebar-open');
    });

    qsa('[data-ui-treeview]').forEach((toggle) => {
      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        toggle.closest('.nav-item')?.classList.toggle('menu-open');
      });
    });

    qsa('.nav-treeview .nav-link.active').forEach((link) => link.closest('.nav-item.menu-tree')?.classList.add('menu-open'));

    qsa('[data-ui-toggle="theme"]').forEach((button) => {
      button.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    });

    qsa('[data-ui-toggle="fullscreen"]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
          else await document.exitFullscreen();
        } catch (_) {
          showToast('O navegador não permitiu ativar o modo de tela cheia.', 'warning');
        }
      });
    });

    qsa('[data-current-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
    qsa('[data-current-time]').forEach((el) => {
      const update = () => { el.textContent = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }); };
      update();
      setInterval(update, 1000);
    });
  }

  function initLogin() {
    const form = qs('#loginForm');
    if (!form) return;
    const password = qs('#password');
    qs('#togglePassword')?.addEventListener('click', () => {
      password.type = password.type === 'password' ? 'text' : 'password';
      qs('#togglePassword i').className = password.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      const button = qs('button[type="submit"]', form);
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';
      localStorage.setItem('casasegura-session', 'demo');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 550);
    });
  }

  function canvasColors() {
    const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    return {
      grid: dark ? 'rgba(255,255,255,.11)' : 'rgba(15,23,42,.11)',
      text: dark ? '#adb5bd' : '#6c757d',
      line: '#0d6efd',
      line2: '#dc3545',
      fill: dark ? 'rgba(13,110,253,.14)' : 'rgba(13,110,253,.12)',
      bars: ['#0d6efd', '#6f42c1', '#198754', '#f0ad4e', '#dc3545']
    };
  }

  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(300, Math.floor(rect.width * ratio));
    canvas.height = Math.max(220, Math.floor(rect.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  function drawLineChart(canvas, labels, values, secondary = null) {
    const { ctx, width, height } = setupCanvas(canvas);
    const colors = canvasColors();
    const pad = { left: 42, right: 18, top: 18, bottom: 36 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    const all = secondary ? values.concat(secondary) : values;
    const max = Math.max(...all, 5);
    const ceiling = Math.ceil(max / 5) * 5;
    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px system-ui, sans-serif';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (chartH * i / 5);
      ctx.strokeStyle = colors.grid;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(ceiling - ceiling * i / 5)), pad.left - 8, y + 4);
    }
    labels.forEach((label, i) => {
      const x = pad.left + chartW * i / (labels.length - 1);
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.fillText(label, x, height - 12);
    });
    const plot = (data, stroke, fill = null) => {
      const points = data.map((value, i) => ({
        x: pad.left + chartW * i / (data.length - 1),
        y: pad.top + chartH - (value / ceiling) * chartH
      }));
      if (fill) {
        ctx.beginPath(); ctx.moveTo(points[0].x, pad.top + chartH);
        points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, pad.top + chartH); ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
      }
      ctx.beginPath();
      points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      points.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fillStyle = stroke; ctx.fill(); });
    };
    plot(values, colors.line, colors.fill);
    if (secondary) plot(secondary, colors.line2);
  }

  function drawBarChart(canvas, labels, values) {
    const { ctx, width, height } = setupCanvas(canvas);
    const colors = canvasColors();
    const pad = { left: 42, right: 18, top: 18, bottom: 52 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    const ceiling = Math.ceil(Math.max(...values, 5) / 5) * 5;
    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px system-ui, sans-serif';
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + chartH * i / 5;
      ctx.strokeStyle = colors.grid; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
      ctx.fillStyle = colors.text; ctx.textAlign = 'right'; ctx.fillText(String(Math.round(ceiling - ceiling * i / 5)), pad.left - 8, y + 4);
    }
    const slot = chartW / values.length;
    const barW = Math.min(54, slot * .55);
    values.forEach((value, i) => {
      const x = pad.left + slot * i + (slot - barW) / 2;
      const barH = value / ceiling * chartH;
      const y = pad.top + chartH - barH;
      ctx.fillStyle = colors.bars[i % colors.bars.length];
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, 6); else ctx.rect(x, y, barW, barH);
      ctx.fill();
      ctx.fillStyle = colors.text; ctx.textAlign = 'center';
      const words = labels[i].split(' ');
      words.slice(0, 2).forEach((word, line) => ctx.fillText(word, x + barW / 2, height - 28 + line * 13));
      ctx.fillText(String(value), x + barW / 2, y - 7);
    });
  }

  function initCharts() {
    const render = () => {
      const events = qs('#eventsChart');
      if (events) drawLineChart(events, ['00h','02h','04h','06h','08h','10h','12h'], [2,1,1,3,7,9,5], [0,0,0,1,1,2,1]);
      const report = qs('#reportChart');
      if (report) drawBarChart(report, ['Quedas confirmadas','Falsos positivos','Movimento','Temperatura','Portas'], [7,11,28,15,9]);
      const detail = qs('#detailChart');
      if (detail) drawLineChart(detail, ['08h','09h','10h','11h','12h','13h','14h'], [21.5,21.8,22.1,22.0,22.4,22.8,22.6]);
    };
    let timer;
    const delayed = () => { clearTimeout(timer); timer = setTimeout(render, 100); };
    window.addEventListener('resize', delayed);
    window.addEventListener('casasegura:themechange', delayed);
    render();
  }

  function initDeviceTable() {
    const tbody = qs('#deviceTableBody');
    if (!tbody) return;
    const rows = () => qsa('tr', tbody);
    const search = qs('#deviceSearch');
    const status = qs('#deviceStatus');
    const type = qs('#deviceType');
    const room = qs('#deviceRoom');
    const pageInfo = qs('#devicePageInfo');
    const prev = qs('#devicePrev');
    const next = qs('#deviceNext');
    const empty = qs('#deviceEmpty');
    let page = 1;
    const perPage = 5;

    const filteredRows = () => rows().filter((row) => {
      const text = row.textContent.toLowerCase();
      return text.includes((search.value || '').toLowerCase())
        && (!status.value || row.dataset.status === status.value)
        && (!type.value || row.dataset.type === type.value)
        && (!room.value || row.dataset.room === room.value);
    });

    const render = () => {
      const filtered = filteredRows();
      const pages = Math.max(1, Math.ceil(filtered.length / perPage));
      page = Math.min(page, pages);
      rows().forEach((row) => row.classList.add('d-none'));
      filtered.slice((page - 1) * perPage, page * perPage).forEach((row) => row.classList.remove('d-none'));
      pageInfo.textContent = `Página ${page} de ${pages} • ${filtered.length} registro(s)`;
      prev.disabled = page <= 1;
      next.disabled = page >= pages;
      empty.classList.toggle('d-none', filtered.length !== 0);
    };

    [search, status, type, room].forEach((control) => control?.addEventListener(control === search ? 'input' : 'change', () => { page = 1; render(); }));
    prev.addEventListener('click', () => { if (page > 1) { page--; render(); } });
    next.addEventListener('click', () => { page++; render(); });

    const deleteModalEl = qs('#deleteDeviceModal');
    const deleteModal = deleteModalEl ? bootstrap.Modal.getOrCreateInstance(deleteModalEl) : null;
    let targetRow = null;
    qsa('[data-delete-device]').forEach((button) => {
      button.addEventListener('click', () => {
        targetRow = button.closest('tr');
        qs('#deleteDeviceName').textContent = targetRow.dataset.name;
        deleteModal.show();
      });
    });
    qs('#confirmDeleteDevice')?.addEventListener('click', () => {
      if (targetRow) {
        const name = targetRow.dataset.name;
        targetRow.remove();
        deleteModal.hide();
        showToast(`O dispositivo “${name}” foi removido apenas da interface simulada.`, 'success');
        page = 1; render();
      }
    });
    render();
  }

  function initDeviceForm() {
    const form = qs('#deviceForm');
    if (!form) return;
    const params = new URLSearchParams(location.search);
    if (params.has('id')) {
      qs('#formPageTitle').textContent = 'Editar dispositivo';
      qs('#formCardTitle').textContent = 'Dados do dispositivo';
      qs('#deviceName').value = 'Sensor de queda Sala 01';
      qs('#deviceCode').value = params.get('id');
      qs('#deviceTypeField').value = 'queda';
      qs('#deviceRoomField').value = 'sala';
      qs('#deviceResident').value = 'helena';
      qs('#deviceSerial').value = 'FD-2026-0048';
      qs('#deviceDate').value = '2026-02-10';
      qs('#deviceThreshold').value = '82';
      qs('#deviceNotes').value = 'Sensor instalado próximo ao sofá e calibrado para reduzir falsos positivos.';
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showToast('Revise os campos obrigatórios destacados.', 'warning');
        return;
      }
      const button = qs('button[type="submit"]', form);
      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
      setTimeout(() => {
        button.disabled = false; button.innerHTML = original;
        showToast('Dados validados e salvos na simulação local.', 'success');
        form.classList.remove('was-validated');
      }, 650);
    });
    qs('#resetDeviceForm')?.addEventListener('click', () => {
      form.reset(); form.classList.remove('was-validated');
    });
  }

  function initDeviceDetails() {
    qs('#testDevice')?.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Executando teste...';
      setTimeout(() => {
        button.disabled = false; button.innerHTML = original;
        showToast('Teste concluído: comunicação, bateria e telemetria estão normais.', 'success');
      }, 900);
    });
    qs('#toggleDevice')?.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const isDisabled = button.dataset.disabled === 'true';
      button.dataset.disabled = String(!isDisabled);
      button.innerHTML = isDisabled ? '<i class="bi bi-pause-circle me-1"></i>Desativar' : '<i class="bi bi-play-circle me-1"></i>Reativar';
      showToast(isDisabled ? 'Dispositivo reativado.' : 'Dispositivo desativado na simulação.', isDisabled ? 'success' : 'warning');
    });
  }

  function initResidents() {
    const search = qs('#residentSearch');
    if (!search) return;
    const cards = qsa('[data-resident-card]');
    search.addEventListener('input', () => {
      const term = search.value.toLowerCase();
      cards.forEach((card) => card.classList.toggle('d-none', !card.textContent.toLowerCase().includes(term)));
    });
  }

  function initAlerts() {
    const table = qs('#alertsTableBody');
    if (!table) return;
    const rows = () => qsa('tr', table);
    const severity = qs('#alertSeverity');
    const status = qs('#alertStatus');
    const search = qs('#alertSearch');
    const render = () => {
      const term = search.value.toLowerCase();
      rows().forEach((row) => {
        const visible = (!severity.value || row.dataset.severity === severity.value)
          && (!status.value || row.dataset.status === status.value)
          && row.textContent.toLowerCase().includes(term);
        row.classList.toggle('d-none', !visible);
      });
    };
    [severity, status].forEach((el) => el.addEventListener('change', render));
    search.addEventListener('input', render);

    const modalEl = qs('#alertDetailsModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    let selectedRow = null;
    qsa('[data-alert-details]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedRow = button.closest('tr');
        qs('#alertModalTitle').textContent = selectedRow.dataset.title;
        qs('#alertModalResident').textContent = selectedRow.dataset.resident;
        qs('#alertModalLocation').textContent = selectedRow.dataset.location;
        qs('#alertModalTime').textContent = selectedRow.dataset.time;
        qs('#alertModalDescription').textContent = selectedRow.dataset.description;
        modal.show();
      });
    });
    qs('#resolveAlert')?.addEventListener('click', () => {
      if (!selectedRow) return;
      selectedRow.dataset.status = 'resolvido';
      const badge = qs('[data-alert-status-badge]', selectedRow);
      badge.className = 'badge text-bg-success'; badge.textContent = 'Resolvido';
      modal.hide(); render();
      showToast('Alerta marcado como resolvido na simulação.', 'success');
    });
    qs('#simulateAlert')?.addEventListener('click', () => {
      showToast('Novo alerta crítico recebido da residência 07.', 'danger', 'Alerta de queda');
      const badge = qs('#criticalAlertCount');
      if (badge) badge.textContent = String(Number(badge.textContent) + 1);
    });
  }

  function csvDownload(filename, rows) {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    URL.revokeObjectURL(url);
  }

  function initReports() {
    qs('#applyReportFilter')?.addEventListener('click', () => showToast('Período do relatório atualizado com dados simulados.', 'info'));
    qs('#exportReport')?.addEventListener('click', () => {
      csvDownload('relatorio-casasegura.csv', [
        ['Indicador','Valor','Variação'],
        ['Alertas registrados','70','+8%'],
        ['Quedas confirmadas','7','-12%'],
        ['Tempo médio de resposta','00:03:42','-00:00:31'],
        ['Sensores online','48 de 52','92,3%']
      ]);
      showToast('Arquivo CSV gerado.', 'success');
    });
    qs('#printReport')?.addEventListener('click', () => window.print());
  }

  function initSettings() {
    const form = qs('#settingsForm');
    if (!form) return;
    const stored = JSON.parse(localStorage.getItem('casasegura-settings') || '{}');
    Object.entries(stored).forEach(([key, value]) => {
      const el = form.elements.namedItem(key);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = value;
      else el.value = value;
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = {};
      [...form.elements].forEach((el) => {
        if (!el.name) return;
        values[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      });
      localStorage.setItem('casasegura-settings', JSON.stringify(values));
      showToast('Preferências salvas neste navegador.', 'success');
    });
    qs('#sendTestNotification')?.addEventListener('click', () => showToast('Notificação de teste enviada para os canais habilitados.', 'info'));
  }

  function initGenericActions() {
    qsa('[data-demo-action]').forEach((button) => {
      button.addEventListener('click', () => showToast(button.dataset.demoAction || 'Ação executada na interface simulada.', 'info'));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const storedTheme = localStorage.getItem('casasegura-theme') || 'light';
    setTheme(storedTheme);
    initLayout();
    initLogin();
    initCharts();
    initDeviceTable();
    initDeviceForm();
    initDeviceDetails();
    initResidents();
    initAlerts();
    initReports();
    initSettings();
    initGenericActions();
  });
})();
