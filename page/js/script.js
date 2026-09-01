'use strict';

const currentYear = document.getElementById('currentYear');
const criticalAlertCount = document.getElementById('criticalAlertCount');
const sidebarAlertCount = document.getElementById('sidebarAlertCount');
const eventsTableBody = document.getElementById('eventsTableBody');
const simulateAlertButton = document.getElementById('simulateAlertButton');
const confirmResolveAlert = document.getElementById('confirmResolveAlert');
const resolveAlertModalElement = document.getElementById('resolveAlertModal');
const toastElement = document.getElementById('appToast');
const toastMessage = document.getElementById('appToastMessage');

let selectedAlertRow = null;
let alertCounter = Number.parseInt(criticalAlertCount.textContent, 10);

currentYear.textContent = new Date().getFullYear();

const toast = bootstrap.Toast.getOrCreateInstance(toastElement, {
  delay: 3500
});

function showToast(message) {
  toastMessage.textContent = message;
  toast.show();
}

function updateAlertCounters(newValue) {
  alertCounter = Math.max(0, newValue);
  criticalAlertCount.textContent = alertCounter;
  sidebarAlertCount.textContent = alertCounter;
}

function getChartTextColor() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--bs-body-color')
    .trim() || '#212529';
}

function getChartGridColor() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--bs-border-color')
    .trim() || '#dee2e6';
}

const chartContext = document.getElementById('eventsChart');
const eventsChart = new Chart(chartContext, {
  type: 'line',
  data: {
    labels: ['02h', '04h', '06h', '08h', '10h', '12h', '14h'],
    datasets: [
      {
        label: 'Todos os eventos',
        data: [2, 1, 3, 4, 3, 6, 5],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.15)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Eventos críticos',
        data: [0, 0, 1, 0, 1, 1, 2],
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.12)',
        fill: true,
        tension: 0.35
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    scales: {
      x: {
        ticks: { color: getChartTextColor() },
        grid: { color: getChartGridColor() }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: getChartTextColor(),
          precision: 0
        },
        grid: { color: getChartGridColor() }
      }
    },
    plugins: {
      legend: {
        labels: { color: getChartTextColor() }
      }
    }
  }
});

document.addEventListener('changed.lte.color-mode', () => {
  const textColor = getChartTextColor();
  const gridColor = getChartGridColor();

  eventsChart.options.scales.x.ticks.color = textColor;
  eventsChart.options.scales.y.ticks.color = textColor;
  eventsChart.options.scales.x.grid.color = gridColor;
  eventsChart.options.scales.y.grid.color = gridColor;
  eventsChart.options.plugins.legend.labels.color = textColor;
  eventsChart.update();
});

document.addEventListener('click', (event) => {
  const resolveButton = event.target.closest('[data-action="resolve-alert"]');

  if (resolveButton) {
    selectedAlertRow = resolveButton.closest('tr');
  }
});

confirmResolveAlert.addEventListener('click', () => {
  if (!selectedAlertRow) {
    return;
  }

  const statusCell = selectedAlertRow.querySelector('[data-status-cell]');
  const actionCell = selectedAlertRow.lastElementChild;

  statusCell.innerHTML = '<span class="badge text-bg-success">Resolvido</span>';
  actionCell.innerHTML = '<button type="button" class="btn btn-sm btn-outline-secondary" disabled>Concluído</button>';

  updateAlertCounters(alertCounter - 1);

  const modal = bootstrap.Modal.getInstance(resolveAlertModalElement);
  modal.hide();

  selectedAlertRow = null;
  showToast('O alerta foi marcado como resolvido.');
});

simulateAlertButton.addEventListener('click', () => {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td>${time}</td>
    <td><strong>Residência 05</strong><div class="small text-body-secondary">João R.</div></td>
    <td><span class="badge text-bg-danger">Possível queda</span></td>
    <td>Banheiro</td>
    <td data-status-cell><span class="badge text-bg-warning">Em atendimento</span></td>
    <td class="text-end">
      <button
        type="button"
        class="btn btn-sm btn-outline-success"
        data-action="resolve-alert"
        data-bs-toggle="modal"
        data-bs-target="#resolveAlertModal"
      >
        Resolver
      </button>
    </td>
  `;

  eventsTableBody.prepend(newRow);
  updateAlertCounters(alertCounter + 1);

  const finalIndex = eventsChart.data.datasets[0].data.length - 1;
  eventsChart.data.datasets[0].data[finalIndex] += 1;
  eventsChart.data.datasets[1].data[finalIndex] += 1;
  eventsChart.update();

  showToast('Um novo alerta fictício foi adicionado à tabela.');
});
