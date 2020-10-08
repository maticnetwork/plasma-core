let config = require("../utils/config");
let { Web3Adapter } = require("../../packages/plasma/dist/index");
let exit = require("../../packages/plasma/dist/exits");
let Web3 = require("web3");
let rootChainAbi = require("../utils/root-chain-abi.json");
let RootChainAdapter = require("../utils/root-chain-adapter");

const provider = new Web3.providers.HttpProvider(config.MAINCHAIN_RPC);
const web3 = new Web3(provider);

const rootChainContractInstance = new web3.eth.Contract(
  rootChainAbi,
  "0x2890bA17EfE978480615e330ecB65333b880928e"
);
const rootChainAdapter = new RootChainAdapter(rootChainContractInstance);

const child_provider = new Web3.providers.HttpProvider(config.MATIC_RPC);
const child_web3 = new Web3(child_provider);
let web3AdapterInstance = new Web3Adapter(child_web3);

async function execute() {
  let receipt = await web3.eth.getTransactionReceipt(
    "0x8b898786c53d458db11bde826714bdd1adf6df554e8d2628cdb53507affc4490"
  );

  let payload = await exit.buildPayloadForExit(
    web3AdapterInstance,
    rootChainAdapter,
    "0x8b898786c53d458db11bde826714bdd1adf6df554e8d2628cdb53507affc4490",
    receipt
  );

  return await exit.buildReferenceTxPayload(payload);
}

execute()
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
