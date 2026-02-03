# Transaction Creation

Creating Bitcoin transactions programmatically involves selecting inputs, creating outputs, calculating fees, signing, and broadcasting. This guide covers the complete process.

## Transaction Structure

### Basic Components

```
Transaction:
  Version: 4 bytes
  Input Count: VarInt
  Inputs: Array of inputs
  Output Count: VarInt
  Outputs: Array of outputs
  Locktime: 4 bytes
  Witness: (if SegWit)
```

### Input Structure

```
Input:
  Previous TXID: 32 bytes
  Previous Output Index: 4 bytes
  Script Length: VarInt
  Script: Variable
  Sequence: 4 bytes
```

### Output Structure

```
Output:
  Value: 8 bytes (satoshis)
  Script Length: VarInt
  Script: Variable (typically 22-34 bytes)
```

### Serializing a Transaction Output

:::code-group
```rust
use bech32::{self, FromBase32, ToBase32};

struct Output {
    value: u64,
    witness_version: u8,
    witness_data: Vec<u8>,
}

impl Output {
    fn new() -> Self {
        Self {
            value: 0,
            witness_version: 0,
            witness_data: Vec::new(),
        }
    }

    /// Create output from address and value in satoshis
    fn from_options(addr: &str, value: u64) -> Result<Self, bech32::Error> {
        let (hrp, data, variant) = bech32::decode(addr)?;
        
        let witness_version = data[0].to_u8();
        let witness_program = Vec::<u8>::from_base32(&data[1..])?;
        
        Ok(Self {
            value,
            witness_version,
            witness_data: witness_program,
        })
    }

    /// Serialize output for transaction
    fn serialize(&self) -> Vec<u8> {
        let mut r = Vec::new();
        
        // Value: 8 bytes (little-endian)
        r.extend_from_slice(&self.value.to_le_bytes());
        
        // Script length
        let script_length = 1 + 1 + self.witness_data.len();
        r.push(script_length as u8);
        
        // Witness version + data length + witness data
        r.push(self.witness_version);
        r.push(self.witness_data.len() as u8);
        r.extend_from_slice(&self.witness_data);
        
        r
    }
}
```

```python
from struct import pack
from bech32py import bech32

class Output:
    def __init__(self):
        self.value = 0
        self.witness_version = 0
        self.witness_data = b""

    @classmethod
    def from_options(cls, addr: str, value: int):
        """Create output from address and value in satoshis."""
        self = cls()
        # Decode bech32 address to get witness version and program
        hrp, data = bech32.decode(addr)
        self.witness_version = data[0]
        # Convert 5-bit values to 8-bit bytes
        witness_program = bech32.convertbits(data[1:], 5, 8, False)
        self.witness_data = bytes(witness_program)
        self.value = value
        return self

    def serialize(self):
        """Serialize output for transaction."""
        r = b""
        # Value: 8 bytes (little-endian)
        r += pack("<Q", self.value)
        # Script length
        script_length = 1 + 1 + len(self.witness_data)
        r += pack("<B", script_length)
        # Witness version + data length + witness data
        r += pack("<B", self.witness_version)
        r += pack("<B", len(self.witness_data))
        r += self.witness_data
        return r
```

```cpp
#include <vector>
#include <string>
#include <cstdint>
#include <bech32.h>  // Assumes a bech32 library

class Output {
public:
    uint64_t value = 0;
    uint8_t witness_version = 0;
    std::vector<uint8_t> witness_data;

    Output() = default;

    /**
     * Create output from address and value in satoshis
     */
    static Output from_options(const std::string& addr, uint64_t value) {
        Output self;
        
        // Decode bech32 address
        auto [hrp, data] = bech32::decode(addr);
        
        self.witness_version = data[0];
        // Convert 5-bit to 8-bit values
        self.witness_data = bech32::convertbits(
            std::vector<uint8_t>(data.begin() + 1, data.end()),
            5, 8, false
        );
        self.value = value;
        
        return self;
    }

    /**
     * Serialize output for transaction
     */
    std::vector<uint8_t> serialize() const {
        std::vector<uint8_t> r;
        
        // Value: 8 bytes (little-endian)
        for (int i = 0; i < 8; ++i) {
            r.push_back(static_cast<uint8_t>((value >> (i * 8)) & 0xFF));
        }
        
        // Script length
        uint8_t script_length = 1 + 1 + static_cast<uint8_t>(witness_data.size());
        r.push_back(script_length);
        
        // Witness version + data length + witness data
        r.push_back(witness_version);
        r.push_back(static_cast<uint8_t>(witness_data.size()));
        r.insert(r.end(), witness_data.begin(), witness_data.end());
        
        return r;
    }
};
```

