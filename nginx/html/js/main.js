/* main.js */
let factData = [];
let forecastData = [];
let dataIndex = {};
let uniqueDays = [];
let selectedStartDate = null;
let selectedEndDate = null;
window.currentMetric = 'check_qnty'; // по умолчанию "чеки"

function loadData() {
  return Promise.all([
    fetch('/fact').then(res => res.json()),
    fetch('/forecast').then(res => res.json())
  ])
  .then(([fact, forecast]) => {
    factData = fact;
    forecastData = forecast;
  })
  .catch(error => console.error("Ошибка загрузки данных:", error));
}

function buildDataIndex() {
  const daysSet = new Set();
  function safeAssign(day, rest) {
    if (!dataIndex[day]) dataIndex[day] = {};
    if (!dataIndex[day][rest]) {
      dataIndex[day][rest] = {
        fact_check: 0,
        fact_sales: 0,
        forecast_check: 0,
        forecast_sales: 0,
        address: 'неизвестно'
      };
    }
    daysSet.add(day);
  }

  factData.forEach(row => {
    const day = row.day_id;
    const rest = String(row.rest_id);
    safeAssign(day, rest);
    dataIndex[day][rest].fact_check += (row.check_qnty || 0);
    dataIndex[day][rest].fact_sales += (row.sales || 0);
    if (row.address) {
      dataIndex[day][rest].address = row.address;
    }
  });

  forecastData.forEach(row => {
    const day = row.day_id;
    const rest = String(row.rest_id);
    safeAssign(day, rest);
    dataIndex[day][rest].forecast_check += (row.check_qnty || 0);
    dataIndex[day][rest].forecast_sales += (row.sales || 0);
    if (row.address) {
      dataIndex[day][rest].address = row.address;
    }
  });

  uniqueDays = Array.from(daysSet).sort();
}

