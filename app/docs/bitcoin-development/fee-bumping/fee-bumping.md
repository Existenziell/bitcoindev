# Fee Bumping

When a [transaction](/docs/bitcoin-development/transactions) is stuck in the [mempool](/docs/mining/mempool) because the fee rate is too low, you can increase the effective fee using **Replace-by-Fee (RBF)** or **Child Pays for Parent (CPFP)**. This page is a developer-focused guide: when to use which, how to signal RBF, and how to build replacement or child transactions in code. For the protocol rules and fee market, see [Transaction Fees](/docs/bitcoin/transaction-fees) and [Mempool](/docs/mining/mempool).

## When to Use RBF vs CPFP

| Situation | Use |
|-----------|-----|
| You are the **sender** and control the inputs | **RBF**: Create a replacement transaction that pays a higher fee (must meet [BIP 125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki) rules). |
| You are the **recipient** and the sender did not enable RBF (or you cannot replace) | **CPFP**: Spend an output of the stuck transaction with a high-fee child so miners include both. |
| [Lightning](/docs/lightning) or other L2 | Implementations use both RBF and CPFP (and package RBF where available) to bump commitment or HTLC transactions. |

## RBF: Replace-by-Fee

To allow RBF, the **original** transaction must signal replaceability: at least one input has `nSequence` &lt; `0xfffffffe` (e.g. `0xfffffffd`). Then you can broadcast a **replacement** that spends the same inputs, pays strictly higher fee (and higher fee rate), and obeys BIP 125 (no new unconfirmed inputs, no new outputs, no reduced output amounts). Full RBF (replace any unconfirmed tx) is a **policy** option on some nodes; see Transaction Fees.

### Enabling RBF on an Input

:::code-group
```rust
use bitcoin::Sequence;

// When building an input, set sequence for RBF
let sequence = Sequence::ENABLE_RBF_NO_LOCKTIME; // 0xfffffffd
```

```python
# When building transaction inputs
SEQUENCE_RBF = 0xfffffffd  # nSequence < 0xfffffffe signals replaceable
txin = CTxIn(prevout=outpoint, scriptSig=b'', nSequence=SEQUENCE_RBF)
```

```cpp
// When building inputs
const uint32_t SEQUENCE_RBF = 0xfffffffd;
input.set_sequence(SEQUENCE_RBF);
```

```go
import "github.com/btcsuite/btcd/wire"

// When building inputs
txIn.Sequence = wire.MaxTxInSequenceNum - 2 // 0xfffffffd; enables RBF
```

```javascript
// When building PSBT or transaction
const SEQUENCE_RBF = 0xfffffffd;
psbt.setInputSequence(inputIndex, SEQUENCE_RBF);
```
:::

### Creating a Replacement (RBF) Transaction

Build a new transaction with the **same inputs** and **same outputs** (or reduced change to pay higher fee). Sign again and broadcast. The replacement must pay a **higher total fee** and **higher fee rate** than the original.

:::code-group
```rust
// Concept: copy original tx inputs and outputs; reduce change output by (new_fee - old_fee)
use bitcoin::{Transaction, Sequence, Amount};

fn create_rbf_replacement(
    original: &Transaction,
    new_fee_rate_sat_per_vb: u64,
    change_index: usize,
    estimate_vsize: fn(&Transaction) -> u64,
) -> Transaction {
    let mut tx = original.clone();
    for inp in tx.input.iter_mut() {
        inp.sequence = Sequence::ENABLE_RBF_NO_LOCKTIME;
    }
    let sum_outputs: u64 = original.output.iter().map(|o| o.value.to_sat()).sum();
    let old_fee: u64 = 0; // set from sum of input values (from your UTXO set) - sum_outputs
    let new_fee = estimate_vsize(&tx) * new_fee_rate_sat_per_vb;
    let extra = new_fee.saturating_sub(old_fee);
    tx.output[change_index].value = Amount::from_sat(
        tx.output[change_index].value.to_sat().saturating_sub(extra),
    );
    tx
}
```

```python
def create_rbf_replacement(original_tx, new_fee_rate_sat_per_vb, change_index: int):
    import copy
    tx = copy.deepcopy(original_tx)
    for inp in tx.vin:
        inp.nSequence = 0xfffffffd
    old_fee = sum_in_values(tx) - sum_out_values(tx)
    new_fee = estimate_vsize(tx) * new_fee_rate_sat_per_vb
    extra = new_fee - old_fee
    tx.vout[change_index].nValue -= extra
    return tx
```

```cpp
Transaction create_rbf_replacement(const Transaction& original, uint64_t new_fee_rate) {
    Transaction tx = original;
    for (auto& inp : tx.inputs())
        inp.set_sequence(0xfffffffd);
    uint64_t old_fee = sum_inputs(original) - sum_outputs(original);
    uint64_t new_fee = estimate_vsize(tx) * new_fee_rate;
    uint64_t extra = new_fee - old_fee;
    tx.outputs()[change_index].value -= extra;
    return tx;
}
```

```go
func createRBFReplacement(original *wire.MsgTx, newFeeRateSatPerVb uint64, changeIndex int) *wire.MsgTx {
	tx := cloneTx(original)
	for _, inp := range tx.TxIn {
		inp.Sequence = wire.MaxTxInSequenceNum - 2
	}
	oldFee := sumInputs(original) - sumOutputs(original)
	newFee := estimateVsize(tx) * newFeeRateSatPerVb
	extra := newFee - oldFee
	tx.TxOut[changeIndex].Value -= int64(extra)
	return tx
}
```

