# Transaction Construction

Building a transaction is the direct application of the [UTXO model](/docs/fundamentals/utxos): you select unspent outputs as inputs, create new outputs (recipient and change), and sign to prove ownership. The [transaction lifecycle](/docs/bitcoin/transaction-lifecycle) (create, sign, broadcast, mempool, confirmed) is what your code drives; fee choice ties into the [incentive structure](/docs/fundamentals/incentives) of the network. This guide covers the complete process from UTXO selection to broadcasting.

## Transaction Lifecycle

Understanding the complete lifecycle of a transaction helps contextualize the construction process:

1. **Creation**: User constructs a transaction specifying inputs ([UTXOs](/docs/fundamentals/utxos) to spend) and outputs (recipient addresses and amounts)
2. **Signing**: User signs the transaction with their private key, proving ownership of the inputs
3. **Broadcasting**: Signed transaction is sent to the network
4. **Mempool**: Transaction waits in the mempool (memory pool) of unconfirmed transactions
5. **Selection**: A miner selects the transaction (typically prioritizing higher fees)
6. **Inclusion**: Transaction is included in a candidate block
7. **Mining**: Miner finds valid proof-of-work for the block
8. **Propagation**: New block spreads across the network
9. **Confirmation**: Each subsequent block adds another confirmation, increasing security

A transaction with 6 confirmations is generally considered irreversible.

---

## Transaction Structure

<img src="/images/docs/raw-bitcoin-transacation-byte.jpg" alt="Raw Bitcoin Transaction Bytes" class="doc-img-big" />
<p class="doc-img-legend">Raw Bitcoin Transaction Bytes</p>

**Byte Order:** Most numeric fields (version, value, locktime, sequence, output index) are encoded in little endian. However, transaction IDs (TXIDs) and block hashes are typically *displayed* in big endian (reversed) for readability, even though they're stored internally in little endian. When working with raw transaction data, the `[::-1]` reversal in Python (or equivalent) converts between these formats.

### Size Calculations

Virtual size (vbytes) = (base_size × 3 + total_size) / 4

---

## Building Transactions

<img src="/images/docs/tx-binary-map.png" alt="Transaction Binary Map" class="doc-img-big" />
<p class="doc-img-legend">Transaction Binary Map</p>

:::code-group
```rust
use bitcoin::{Transaction, TxIn, TxOut, OutPoint, Sequence, Amount, ScriptBuf};
use bitcoin::absolute::LockTime;

fn create_transaction(prev_txid: Txid, recipient: ScriptBuf, change: ScriptBuf) -> Transaction {
    Transaction {
        version: 2,
        lock_time: LockTime::ZERO,
        input: vec![TxIn {
            previous_output: OutPoint::new(prev_txid, 0),
            script_sig: ScriptBuf::new(),
            sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
            witness: bitcoin::Witness::default(),
        }],
        output: vec![
            TxOut { value: Amount::from_sat(50000), script_pubkey: recipient },
            TxOut { value: Amount::from_sat(49000), script_pubkey: change },
        ],
    }
}
```

```python
from bitcoin.core import CTransaction, CTxIn, CTxOut, COutPoint

def create_transaction(prev_txid, recipient_script, change_script):
    outpoint = COutPoint(bytes.fromhex(prev_txid)[::-1], 0)
    txin = CTxIn(outpoint)
    txout = CTxOut(50000, recipient_script)
    change = CTxOut(49000, change_script)
    return CTransaction([txin], [txout, change])
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::chain::transaction create_transaction(const bc::hash_digest& prev_txid,
                                          const bc::chain::script& recipient,
                                          const bc::chain::script& change) {
    bc::chain::input input;
    input.set_previous_output({prev_txid, 0});
    input.set_sequence(0xfffffffd); // RBF enabled
    
    bc::chain::transaction tx;
    tx.set_version(2);
    tx.inputs().push_back(input);
    tx.outputs().push_back({50000, recipient});
    tx.outputs().push_back({49000, change});
    return tx;
}
```