```go
package main

import (
	"encoding/binary"
	"encoding/hex"
	"fmt"

	"github.com/btcsuite/btcd/btcutil/bech32"
)

type Output struct {
	Value         uint64
	WitnessVersion uint8
	WitnessData   []byte
}

func NewOutput() *Output {
	return &Output{
		Value:         0,
		WitnessVersion: 0,
		WitnessData:   []byte{},
	}
}

// FromOptions creates output from address and value in satoshis
func FromOptions(addr string, value uint64) (*Output, error) {
	hrp, data, err := bech32.Decode(addr)
	if err != nil {
		return nil, err
	}

	witnessVersion := data[0]
	witnessProgram, err := bech32.ConvertBits(data[1:], 5, 8, false)
	if err != nil {
		return nil, err
	}

	return &Output{
		Value:         value,
		WitnessVersion: witnessVersion,
		WitnessData:   witnessProgram,
	}, nil
}

// Serialize serializes output for transaction
func (o *Output) Serialize() []byte {
	var result []byte

	// Value: 8 bytes (little-endian)
	valueBytes := make([]byte, 8)
	binary.LittleEndian.PutUint64(valueBytes, o.Value)
	result = append(result, valueBytes...)

	// Script length
	scriptLength := 1 + 1 + len(o.WitnessData)
	result = append(result, byte(scriptLength))

	// Witness version + data length + witness data
	result = append(result, o.WitnessVersion)
	result = append(result, byte(len(o.WitnessData)))
	result = append(result, o.WitnessData...)

	return result
}

func main() {
	output, err := FromOptions("bc1q...", 50000)
	if err != nil {
		panic(err)
	}

	serialized := output.Serialize()
	fmt.Printf("Serialized output: %s\n", hex.EncodeToString(serialized))
}
```

```javascript
const bech32 = require('@savingsatoshi/bech32js');

class Output {
  constructor() {
    this.value = 0;
    this.witness_version = 0;
    this.witness_data = Buffer.alloc(0);
  }

  static from_options(addr, value) {
    const self = new this();
    // Decode bech32 address
    const decoded = bech32.bech32_decode(addr);
    const words = decoded[1];
    
    self.witness_version = words[0];
    // Convert 5-bit to 8-bit values
    const witness_program = bech32.fromWords(words.slice(1));
    self.witness_data = Buffer.from(witness_program);
    self.value = value;
    return self;
  }

  serialize() {
    // Value: 8 bytes (little-endian)
    const valueBuffer = Buffer.alloc(8);
    const value = BigInt(this.value);
    valueBuffer.writeUInt32LE(Number(value & 0xffffffffn), 0);
    valueBuffer.writeUInt32LE(Number((value >> 32n) & 0xffffffffn), 4);
    
    // Script length
    const script_length = 1 + 1 + this.witness_data.length;
    
    return Buffer.concat([
      valueBuffer,
      Buffer.from([script_length]),
      Buffer.from([this.witness_version]),
      Buffer.from([this.witness_data.length]),
      this.witness_data
    ]);
  }
}
```
:::

---

## Step-by-Step Process

### Step 1: Select UTXOs

Choose which UTXOs to spend:

```bash
# List available UTXOs
bitcoin-cli listunspent

# Select UTXOs (coin selection algorithm)
# Total value >= payment + fee
```

### Step 2: Create Raw Transaction

```bash
# Create transaction
bitcoin-cli createrawtransaction \
  '[{"txid":"abc123...", "vout":0}]' \
  '{"<destination_address>": 0.001}'
```

**Parameters:**
- **Inputs**: Array of UTXOs to spend
- **Outputs**: Destination address and amount

:::code-group
```rust
use std::process::Command;
use serde_json::{json, Value};

fn bcli(cmd: &str) -> Result<String, String> {
    let args: Vec<&str> = cmd.split_whitespace().collect();
    let output = Command::new("bitcoin-cli")
        .arg("-signet")
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

// Build inputs from selected UTXOs
let inputs: Vec<Value> = selected_utxos.iter()
    .map(|utxo| json!({"txid": utxo.txid, "vout": utxo.vout}))
    .collect();

// Build outputs (payment + change)
let outputs = json!({
    destination_address: payment_amount,
    change_address: change_amount
});

// Create raw transaction
let inputs_json = serde_json::to_string(&inputs).unwrap();
let outputs_json = serde_json::to_string(&outputs).unwrap();
let unsigned_tx = bcli(&format!("createrawtransaction '{}' '{}'", inputs_json, outputs_json))?;
```

