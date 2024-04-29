require('dotenv').config({ path: '../../.env' });
const TelegramBot = require('node-telegram-bot-api');
const { fetchBaseFeeHistory } = require('../api/GetBaseFeeHistory');
const { generateBaseFeeChart } = require('../charts/chartGenerator');
const { generateMaxPriorityFeeChart, generateOtherFeesChart } = require('../charts/chartGeneratorGist');
const { fetchBaseFeePercentile } = require('../api/GetBaseFeePercentile');
const { fetchBusyThreshold } = require('../api/GetBusyThreshold');
const { fetchSuggestedGasFees } = require('../api/GetEIP-1559GasPrices');

// Токен, который вы получили у BotFather
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: 'Оценить свой смарт контракт', callback_data: 'evaluate' }],
                [{ text: 'Данные Gas API', callback_data: 'gas_data' }]
            ]
        })
    };
    bot.sendMessage(chatId, 'Выберите опцию:', options);
});

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    switch (data) {
        case 'evaluate':
            bot.sendMessage(chatId, 'Данный функционал находится в доработке');
            break;
        case 'gas_data':
            showGasOptions(chatId);
            break;
        case 'fetch_base_fee_chart':
            await fetchAndSendBaseFeeHistory(chatId);
            break;
        case 'fetch_percentile':
            await fetchAndSendBaseFeePercentile(chatId);
            break;
        case 'fetch_busy_threshold':
            await fetchAndSendBusyThreshold(chatId);
            break;
        case 'fetch_gas_prices':
            await fetchAndSendGasPrices(chatId);
            break;
        case 'main_menu':
            sendMainMenu(chatId);
            break;
        default:
            bot.sendMessage(chatId, 'Неизвестная команда, пожалуйста, выберите одну из доступных опций.');
    }
});


async function fetchAndSendBaseFeeHistory(chatId) {
    try {
        const baseFeeHistory = await fetchBaseFeeHistory(process.env.INFURA_API_KEY, process.env.INFURA_API_KEY_SECRET);
        if (!baseFeeHistory.length) {
            console.log("No data received from API");
            return;
        }
        const limitedHistory = baseFeeHistory.slice(-100); // Получение последних 500 значений
        const numbers = limitedHistory.map(value => parseFloat(value));
        const chartBuffer = await generateBaseFeeChart(numbers);
        await bot.sendPhoto(chatId, chartBuffer);
        // Отправка последнего значения текстом
        const lastValue = numbers[numbers.length - 1];
        bot.sendMessage(chatId, `Last base fee value: ${lastValue}`);
    } catch (error) {
        console.error("Failed to process or send chart:", error);
        bot.sendMessage(chatId, "Failed to generate or send chart.");
    }
}

async function fetchAndSendBaseFeePercentile(chatId) {
    const percentileData = await fetchBaseFeePercentile(process.env.INFURA_API_KEY, process.env.INFURA_API_KEY_SECRET);
    if (percentileData) {
        const responseText = `${percentileData.baseFeePercentile} GWEI\n\nЭто означает, что 50 % исторических базовых сборов меньше или равны ${percentileData.baseFeePercentile} GWEI`;
        bot.sendMessage(chatId, responseText);
    } else {
        bot.sendMessage(chatId, "Не удалось получить данные.");
    }
}

