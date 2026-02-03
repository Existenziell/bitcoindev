# Testing & Debugging Bitcoin Applications

Testing Bitcoin applications requires special considerations due to the financial nature of the software and the complexity of the protocol.

## Testing Network

### Regtest (Recommended for Development)

Regtest provides a completely controlled environment where you can instantly generate blocks. For more on test networks, see [Testnets](/docs/development/testnets).

**Setup:**

```bash
# Start Bitcoin Core in regtest mode
bitcoind -regtest -daemon

# Create a wallet
bitcoin-cli -regtest createwallet "test"

# Generate initial blocks (need 100+ for spendable coins)
bitcoin-cli -regtest -generate 101
```

---

## Unit Testing Strategies

### Testing Address Generation

:::code-group
```rust
#[test]
fn test_address_generation() {
    let pubkey = PublicKey::from_str(
        "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
    ).unwrap();
    let address = Address::p2wpkh(&pubkey, Network::Bitcoin).unwrap();
    assert!(address.to_string().starts_with("bc1q"));
}
```

```python
def test_address_generation():
    from bitcoin.wallet import P2PKHBitcoinAddress
    pubkey = bytes.fromhex('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798')
    addr = P2PKHBitcoinAddress.from_pubkey(pubkey)
    assert str(addr).startswith('m') or str(addr).startswith('n')
```

```cpp
BOOST_AUTO_TEST_CASE(test_address_generation) {
    bc::ec_compressed pubkey;
    bc::decode_base16(pubkey, "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798");
    auto addr = bc::wallet::payment_address(pubkey);
    BOOST_CHECK(addr.encoded().substr(0, 1) == "1");
}
```

```go
package main

import (
	"encoding/hex"
	"testing"
)

func TestAddressGeneration(t *testing.T) {
	pubkeyHex := "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
	pubkey, err := hex.DecodeString(pubkeyHex)
	if err != nil {
		t.Fatal(err)
	}
	
	// In a real implementation, you would use a Bitcoin library
	// to generate the address from the pubkey
	// This is a simplified example
	_ = pubkey
	
	// Example assertion (would use actual address generation)
	// addr := generateP2WPKHAddress(pubkey)
	// if !strings.HasPrefix(addr, "bc1q") {
	//     t.Errorf("Expected address to start with 'bc1q', got %s", addr)
	// }
}
```

```javascript
test('generates valid P2WPKH address', () => {
  const pubkey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');
  const { address } = bitcoin.payments.p2wpkh({ pubkey, network: bitcoin.networks.bitcoin });
  expect(address).toMatch(/^bc1q/);
});
```
:::

### Testing Transaction Construction

:::code-group
```rust
#[test]
fn test_transaction() {
    let tx = Transaction { version: 2, lock_time: LockTime::ZERO, input: vec![], output: vec![] };
    assert_eq!(tx.version, 2);
}
```

```python
def test_transaction_construction():
    outpoint = COutPoint(bytes(32), 0)
    txin = CTxIn(prevout=outpoint)
    tx = CTransaction([txin], [])
    
    assert len(tx.vin) == 1
    assert len(tx.vout) == 0
```

```cpp
BOOST_AUTO_TEST_CASE(test_transaction) {
    bc::chain::transaction tx;
    tx.set_version(2);
    BOOST_CHECK_EQUAL(tx.version(), 2u);
}
```

```go
package main

import (
	"testing"
)

type Transaction struct {
	Version int32
	Inputs  []Input
	Outputs []Output
}

type Input struct {
	PrevOutHash  []byte
	PrevOutIndex uint32
}

type Output struct {
	Value  int64
	Script []byte
}

func TestTransactionConstruction(t *testing.T) {
	tx := Transaction{
		Version: 2,
		Inputs:  []Input{},
		Outputs: []Output{},
	}
	
	if tx.Version != 2 {
		t.Errorf("Expected version 2, got %d", tx.Version)
	}
}
```

```javascript
test('creates valid transaction structure', () => {
  const psbt = new bitcoin.Psbt();
  psbt.addInput({ hash: Buffer.alloc(32), index: 0, witnessUtxo: { script: Buffer.alloc(22), value: 100000 } });
  expect(psbt.inputCount).toBe(1);
});
```
:::

