/* In-browser EVM for the Test Lab. Bundled into contractforge-deploy/lab-evm.js (see tools/lab-evm). */
import { createEVM } from '@ethereumjs/evm';
import { MerkleStateManager } from '@ethereumjs/statemanager';
import { Mainnet, Hardfork, createCustomCommon } from '@ethereumjs/common';
import { hexToBytes, bytesToHex, createAddressFromString, createAccount } from '@ethereumjs/util';

const toAddr = (a) => createAddressFromString(a);
const hex = (b) => bytesToHex(b);

export class Lab {
  static async create(opts = {}) {
    const lab = new Lab();
    lab.chainId = opts.chainId || 5042;
    const common = createCustomCommon({ chainId: lab.chainId }, Mainnet, { hardfork: Hardfork.Cancun });
    lab.stateManager = new MerkleStateManager();
    lab.evm = await createEVM({ common, stateManager: lab.stateManager });
    lab.number = 1n;
    lab.timestamp = BigInt(opts.timestamp || Math.floor(Date.now() / 1000));
    lab.coinbase = toAddr('0x00000000000000000000000000000000000000c0');
    return lab;
  }

  /* Every operation runs one after the other: the page may start a balance refresh while a transaction is still running. */
  _enqueue(fn) {
    const run = (this._queue || Promise.resolve()).then(fn);
    this._queue = run.catch(() => {});
    return run;
  }

  _block() {
    return {
      header: {
        number: this.number, timestamp: this.timestamp, gasLimit: 30_000_000n, coinbase: this.coinbase,
        difficulty: 0n, prevRandao: new Uint8Array(32), baseFeePerGas: 0n,
        getBlobGasPrice: () => 1n, cliqueSigner: () => this.coinbase,
      },
    };
  }

  setBalance(addr, wei) { return this._enqueue(() => this._setBalance(addr, wei)); }
  async _setBalance(addr, wei) {
    const a = toAddr(addr);
    let acct = await this.stateManager.getAccount(a);
    if (!acct) acct = createAccount({ nonce: 0n, balance: 0n });
    acct.balance = BigInt(wei);
    await this.stateManager.putAccount(a, acct);
    await this.stateManager.flush();
  }
  getBalance(addr) { return this._enqueue(() => this._getBalance(addr)); }
  async _getBalance(addr) {
    const acct = await this.stateManager.getAccount(toAddr(addr));
    return acct ? acct.balance : 0n;
  }
  setCode(addr, codeHex) { return this._enqueue(() => this._setCode(addr, codeHex)); }
  async _setCode(addr, codeHex) {
    const a = toAddr(addr);
    let acct = await this.stateManager.getAccount(a);
    if (!acct) await this.stateManager.putAccount(a, createAccount({ nonce: 1n, balance: 0n }));
    await this.stateManager.putCode(a, hexToBytes(codeHex));
    await this.stateManager.flush();
  }
  getCode(addr) { return this._enqueue(async () => hex(await this.stateManager.getCode(toAddr(addr)))); }

  setTime(timestamp) { this.timestamp = BigInt(timestamp); }
  advance({ seconds = 0, blocks = 0 } = {}) {
    this.timestamp += BigInt(seconds);
    this.number += BigInt(blocks || (seconds ? 1 : 0));
  }

  /* Runs one transaction. `to` empty = contract creation (data = init code + constructor args). */
  tx(opts) {
    return this._enqueue(async () => {
      try { return await this._run(opts); }
      finally { await this.evm.journal.cleanup(); }   // fresh access lists and journal for the next transaction
    });
  }

  async _run({ from, to, data = '0x', value = 0n, gasLimit = 15_000_000n }) {
    // every transaction is its own block, a moment later than the last one
    this.number += 1n; this.timestamp += 1n;
    const res = await this.evm.runCall({
      caller: toAddr(from), to: to ? toAddr(to) : undefined, data: hexToBytes(data), value: BigInt(value),
      gasLimit: BigInt(gasLimit), block: this._block(), origin: toAddr(from), gasPrice: 0n,
    });
    const er = res.execResult;
    const failed = !!er.exceptionError;
    const logs = (er.logs || []).map(([a, topics, d]) => ({ address: hex(a), topics: topics.map(hex), data: hex(d) }));
    return {
      ok: !failed,
      error: failed ? String(er.exceptionError.error || er.exceptionError) : null,
      returnData: hex(er.returnValue),
      gasUsed: er.executionGasUsed,
      logs: failed ? [] : logs,
      created: res.createdAddress ? res.createdAddress.toString() : null,
    };
  }

  /* Read-only call: runs and rolls back every change (through the EVM's own journal, so it nests correctly). */
  staticCall(opts) { return this._enqueue(() => this._staticCall(opts)); }
  async _staticCall({ from, to, data = '0x', value = 0n, gasLimit = 15_000_000n }) {
    const journal = this.evm.journal;
    await journal.checkpoint();
    const n = this.number, t = this.timestamp;
    try {
      return await this._run({ from, to, data, value, gasLimit });
    } finally {
      await journal.revert();
      await journal.cleanup();
      this.number = n; this.timestamp = t;
    }
  }
}
export { toAddr };
