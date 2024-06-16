<<<<<<< HEAD
=======

// truffle-config.js
>>>>>>> 3baae62e600c127962460252bea7200d2bbacd47
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