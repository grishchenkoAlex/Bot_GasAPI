const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

async function generateMaxPriorityFeeChart(data) {
    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
    const labels = ['Low', 'Medium', 'High'];
    const colors = ['rgba(75, 192, 132, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(255, 99, 132, 0.7)'];

    const datasets = [{
        label: 'Max Priority Fee Per Gas (GWEI)',
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.7', '1')),
        borderWidth: 1,
        data: [
            data.low.suggestedMaxPriorityFeePerGas,
            data.medium.suggestedMaxPriorityFeePerGas,
            data.high.suggestedMaxPriorityFeePerGas
        ]
    }];

    const configuration = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    };

    return chartJSNodeCanvas.renderToBuffer(configuration);
}

async function generateOtherFeesChart(data) {
    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
    const labels = ['Max Fee', 'Min Wait Time', 'Max Wait Time'];
    const levels = ['low', 'medium', 'high'];
    const colors = ['rgba(75, 192, 132, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(255, 99, 132, 0.7)'];

    const datasets = levels.map((level, index) => ({
        label: level.charAt(0).toUpperCase() + level.slice(1),
        backgroundColor: colors[index],
        borderColor: colors[index].replace('0.7', '1'),
        borderWidth: 1,
        data: [
            data[level].suggestedMaxFeePerGas,
            data[level].minWaitTimeEstimate / 1000,
            data[level].maxWaitTimeEstimate / 1000
        ]
    }));

    const configuration = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    };

    return chartJSNodeCanvas.renderToBuffer(configuration);
}

module.exports = { generateMaxPriorityFeeChart, generateOtherFeesChart };
