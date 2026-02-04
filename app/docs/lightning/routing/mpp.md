# Multi-Part Payments (MPP)

Multi-Part Payments allow splitting a single payment across multiple [routes](/docs/lightning/routing-fees). This enables larger payments and improves success rates by utilizing multiple [channels](/docs/lightning/channels).
Instead of sending one large payment through a single route, MPP splits the payment into multiple smaller parts that can take different routes.

### Example

```
Single Payment (fails):
Alice → Bob → Carol → Dave
Amount: 500,000 sats
Problem: Carol's channel only has 200,000 sats capacity

MPP Payment (succeeds):
Route 1: Alice → Bob → Carol → Dave (200,000 sats)
Route 2: Alice → Eve → Dave (200,000 sats)
Route 3: Alice → Fred → George → Dave (100,000 sats)
Total: 500,000 sats
```

---

## Why Use MPP?

### Benefits

1. **Larger Payments**: Can send amounts larger than any single channel
2. **Higher Success Rate**: Multiple routes increase chance of success
3. **Better Liquidity Utilization**: Use multiple channels simultaneously
4. **Fault Tolerance**: If one route fails, others can still succeed

### Use Cases

- **Large Payments**: Payments larger than channel capacity
- **Unbalanced Channels**: When direct channels are one-sided
- **Network Congestion**: When single routes are unreliable
- **Optimization**: Split to minimize fees or maximize speed

---

## How MPP Works

### Payment Splitting

1. **Determine Split**: Divide payment into multiple parts
2. **Find Routes**: Find routes for each part
3. **Send Simultaneously**: Send all parts at once
4. **Wait for All**: Wait for all parts to complete
5. **Verify Completion**: Ensure all parts succeeded

### Equal Splitting

Simplest approach: divide payment equally among routes:

```
Payment: 120,000 sats
Routes: 3

Split: 120,000 / 3 = 40,000 sats per route
```

### Optimal Splitting

More advanced: split based on:
- Channel capacities
- Fee optimization
- Success probability
- Route quality

---

## TLV Encoding for MPP

MPP payments include special TLV (Type-Length-Value) fields in the final hop of each route.

### Payment Data TLV

```
Type: 8
Length: 40 bytes

Value (40 bytes):
  32 bytes: payment_secret (payment_address)
  8 bytes: total_msat (total payment amount)
```

:::code-group
```rust
/// Encode TLV for MPP payment data
/// Format: type (8 bytes) + length (8 bytes) + payment_secret (32 bytes) + total_msat (8 bytes)
fn encode_mpp_tlv(payment_secret: &[u8; 32], total_msat: u64) -> String {
    let mut result = String::with_capacity(112); // 16 + 16 + 64 + 16 = 112 hex chars
    
    // Type: 8 (uint64, big-endian)
    for byte in &8u64.to_be_bytes() {
        result.push_str(&format!("{:02x}", byte));
    }
    
    // Length: 40 (uint64, big-endian)
    for byte in &40u64.to_be_bytes() {
        result.push_str(&format!("{:02x}", byte));
    }
    
    // Payment secret: 32 bytes
    for byte in payment_secret.iter() {
        result.push_str(&format!("{:02x}", byte));
    }
    
    // Total msat: 8 bytes (uint64, big-endian)
    for byte in &total_msat.to_be_bytes() {
        result.push_str(&format!("{:02x}", byte));
    }
    
    result
}

// Example usage
fn main() {
    let payment_secret: [u8; 32] = hex::decode("b3c3965128b05c96d76348158f8f3a1b92e2847172f9adebb400a9e83e62f066")
        .unwrap()
        .try_into()
        .unwrap();
    let total_msat: u64 = 120_000;
    let tlv = encode_mpp_tlv(&payment_secret, total_msat);
    println!("TLV: {}", tlv);
}
```

```python
def encode_mpp_tlv(payment_secret: bytes, total_msat: int) -> str:
    """Encode TLV for MPP payment data.
    
    Args:
        payment_secret: 32-byte payment secret from invoice
        total_msat: Total payment amount in millisatoshis
    
    Returns:
        Hex-encoded TLV string
    """
    result = ""
    
    # Type: 8 (uint64, big-endian)
    result += (8).to_bytes(8, 'big').hex()
    
    # Length: 40 (uint64, big-endian) 
    result += (40).to_bytes(8, 'big').hex()
    
    # Payment secret: 32 bytes
    result += payment_secret.hex()
    
    # Total msat: 8 bytes (uint64, big-endian)
    result += total_msat.to_bytes(8, 'big').hex()
    
    return result

# Example usage
payment_secret = bytes.fromhex("b3c3965128b05c96d76348158f8f3a1b92e2847172f9adebb400a9e83e62f066")
total_msat = 120_000
tlv = encode_mpp_tlv(payment_secret, total_msat)
print(f"TLV: {tlv}")
```

