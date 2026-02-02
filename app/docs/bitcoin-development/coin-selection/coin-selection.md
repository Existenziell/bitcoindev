# Coin Selection

When building a [transaction](/docs/bitcoin-development/transactions), you must choose which [UTXOs](/docs/fundamentals/utxos) to spend so that their total value covers the payment amount plus [fees](/docs/bitcoin/transaction-fees). Coin selection is the process of picking those inputs and, when necessary, creating a **change** output back to your wallet. This page focuses on implementation: effective value, fee budget, and a simple selection loop. For algorithms (e.g. branch-and-bound, privacy-aware strategies) and wallet UX, see [Coin Selection](/docs/wallets/coin-selection) in Wallet Development. For fee rate sources, see [Fee Estimation](/docs/bitcoin-development/fee-estimation).

## The Problem

Given:

- A set of available UTXOs (each with amount and script/address type, so you can compute input size)
- A payment amount (in satoshis)
- A target fee rate (sat/vB)

You must:

1. Select inputs such that total input value ≥ payment amount + fee for the transaction
2. Optionally create a change output if input value exceeds payment + fee (and change is above dust)

Fee depends on transaction size (inputs + outputs), so in practice you may iterate: pick inputs, estimate size, compute fee, then adjust (e.g. add one more input or reduce change).

## Effective Value

The **effective value** of a UTXO is its amount minus the cost to spend it at a given fee rate:

```text
effective_value = amount - (input_vbytes × fee_rate)
```

Input size (vbytes) depends on the script type (e.g. P2PKH ~148, P2WPKH ~68, P2TR ~57.5). At high fee rates, small UTXOs can have negative effective value and should be excluded from selection.

:::code-group
```rust
/// input_vbytes for common types: P2PKH 148, P2WPKH 68, P2TR ~57
fn input_vbytes(script_type: &str) -> u32 {
    match script_type {
        "p2pkh" => 148,
        "p2wpkh" => 68,
        "p2tr" => 57,
        _ => 148,
    }
}

fn effective_value(amount_sats: u64, input_vb: u32, fee_rate_sat_per_vb: u64) -> i64 {
    let cost = (input_vb as u64) * fee_rate_sat_per_vb;
    amount_sats as i64 - cost as i64
}
```

```python
def input_vbytes(script_type: str) -> int:
    sizes = {"p2pkh": 148, "p2wpkh": 68, "p2tr": 57}
    return sizes.get(script_type, 148)

def effective_value(amount_sats: int, input_vb: int, fee_rate_sat_per_vb: int) -> int:
    cost = input_vb * fee_rate_sat_per_vb
    return amount_sats - cost
```

```cpp
uint32_t input_vbytes(const std::string& script_type) {
    if (script_type == "p2pkh") return 148;
    if (script_type == "p2wpkh") return 68;
    if (script_type == "p2tr") return 57;
    return 148;
}

int64_t effective_value(uint64_t amount_sats, uint32_t input_vb, uint64_t fee_rate_sat_per_vb) {
    uint64_t cost = input_vb * fee_rate_sat_per_vb;
    return static_cast<int64_t>(amount_sats) - static_cast<int64_t>(cost);
}
```

```go
func inputVbytes(scriptType string) uint32 {
	switch scriptType {
	case "p2pkh": return 148
	case "p2wpkh": return 68
	case "p2tr": return 57
	default: return 148
	}
}

func effectiveValue(amountSats uint64, inputVb uint32, feeRateSatPerVb uint64) int64 {
	cost := uint64(inputVb) * feeRateSatPerVb
	return int64(amountSats) - int64(cost)
}
```

```javascript
function inputVbytes(scriptType) {
  const sizes = { p2pkh: 148, p2wpkh: 68, p2tr: 57 };
  return sizes[scriptType] ?? 148;
}

function effectiveValue(amountSats, inputVb, feeRateSatPerVb) {
  const cost = inputVb * feeRateSatPerVb;
  return Number(amountSats) - Number(cost);
}
```
:::

## Simple Selection: Cover Amount + Fee

A minimal approach: sort UTXOs by effective value (or amount), then greedily add inputs until total input value ≥ payment + estimated fee. Estimate fee from a baseline size (e.g. one input, two outputs: payment + change) then add per-input size for each selected input.

:::code-group
```rust
#[derive(Clone)]
struct Utxo {
    amount: u64,
    input_vb: u32,
}

fn select_coins(
    utxos: &[Utxo],
    payment_sats: u64,
    fee_rate_sat_per_vb: u64,
    output_vb: u32,
) -> Option<(Vec<Utxo>, u64)> {
    let mut selected = Vec::new();
    let mut total: u64 = 0;
    let mut est_vb = 10u32 + output_vb + 31;
    for u in utxos.iter() {
        selected.push(u.clone());
        total += u.amount;
        est_vb += u.input_vb;
        let fee = (est_vb as u64) * fee_rate_sat_per_vb;
        if total >= payment_sats + fee {
            let change = total - payment_sats - fee;
            if change >= 546 || change == 0 {
                return Some((selected, change));
            }
        }
    }
    None
}
```

