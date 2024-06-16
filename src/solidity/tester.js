const { exec } = require('child_process');
const path = require('path');
const truffleConfig = require('../../truffle-config.js');

// Функция для запуска Ganache CLI
function startGanache(gasFeesData) {
  return new Promise((resolve, reject) => {
    const ganacheProcess = exec(`ganache-cli -p 8545 --gasPrice ${gasFeesData.low.suggestedMaxFeePerGas * 1e9}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Ошибка при запуске Ganache CLI: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Ganache CLI stderr: ${stderr}`);
      }
      resolve(ganacheProcess);
    });

    ganacheProcess.stdout.on('data', (data) => {
      if (data.includes('Listening on 0.0.0.0:8545')) {
        console.log('Ganache CLI успешно запущен.');
        bot.sendMessage(chatId, 'Ganache CLI успешно запущен.');
        resolve(ganacheProcess);
      }
    });
  });
}

// Основная функция для тестирования контракта
async function testContract(gasFeesData) {
  try {
    const ganacheProcess = await startGanache(gasFeesData);
    await deployContract(gasFeesData);
    await runTests(gasFeesData);

    // Завершение процесса Ganache CLI после тестирования
    ganacheProcess.kill();
    console.log('Тестирование успешно завершено');
  } catch (error) {
    console.error(`Ошибка при тестировании контракта: ${error.message}`);
    throw error;
  }
}


module.exports = { testContract };