```cpp
#include <iostream>
#include <string>
#include <array>
#include <cstdint>
#include <iomanip>
#include <sstream>

/**
 * Encode TLV for MPP payment data
 * Format: type (8 bytes) + length (8 bytes) + payment_secret (32 bytes) + total_msat (8 bytes)
 */
std::string encode_mpp_tlv(const std::array<uint8_t, 32>& payment_secret, uint64_t total_msat) {
    std::ostringstream result;
    result << std::hex << std::setfill('0');
    
    // Type: 8 (uint64, big-endian)
    for (int i = 7; i >= 0; --i) {
        result << std::setw(2) << ((8ULL >> (i * 8)) & 0xFF);
    }
    
    // Length: 40 (uint64, big-endian)
    for (int i = 7; i >= 0; --i) {
        result << std::setw(2) << ((40ULL >> (i * 8)) & 0xFF);
    }
    
    // Payment secret: 32 bytes
    for (const auto& byte : payment_secret) {
        result << std::setw(2) << static_cast<int>(byte);
    }
    
    // Total msat: 8 bytes (uint64, big-endian)
    for (int i = 7; i >= 0; --i) {
        result << std::setw(2) << ((total_msat >> (i * 8)) & 0xFF);
    }
    
    return result.str();
}

// Example usage
int main() {
    std::array<uint8_t, 32> payment_secret = {
        0xb3, 0xc3, 0x96, 0x51, 0x28, 0xb0, 0x5c, 0x96,
        0xd7, 0x63, 0x48, 0x15, 0x8f, 0x8f, 0x3a, 0x1b,
        0x92, 0xe2, 0x84, 0x71, 0x72, 0xf9, 0xad, 0xeb,
        0xb4, 0x00, 0xa9, 0xe8, 0x3e, 0x62, 0xf0, 0x66
    };
    uint64_t total_msat = 120000;
    std::string tlv = encode_mpp_tlv(payment_secret, total_msat);
    std::cout << "TLV: " << tlv << std::endl;
    return 0;
}
```

```go
package main

import (
	"encoding/binary"
	"encoding/hex"
	"fmt"
)

// EncodeMppTlv encodes TLV for MPP payment data
// Format: type (8 bytes) + length (8 bytes) + payment_secret (32 bytes) + total_msat (8 bytes)
func EncodeMppTlv(paymentSecret [32]byte, totalMsat uint64) string {
	var result []byte

	// Type: 8 (uint64, big-endian)
	typeBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(typeBytes, 8)
	result = append(result, typeBytes...)

	// Length: 40 (uint64, big-endian)
	lengthBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(lengthBytes, 40)
	result = append(result, lengthBytes...)

	// Payment secret: 32 bytes
	result = append(result, paymentSecret[:]...)

	// Total msat: 8 bytes (uint64, big-endian)
	msatBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(msatBytes, totalMsat)
	result = append(result, msatBytes...)

	return hex.EncodeToString(result)
}

func main() {
	// Example usage
	paymentSecret := [32]byte{0xb3, 0xc3, 0x96, 0x51, 0x28, 0xb0, 0x5c, 0x96,
		0xd7, 0x63, 0x48, 0x15, 0x8f, 0x8f, 0x3a, 0x1b,
		0x92, 0xe2, 0x84, 0x71, 0x72, 0xf9, 0xad, 0xeb,
		0xb4, 0x00, 0xa9, 0xe8, 0x3e, 0x62, 0xf0, 0x66}
	totalMsat := uint64(120000)
	tlv := EncodeMppTlv(paymentSecret, totalMsat)
	fmt.Printf("TLV: %s\n", tlv)
}
```

```javascript
/**
 * Encode TLV for MPP payment data
 * Format: type (8 bytes) + length (8 bytes) + payment_secret (32 bytes) + total_msat (8 bytes)
 * 
 * @param {Buffer} paymentSecret - 32-byte payment secret from invoice
 * @param {BigInt} totalMsat - Total payment amount in millisatoshis
 * @returns {string} Hex-encoded TLV string
 */
function encodeMppTlv(paymentSecret, totalMsat) {
    let result = '';
    
    // Type: 8 (uint64, big-endian)
    const typeBuffer = Buffer.alloc(8);
    typeBuffer.writeBigUInt64BE(8n);
    result += typeBuffer.toString('hex');
    
    // Length: 40 (uint64, big-endian)
    const lengthBuffer = Buffer.alloc(8);
    lengthBuffer.writeBigUInt64BE(40n);
    result += lengthBuffer.toString('hex');
    
    // Payment secret: 32 bytes
    result += paymentSecret.toString('hex');
    
    // Total msat: 8 bytes (uint64, big-endian)
    const msatBuffer = Buffer.alloc(8);
    msatBuffer.writeBigUInt64BE(BigInt(totalMsat));
    result += msatBuffer.toString('hex');
    
    return result;
}

// Example usage
const paymentSecret = Buffer.from('b3c3965128b05c96d76348158f8f3a1b92e2847172f9adebb400a9e83e62f066', 'hex');
const totalMsat = 120000n;
const tlv = encodeMppTlv(paymentSecret, totalMsat);
console.log(`TLV: ${tlv}`);
```
:::

