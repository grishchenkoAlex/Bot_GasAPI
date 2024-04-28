const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

function getFormattedDateTime() {
    const now = new Date();
    return now.toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }) + ' ' + now.toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function generateBaseFeeChart(data) {
    const width = 800; // ширина изображения
    const height = 600; // высота изображения
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
    const lastValue = data[data.length - 1]; // Получение последнего значения
    const dateTime = getFormattedDateTime(); // Получение текущей даты и времени по Москве

    const configuration = {
        type: 'line',
        data: {
            labels: data.map((_, index) => index + 1), // Создание меток для оси X
            datasets: [{
                label: `Base Fee History (Last Value: ${lastValue}, Date: ${dateTime})`, // Добавление последнего значения и даты в легенду
                data: data,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top', // Установка позиции легенды
                    align: 'end' // Выравнивание текста легенды по правой стороне
                }
            }
        }
    };

    return chartJSNodeCanvas.renderToBuffer(configuration);
}

module.exports = { generateBaseFeeChart };