```javascript
import * as bitcoin from 'bitcoinjs-lib';

function createTransaction(prevTxid, recipientAddr, changeAddr) {
  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
  
  psbt.addInput({
    hash: prevTxid,
    index: 0,
    witnessUtxo: { script: Buffer.from('0014...', 'hex'), value: 100000 },
  });
  
  psbt.addOutput({ address: recipientAddr, value: 50000 });
  psbt.addOutput({ address: changeAddr, value: 49000 });
  
  // Sign and finalize...
  return psbt;
}
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/txscript"
	"github.com/btcsuite/btcd/wire"
)

func createTransaction(prevTxid string, recipientAddr string, changeAddr string) (*wire.MsgTx, error) {
	tx := wire.NewMsgTx(wire.TxVersion)

	// Add input
	prevTxHash, err := wire.NewHashFromStr(prevTxid)
	if err != nil {
		return nil, err
	}
	txIn := wire.NewTxIn(wire.NewOutPoint(prevTxHash, 0), nil, nil)
	txIn.Sequence = wire.MaxTxInSequenceNum - 2 // Enable RBF
	tx.AddTxIn(txIn)

	// Add recipient output
	recipientAddrDecoded, err := btcutil.DecodeAddress(recipientAddr, &chaincfg.MainNetParams)
	if err != nil {
		return nil, err
	}
	recipientScript, err := txscript.PayToAddrScript(recipientAddrDecoded)
	if err != nil {
		return nil, err
	}
	tx.AddTxOut(wire.NewTxOut(50000, recipientScript))

	// Add change output
	changeAddrDecoded, err := btcutil.DecodeAddress(changeAddr, &chaincfg.MainNetParams)
	if err != nil {
		return nil, err
	}
	changeScript, err := txscript.PayToAddrScript(changeAddrDecoded)
	if err != nil {
		return nil, err
	}
	tx.AddTxOut(wire.NewTxOut(49000, changeScript))

	return tx, nil
}

func main() {
	tx, err := createTransaction("prev_txid", "bc1q...", "bc1q...")
	if err != nil {
		panic(err)
	}
	fmt.Printf("Transaction created with %d inputs and %d outputs\n", len(tx.TxIn), len(tx.TxOut))
}
```
:::

---

## Input Selection

### Coin Selection Algorithms

#### Largest First

```typescript
function largestFirst(utxos: UTXO[], target: number): UTXO[] {
  // Sort by value descending
  const sorted = [...utxos].sort((a, b) => b.value - a.value);
  
  const selected: UTXO[] = [];
  let total = 0;
  
  for (const utxo of sorted) {
    selected.push(utxo);
    total += utxo.value;
    if (total >= target) break;
  }
  
  return total >= target ? selected : [];
}
```

#### Branch and Bound (Exact Match)

```typescript
function branchAndBound(utxos: UTXO[], target: number, maxTries = 100000): UTXO[] | null {
  let tries = 0;
  let bestSelection: UTXO[] | null = null;
  let bestWaste = Infinity;
  
  function search(index: number, selected: UTXO[], total: number): void {
    if (tries++ > maxTries) return;
    
    // Found exact match
    if (total === target) {
      bestSelection = [...selected];
      bestWaste = 0;
      return;
    }
    
    // Over target, calculate waste
    if (total > target) {
      const waste = total - target;
      if (waste < bestWaste) {
        bestSelection = [...selected];
        bestWaste = waste;
      }
      return;
    }
    
    // Try including next UTXO
    if (index < utxos.length) {
      // Include
      selected.push(utxos[index]);
      search(index + 1, selected, total + utxos[index].value);
      selected.pop();
      
      // Exclude
      search(index + 1, selected, total);
    }
  }
  
  search(0, [], 0);
  return bestSelection;
}
```

#### Knapsack

