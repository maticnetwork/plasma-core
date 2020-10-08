let config = require("../utils/config");
let { Web3Adapter } = require("../../packages/plasma/dist/index");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(config.MATIC_RPC);
const web3 = new Web3(provider);

let web3AdapterInstance = new Web3Adapter(web3);
web3AdapterInstance
  .getTransactionReceipt(
    "0x8b898786c53d458db11bde826714bdd1adf6df554e8d2628cdb53507affc4490"
  )
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
