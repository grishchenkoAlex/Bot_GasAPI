require('dotenv').config({ path: '../../.env' });
const TelegramBot = require('node-telegram-bot-api');
const { fetchBaseFeeHistory } = require('../api/GetBaseFeeHistory');
const { generateBaseFeeChart } = require('../charts/chartGenerator');
const { generateMaxPriorityFeeChart, generateOtherFeesChart } = require('../charts/chartGeneratorGist');
const { fetchBaseFeePercentile } = require('../api/GetBaseFeePercentile');
const { fetchBusyThreshold } = require('../api/GetBusyThreshold');
const { fetchSuggestedGasFees } = require('../api/GetEIP-1559GasPrices');
const { compileSolidity } = require('../solidity/compiler');
const { testContract } = require('../solidity/tester');
const fs = require('fs');

// Токен, который вы получили у BotFather
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const contractFilePath = require.resolve('./tempContract.sol');

let awaitingContractEvaluation = false;

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
        reply_markup: {
            keyboard: [
                ['Оценить свой смарт контракт'],
                ['Данные Gas API']
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(chatId, 'Выберите опцию', options);
});

bot.onText(/Оценить свой смарт контракт/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Пожалуйста, отправьте исходный код вашего смарт-контракта для оценки.');
    awaitingContractEvaluation = true;
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Исключаем обработку команд из обработчика смарт-контрактов
    if (msg.entities && msg.entities.some(entity => entity.type === 'bot_command')) {
        return; // Пропускаем обработку, если это команда
    }

    // Проверяем, ожидается ли оценка смарт-контракта
    if (awaitingContractEvaluation) {
        const result = compileSolidity(msg.text, contractFilePath);
        if (result.errors) {
            bot.sendMessage(chatId, 'Ошибка компиляции:\n' + result.errors.join('\n'));
        } else {
            fs.writeFile(contractFilePath, msg.text, async (err) => {
                if (err) {
                    console.error('Ошибка записи файла контракта:', err);
                    return;
                }
                console.log('Код контракта успешно записан в файл:', contractFilePath);

                bot.sendMessage(chatId, 'Компиляция прошла успешно. Идет подготовка к тестированию...');
                try {
                    const testResults = await testContract(result.compiledCode);
                    bot.sendMessage(chatId, formatResults(testResults));
                } catch (error) {
                    console.error('Ошибка при тестировании контракта:', error);
                }
            });
        }
        awaitingContractEvaluation = false; // После оценки контракта сбрасываем флаг ожидания
    }
});


function formatResults(results) {
    return results.map(result => result.error ?
        `${result.transaction}: Недоступно, Ошибка - ${result.error}` :
        `${result.transaction}: Газ - ${result.gasUsed}, Время - ${result.time}ms`
    ).join('\n');
}


bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === 'Получить график базовых комиссий') {
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
    if (msg.text === 'Получите процентиль базовой комиссии') {
        const percentileData = await fetchBaseFeePercentile(process.env.INFURA_API_KEY, process.env.INFURA_API_KEY_SECRET);
        if (percentileData) {
            const responseText = `${percentileData.baseFeePercentile} GWEI\n\nЭто означает, что 50 % исторических базовых сборов меньше или равны ${percentileData.baseFeePercentile} GWEI`;
            bot.sendMessage(chatId, responseText);
        } else {
            bot.sendMessage(chatId, "Не удалось получить данные.");
        }
    }
    if (msg.text === 'Получите порог занятости') {
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

    if (msg.text === 'Получить цены на газ EIP-1559') {
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
});

function sendMainMenu(chatId) {
    bot.sendMessage(chatId, 'Выберите опцию', {
        reply_markup: {
            keyboard: [
                [{ text: 'Оценить свой смарт контракт' }],
                [{ text: 'Данные Gas API' }]
            ],
            resize_keyboard: true
        }
    });
}

function sendGasDataOptions(chatId) {
    bot.sendMessage(chatId, 'Выберите тип данных:', {
        reply_markup: {
            keyboard: [
                [{ text: 'Получить график базовых комиссий' }],
                [{ text: 'Получите процентиль базовой комиссии' }],
                [{ text: 'Получите порог занятости' }],
                [{ text: 'Получить цены на газ EIP-1559' }],
                [{ text: 'В главное меню' }]
            ],
            resize_keyboard: true
        }
    });
}

module.exports = bot;
// Дополнительные обработчики для других кнопок и ввода смарт-контрактов
