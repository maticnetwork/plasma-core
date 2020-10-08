let config = require("../utils/config");
let proof = require("../../packages/plasma/dist/proofs");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(config.MATIC_RPC);
const web3 = new Web3(provider);

async function execute() {
  let block = await web3.eth.getBlock(5198688);
  return await proof.serializeBlockHeader(block);
}

execute()
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
