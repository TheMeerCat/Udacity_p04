var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "risk manual empower fashion excite gauge supply festival will paddle gorilla used";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 9545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
    },
  },
  compilers: {
    solc: {
      version: "^0.8.13"
    }
  }
};