async function fetchAndSendBusyThreshold(chatId) {
    try {
        const baseFeeHistory = await fetchBaseFeeHistory(process.env.INFURA_API_KEY, process.env.INFURA_API_KEY_SECRET);
        if (!baseFeeHistory.length) {
            console.log("No data received from API");
            return;
        }
        const lastValue = parseFloat(baseFeeHistory.slice(-1)[0]); // Получение последнего значения
        const busyThreshold = await fetchBusyThreshold(process.env.INFURA_API_KEY, process.env.INFURA_API_KEY_SECRET);

        if (busyThreshold) {
            let comparisonText = "";
            if (lastValue > busyThreshold) {
                comparisonText = `Текущая базовая комиссия ${lastValue} GWEI больше ${busyThreshold}, это говорит о том, что сейчас сеть более загружена, чем обычно, вероятно, из-за большого объема транзакций.`;
            } else {
                comparisonText = `Текущая базовая комиссия ${lastValue} GWEI меньше ${busyThreshold}, это говорит о том, что сейчас сеть менее загружена, чем обычно, вероятно, из-за маленького объема транзакций.`;
            }

            const responseText = `${busyThreshold} GWEI\n\nЭто означает, что 90 % исторических базовых сборов в сети были ниже ${busyThreshold} GWEI.\n\n${comparisonText}`;
            bot.sendMessage(chatId, responseText);
        } else {
            bot.sendMessage(chatId, "Не удалось получить данные о пороге занятости.");
        }
    } catch (error) {
        console.error("Failed to process or send threshold data:", error);
        bot.sendMessage(chatId, "Failed to generate or send threshold data.");
    }
}

async function fetchAndSendGasPrices(chatId) {
    const gasFeesData = await fetchSuggestedGasFees(process.env.INFURA_API_KEY, process.env.INFURA_API_KEY_SECRET);
    if (gasFeesData) {
        // Отправляем гистограмму для Max Priority Fee
        const priorityFeeChart = await generateMaxPriorityFeeChart(gasFeesData);
        await bot.sendPhoto(chatId, priorityFeeChart);

        // Отправляем гистограмму для остальных платежей
        const otherFeesChart = await generateOtherFeesChart(gasFeesData);
        await bot.sendPhoto(chatId, otherFeesChart);

        // Затем отправляем текстовые данные
        const responseText = formatGasFeesData(gasFeesData);
        bot.sendMessage(chatId, responseText);
    } else {
        bot.sendMessage(chatId, "Не удалось получить данные о платах за газ.");
    }

    function formatGasFeesData(data) {
        const levels = ['low', 'medium', 'high'];
        let responseText = '';
        levels.forEach(level => {
            responseText += `\n${level.toUpperCase()}:\n` +
                `Max Priority Fee Per Gas: ${data[level].suggestedMaxPriorityFeePerGas} GWEI\n` +
                `Max Fee Per Gas: ${data[level].suggestedMaxFeePerGas} GWEI\n` +
                `Min Wait Time Estimate: ${data[level].minWaitTimeEstimate / 1000} seconds\n` +
                `Max Wait Time Estimate: ${data[level].maxWaitTimeEstimate / 1000} seconds\n`;
        });

        responseText += `\nEstimated Base Fee: ${data.estimatedBaseFee} GWEI\n` +
            `Network Congestion: ${data.networkCongestion}\n` +
            `Latest Priority Fee Range: ${data.latestPriorityFeeRange.join(' - ')} GWEI\n` +
            `Historical Priority Fee Range: ${data.historicalPriorityFeeRange.join(' - ')} GWEI\n` +
            `Historical Base Fee Range: ${data.historicalBaseFeeRange.join(' - ')} GWEI\n` +
            `Priority Fee Trend: ${data.priorityFeeTrend}\n` +
            `Base Fee Trend: ${data.baseFeeTrend}`;

        return responseText;
    }
}



function showGasOptions(chatId) {
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: 'Получить график базовых комиссий', callback_data: 'fetch_base_fee_chart' }],
                [{ text: 'Получите процентиль базовой комиссии', callback_data: 'fetch_percentile' }],
                [{ text: 'Получите порог занятости', callback_data: 'fetch_busy_threshold' }],
                [{ text: 'Получить цены на газ EIP-1559', callback_data: 'fetch_gas_prices' }],
                [{ text: 'В главное меню', callback_data: 'main_menu' }]
            ]
        })
    };
    bot.sendMessage(chatId, 'Выберите тип данных Gas API:', options);
}

function sendMainMenu(chatId) {
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: 'Оценить свой смарт контракт', callback_data: 'evaluate' }],
                [{ text: 'Данные Gas API', callback_data: 'gas_data' }]
            ]
        })
    };
    bot.sendMessage(chatId, 'Возврат в главное меню:', options);
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Чтобы начать, используйте команду /start.');
});