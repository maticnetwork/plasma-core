let config = require("../utils/config");
let { Web3Adapter } = require("../../packages/plasma/dist/index");
let proof = require("../../packages/plasma/dist/proofs");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(config.MATIC_RPC);
const web3 = new Web3(provider);
let web3AdapterInstance = new Web3Adapter(web3);

proof
  .buildCheckpointRoot(web3AdapterInstance, 5198592, 5198847)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
