class RootChainAdapter {
  constructor(rootchain) {
    this.rootchain = rootchain;
  }
  async currentHeaderBlock() {
    const blockNumber = await this.rootchain.methods
      .currentHeaderBlock()
      .call();
    return blockNumber.toString();
  }
  async getLastChildBlock() {
    const childBlockNumber = await this.rootchain.methods
      .getLastChildBlock()
      .call();
    return childBlockNumber.toString();
  }
  async headerBlocks(blockNumber) {
    const headerBlock = await this.rootchain.methods
      .headerBlocks(blockNumber)
      .call();
    return {
      start: headerBlock.start.toString(),
      end: headerBlock.end.toString(),
      createdAt: headerBlock.createdAt.toString(),
    };
  }
}

module.exports = RootChainAdapter;