### Example

```
Payment Secret: b3c3965128b05c96d76348158f8f3a1b92e2847172f9adebb400a9e83e62f066
Total Amount: 120,000 msat

TLV Encoding:
Type: 0000000000000008 (8)
Length: 0000000000000028 (40)
Value: b3c3965128b05c96d76348158f8f3a1b92e2847172f9adebb400a9e83e62f0660000000000000078
```

### Where to Include

- **Last hop of each path**: Include in final hop's TLV
- **Same values**: All paths use same payment_secret and total_msat
- **Other hops**: NULL TLV for non-final hops

---

## MPP Implementation

### Step 1: Simple Route

For single-path payments, no MPP TLV is needed:

```
Route: Alice → Bob → Carol → Dave
Amount: 100,000 sats
TLV: NULL (no MPP field)
```

### Step 2: Multi-Path Payment

For multi-path payments, include TLV in last hop of each path:

```
Path 1: Alice → Bob → Carol → Dave
  Last hop (Carol → Dave): Include MPP TLV
  
Path 2: Alice → Eve → Dave
  Last hop (Eve → Dave): Include MPP TLV
  
Path 3: Alice → Fred → George → Dave
  Last hop (George → Dave): Include MPP TLV
```

### TLV Structure

The TLV uses simplified encoding (not full BOLT specification):

```
Type [uint64]: 8
Length [uint64]: 40

Values [40 bytes]:
  32 bytes: payment_secret (hex)
  8 bytes: total_msat (uint64, big-endian)
```

---

## Payment Secret

The payment secret (also called payment_address) is:
- **32 bytes**: Random value generated by recipient
- **Same for all parts**: All MPP parts use the same secret
- **Verification**: Recipient verifies all parts use same secret
- **Security**: Prevents payment mixing attacks

---

## Total Amount

The total_msat field specifies:
- **Total payment**: Sum of all MPP parts
- **Verification**: Recipient verifies sum matches invoice
- **Same for all parts**: All parts include the same total
- **8 bytes**: uint64 in big-endian format

---

## Example: 3-Path MPP

### Invoice Details

```
Invoice Amount: 120,000 sats
Payment Secret: b3c3965128b05c96d76348158f8f3a1b92e2847172f9adebb400a9e83e62f066
```

### Route Calculation

```
Path 0: Alice → Bob → Carol → Dave
  Amount per path: 40,000 sats
  Fees: Calculate for each hop
  
Path 1: Alice → Eve → Dave
  Amount per path: 40,000 sats
  Fees: Calculate for each hop
  
Path 2: Alice → Fred → George → Dave
  Amount per path: 40,000 sats
  Fees: Calculate for each hop
```

### TLV for Each Path

All three paths include the same TLV in their final hop:

```
TLV: 00000000000000080000000000000028b3c3965128b05c96d76348158f8f3a1b92e2847172f9adebb400a9e83e62f0660000000000000078
```

---

## Verification

### Recipient Verification

The recipient verifies:
1. **All parts received**: All MPP parts arrived
2. **Same secret**: All parts use same payment_secret
3. **Correct total**: Sum of parts equals total_msat
4. **Valid preimage**: All parts have valid preimages

### Sender Verification

The sender verifies:
1. **All parts sent**: All parts were sent
2. **All succeeded**: All parts completed successfully
3. **Correct amounts**: Sum equals invoice amount
4. **Preimages match**: All preimages are the same

---

## Best Practices

### For Senders

1. **Equal Splitting**: Start with equal splits
2. **Route Quality**: Use best available routes
3. **Monitor Progress**: Track all parts
4. **Handle Failures**: Retry failed parts if needed

### For Recipients

1. **Wait for All**: Don't settle until all parts arrive
2. **Verify Totals**: Ensure sum matches invoice
3. **Check Secrets**: Verify all parts use same secret
4. **Timeout Handling**: Handle partial payments

---

## Common Issues

### Partial Payment Received

**Problem**: Only some MPP parts succeed

**Solution**:
- Wait for timeout
- Request remaining parts
- Or cancel and retry

### TLV Encoding Errors

**Problem**: TLV not encoded correctly

**Solution**:
- Verify type is 8
- Check length is 40
- Ensure correct byte order
- Validate hex encoding

### Amount Mismatch

**Problem**: Sum of parts doesn't match total

**Solution**:
- Verify calculation
- Check fee inclusion
- Ensure correct splitting

---

## Summary

Multi-Part Payments enable:

- **Larger payments**: Split across multiple routes
- **Better success rates**: Multiple paths increase reliability
- **Liquidity utilization**: Use multiple channels
- **TLV encoding**: Payment data in final hops
- **Verification**: Recipient verifies all parts

MPP is essential for handling large payments and improving Lightning Network usability.