```typescript
function knapsack(utxos: UTXO[], target: number): UTXO[] {
  const n = utxos.length;
  const dp: boolean[][] = Array(n + 1).fill(null)
    .map(() => Array(target + 1).fill(false));
  
  // Base case: sum of 0 is always achievable
  for (let i = 0; i <= n; i++) dp[i][0] = true;
  
  // Fill the table
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= target; j++) {
      dp[i][j] = dp[i - 1][j]; // Don't include
      if (j >= utxos[i - 1].value) {
        dp[i][j] = dp[i][j] || dp[i - 1][j - utxos[i - 1].value];
      }
    }
  }
  
  // Backtrack to find solution
  if (!dp[n][target]) return largestFirst(utxos, target); // Fallback
  
  const selected: UTXO[] = [];
  let remaining = target;
  for (let i = n; i > 0 && remaining > 0; i--) {
    if (!dp[i - 1][remaining]) {
      selected.push(utxos[i - 1]);
      remaining -= utxos[i - 1].value;
    }
  }
  
  return selected;
}
```

---

## Fee Estimation

### Fee Rate Sources

```typescript
async function getFeeRate(): Promise<number> {
  // Option 1: mempool.space API
  const response = await fetch('https://mempool.space/api/v1/fees/recommended');
  const fees = await response.json();
  
  return {
    fast: fees.fastestFee,      // Next block
    medium: fees.halfHourFee,   // ~30 min
    slow: fees.hourFee,         // ~1 hour
    economy: fees.economyFee,   // Low priority
  };
}

// Option 2: Bitcoin Core RPC
async function getFeeRateFromNode(rpc: BitcoinRPC, blocks: number): Promise<number> {
  const result = await rpc.call('estimatesmartfee', [blocks]);
  if (result.feerate) {
    // Convert BTC/kB to sat/vB
    return Math.ceil(result.feerate * 100000);
  }
  throw new Error('Fee estimation failed');
}
```

### Calculating Transaction Fee

```typescript
interface TransactionSizes {
  P2PKH_INPUT: 148,
  P2WPKH_INPUT: 68,
  P2TR_INPUT: 57.5,
  P2PKH_OUTPUT: 34,
  P2WPKH_OUTPUT: 31,
  P2TR_OUTPUT: 43,
  OVERHEAD: 10.5,
}

function estimateFee(
  inputs: { type: string }[],
  outputs: { type: string }[],
  feeRate: number
): number {
  let vSize = TransactionSizes.OVERHEAD;
  
  for (const input of inputs) {
    switch (input.type) {
      case 'P2PKH': vSize += TransactionSizes.P2PKH_INPUT; break;
      case 'P2WPKH': vSize += TransactionSizes.P2WPKH_INPUT; break;
      case 'P2TR': vSize += TransactionSizes.P2TR_INPUT; break;
    }
  }
  
  for (const output of outputs) {
    switch (output.type) {
      case 'P2PKH': vSize += TransactionSizes.P2PKH_OUTPUT; break;
      case 'P2WPKH': vSize += TransactionSizes.P2WPKH_OUTPUT; break;
      case 'P2TR': vSize += TransactionSizes.P2TR_OUTPUT; break;
    }
  }
  
  return Math.ceil(vSize * feeRate);
}
```

---

## Replace-By-Fee (RBF)

### Enabling RBF

```typescript
function createRBFTransaction(psbt: Psbt) {
  // Set sequence to enable RBF (< 0xFFFFFFFE)
  psbt.setInputSequence(0, 0xFFFFFFFD);
  
  // Alternative: Use the constant
  psbt.setInputSequence(0, bitcoin.Transaction.DEFAULT_SEQUENCE - 2);
}
```

### Creating Replacement Transaction

```typescript
function bumpFee(originalTx: Transaction, newFeeRate: number): Psbt {
  const psbt = new bitcoin.Psbt();
  
  // Copy inputs from original transaction
  for (const input of originalTx.ins) {
    psbt.addInput({
      hash: input.hash,
      index: input.index,
      sequence: 0xFFFFFFFD, // RBF enabled
      // Add witness UTXO data...
    });
  }
  
  // Recalculate outputs with higher fee
  const originalFee = calculateFee(originalTx);
  const newVSize = originalTx.virtualSize();
  const newFee = newVSize * newFeeRate;
  const additionalFee = newFee - originalFee;
  
  // Reduce change output by additional fee
  for (let i = 0; i < originalTx.outs.length; i++) {
    const output = originalTx.outs[i];
    if (isChangeOutput(output)) {
      psbt.addOutput({
        script: output.script,
        value: output.value - additionalFee,
      });
    } else {
      psbt.addOutput({
        script: output.script,
        value: output.value,
      });
    }
  }
  
  return psbt;
}
```

