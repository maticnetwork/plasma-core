let config = require("../utils/config");
let proof = require("../../packages/plasma/dist/proofs");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(config.MATIC_RPC);
const web3 = new Web3(provider);

async function execute() {
  let receipt = await web3.eth.getTransactionReceipt(
    "0x8b898786c53d458db11bde826714bdd1adf6df554e8d2628cdb53507affc4490"
  );
  return await proof.getReceiptBytes(receipt);
}

execute()
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
