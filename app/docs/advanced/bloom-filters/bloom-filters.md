# Bloom Filters

Bloom filters are a probabilistic data structure used by SPV (Simplified Payment Verification) clients to request relevant transactions from full nodes without revealing exactly which addresses they're interested in.

**Bloom filters** allow SPV clients to:

- **Request transactions**: Without revealing addresses
- **Privacy**: Partial privacy protection
- **Efficiency**: Compact representation
- **False positives**: Possible but manageable

```mermaid
sequenceDiagram
  participant SPV as SPV client
  participant Node as Full node
  SPV->>Node: Bloom filter
  Node->>Node: Filter transactions
  Node->>SPV: Filtered blocks / matching txs
```

---

## How Bloom Filters Work

### Construction

```text
1. Add addresses to filter
2. Hash addresses multiple times
3. Set bits in filter array
4. Send filter to full node
5. Node filters transactions
6. Returns matching transactions
```

### Querying

```text
Full Node:
1. Receives bloom filter
2. Checks each transaction
3. If filter matches, includes transaction
4. May include false positives
5. Sends matching transactions
```

---

## Privacy Trade-offs

### Privacy Benefits

- **Address hiding**: Doesn't reveal exact addresses
- **Plausible deniability**: False positives provide cover

### Privacy Limitations

- **Pattern analysis**: Multiple queries reveal patterns
- **False positive rate**: Can be analyzed
- **Not perfect**: Better than nothing, but not anonymous

---

## Modern Alternatives

### Compact Block Filters (BIP 158)

**Compact block filters** replace bloom filters:

```text
Benefits:
- Better privacy
- More efficient
- Standardized format
- Used by modern SPV clients
```

### Comparison

| Feature | Bloom Filters | Compact Block Filters |
|---------|---------------|----------------------|
| **Privacy** | Partial | Better |
| **Efficiency** | Good | Better |
| **Standardization** | BIP 37 | BIP 158 |
| **Adoption** | Legacy | Modern |

---

## Code Examples

### Creating a Bloom Filter

:::code-group
```rust
use bitcoin::bloom::BloomFilter;
use bitcoin::hashes::Hash;
use bitcoin::hash_types::FilterHash;

fn create_bloom_filter(addresses: &[String]) -> BloomFilter {
    let mut filter = BloomFilter::new(10000, 0.001, 0, 0);
    
    for address in addresses {
        let hash = FilterHash::hash(address.as_bytes());
        filter.insert(&hash);
    }
    
    filter
}
```

```python
import mmh3
import struct

def create_bloom_filter(addresses, size=10000, error_rate=0.001):
    """Create bloom filter for addresses."""
    import bitarray
    filter_array = bitarray.bitarray(size)
    filter_array.setall(0)
    
    num_hashes = int(-size * math.log(error_rate) / (math.log(2) ** 2))
    
    for address in addresses:
        for i in range(num_hashes):
            hash_val = mmh3.hash(address, i) % size
            filter_array[hash_val] = 1
    
    return filter_array
```

```cpp
#include <vector>
#include <bitset>
#include <functional>

class BloomFilter {
private:
    std::bitset<10000> bits;
    size_t num_hashes;
    
public:
    BloomFilter(double error_rate) {
        num_hashes = -10000 * log(error_rate) / (log(2) * log(2));
    }
    
    void add(const std::string& item) {
        for (size_t i = 0; i < num_hashes; ++i) {
            std::hash<std::string> hasher;
            size_t hash = hasher(item + std::to_string(i));
            bits[hash % 10000] = true;
        }
    }
    
    bool contains(const std::string& item) const {
        for (size_t i = 0; i < num_hashes; ++i) {
            std::hash<std::string> hasher;
            size_t hash = hasher(item + std::to_string(i));
            if (!bits[hash % 10000]) return false;
        }
        return true;
    }
};
```

```go
package main

import (
	"hash/fnv"
)

type BloomFilter struct {
	bits      []bool
	size      int
	numHashes int
}

func NewBloomFilter(size int, errorRate float64) *BloomFilter {
	numHashes := int(-float64(size) * math.Log(errorRate) / (math.Log(2) * math.Log(2)))
	return &BloomFilter{
		bits:      make([]bool, size),
		size:      size,
		numHashes: numHashes,
	}
}

func (bf *BloomFilter) Add(item string) {
	for i := 0; i < bf.numHashes; i++ {
		hash := fnv.New32a()
		hash.Write([]byte(item + string(rune(i))))
		index := int(hash.Sum32()) % bf.size
		bf.bits[index] = true
	}
}
```

```javascript
class BloomFilter {
    constructor(size = 10000, errorRate = 0.001) {
        this.bits = new Array(size).fill(false);
        this.size = size;
        this.numHashes = Math.ceil(-size * Math.log(errorRate) / (Math.log(2) ** 2));
    }
    
    add(item) {
        for (let i = 0; i < this.numHashes; i++) {
            const hash = this.hash(item + i);
            this.bits[hash % this.size] = true;
        }
    }
    
    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}
```
:::

---

## Related Topics

- SPV - Simplified payment verification
- [Node Types](/docs/development/node-types) - Different node configurations
- [Privacy Techniques](/docs/wallets/privacy) - Privacy improvements

---

## Resources

- [BIP 37: Bloom Filters](https://github.com/bitcoin/bips/blob/master/bip-0037.mediawiki)
- [BIP 158: Compact Block Filters](https://github.com/bitcoin/bips/blob/master/bip-0158.mediawiki)
