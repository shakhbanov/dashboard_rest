/* charts.js */
let charts = {};
let kpiChart;
let modalChart;

function formatValueShort(value) {
  const sign = value < 0 ? '-' : '';
  const absValue = Math.abs(value);
  if (absValue >= 1e9) {
    return sign + (absValue / 1e9).toLocaleString('ru-RU', {
      maximumFractionDigits: 3,
      minimumFractionDigits: 3
    }) + ' млрд';
  } else if (absValue >= 1e6) {
    return sign + (absValue / 1e6).toLocaleString('ru-RU', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1
    }) + ' млн';
  } else if (absValue >= 1e3) {
    return sign + (absValue / 1e3).toLocaleString('ru-RU', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1
    }) + ' тыс';
  } else {
    return sign + absValue.toFixed(2);
  }
}

function initCharts() {
  // KPI график (месячная агрегация)
  const kpiCtx = document.getElementById('kpiChart').getContext('2d');
  kpiChart = new Chart(kpiCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Факт',
          data: [],
          backgroundColor: 'green',
          borderRadius: 10,
          barThickness: 30
        },
        {
          label: 'Прогноз',
          data: [],
          backgroundColor: 'blue',
          borderRadius: 10,
          barThickness: 30
        }
      ]
    },
    options: {
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 20 }
        }
      }
    }
  });

  // График: Ошибка WAPE по дням
  const ctxErrorByDay = document.getElementById('chartErrorByDay').getContext('2d');
  charts.chartErrorByDay = new Chart(ctxErrorByDay, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Ошибка WAPE, %',
        data: [],
        borderColor: 'green',
        backgroundColor: 'rgba(0,255,0,0.1)',
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { title: { display: true, text: 'Ошибка WAPE, %' } },
        x: { title: { display: true, text: 'Дата' } }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let value = context.parsed.y;
              return 'WAPE: ' + value.toFixed(2) + '%';
            }
          }
        },
        title: {
          display: true,
          text: 'Ошибка WAPE, % по дням'
        },
        annotation: {
          annotations: {
            targetLine: {
              type: 'line',
              scaleID: 'y',
              value: (window.currentMetric === 'check_qnty' ? 8 : 11),
              borderColor: 'red',
              borderDash: [6, 6],
              borderWidth: 2,
              label: {
                enabled: true,
                content: 'Цель'
              }
            }
          }
        }
      }
    }
  });

  // График: Плотность ошибки
  const ctxErrorDensity = document.getElementById('chartErrorDensity').getContext('2d');
  charts.chartErrorDensity = new Chart(ctxErrorDensity, {
    type: 'bar',
    data: {
      labels: ['0-10','10-20','20-30','30-40','40-50','50-60','60-70','70-80','80-90','90-100'],
      datasets: [{
        label: 'Плотность ошибки',
        data: [],
        backgroundColor: '#27ae60'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Ошибка, % (корзины)' } },
        y: { beginAtZero: true, title: { display: true, text: 'Плотность' } }
      },
      plugins: {
        title: {
          display: true,
          text: 'Плотность ошибки по корзинам'
        }
      }
    }
  });

  // График: Факт vs Прогноз и дельта (линия + бары)
  const ctxFactForecast = document.getElementById('chartFactForecast').getContext('2d');
  charts.chartFactForecast = new Chart(ctxFactForecast, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Факт',
          data: [],
          borderColor: 'green',
          backgroundColor: 'rgba(0,255,0,0.2)',
          fill: false
        },
        {
          label: 'Прогноз',
          data: [],
          borderColor: 'blue',
          backgroundColor: 'rgba(0,0,255,0.2)',
          fill: false
        },
        {
          label: 'Дельта (Факт - Прогноз)',
          type: 'bar',
          data: [],
          backgroundColor: 'rgba(255,99,132,0.5)',
          borderColor: 'rgba(255,99,132,1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Дата' } },
        y: { title: { display: true, text: 'Значение' } }
      },
      plugins: {
        title: {
          display: true,
          text: 'Факт vs Прогноз и дельта'
        }
      }
    }
  });

  // График: Распределение ошибки по дням (stacked bar)
  const ctxErrorDistribution = document.getElementById('chartErrorDistribution').getContext('2d');
  charts.chartErrorDistribution = new Chart(ctxErrorDistribution, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        { label: '0-10%',  data: [], backgroundColor: '#2ecc71', stack: 'stack1' },
        { label: '10-20%', data: [], backgroundColor: '#f1c40f', stack: 'stack1' },
        { label: '20-30%', data: [], backgroundColor: '#e67e22', stack: 'stack1' },
        { label: '30-40%', data: [], backgroundColor: '#e74c3c', stack: 'stack1' },
        { label: '>40%',   data: [], backgroundColor: '#8e44ad', stack: 'stack1' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, title: { display: true, text: 'Дата' } },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Проценты' },
          ticks: { callback: val => val + '%' }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Распределение ошибки по дням'
        }
      }
    }
  });

  // График: Факт и Прогноз по ресторанам
  const ctxFactForecastByRestaurant = document.getElementById('chartFactForecastByRestaurant').getContext('2d');
  charts.chartFactForecastByRestaurant = new Chart(ctxFactForecastByRestaurant, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Факт',
          data: [],
          borderColor: 'green',
          backgroundColor: 'rgba(0,255,0,0.2)',
          fill: false
        },
        {
          label: 'Прогноз',
          data: [],
          borderColor: 'blue',
          backgroundColor: 'rgba(0,0,255,0.2)',
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: {
          display: true,
          align: 'top',
          color: '#000',
          font: { weight: 'bold' },
          formatter: (value) => formatValueShort(value)
        },
        title: {
          display: true,
          text: 'Факт и Прогноз по ресторанам'
        }
      },
      scales: {
        x: { title: { display: true, text: 'Дата' } },
        y: { title: { display: true, text: 'Сумма' } }
      }
    },
    plugins: [ChartDataLabels]
  });

  // График: Дельта (Факт - Прогноз) по ресторанам
  const ctxDeltaFactForecastByRestaurant = document.getElementById('chartDeltaFactForecastByRestaurant').getContext('2d');
  charts.chartDeltaFactForecastByRestaurant = new Chart(ctxDeltaFactForecastByRestaurant, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Дельта (Факт - Прогноз)',
          data: [],
          backgroundColor: 'rgba(255,99,132,0.5)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: {
          display: true,
          align: 'top',
          color: '#000',
          font: { weight: 'bold' },
          formatter: (value) => formatValueShort(value)
        },
        title: {
          display: true,
          text: 'Дельта (Факт - Прогноз) по ресторанам'
        }
      },
      scales: {
        x: { title: { display: true, text: 'Дата' } },
        y: { title: { display: true, text: 'Разница' } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function updateKPIChart(monthlyData) {
  const labels = monthlyData.map(d => d.month);
  const factVals = monthlyData.map(d => d.fact);
  const forecastVals = monthlyData.map(d => d.forecast);
  kpiChart.data.labels = labels;
  kpiChart.data.datasets[0].data = factVals;
  kpiChart.data.datasets[1].data = forecastVals;
  kpiChart.update();

  const totalFact = factVals.reduce((a, b) => a + b, 0);
  const totalForecast = forecastVals.reduce((a, b) => a + b, 0);
  document.getElementById('factTotal').textContent = formatValueShort(totalFact);
  document.getElementById('forecastTotal').textContent = formatValueShort(totalForecast);
}

function updateAllCharts(data) {
  const labels = data.map(d => d.day_id);
  const errorVals = data.map(d => d.errorPercent);
  // chartErrorByDay
  charts.chartErrorByDay.data.labels = labels;
  charts.chartErrorByDay.data.datasets[0].data = errorVals;
  charts.chartErrorByDay.options.plugins.annotation.annotations.targetLine.value =
    (window.currentMetric === 'check_qnty' ? 8 : 11);
  charts.chartErrorByDay.update();

  // chartErrorDensity
  const density = getErrorDensity(data);
  charts.chartErrorDensity.data.datasets[0].data = density;
  charts.chartErrorDensity.update();

  // chartFactForecast
  const factVals = data.map(d => d.fact);
  const forecastVals = data.map(d => d.forecast);
  const deltaVals = data.map(d => d.delta);
  charts.chartFactForecast.data.labels = labels;
  charts.chartFactForecast.data.datasets[0].data = factVals;
  charts.chartFactForecast.data.datasets[1].data = forecastVals;
  charts.chartFactForecast.data.datasets[2].data = deltaVals;
  charts.chartFactForecast.update();

  // chartErrorDistribution
  const distInfo = getErrorDistribution(data);
  charts.chartErrorDistribution.data.labels = distInfo.days;
  for (let i = 0; i < 5; i++) {
    charts.chartErrorDistribution.data.datasets[i].data = distInfo.distribution.map(row => row[i]);
  }
  charts.chartErrorDistribution.update();

  // chartFactForecastByRestaurant
  charts.chartFactForecastByRestaurant.data.labels = labels;
  charts.chartFactForecastByRestaurant.data.datasets[0].data = factVals;
  charts.chartFactForecastByRestaurant.data.datasets[1].data = forecastVals;
  charts.chartFactForecastByRestaurant.update();

  // chartDeltaFactForecastByRestaurant
  charts.chartDeltaFactForecastByRestaurant.data.labels = labels;
  charts.chartDeltaFactForecastByRestaurant.data.datasets[0].data = deltaVals;
  charts.chartDeltaFactForecastByRestaurant.update();
}

function getErrorDensity(data) {
  const bins = [0,10,20,30,40,50,60,70,80,90,100];
  const counts = new Array(bins.length - 1).fill(0);
  data.forEach(d => {
    const e = Math.abs(d.errorPercent);
    for (let i = 0; i < bins.length - 1; i++) {
      if (e >= bins[i] && e < bins[i+1]) {
        counts[i]++;
        break;
      }
    }
  });
  const total = data.length || 1;
  return counts.map(c => c / total);
}

function getErrorDistribution(data) {
  const distribution = data.map(d => {
    const e = Math.abs(d.errorPercent);
    const row = [0, 0, 0, 0, 0];
    if (e < 10) row[0] = 100;
    else if (e < 20) row[1] = 100;
    else if (e < 30) row[2] = 100;
    else if (e < 40) row[3] = 100;
    else row[4] = 100;
    return row;
  });
  const days = data.map(d => d.day_id);
  return { days, distribution };
}

function openFullscreenChart(chartId) {
  const modalOverlay = document.getElementById('chartModal');
  const modalCanvas = document.getElementById('modalChartCanvas');
  modalOverlay.style.display = 'flex';

  if (modalChart) {
    modalChart.destroy();
  }
  const originalChart = charts[chartId];
  if (!originalChart) return;

  const newConfig = {
    type: originalChart.config.type,
    data: JSON.parse(JSON.stringify(originalChart.data)),
    options: {
      ...originalChart.config.options,
      responsive: true,
      maintainAspectRatio: false
    },
    plugins: originalChart.config.plugins || []
  };

  modalChart = new Chart(modalCanvas.getContext('2d'), newConfig);
  setTimeout(() => {
    modalChart.resize();
    modalChart.update();
  }, 100);
}

function closeModal() {
  document.getElementById('chartModal').style.display = 'none';
  if (modalChart) {
    modalChart.destroy();
    modalChart = null;
  }
}