```python
import json
from subprocess import run

def bcli(cmd: str):
    """Execute bitcoin-cli command."""
    res = run(
        ["bitcoin-cli", "-signet"] + cmd.split(" "),
        capture_output=True, encoding="utf-8"
    )
    if res.returncode == 0:
        return res.stdout.strip()
    raise Exception(res.stderr.strip())

# Build inputs from selected UTXOs
inputs = [{"txid": utxo["txid"], "vout": utxo["vout"]} for utxo in selected_utxos]

# Build outputs (payment + change)
outputs = {
    destination_address: float(payment_amount),
    change_address: float(change_amount)
}

# Create raw transaction
inputs_json = json.dumps(inputs)
outputs_json = json.dumps(outputs)
unsigned_tx = bcli(f"createrawtransaction {inputs_json} {outputs_json}")
```

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <array>
#include <stdexcept>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

std::string bcli(const std::string& cmd) {
    std::string full_cmd = "bitcoin-cli -signet " + cmd;
    std::array<char, 128> buffer;
    std::string result;
    
    FILE* pipe = popen(full_cmd.c_str(), "r");
    if (!pipe) {
        throw std::runtime_error("popen() failed");
    }
    
    while (fgets(buffer.data(), buffer.size(), pipe) != nullptr) {
        result += buffer.data();
    }
    
    int status = pclose(pipe);
    if (status != 0) {
        throw std::runtime_error("Command failed: " + result);
    }
    
    // Trim trailing newline
    if (!result.empty() && result.back() == '\n') {
        result.pop_back();
    }
    return result;
}

// Build inputs from selected UTXOs
json inputs = json::array();
for (const auto& utxo : selected_utxos) {
    inputs.push_back({{"txid", utxo.txid}, {"vout", utxo.vout}});
}

// Build outputs (payment + change)
json outputs = {
    {destination_address, payment_amount},
    {change_address, change_amount}
};

// Create raw transaction
std::string inputs_json = inputs.dump();
std::string outputs_json = outputs.dump();
std::string unsigned_tx = bcli("createrawtransaction '" + inputs_json + "' '" + outputs_json + "'");
```

```go
package main

import (
	"encoding/json"
	"fmt"
	"os/exec"
)

type UTXO struct {
	Txid string `json:"txid"`
	Vout int    `json:"vout"`
}