---

## Child-Pays-For-Parent (CPFP)

### Creating CPFP Transaction

```typescript
function createCPFPTransaction(
  stuckTx: Transaction,
  stuckTxFee: number,
  targetFeeRate: number
): Psbt {
  // Find our output in the stuck transaction
  const ourOutput = findOurOutput(stuckTx);
  
  // Calculate required fee for both transactions
  const stuckTxVSize = stuckTx.virtualSize();
  const childVSize = 110; // Estimate for simple spend
  const totalVSize = stuckTxVSize + childVSize;
  const totalFeeNeeded = totalVSize * targetFeeRate;
  const childFee = totalFeeNeeded - stuckTxFee;
  
  // Create child transaction
  const psbt = new bitcoin.Psbt();
  
  psbt.addInput({
    hash: stuckTx.getId(),
    index: ourOutput.index,
    witnessUtxo: {
      script: ourOutput.script,
      value: ourOutput.value,
    },
  });
  
  psbt.addOutput({
    address: newAddress,
    value: ourOutput.value - childFee,
  });
  
  return psbt;
}
```

---

## Transaction Batching

### Batch Multiple Payments

```typescript
interface Payment {
  address: string;
  amount: number;
}

function createBatchTransaction(
  utxos: UTXO[],
  payments: Payment[],
  feeRate: number,
  changeAddress: string
): Psbt {
  const psbt = new bitcoin.Psbt();
  
  // Calculate total needed
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Select inputs
  const estimatedFee = estimateBatchFee(utxos.length, payments.length + 1, feeRate);
  const target = totalPayments + estimatedFee;
  const selectedUtxos = selectCoins(utxos, target);
  
  // Add inputs
  let totalInput = 0;
  for (const utxo of selectedUtxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: utxo.script,
        value: utxo.value,
      },
    });
    totalInput += utxo.value;
  }
  
  // Add payment outputs
  for (const payment of payments) {
    psbt.addOutput({
      address: payment.address,
      value: payment.amount,
    });
  }
  
  // Add change output
  const actualFee = estimateBatchFee(selectedUtxos.length, payments.length + 1, feeRate);
  const change = totalInput - totalPayments - actualFee;
  
  if (change > 546) {
    psbt.addOutput({
      address: changeAddress,
      value: change,
    });
  }
  
  return psbt;
}
```

### Benefits of Batching

```
Single transaction to 10 recipients:
- 1 input, 11 outputs (including change)
- ~380 vbytes
- 1 fee payment

10 separate transactions:
- 10 inputs, 20 outputs total
- ~1,100 vbytes total
- 10 fee payments
```

---

## Time Locks

### Absolute Time Lock (nLockTime)

```typescript
function createTimeLocked(lockTime: number): Psbt {
  const psbt = new bitcoin.Psbt();
  
  // Set locktime (block height or Unix timestamp)
  psbt.setLocktime(lockTime);
  
  // Must set sequence < 0xFFFFFFFF to enable locktime
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    sequence: 0xFFFFFFFE,
    witnessUtxo: {
      script: utxo.script,
      value: utxo.value,
    },
  });
  
  psbt.addOutput({
    address: recipient,
    value: amount,
  });
  
  return psbt;
}

// Lock until specific block
createTimeLocked(850000); // Block 850,000

// Lock until specific time (Unix timestamp > 500,000,000)
createTimeLocked(1735689600); // Jan 1, 2025
```

### Relative Time Lock (CSV)

```typescript
function createCSVLocked(blocks: number): Psbt {
  const psbt = new bitcoin.Psbt();
  
  // Set sequence for relative timelock
  // Blocks: blocks (up to 65535)
  // Time: blocks | 0x00400000 (in 512-second units)
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    sequence: blocks, // e.g., 144 for ~1 day
    witnessUtxo: {
      script: utxo.script,
      value: utxo.value,
    },
  });
  
  return psbt;
}
```

---

## Broadcasting Transactions