---

## Integration Testing

### Testing with Regtest

**Complete Test Flow:**

```python
import subprocess
import time
import json
import unittest

class RegtestTestCase(unittest.TestCase):
    """Base test case for Bitcoin regtest integration tests."""
    
    def setUp(self):
        # Start bitcoind in regtest mode
        subprocess.run(['bitcoind', '-regtest', '-daemon'])
        time.sleep(2)  # Wait for startup
        
        # Create wallet and generate coins
        self.cli('createwallet', 'test')
        self.cli('-generate', '101')
    
    def tearDown(self):
        # Stop bitcoind
        self.cli('stop')
    
    def cli(self, *args):
        """Execute bitcoin-cli command and return parsed result."""
        result = subprocess.run(
            ['bitcoin-cli', '-regtest'] + list(args),
            capture_output=True,
            text=True
        )
        if result.stdout:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return result.stdout.strip()
        return None
    
    def test_send_transaction(self):
        # Get a new address
        addr = self.cli('getnewaddress')
        
        # Send coins
        txid = self.cli('sendtoaddress', addr, '1.0')
        
        # Verify transaction exists
        tx = self.cli('gettransaction', txid)
        self.assertIsNotNone(tx)
        self.assertEqual(tx['amount'], 1.0)
```

### Testing Fee Estimation

```python
def test_fee_estimation(self):
    # Generate some blocks with transactions
    for _ in range(10):
        addr = self.cli('getnewaddress')
        self.cli('sendtoaddress', addr, '0.1')
        self.cli('-generate', '1')
    
    # Test fee estimation
    fee_rate = self.cli('estimatesmartfee', '6')
    
    # Should return a valid fee rate
    assert 'feerate' in fee_rate
    assert fee_rate['feerate'] > 0
```

---

## Debugging Techniques

### Using bitcoin-cli for Debugging

**Inspect Transaction:**

```bash
# Decode raw transaction
bitcoin-cli decoderawtransaction <hex>

# Get transaction details
bitcoin-cli getrawtransaction <txid> true

# Check mempool
bitcoin-cli getmempoolentry <txid>
```

**Debug Scripts:**

```bash
# Test script execution (if using btcdeb)
btcdeb '[OP_DUP OP_HASH160 <pubkey_hash> OP_EQUALVERIFY OP_CHECKSIG]'
```

### Analyzing Debug Logs

Bitcoin Core writes detailed logs to `debug.log`.

**Location:**
- Linux: `~/.bitcoin/debug.log`
- macOS: `~/Library/Application Support/Bitcoin/debug.log`
- Windows: `%APPDATA%\Bitcoin\debug.log`

**Useful Log Categories:**

```bash
# Enable specific debug categories
bitcoind -debug=net -debug=mempool -debug=validation

# Or in bitcoin.conf
debug=net
debug=mempool
debug=validation
```

**Common Debug Categories:**
- `net`: Network messages
- `mempool`: Mempool operations
- `validation`: Block validation
- `rpc`: RPC calls
- `estimatefee`: Fee estimation
- `selectcoins`: Coin selection

### Common Debugging Patterns

**Transaction Not Confirming:**

```bash
# Check if in mempool
bitcoin-cli getmempoolentry <txid>

# Check mempool info
bitcoin-cli getmempoolinfo

# Check fee rate
bitcoin-cli getmempoolentry <txid> | jq '.fees.base / .vsize'
```

**Script Verification Failed:**

```bash
# Decode and inspect the transaction
bitcoin-cli decoderawtransaction <raw_tx>

# Check the referenced output
bitcoin-cli gettxout <prev_txid> <vout>
```

---

## Testing Lightning Applications

### Using Polar

Polar provides a one-click Lightning Network for testing.

