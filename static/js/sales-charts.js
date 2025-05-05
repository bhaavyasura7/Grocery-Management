// Initialize Chart.js charts for sales data
let yearlyChart, monthlyChart, weeklyChart;

// Function to format currency in Rupees
const formatCurrency = (amount) => {
    return '₹' + amount.toFixed(2);
};

// Function to initialize all charts
const initializeCharts = () => {
    // Create Yearly Sales Chart
    const yearlyCtx = document.getElementById('yearlyChart');
    if (yearlyCtx) {
        yearlyChart = new Chart(yearlyCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Yearly Sales',
                    data: [],
                    backgroundColor: '#015551',
                    borderColor: '#015551',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }

    // Create Monthly Sales Chart
    const monthlyCtx = document.getElementById('monthlyChart');
    if (monthlyCtx) {
        monthlyChart = new Chart(monthlyCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Monthly Sales',
                    data: [],
                    backgroundColor: '#FE4F2D',
                    borderColor: '#FE4F2D',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }

    // Create Weekly Sales Chart
    const weeklyCtx = document.getElementById('weeklyChart');
    if (weeklyCtx) {
        weeklyChart = new Chart(weeklyCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Weekly Sales',
                    data: [],
                    backgroundColor: '#a29330',
                    borderColor: '#a29330',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
};

// Function to update chart data
const updateChartData = (chartType, data) => {
    let chart;
    switch (chartType) {
        case 'yearly':
            chart = yearlyChart;
            break;
        case 'monthly':
            chart = monthlyChart;
            break;
        case 'weekly':
            chart = weeklyChart;
            break;
    }

    if (chart) {
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.data;
        chart.update();
    }
};

// Function to sort chart data
const sortChartData = (chartType, order) => {
    let chart;
    switch (chartType) {
        case 'yearly':
            chart = yearlyChart;
            break;
        case 'monthly':
            chart = monthlyChart;
            break;
        case 'weekly':
            chart = weeklyChart;
            break;
    }

    if (chart) {
        const data = chart.data.datasets[0].data;
        const labels = chart.data.labels;
        const combined = labels.map((label, i) => ({ label, value: data[i] }));

        combined.sort((a, b) => {
            return order === 'asc' ? a.value - b.value : b.value - a.value;
        });

        chart.data.labels = combined.map(item => item.label);
        chart.data.datasets[0].data = combined.map(item => item.value);
        chart.update();
    }
};

// For backward compatibility with the old implementation
let salesChart = null;

function updateChartTimeperiod(timeperiod) {
    // Fetch real-time data based on timeperiod
    fetch(`/api/sales/${timeperiod}`)
        .then(response => response.json())
        .then(data => {
            updateSingleChartData(timeperiod, data);
        })
        .catch(error => console.error('Error fetching sales data:', error));
}

function updateSingleChartData(timeperiod, data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    const chartCtx = ctx.getContext('2d');
    const maxValue = Math.max(...data.data);
    const stepSize = Math.ceil(maxValue / 5);

    const chartConfig = {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: `${timeperiod.charAt(0).toUpperCase() + timeperiod.slice(1)} Sales`,
                data: data.data,
                backgroundColor: '#57B4BA',
                borderColor: '#015551',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: maxValue * 1.1,
                    grid: {
                        color: '#e0e0e0'
                    },
                    ticks: {
                        callback: function (value) {
                            return '₹' + value;
                        },
                        stepSize: stepSize
                    }
                },
                x: {
                    grid: {
                        color: '#e0e0e0'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return '₹' + context.raw;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    };

    if (salesChart) {
        salesChart.destroy();
    }
    salesChart = new Chart(chartCtx, chartConfig);
}

// Initialize charts when the page loads
document.addEventListener('DOMContentLoaded', function () {
    // Initialize multi-chart implementation
    initializeCharts();
    
    // Check which timeperiod selector exists in the current page
    const timeperiodSelect = document.getElementById('timeperiodSelect');
    const timeFilter = document.getElementById('timeFilter');

    if (timeperiodSelect) {
        updateChartTimeperiod(timeperiodSelect.value);
    } else if (timeFilter) {
        updateChartTimeperiod(timeFilter.value);
    }
});

// Update charts every minute for real-time data
setInterval(() => {
    // Check which timeperiod selector exists in the current page
    const timeperiodSelect = document.getElementById('timeperiodSelect');
    const timeFilter = document.getElementById('timeFilter');

    if (timeperiodSelect) {
        updateChartTimeperiod(timeperiodSelect.value);
    } else if (timeFilter) {
        updateChartTimeperiod(timeFilter.value);
    }
}, 60000);
