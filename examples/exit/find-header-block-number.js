let config = require("../utils/config");
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

exit
  .findHeaderBlockNumber(rootChainAdapter, 5013165)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
