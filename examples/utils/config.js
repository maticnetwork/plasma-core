let path = require("path");
let dotenv = require("dotenv");

// load config env
let root = path.normalize(`${__dirname}/..`);
let fileName = "/.env";

const configFile = `${root}${fileName}`;
dotenv.config({ path: configFile, silent: true });

module.exports = {
  MATIC_RPC: process.env.MATIC_RPC,
  MAINCHAIN_RPC: process.env.MAINCHAIN_RPC,
};