**Setup:**
1. Download from [lightningpolar.com](https://lightningpolar.com/)
2. Create a new network
3. Start nodes
4. Open channels between nodes

### LND Testing

```python
import grpc
import lnrpc
import unittest

class LightningTestCase(unittest.TestCase):
    """Test case for LND Lightning Network integration tests."""
    
    def setUp(self):
        # Connect to LND
        self.channel = grpc.insecure_channel('localhost:10009')
        self.stub = lnrpc.LightningStub(self.channel)
    
    def tearDown(self):
        self.channel.close()
    
    def test_create_invoice(self):
        # Create invoice
        request = lnrpc.Invoice(value=1000, memo="test")
        response = self.stub.AddInvoice(request)
        
        # Verify invoice created
        self.assertIsNotNone(response.payment_request)
        self.assertTrue(response.payment_request.startswith('ln'))
```

### Core Lightning Testing

```python
from pyln.client import LightningRpc
import unittest

class CLightningTestCase(unittest.TestCase):
    """Test case for Core Lightning integration tests."""
    
    def setUp(self):
        self.rpc = LightningRpc("/path/to/lightning-rpc")
    
    def test_get_info(self):
        info = self.rpc.getinfo()
        self.assertIn('id', info)
        self.assertIn('alias', info)
```

---

## Mocking and Stubbing

### Mocking RPC Calls

```python
from unittest.mock import Mock, patch

class TestWithMocks:
    @patch('bitcoinrpc.RawProxy')
    def test_get_balance(self, mock_proxy):
        # Setup mock
        mock_proxy.return_value.getbalance.return_value = 10.5
        
        # Test code that uses RPC
        rpc = mock_proxy()
        balance = rpc.getbalance()
        
        assert balance == 10.5
        mock_proxy.return_value.getbalance.assert_called_once()
```

### Mocking Network Responses

```python
import responses
import requests

class TestAPIIntegration:
    @responses.activate
    def test_fetch_block(self):
        # Mock the API response
        responses.add(
            responses.GET,
            'https://blockstream.info/api/block/000000...',
            json={'height': 100000, 'tx_count': 50},
            status=200
        )
        
        # Test code
        response = requests.get('https://blockstream.info/api/block/000000...')
        data = response.json()
        
        assert data['height'] == 100000
```

---

## Test Data Generation

### Creating Test Transactions

```python
def create_test_transaction(inputs, outputs):
    """Create a transaction for testing."""
    tx = CTransaction()
    
    for txid, vout in inputs:
        outpoint = COutPoint(bytes.fromhex(txid)[::-1], vout)
        tx.vin.append(CTxIn(outpoint))
    
    for address, amount in outputs:
        script = address.to_scriptPubKey()
        tx.vout.append(CTxOut(int(amount * 100000000), script))
    
    return tx
```

### Generating Test Keys

```python
import secrets
from bitcoin.wallet import CBitcoinSecret

def generate_test_keypair():
    """Generate a random keypair for testing."""
    # Generate random private key
    private_key_bytes = secrets.token_bytes(32)
    private_key = CBitcoinSecret.from_secret_bytes(private_key_bytes)
    
    # Derive public key
    public_key = private_key.pub
    
    return private_key, public_key
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Bitcoin Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
    
    - name: Install dependencies
      run: |
        pip install python-bitcoinlib pytest
    
    - name: Install Bitcoin Core
      run: |
        wget https://bitcoincore.org/bin/bitcoin-core-25.0/bitcoin-25.0-x86_64-linux-gnu.tar.gz
        tar xzf bitcoin-25.0-x86_64-linux-gnu.tar.gz
        sudo mv bitcoin-25.0/bin/* /usr/local/bin/
    
    - name: Run unit tests
      run: pytest tests/unit/
    
    - name: Run integration tests
      run: |
        bitcoind -regtest -daemon
        sleep 5
        pytest tests/integration/
        bitcoin-cli -regtest stop
```

---

## Test Organization

```
tests/
├── unit/
│   ├── test_transactions.py
│   ├── test_addresses.py
│   └── test_scripts.py
├── integration/
│   ├── test_wallet.py
│   ├── test_mempool.py
│   └── test_mining.py
├── fixtures/
│   ├── transactions.json
│   └── blocks.json
└── conftest.py
```

---

## Related Topics

- [Test Networks](/docs/development/testnets) - Regtest, Signet, and Testnet setup
- [Getting Started](/docs/development) - Development environment setup
- [Libraries & SDKs](/docs/development/libraries) - Testing utilities in each library