```python
def select_coins(utxos: list[dict], payment_sats: int, fee_rate_sat_per_vb: int, output_vb: int = 31) -> tuple[list, int] | None:
    est_vb = 10 + output_vb + 31
    selected = []
    total = 0
    for u in utxos:
        selected.append(u)
        total += u["amount"]
        est_vb += u["input_vb"]
        fee = est_vb * fee_rate_sat_per_vb
        if total >= payment_sats + fee:
            change = total - payment_sats - fee
            if change >= 546 or change == 0:
                return selected, change
    return None
```

```cpp
struct Utxo {
    uint64_t amount;
    uint32_t input_vb;
};

std::optional<std::pair<std::vector<Utxo>, uint64_t>> select_coins(
    const std::vector<Utxo>& utxos,
    uint64_t payment_sats,
    uint64_t fee_rate_sat_per_vb,
    uint32_t output_vb = 31) {
    uint32_t est_vb = 10 + output_vb + 31;
    std::vector<Utxo> selected;
    uint64_t total = 0;
    for (const auto& u : utxos) {
        if (total >= payment_sats) {
            uint64_t fee = est_vb * fee_rate_sat_per_vb;
            if (total >= payment_sats + fee) {
                uint64_t change = total - payment_sats - fee;
                if (change >= 546 || change == 0)
                    return std::make_pair(selected, change);
            }
        }
        selected.push_back(u);
        total += u.amount;
        est_vb += u.input_vb;
    }
    uint64_t fee = est_vb * fee_rate_sat_per_vb;
    if (total >= payment_sats + fee) {
        uint64_t change = total - payment_sats - fee;
        if (change >= 546 || change == 0)
            return std::make_pair(selected, change);
    }
    return std::nullopt;
}
```

```go
type Utxo struct {
	Amount   uint64
	InputVb  uint32
}

func selectCoins(utxos []Utxo, paymentSats, feeRateSatPerVb uint64, outputVb uint32) ([]Utxo, uint64, bool) {
	estVb := 10 + outputVb + 31
	var selected []Utxo
	var total uint64
	for _, u := range utxos {
		if total >= paymentSats {
			fee := estVb * feeRateSatPerVb
			if total >= paymentSats+fee {
				change := total - paymentSats - fee
				if change >= 546 || change == 0 {
					return selected, change, true
				}
			}
		}
		selected = append(selected, u)
		total += u.Amount
		estVb += u.InputVb
	}
	fee := estVb * feeRateSatPerVb
	if total >= paymentSats+fee {
		change := total - paymentSats - fee
		if change >= 546 || change == 0 {
			return selected, change, true
		}
	}
	return nil, 0, false
}
```

```javascript
function selectCoins(utxos, paymentSats, feeRateSatPerVb, outputVb = 31) {
  let estVb = 10 + outputVb + 31;
  const selected = [];
  let total = 0;
  for (const u of utxos) {
    if (total >= paymentSats) {
      const fee = estVb * feeRateSatPerVb;
      if (total >= paymentSats + fee) {
        const change = total - paymentSats - fee;
        if (change >= 546 || change === 0) return { selected, change };
      }
    }
    selected.push(u);
    total += u.amount;
    estVb += u.inputVb;
  }
  const fee = estVb * feeRateSatPerVb;
  if (total >= paymentSats + fee) {
    const change = total - paymentSats - fee;
    if (change >= 546 || change === 0) return { selected, change };
  }
  return null;
}
```
:::

## Change Output

If selected inputs exceed payment + fee, the remainder is **change**. Create a new output (to an address you control) for that amount. If the remainder is below the [dust](/docs/bitcoin/transaction-fees) threshold (e.g. 546 sats), you may add it to the fee (no change output) to avoid an unspendable output. In the snippets above, we only allow change ≥ 546 or exactly 0.

## Integration with Transaction Building

Use the selected UTXOs as inputs and amounts in your [transaction](/docs/bitcoin-development/transactions): one output for the payment, and one for change (if any). Fee = sum(inputs) - sum(outputs). Get the fee rate from [Fee Estimation](/docs/bitcoin-development/fee-estimation).

## Related Topics

- [Coin Selection](/docs/wallets/coin-selection) - Algorithms, privacy, and wallet design
- [Transaction Construction](/docs/bitcoin-development/transactions) - Building the transaction from selected UTXOs
- [Fee Estimation](/docs/bitcoin-development/fee-estimation) - Getting fee rate (sat/vB)
- [Transaction Fees](/docs/bitcoin/transaction-fees) - Fee market and dust
- [UTXO Model](/docs/fundamentals/utxos) - What UTXOs are and how they are spent
