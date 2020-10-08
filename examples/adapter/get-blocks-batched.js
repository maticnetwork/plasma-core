let config = require("../utils/config");
let { Web3Adapter } = require("../../packages/plasma/dist/index");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(config.MATIC_RPC);
const web3 = new Web3(provider);

let web3AdapterInstance = new Web3Adapter(web3);
web3AdapterInstance
  .getBlocksBatched(5013100, 5013165, true)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
