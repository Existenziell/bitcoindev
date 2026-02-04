# Network Attacks & Security

Bitcoin's P2P network faces various attack vectors. Understanding these attacks helps node operators secure their nodes and developers build resilient applications.

## Attack Types

### Eclipse Attacks

**Eclipse attacks** isolate a node by controlling all its connections:

```text
Attack:
1. Attacker controls many IP addresses
2. Attacker connects to victim from all addresses
3. Victim's connections are all to attacker
4. Attacker controls what victim sees
5. Victim sees fake blockchain state
```

**Mitigation**:
- Connect to diverse IP ranges
- Use multiple outbound connections
- Verify block data independently
- Use block-relay-only connections

### Sybil Attacks

**Sybil attacks** create many fake identities:

```text
Attack:
1. Attacker creates many node identities
2. Attacker controls large portion of network
3. Attacker can influence network behavior
4. Attacker can censor transactions
```

**Mitigation**:
- Proof-of-work prevents fake blocks
- Independent validation by all nodes
- No trust in individual peers
- Economic cost of attack

### BGP Hijacking

**BGP hijacking** redirects network traffic:

```text
Attack:
1. Attacker announces false BGP routes
2. Traffic redirected to attacker
3. Attacker can intercept/modify data
4. Affects large portions of network
```

**Mitigation**:
- Use Tor or VPN
- Connect to diverse geographic locations
- Monitor for unusual routing
- Use authenticated connections

---

## Code Examples

### Detecting Eclipse Attack

:::code-group
```rust
use std::collections::HashSet;
use std::net::IpAddr;

fn detect_eclipse_attack(connected_ips: Vec<IpAddr>) -> bool {
    // Check IP diversity
    let unique_ips: HashSet<IpAddr> = connected_ips.iter().cloned().collect();
    
    // Check for suspicious patterns
    let same_subnet = connected_ips
        .windows(2)
        .all(|w| same_subnet(w[0], w[1]));
    
    // Eclipse attack if all IPs from same subnet
    same_subnet && unique_ips.len() < 5
}
```

```python
from ipaddress import ip_network
from collections import Counter

def detect_eclipse_attack(connected_ips):
    """Detect potential eclipse attack."""
    # Check IP diversity
    unique_ips = set(connected_ips)
    
    # Check subnet distribution
    subnets = [str(ip_network(ip + '/24', strict=False)) for ip in connected_ips]
    subnet_counts = Counter(subnets)
    
    # Suspicious if too many from same subnet
    max_subnet_count = max(subnet_counts.values())
    return max_subnet_count > len(connected_ips) * 0.8
```

```cpp
#include <set>
#include <vector>
#include <netinet/in.h>

bool detect_eclipse_attack(const std::vector<in_addr>& connected_ips) {
    std::set<in_addr> unique_ips(connected_ips.begin(), connected_ips.end());
    
    // Check subnet diversity
    std::map<uint32_t, int> subnet_counts;
    for (const auto& ip : connected_ips) {
        uint32_t subnet = ntohl(ip.s_addr) & 0xFFFFFF00; // /24 subnet
        subnet_counts[subnet]++;
    }
    
    // Suspicious if too many from same subnet
    int max_count = 0;
    for (const auto& pair : subnet_counts) {
        max_count = std::max(max_count, pair.second);
    }
    
    return max_count > connected_ips.size() * 0.8;
}
```

```go
package main

import (
	"net"
)

func detectEclipseAttack(connectedIPs []net.IP) bool {
	// Check IP diversity
	uniqueIPs := make(map[string]bool)
	subnetCounts := make(map[string]int)
	
	for _, ip := range connectedIPs {
		uniqueIPs[ip.String()] = true
		subnet := getSubnet(ip)
		subnetCounts[subnet]++
	}
	
	// Check if too many from same subnet
	maxCount := 0
	for _, count := range subnetCounts {
		if count > maxCount {
			maxCount = count
		}
	}
	
	return maxCount > len(connectedIPs)*8/10
}

func getSubnet(ip net.IP) string {
	// Get /24 subnet
	ip = ip.To4()
	return net.IP{ip[0], ip[1], ip[2], 0}.String()
}
```

```javascript
function detectEclipseAttack(connectedIPs) {
    // Check IP diversity
    const uniqueIPs = new Set(connectedIPs);
    
    // Check subnet distribution
    const subnetCounts = {};
    connectedIPs.forEach(ip => {
        const subnet = getSubnet(ip);
        subnetCounts[subnet] = (subnetCounts[subnet] || 0) + 1;
    });
    
    // Suspicious if too many from same subnet
    const maxCount = Math.max(...Object.values(subnetCounts));
    return maxCount > connectedIPs.length * 0.8;
}

function getSubnet(ip) {
    // Get /24 subnet
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}
```
:::

---

## Partition Attacks

### Network Partition

A **network partition** splits the network:

```text
Partition:
Network A: Nodes 1-100
Network B: Nodes 101-200

Result:
- Two separate blockchains
- Eventually one wins (longest chain)
- Transactions in losing partition invalidated
```

### Mitigation

- **Multiple connections**: Reduces partition risk
- **Geographic diversity**: Connect globally
- **Wait for confirmations**: Don't trust 0-conf

---

## Denial of Service (DoS)

### Transaction Flooding

Attackers flood network with transactions:

```text
Attack:
1. Create many low-fee transactions
2. Fill mempool
3. Legitimate transactions delayed
4. Network congestion
```

**Mitigation**:
- Fee-based prioritization
- Mempool size limits
- Transaction eviction policies

### Connection Exhaustion

Attackers exhaust node connections:

```text
Attack:
1. Open many connections to node
2. Exhaust connection limit
3. Legitimate peers can't connect
4. Node isolated
```

**Mitigation**:
- Connection limits
- Rate limiting
- Ban malicious IPs

---

## Best Practices

### For Node Operators

1. **Diverse connections**: Connect to different IP ranges
2. **Monitor connections**: Watch for suspicious patterns
3. **Use firewall**: Limit exposure
4. **Keep software updated**: Security patches

### For Developers

1. **Validate independently**: Don't trust peers
2. **Handle network issues**: Graceful degradation
3. **Implement timeouts**: Prevent hanging connections
4. **Rate limit**: Prevent abuse

---

## Related Topics

- [P2P Network Protocol](/docs/bitcoin/p2p-protocol) - Network communication
- [Mining Attacks](/docs/mining/attacks) - Mining-specific attacks
- [Node Types](/docs/development/node-types) - Node configurations

---

## Resources

- [Bitcoin Wiki – Network](https://en.bitcoin.it/wiki/Network)
