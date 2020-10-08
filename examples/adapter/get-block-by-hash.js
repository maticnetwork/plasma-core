let config = require("../utils/config");
let { Web3Adapter } = require("../../packages/plasma/dist/index");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(config.MATIC_RPC);
const web3 = new Web3(provider);

let web3AdapterInstance = new Web3Adapter(web3);
web3AdapterInstance
  .getBlockByHash(
    "0x12c2855264a00fdc19ca052ad4aac6bc1377a6d2934e9fed646dcc41406c962c"
  )
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