```javascript
function createRBFReplacement(originalTx, newFeeRateSatPerVb, changeIndex) {
  const tx = cloneTx(originalTx);
  tx.ins.forEach(inp => { inp.sequence = 0xfffffffd; });
  const oldFee = sumInputs(originalTx) - sumOutputs(originalTx);
  const newFee = estimateVsize(tx) * newFeeRateSatPerVb;
  const extra = newFee - oldFee;
  tx.outs[changeIndex].value -= extra;
  return tx;
}
```
:::

## CPFP: Child Pays for Parent

If you **received** an output from the stuck transaction, you can create a **child** transaction that spends that output and attaches a high fee. Miners evaluate the package (parent + child) by combined fee and size; a high-fee child makes the package profitable so they include both.

### Creating a CPFP Child Transaction

:::code-group
```rust
// You control an output of the stuck (parent) tx. Build a child that spends that output
// and pays a fee high enough so (parent_fee + child_fee) / (parent_vsize + child_vsize) >= target_rate
use bitcoin::{Transaction, TxIn, TxOut, OutPoint, Amount};

fn create_cpfp_child(
    parent_txid: Txid,
    parent_out_index: u32,
    parent_out_value: Amount,
    parent_out_script: ScriptBuf,
    our_change_script: ScriptBuf,
    target_fee_rate_sat_per_vb: u64,
    parent_vsize: u32,
    parent_fee: u64,
) -> Transaction {
    let child_vsize_est = 110u32; // e.g. one P2WPKH input, one output
    let total_vsize = parent_vsize + child_vsize_est;
    let total_fee_needed = (total_vsize as u64) * target_fee_rate_sat_per_vb;
    let child_fee = total_fee_needed.saturating_sub(parent_fee);
    let to_our_change = parent_out_value - Amount::from_sat(child_fee);
    Transaction {
        version: 2,
        lock_time: LockTime::ZERO,
        input: vec![TxIn {
            previous_output: OutPoint::new(parent_txid, parent_out_index),
            script_sig: ScriptBuf::new(),
            sequence: Sequence::MAX,
            witness: Default::default(),
        }],
        output: vec![TxOut { value: to_our_change, script_pubkey: our_change_script }],
    }
}
```

```python
def create_cpfp_child(
    parent_txid, parent_out_index, parent_out_value, parent_out_script,
    our_change_script, target_fee_rate_sat_per_vb, parent_vsize, parent_fee
):
    child_vsize_est = 110
    total_vsize = parent_vsize + child_vsize_est
    total_fee_needed = total_vsize * target_fee_rate_sat_per_vb
    child_fee = total_fee_needed - parent_fee
    to_change = parent_out_value - child_fee
    return CTransaction(
        [CTxIn(COutPoint(parent_txid, parent_out_index))],
        [CTxOut(to_change, our_change_script)],
    )
```

```cpp
Transaction create_cpfp_child(
    const uint256& parent_txid, uint32_t parent_out_index, int64_t parent_out_value,
    const CScript& parent_out_script, const CScript& our_change_script,
    uint64_t target_fee_rate, uint32_t parent_vsize, uint64_t parent_fee)
{
    uint32_t child_vsize_est = 110;
    uint64_t total_fee_needed = (parent_vsize + child_vsize_est) * target_fee_rate;
    uint64_t child_fee = total_fee_needed - parent_fee;
    CTransaction child;
    child.vin.push_back(CTxIn(COutPoint(parent_txid, parent_out_index)));
    child.vout.push_back(CTxOut(parent_out_value - child_fee, our_change_script));
    return child;
}
```

```go
func createCPFPChild(
	parentTxid *chainhash.Hash, parentOutIndex uint32, parentOutValue int64,
	parentOutScript, ourChangeScript []byte,
	targetFeeRateSatPerVb uint64, parentVsize uint32, parentFee uint64,
) *wire.MsgTx {
	childVsizeEst := uint32(110)
	totalFeeNeeded := (parentVsize + childVsizeEst) * targetFeeRateSatPerVb
	childFee := totalFeeNeeded - parentFee
	tx := wire.NewMsgTx(wire.TxVersion)
	tx.AddTxIn(wire.NewTxIn(wire.NewOutPoint(parentTxid, parentOutIndex), nil, nil))
	tx.AddTxOut(wire.NewTxOut(parentOutValue-int64(childFee), ourChangeScript))
	return tx
}
```

```javascript
function createCPFPChild(
  parentTxid, parentOutIndex, parentOutValue, parentOutScript,
  ourChangeScript, targetFeeRateSatPerVb, parentVsize, parentFee
) {
  const childVsizeEst = 110;
  const totalFeeNeeded = (parentVsize + childVsizeEst) * targetFeeRateSatPerVb;
  const childFee = totalFeeNeeded - parentFee;
  const psbt = new bitcoin.Psbt();
  psbt.addInput({
    hash: parentTxid,
    index: parentOutIndex,
    witnessUtxo: { script: parentOutScript, value: parentOutValue },
  });
  psbt.addOutput({ script: ourChangeScript, value: parentOutValue - childFee });
  return psbt;
}
```
:::

## Package Relay and Package RBF

[Package relay](https://github.com/bitcoin/bips/blob/master/bip-0329.mediawiki) and **package RBF** allow nodes to accept and relay a **package** (e.g. parent + child) as a unit and, for package RBF, to replace a package with a new one. These are optional node policies (e.g. Bitcoin Core); they help Lightning and other L2 protocols fee-bump reliably. See Transaction Fees for links to BIPs.

## Related Topics

- Transaction Fees - RBF/CPFP rules and fee market
- [Transaction Construction](/docs/bitcoin-development/transactions) - Building and signing transactions
- Mempool - How unconfirmed transactions are stored and selected
- [Fee Estimation](/docs/bitcoin-development/fee-estimation) - Getting a target fee rate
