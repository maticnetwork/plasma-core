let { Web3Adapter } = require("../../dist/index");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(
  "https://rpc-mumbai.maticvigil.com/v1/10a5a510db38c5c0d9d028f96ff9f4b621554330"
);

const web3 = new Web3(provider);

let web3AdapterInstance = new Web3Adapter(web3);
web3AdapterInstance
  .getBlock(5013165, false)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
