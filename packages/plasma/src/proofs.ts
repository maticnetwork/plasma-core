let Trie = require("merkle-patricia-tree");
let EthereumTransaction = require("ethereumjs-tx");
import rlp from "rlp";

import BN from "bn.js";
import { keccak256, toBuffer, bufferToHex, setLengthLeft } from "ethereumjs-util";
import { MerkleTree } from "./merkle";
import {
  Block,
  SerializableTransaction,
  TransactionReceipt,
  ExitProof,
} from "./types";
import { IProviderAdapter } from "./adapters/IProviderAdapter";

export function serializeBlockHeader(block: Block): Buffer {
  const n = new BN(block.number).toArrayLike(Buffer, "be", 32);
  const ts = new BN(block.timestamp).toArrayLike(Buffer, "be", 32);
  const txRoot = toBuffer(block.transactionsRoot);
  const receiptsRoot = toBuffer(block.receiptsRoot);
  return keccak256(Buffer.concat([n, ts, txRoot, receiptsRoot]));
}

export async function buildCheckpointRoot(
  provider: IProviderAdapter,
  start: number,
  end: number
): Promise<string> {
  const tree = await buildBlockHeaderMerkle(provider, start, end);
  return bufferToHex(tree.getRoot());
}

export async function buildBlockProof(
  provider: IProviderAdapter,
  start: number,
  end: number,
  blockNumber: number
): Promise<string> {
  const tree = await buildBlockHeaderMerkle(provider, start, end);
  const proof = tree.getProof(
    serializeBlockHeader(await provider.getBlock(blockNumber, true))
  );
  return bufferToHex(Buffer.concat(proof));
}

export async function buildBlockHeaderMerkle(
  provider: IProviderAdapter,
  start: number,
  end: number,
  offset?: number
): Promise<MerkleTree> {
  const blocks = await provider.getBlocksBatched(start, end, false, offset);
  return new MerkleTree(blocks.map((b) => serializeBlockHeader(b)));
}

async function findProof(
  trie: any,
  key: Buffer,
  blockHash?: string
): Promise<ExitProof> {
  const path: {
    node: any;
    stack: any[];
    reminder: any[];
  } = await new Promise((resolve, reject) => {
    trie.findPath(
      key,
      (err: any, rawTxNode: any, reminder: any[], stack: any) => {
        if (err) {
          return reject(err);
        }

        if (reminder.length > 0) {
          return reject(new Error("Node does not contain the key"));
        }

        resolve({
          node: rawTxNode,
          reminder,
          stack,
        });
      }
    );
  });

  const proof = path.stack.map((s) => s.raw);

  return {
    blockHash: toBuffer(blockHash),
    parentNodes: proof,
    root: toBuffer(trie.root),
    path: key,
    value: rlp.decode(path.node.value),
  };
}

function getTriePath(data: { transactionIndex: number | BN | null }): Buffer {
  return rlp.encode(data.transactionIndex);
}

export async function getTxProof(
  tx: SerializableTransaction,
  block: Block
): Promise<ExitProof> {
  const stateSyncTxHash = bufferToHex(getStateSyncTxHash(block))

  const txTrie = new Trie();
  for (let i = 0; i < block.transactions.length; i++) {
    const siblingTx = block.transactions[i];
    if (siblingTx.hash === stateSyncTxHash) {
      // ignore if tx hash is bor state-sync tx
      continue
    }
    await new Promise((resolve, reject) => {
      txTrie.put(getTriePath(siblingTx), getTxBytes(siblingTx), (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  return findProof(txTrie, getTriePath(tx), tx.blockHash);
}

export function getTxBytes(tx: SerializableTransaction): Buffer {
  const txObj = new EthereumTransaction(tx);
  return txObj.serialize();
}

export async function getReceiptProof(
  provider: IProviderAdapter,
  receipt: TransactionReceipt,
  block: Block,
  receipts?: TransactionReceipt[]
): Promise<ExitProof> {
  const receiptsTrie = new Trie();
  const receiptPromises: Promise<TransactionReceipt>[] = [];
  const stateSyncTxHash = bufferToHex(getStateSyncTxHash(block))

  if (!receipts) {
    block.transactions.forEach((tx) => {
      if (tx.hash === stateSyncTxHash) {
        // ignore if tx hash is bor state-sync tx
        return
      }
      receiptPromises.push(provider.getTransactionReceipt(tx.hash));
    });
    receipts = await Promise.all(receiptPromises);
  }

  for (let i = 0; i < receipts.length; i++) {
    const siblingReceipt = receipts[i];
    if (siblingReceipt.transactionHash === stateSyncTxHash) {
      // ignore if tx hash is bor state-sync tx
      continue
    }
    await new Promise((resolve, reject) => {
      receiptsTrie.put(
        getTriePath(siblingReceipt),
        getReceiptBytes(siblingReceipt),
        (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  return findProof(receiptsTrie, getTriePath(receipt), receipt.blockHash);
}

export function getReceiptBytes(receipt: TransactionReceipt): Buffer {
  return rlp.encode([
    toBuffer(receipt.status ? "0x1" : "0x0"),
    toBuffer(receipt.cumulativeGasUsed),
    toBuffer(receipt.logsBloom),
    // encoded log array
    receipt.logs.map((l) => {
      // [address, [topics array], data]
      return [
        toBuffer(l.address), // convert address to buffer
        l.topics.map(toBuffer), // convert topics to buffer
        toBuffer(l.data), // convert data to buffer
      ];
    }),
  ]);
}

// getStateSyncTxHash returns tx hash for block's tx hash for state-sync receipt
// Bor blockchain includes extra receipt/tx for state-sync logs,
// but it is not included in transactionRoot or receiptRoot. 
// So, while calculating proof, we have to exclude them.
//
// Tx hash for state-sync is derived from block's hash and number
// state-sync tx hash = keccak256("matic-bor-receipt-" + block.number + block.hash)
export function getStateSyncTxHash(block: Block): Buffer {
  return keccak256(
    Buffer.concat([
      toBuffer("matic-bor-receipt-"), // prefix for bor receipt
      setLengthLeft(toBuffer(block.number), 8), // 8 bytes of block number (BigEndian)
      toBuffer(block.hash), // block hash
    ])
  )
}