let { Web3Adapter } = require("../../dist/index");
let exit = require("../../dist/exits");
let Web3 = require("web3");
let rootChainAbi = require("./root-chain-abi.json");

const provider = new Web3.providers.HttpProvider(
  "https://rpc-mumbai.maticvigil.com/v1/10a5a510db38c5c0d9d028f96ff9f4b621554330"
);

const web3 = new Web3(provider);

const rootChainContractInstance = new web3.eth.Contract(
  rootChainAbi,
  "0x2890bA17EfE978480615e330ecB65333b880928e"
);

class RootChainAdapter {
  constructor(rootchain) {
    this.rootchain = rootchain;
  }
  async currentHeaderBlock() {
    const blockNumber = await this.rootchain.methods.currentHeaderBlock();
    return blockNumber.toString();
  }
  async getLastChildBlock() {
    const childBlockNumber = await this.rootchain.methods.getLastChildBlock();
    return childBlockNumber.toString();
  }
  async headerBlocks(blockNumber) {
    const headerBlock = await this.rootchain.methods.headerBlocks(blockNumber);
    return {
      start: headerBlock.start.toString(),
      end: headerBlock.end.toString(),
      createdAt: headerBlock.createdAt.toString(),
    };
  }
}

const rootChainAdapter = new RootChainAdapter(rootChainContractInstance);

exit
  .findHeaderBlockNumber(rootChainAdapter, "5013165")
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
