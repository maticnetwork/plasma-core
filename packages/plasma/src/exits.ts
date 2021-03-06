import rlp from "rlp";

import BN from "bn.js";
import {
  buildBlockHeaderMerkle,
  serializeBlockHeader,
  getReceiptProof,
  getTxProof,
  getReceiptBytes,
  getTxBytes,
} from "./proofs";
import {
  RootChainReadOnly,
  ExitReference,
  ExitPayload,
  Block,
  SerializableTransaction,
  TransactionReceipt,
  ExitData,
} from "./types";
import { IProviderAdapter } from "./adapters/IProviderAdapter";
import { bufferToHex, toBuffer } from "ethereumjs-util";
import assert from "assert";

export async function buildExitReference(
  provider: IProviderAdapter,
  block: Block,
  tx: SerializableTransaction,
  receipt: TransactionReceipt
): Promise<ExitReference> {
  const receiptProof = await getReceiptProof(provider, receipt, block);
  const txProof = await getTxProof(tx, block);
  return {
    receipt: getReceiptBytes(receipt), // rlp encoded
    receiptParentNodes: receiptProof.parentNodes,
    tx: getTxBytes(tx), // rlp encoded
    txParentNodes: txProof.parentNodes,
    path: Buffer.concat([Buffer.from("00", "hex"), receiptProof.path]),
    transactionsRoot: toBuffer(txProof.root),
    receiptsRoot: toBuffer(receiptProof.root),
  };
}

export async function getExitData(
  provider: IProviderAdapter,
  txHash: string
): Promise<ExitData> {
  const exitTx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  const block = await provider.getBlockByHash(receipt.blockHash);

  return {
    tx: exitTx,
    receipt,
    block,
  };
}

export function buildReferenceTxPayload(input: ExitPayload): string {
  return bufferToHex(rlp.encode(_buildReferenceTxPayload(input)));
}

export async function findHeaderBlockNumber(
  rootChain: RootChainReadOnly,
  childBlockNumber: number | string
): Promise<string> {
  const currentChildBlockNumber = new BN(childBlockNumber);
  // first checkpoint id = start * 10000
  const checkpointInterval = new BN(10000);
  const BigOne = new BN(1);
  let start = BigOne;

  // last checkpoint id = end * 10000
  let end = new BN(await rootChain.currentHeaderBlock()).div(
    checkpointInterval
  );

  // binary search on all the checkpoints to find the checkpoint that contains the childBlockNumber
  let ans: BN = new BN(0);
  while (start.lte(end)) {
    if (start.eq(end)) {
      ans = start;
      break;
    }

    const mid = start.add(end).div(new BN(2));

    const searchTerm = mid.mul(checkpointInterval).toString();
    const headerBlock = await rootChain.headerBlocks(searchTerm);
    const headerStart = new BN(headerBlock.start);
    const headerEnd = new BN(headerBlock.end);

    if (
      headerStart.lte(currentChildBlockNumber) &&
      currentChildBlockNumber.lte(headerEnd)
    ) {
      // if childBlockNumber is between the upper and lower bounds of the headerBlock, we found our answer
      ans = mid;
      break;
    } else if (headerStart.gt(currentChildBlockNumber)) {
      // childBlockNumber was checkpointed before this header
      end = mid.sub(BigOne);
    } else if (headerEnd.lt(currentChildBlockNumber)) {
      // childBlockNumber was checkpointed after this header
      start = mid.add(BigOne);
    }
  }

  return ans.mul(checkpointInterval).toString();
}

export async function buildPayloadForExit(
  provider: IProviderAdapter,
  rootChain: RootChainReadOnly,
  txHash: string,
  logEventSig: string,
  offset?: number
): Promise<ExitPayload> {
  // check checkpoint
  const lastChildBlock = await rootChain.getLastChildBlock();
  const { tx, receipt, block } = await getExitData(provider, txHash);

  let txBlockNumber = tx.blockNumber!;
  if (offset) {
    txBlockNumber -= offset;
    block.number -= offset;
  }

  assert.ok(
    new BN(lastChildBlock).gte(new BN(txBlockNumber)),
    "Exit transaction has not been checkpointed as yet"
  );

  const headerBlockNumber = await findHeaderBlockNumber(
    rootChain,
    txBlockNumber
  );
  const headerBlock = await rootChain.headerBlocks(headerBlockNumber);

  const start = parseInt(headerBlock.start, 10);
  const end = parseInt(headerBlock.end, 10);

  const tree = await buildBlockHeaderMerkle(provider, start, end);
  const blockProof = tree.getProof(serializeBlockHeader(block));

  let logIndex = -1;
  if (logEventSig) {
    logIndex = receipt.logs.findIndex(
      (log) => log.topics[0].toLowerCase() === logEventSig.toLowerCase()
    );
    assert.ok(logIndex > -1, "Log not found in receipt");
  }

  return {
    blockNumber: new BN(block.number),
    blockTimestamp: new BN(block.timestamp),
    blockProof,
    headerNumber: new BN(headerBlockNumber),
    createdAt: new BN(headerBlock.createdAt),
    reference: await buildExitReference(provider, block, tx, receipt),
    logIndex,
  };
}

function _buildReferenceTxPayload(input: ExitPayload) {
  const {
    headerNumber,
    blockNumber,
    blockTimestamp,
    blockProof,
    reference,
    logIndex,
  } = input;

  return [
    headerNumber,
    bufferToHex(Buffer.concat(blockProof)),
    blockNumber,
    blockTimestamp,
    bufferToHex(reference.transactionsRoot),
    bufferToHex(reference.receiptsRoot),
    bufferToHex(reference.receipt),
    bufferToHex(rlp.encode(reference.receiptParentNodes)),
    bufferToHex(reference.path), // branch mask,
    logIndex,
  ];
}

export function buildChallengeData(input: ExitPayload): string {
  const data = _buildReferenceTxPayload(input);
  const { reference } = input;
  return bufferToHex(
    rlp.encode(
      data.concat([
        bufferToHex(reference.tx),
        bufferToHex(rlp.encode(reference.txParentNodes)),
      ])
    )
  );
}
