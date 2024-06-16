const solc = require('solc');
const fs = require('fs');

function compileSolidity(contractCode, contractFilePath) {
  console.log('Получен исходный код контракта:', contractCode);
  console.log('Путь к файлу исходного кода:', contractFilePath);

  const input = {
    language: 'Solidity',
    sources: {
      [contractFilePath]: {
        content: contractCode
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object']
        }
      }
    }
  };

  console.log('Конфигурация для компиляции:', JSON.stringify(input, null, 2));

  const compiled = solc.compile(JSON.stringify(input));
  const output = JSON.parse(compiled);

  if (output.errors && output.errors.some(error => error.severity === 'error')) {
    console.error('Компиляция не удалась с ошибками:', output.errors);
    return { errors: output.errors.map(error => error.formattedMessage) };
  }

  const contractName = Object.keys(output.contracts[contractFilePath])[0];
  const compiledContract = output.contracts[contractFilePath][contractName];

  if (!compiledContract) {
    console.error('Компилированный контракт не найден в выводе.');
    return { errors: ['Компилированный контракт не найден'] };
  }

  console.log('Компиляция успешна. ABI:', compiledContract.abi);
  console.log('Bytecode:', compiledContract.evm.bytecode.object);

  return { compiledContract, errors: null };
}

module.exports = {
  compileSolidity
};


