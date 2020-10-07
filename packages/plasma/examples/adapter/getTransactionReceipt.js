let { Web3Adapter } = require("../../dist/index");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(
  "https://goerli.infura.io/v3/5687b932e64441e5a297a0bfba8895cd"
);
const web3 = new Web3(provider);

let web3AdapterInstance = new Web3Adapter(web3);
web3AdapterInstance
  .getTransactionReceipt(
    "0xb45f2a84346efebc2d6f36edf690e6dda617907589cb43d310164100e5c4e493"
  )
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