:::code-group
```rust
use reqwest;

async fn broadcast_transaction(tx_hex: &str) -> Result<String, Box<dyn std::error::Error>> {
    let response = reqwest::Client::new()
        .post("https://mempool.space/api/tx")
        .body(tx_hex.to_string())
        .send().await?;
    Ok(response.text().await?)
}
```

```python
import requests

def broadcast_transaction(tx_hex):
    response = requests.post('https://mempool.space/api/tx', data=tx_hex)
    if response.status_code != 200:
        raise Exception(f"Broadcast failed: {response.text}")
    return response.text  # Returns txid
```

```cpp
#include <curl/curl.h>

std::string broadcast_transaction(const std::string& tx_hex) {
    CURL* curl = curl_easy_init();
    curl_easy_setopt(curl, CURLOPT_URL, "https://mempool.space/api/tx");
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, tx_hex.c_str());
    // ... handle response
    curl_easy_cleanup(curl);
    return txid;
}
```

```javascript
async function broadcastTransaction(txHex) {
  const response = await fetch('https://mempool.space/api/tx', {
    method: 'POST',
    body: txHex,
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.text(); // Returns txid
}
```

```go
package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
)

func broadcastTransaction(txHex string) (string, error) {
	url := "https://mempool.space/api/tx"
	resp, err := http.Post(url, "text/plain", bytes.NewBufferString(txHex))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("broadcast failed: %s", string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil // Returns txid
}

func main() {
	// Example: broadcast a transaction
	txHex := "0100000001..." // Transaction hex
	txid, err := broadcastTransaction(txHex)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Transaction broadcast: %s\n", txid)
}
```
:::

---

## Error Handling

### Common Errors

```typescript
async function safebroadcast(txHex: string): Promise<string> {
  try {
    return await broadcastTransaction(txHex);
  } catch (error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('insufficient fee')) {
      throw new Error('Fee too low. Increase fee rate and retry.');
    }
    if (message.includes('dust')) {
      throw new Error('Output amount too small (below dust limit).');
    }
    if (message.includes('missing inputs') || message.includes('bad-txns-inputs-missingorspent')) {
      throw new Error('Input already spent or does not exist.');
    }
    if (message.includes('txn-mempool-conflict')) {
      throw new Error('Conflicting transaction in mempool. May need RBF.');
    }
    if (message.includes('non-final')) {
      throw new Error('Transaction timelock not yet satisfied.');
    }
    
    throw error;
  }
}
```

---

## Best Practices

### Transaction Construction

1. **Validate All Inputs**: Verify UTXOs exist and are unspent
2. **Calculate Fees Carefully**: Use appropriate fee rate for urgency
3. **Handle Dust**: Don't create outputs below dust limit (~546 sats)
4. **Use RBF**: Enable RBF for flexibility (unless specific reason not to)
5. **Verify Before Signing**: Double-check amounts and addresses

### Security

1. **Test on Testnet**: Always test transaction logic on testnet first
2. **Validate Addresses**: Verify recipient addresses are valid
3. **Check Change Amounts**: Ensure change is calculated correctly
4. **Review Before Broadcast**: Final review of all transaction details

### Optimization

1. **Batch When Possible**: Combine multiple payments into one transaction
2. **Use SegWit/Taproot**: Lower fees for SegWit and Taproot inputs/outputs
3. **Consolidate UTXOs**: During low-fee periods, consolidate small UTXOs
4. **Avoid Unnecessary Outputs**: Minimize output count when possible

---

## Summary

Transaction construction involves:

- **Building**: Creating inputs, outputs, and metadata
- **Coin Selection**: Choosing optimal UTXOs to spend
- **Fee Estimation**: Calculating appropriate fees
- **Signing**: Adding valid signatures
- **Broadcasting**: Submitting to the network

Understanding these fundamentals enables building robust Bitcoin applications that handle funds safely and efficiently.

---

## Related Topics

- [PSBT](/docs/bitcoin-development/psbt) - Partially Signed Bitcoin Transactions
- [Coin Selection](/docs/wallets/coin-selection) - UTXO selection algorithms
- [Address Generation](/docs/bitcoin-development/addresses) - Creating recipient addresses
- [Mempool](/docs/mining/mempool) - Transaction propagation and fees