function initRestaurantList() {
  const uniqueRests = {};
  for (const day in dataIndex) {
    for (const restId in dataIndex[day]) {
      if (!uniqueRests[restId]) {
        uniqueRests[restId] = dataIndex[day][restId].address || 'неизвестно';
      }
    }
  }
  const container = document.getElementById('restaurantList');
  container.innerHTML = '';
  Object.keys(uniqueRests).forEach(rid => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" class="restaurant-checkbox" value="${rid}">
      ${rid} - ${uniqueRests[rid]}
    `;
    container.appendChild(label);
  });
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function filterDaysByRange(days, start, end) {
  if (!start || !end) return days;
  return days.filter(d => {
    const dayMoment = moment(d, 'YYYY-MM-DD');
    return dayMoment.isBetween(start, end, null, '[]');
  });
}

function combineData(selectedRests, metric, startDate, endDate) {
  const filteredDays = filterDaysByRange(uniqueDays, startDate, endDate);
  const result = [];
  filteredDays.forEach(day => {
    if (!dataIndex[day]) return;
    let totalFact = 0;
    let totalForecast = 0;
    let totalAbsError = 0;
    const dayRests = Object.keys(dataIndex[day]);
    dayRests.forEach(restId => {
      if (selectedRests.length > 0 && !selectedRests.includes(restId)) return;
      const entry = dataIndex[day][restId];
      const factVal = (metric === 'check_qnty') ? entry.fact_check : entry.fact_sales;
      const forecastVal = (metric === 'check_qnty') ? entry.forecast_check : entry.forecast_sales;
      totalFact += factVal;
      totalForecast += forecastVal;
      totalAbsError += Math.abs(factVal - forecastVal);
    });
    let errorPercent = 0;
    if (totalFact !== 0) {
      errorPercent = (totalAbsError / totalFact) * 100;
    }
    result.push({
      day_id: day,
      fact: totalFact,
      forecast: totalForecast,
      delta: totalFact - totalForecast,
      errorPercent: errorPercent
    });
  });
  return result.sort((a, b) => (a.day_id > b.day_id ? 1 : -1));
}

function combineMonthlyData(selectedRests, metric, startDate, endDate) {
  const filteredDays = filterDaysByRange(uniqueDays, startDate, endDate);
  const monthlyData = {};
  filteredDays.forEach(day => {
    if (!dataIndex[day]) return;
    const month = moment(day, 'YYYY-MM-DD').format('YYYY-MM');
    if (!monthlyData[month]) {
      monthlyData[month] = { fact: 0, forecast: 0 };
    }
    Object.keys(dataIndex[day]).forEach(restId => {
      if (selectedRests.length > 0 && !selectedRests.includes(restId)) return;
      const entry = dataIndex[day][restId];
      const factVal = (metric === 'check_qnty') ? entry.fact_check : entry.fact_sales;
      const forecastVal = (metric === 'check_qnty') ? entry.forecast_check : entry.forecast_sales;
      monthlyData[month].fact += factVal;
      monthlyData[month].forecast += forecastVal;
    });
  });
  let result = Object.keys(monthlyData).sort().map(month => {
    const fact = monthlyData[month].fact;
    const forecast = monthlyData[month].forecast;
    const delta = fact - forecast;
    const errorPercent = fact !== 0 ? (Math.abs(fact - forecast) / fact) * 100 : 0;
    return { month, fact, forecast, delta, errorPercent };
  });
  return result;
}

function refreshData() {
  const selectedRests = Array.from(document.querySelectorAll('.restaurant-checkbox:checked'))
                             .map(ch => ch.value);
  const toggleChecks = document.getElementById('toggleChecks').checked;
  const toggleSales = document.getElementById('toggleSales').checked;
  window.currentMetric = toggleSales ? 'sales' : 'check_qnty';

  const combined = combineData(selectedRests, window.currentMetric, selectedStartDate, selectedEndDate);
  updateAllCharts(combined);

  const monthlyCombined = combineMonthlyData(selectedRests, window.currentMetric, selectedStartDate, selectedEndDate);
  updateKPIChart(monthlyCombined);
}

document.addEventListener('DOMContentLoaded', () => {
  // Запуск цитат из quotes.js
  startQuotes();

  loadData().then(() => {
    buildDataIndex();
    initRestaurantList();
    initCharts();

    const $dateRange = $('#daterange');
    const defaultStart = moment().subtract(7, 'days');
    const defaultEnd   = moment();
    selectedStartDate = defaultStart;
    selectedEndDate   = defaultEnd;

    $dateRange.daterangepicker({
      startDate: defaultStart,
      endDate: defaultEnd,
      opens: 'right',
      autoApply: false,
      locale: {
        format: 'DD.MM.YYYY',
        applyLabel: 'Применить',
        cancelLabel: 'Отмена',
        daysOfWeek: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
        monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
        firstDay: 1
      }
    }, function(start, end) {
      selectedStartDate = start;
      selectedEndDate = end;
      refreshData();
    });
    $dateRange.val(defaultStart.format('DD.MM.YYYY') + ' - ' + defaultEnd.format('DD.MM.YYYY'));

    const toggleChecks = document.getElementById('toggleChecks');
    const toggleSales = document.getElementById('toggleSales');
    toggleChecks.checked = true;
    toggleSales.checked = false;

    toggleChecks.addEventListener('change', () => {
      if (toggleChecks.checked) {
        toggleSales.checked = false;
      } else {
        if (!toggleSales.checked) {
          toggleSales.checked = true;
        }
      }
      refreshData();
    });
    toggleSales.addEventListener('change', () => {
      if (toggleSales.checked) {
        toggleChecks.checked = false;
      } else {
        if (!toggleChecks.checked) {
          toggleChecks.checked = true;
        }
      }
      refreshData();
    });

    document.getElementById('restaurantList').addEventListener('change', refreshData);

    const searchInput = document.getElementById('searchRestaurant');
    const handleSearch = debounce((e) => {
      const val = e.target.value.toLowerCase();
      document.querySelectorAll('.restaurant-checkbox').forEach(ch => {
        const label = ch.parentElement.textContent.toLowerCase();
        ch.parentElement.style.display = label.includes(val) ? 'block' : 'none';
      });
    }, 300);
    searchInput.addEventListener('input', handleSearch);

    document.querySelectorAll('.fullscreen-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openFullscreenChart(btn.getAttribute('data-chart'));
      });
    });
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    refreshData();

    // Скрытие оверлея загрузки и остановка цитат
    window.overlayVisible = false;
    if (window.quoteTimer) {
      clearInterval(window.quoteTimer);
    }
    document.getElementById('loadingOverlay').style.display = 'none';
  });
});
