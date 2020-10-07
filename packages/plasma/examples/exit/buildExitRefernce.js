let { Web3Adapter } = require("../../dist/index");
let exit = require("../../dist/exits");
let Web3 = require("web3");

const provider = new Web3.providers.HttpProvider(
  "https://rpc-mumbai.maticvigil.com/v1/10a5a510db38c5c0d9d028f96ff9f4b621554330"
);

const web3 = new Web3(provider);

let web3AdapterInstance = new Web3Adapter(web3);

exit
  .getExitData(
    web3AdapterInstance,
    "0x8b898786c53d458db11bde826714bdd1adf6df554e8d2628cdb53507affc4490"
  )
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
