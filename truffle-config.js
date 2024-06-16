
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Любой network id
    },
  },
  compilers: {
    solc: {
      version: "0.8.2", // Версия компилятора Solidity
    },
  },
};