func bcli(cmd string) (string, error) {
	// Execute bitcoin-cli command
	args := append([]string{"-signet"}, cmd...)
	output, err := exec.Command("bitcoin-cli", args...).Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

func main() {
	// Build inputs from selected UTXOs
	selectedUtxos := []UTXO{
		{Txid: "abc123...", Vout: 0},
		{Txid: "def456...", Vout: 1},
	}

	inputs := make([]map[string]interface{}, len(selectedUtxos))
	for i, utxo := range selectedUtxos {
		inputs[i] = map[string]interface{}{
			"txid": utxo.Txid,
			"vout": utxo.Vout,
		}
	}

	// Build outputs (payment + change)
	outputs := map[string]float64{
		"destination_address": 0.001,
		"change_address":      0.0005,
	}

	// Create raw transaction
	inputsJSON, _ := json.Marshal(inputs)
	outputsJSON, _ := json.Marshal(outputs)

	unsignedTx, err := bcli(fmt.Sprintf("createrawtransaction '%s' '%s'", string(inputsJSON), string(outputsJSON)))
	if err != nil {
		panic(err)
	}

	fmt.Printf("Unsigned transaction: %s\n", unsignedTx)
}
```

```javascript
const { execSync } = require('child_process');

function bcli(cmd) {
  const result = execSync(`bitcoin-cli -signet ${cmd}`, { encoding: 'utf-8' });
  return result.trim();
}

// Build inputs from selected UTXOs
const inputs = selectedUtxos.map(utxo => ({
  txid: utxo.txid,
  vout: utxo.vout
}));

// Build outputs (payment + change)
const outputs = {
  [destinationAddress]: paymentAmount,
  [changeAddress]: changeAmount
};

// Create raw transaction
const inputsJson = JSON.stringify(inputs);
const outputsJson = JSON.stringify(outputs);
const unsignedTx = bcli(`createrawtransaction '${inputsJson}' '${outputsJson}'`);
```
:::

### Step 3: Sign Transaction

```bash
# Sign transaction
bitcoin-cli signrawtransactionwithwallet <hex>
```

**For Multisig:**
```bash
# Sign with specific key
bitcoin-cli signrawtransactionwithkey <hex> \
  '["<private_key>"]' \
  '[{"txid":"...", "vout":0, "scriptPubKey":"...", "redeemScript":"..."}]'
```

### Step 4: Broadcast Transaction

```bash
# Broadcast to network
bitcoin-cli sendrawtransaction <signed_hex>
```

:::code-group
```rust
use serde_json::Value;

// Sign the transaction
let sign_result = bcli(&format!("signrawtransactionwithwallet {}", unsigned_tx))?;
let signed_data: Value = serde_json::from_str(&sign_result)?;

if !signed_data["complete"].as_bool().unwrap_or(false) {
    return Err("Transaction signing incomplete".into());
}

let signed_tx = signed_data["hex"].as_str().unwrap();

// Broadcast transaction (0 = no maxfeerate protection)
let txid = bcli(&format!("sendrawtransaction {} 0", signed_tx))?;
println!("Transaction broadcast: {}", txid);
```

```python
import json

# Sign the transaction
sign_result = bcli(f"signrawtransactionwithwallet {unsigned_tx}")
signed_data = json.loads(sign_result)

if not signed_data.get("complete"):
    raise Exception("Transaction signing incomplete")

signed_tx = signed_data["hex"]

# Broadcast transaction (0 = no maxfeerate protection)
txid = bcli(f"sendrawtransaction {signed_tx} 0")
print(f"Transaction broadcast: {txid}")
```

```cpp
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// Sign the transaction
std::string sign_result = bcli("signrawtransactionwithwallet " + unsigned_tx);
json signed_data = json::parse(sign_result);

if (!signed_data.value("complete", false)) {
    throw std::runtime_error("Transaction signing incomplete");
}

std::string signed_tx = signed_data["hex"].get<std::string>();

// Broadcast transaction (0 = no maxfeerate protection)
std::string txid = bcli("sendrawtransaction " + signed_tx + " 0");
std::cout << "Transaction broadcast: " << txid << std::endl;
```

```go
package main

import (
	"encoding/json"
	"fmt"
	"os/exec"
)

func bcli(cmd string) (string, error) {
	args := append([]string{"-signet"}, cmd...)
	output, err := exec.Command("bitcoin-cli", args...).Output()
	if err != nil {
		return "", err
	}
	return string(output), nil
}

func main() {
	unsignedTx := "0100000001..." // From previous step

	// Sign the transaction
	signResult, err := bcli(fmt.Sprintf("signrawtransactionwithwallet %s", unsignedTx))
	if err != nil {
		panic(err)
	}

	var signedData map[string]interface{}
	if err := json.Unmarshal([]byte(signResult), &signedData); err != nil {
		panic(err)
	}

	complete, _ := signedData["complete"].(bool)
	if !complete {
		panic("Transaction signing incomplete")
	}

	signedTx := signedData["hex"].(string)

	// Broadcast transaction (0 = no maxfeerate protection)
	txid, err := bcli(fmt.Sprintf("sendrawtransaction %s 0", signedTx))
	if err != nil {
		panic(err)
	}

	fmt.Printf("Transaction broadcast: %s\n", txid)
}
```

```javascript
// Sign the transaction
const signResult = bcli(`signrawtransactionwithwallet ${unsignedTx}`);
const signedData = JSON.parse(signResult);

if (!signedData.complete) {
  throw new Error('Transaction signing incomplete');
}

const signedTx = signedData.hex;

// Broadcast transaction (0 = no maxfeerate protection)
const txid = bcli(`sendrawtransaction ${signedTx} 0`);
console.log(`Transaction broadcast: ${txid}`);
```
:::

---

## Fee Calculation

### Estimating Transaction Size

**Base Transaction:**
- Version: 4 bytes
- Input count: 1-9 bytes
- Output count: 1-9 bytes
- Locktime: 4 bytes

**Per Input:**
- Previous output: 36 bytes
- Script length: 1-9 bytes
- Script: Variable (depends on script type)
- Sequence: 4 bytes

**Per Output:**
- Value: 8 bytes
- Script length: 1-9 bytes
- Script: Variable (typically 22-34 bytes)

### Virtual Size (SegWit)

```
Weight = (Base Size × 3) + Total Size
Virtual Size = Weight / 4
```

### Fee Calculation

```
Fee = Transaction Size (vBytes) × Fee Rate (sat/vB)
```

**Example:**
```
Transaction Size: 250 vBytes
Fee Rate: 10 sat/vB
Fee: 2,500 sats
```

---

## Change Outputs

### When to Create Change

Create change output if:
- Input value > Payment + Fee + Dust Threshold
- Change amount > Dust threshold (546 sats)

### Change Output Creation

```bash
# Include change output
bitcoin-cli createrawtransaction \
  '[{"txid":"...", "vout":0}]' \
  '{"<destination>": 0.001, "<change_address>": 0.0005}'
```

---

## Signing Process

### Single Signature

**P2PKH:**
```
Script: <signature> <public_key>
```

**P2WPKH:**
```
Witness: <signature> <public_key>
```

### Multisig Signing

**Process:**
1. Create transaction
2. Sign with first key
3. Sign with second key (using partially signed tx)
4. Continue until M signatures collected
5. Broadcast fully signed transaction

---

## Transaction Validation

### Before Broadcasting

1. **Check Inputs**: Verify UTXOs are still unspent
2. **Verify Balance**: Ensure sufficient funds
3. **Validate Fee**: Check fee meets minimum
4. **Check Size**: Ensure transaction is valid size
5. **Verify Signatures**: All signatures valid

### Common Validation Errors

- **Insufficient funds**: Not enough input value
- **Invalid signature**: Signature doesn't match
- **Double spend**: UTXO already spent
- **Dust output**: Output below dust threshold
- **Fee too low**: Fee below minimum

---

## Best Practices

### For Developers

1. **Fee Estimation**: Accurate fee estimation is critical
2. **UTXO Management**: Efficient coin selection
3. **Error Handling**: Handle all error cases
4. **Validation**: Validate before broadcasting
5. **Testing**: Test on testnet first

### For Users

1. **Verify Address**: Double-check destination address
2. **Check Fee**: Ensure reasonable fee
3. **Wait for Confirmation**: Don't assume immediate confirmation
4. **Backup**: Backup transaction if needed
5. **Monitor**: Track transaction status

---

## Common Issues

### Transaction Stuck

**Problem**: Transaction not confirming

**Solutions:**
- Wait for confirmation
- Use Replace-by-Fee (RBF) if enabled
- Increase fee (if possible)
- Wait for mempool to clear

### Insufficient Fee

**Problem**: Fee too low, transaction rejected

**Solutions:**
- Increase fee rate
- Use higher priority
- Wait for lower network activity

### Invalid Transaction

**Problem**: Transaction rejected by network

**Causes:**
- Invalid signature
- Double spend
- Dust output
- Invalid script

**Solution**: Fix issue and recreate transaction

---

## Advanced Topics

### Replace-by-Fee (RBF)

**Enable RBF:**
```bash
# Set sequence to enable RBF
# Sequence < 0xFFFFFFFF - 1
```

**Replace Transaction:**
```bash
# Create replacement with higher fee
bitcoin-cli createrawtransaction ... --replaceable
```

### Partially Signed Bitcoin Transactions (PSBT)

**Create PSBT:**
```bash
bitcoin-cli walletcreatefundedpsbt \
  '[]' \
  '[{"<address>": <amount>}]'
```

**Sign PSBT:**
```bash
bitcoin-cli walletprocesspsbt <psbt>
```

**Finalize PSBT:**
```bash
bitcoin-cli finalizepsbt <psbt>
```

---

## Summary

Transaction creation involves:

- **UTXO Selection**: Choose inputs to spend
- **Output Creation**: Create payment and change outputs
- **Fee Calculation**: Calculate appropriate fees
- **Signing**: Sign with private keys
- **Broadcasting**: Send to network
- **Validation**: Verify transaction is valid

Understanding transaction creation is essential for building Bitcoin wallets and applications.

---

## Related Topics

- [Bitcoin Wallets](/docs/wallets) - Introduction to Bitcoin wallets
- [Coin Selection](/docs/bitcoin-development/coin-selection) - How wallets choose UTXOs to spend
- [Multisig](/docs/wallets/multisig) - Multi-signature transaction signing
- [PSBT](/docs/bitcoin-development/psbt) - Partially Signed Bitcoin Transactions standard
- [Mempool](/docs/mining/mempool) - Where unconfirmed transactions wait
