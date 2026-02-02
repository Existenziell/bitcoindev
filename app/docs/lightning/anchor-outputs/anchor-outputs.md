# Anchor Outputs

Anchor outputs are a modern channel format that allows commitment transactions to have their fees adjusted after broadcast. This solves the fee estimation problem in Lightning channels.

## The Fee Problem

In original Lightning channels, commitment transaction fees were set at channel creation:

**Problems**:
- Fees must be pre-committed before broadcast
- Can't predict future fee rates accurately
- High pre-set fees waste money during low congestion
- Low pre-set fees may cause transactions to be stuck during high congestion

**Critical Issue**: A force-close during a fee spike could leave your commitment transaction unconfirmed, potentially allowing your counterparty to claim funds via timelock expiry.

---

## How Anchor Outputs Work

Anchor outputs solve this by:

1. Setting commitment transaction fees to minimum (1 sat/vB)
2. Adding small "anchor" outputs that either party can spend
3. Using CPFP (Child Pays for Parent) to boost fees at broadcast time

```mermaid
flowchart TD
  subgraph commitBlock [Commitment Transaction]
    In[Input: Funding output]
    O1[Output 1: to_local]
    O2[Output 2: to_remote]
    O3[Output 3: Alice anchor 330 sats]
    O4[Output 4: Bob anchor 330 sats]
    Fee[Fee: Minimum 1 sat/vB]
  end
```

---

## Anchor Output Structure

Each anchor output is exactly 330 satoshis with this script:

```text
<local_pubkey> OP_CHECKSIG OP_IFDUP OP_NOTIF
    OP_16 OP_CHECKSEQUENCEVERIFY
OP_ENDIF
```

This means:
- Owner can spend immediately with their signature
- Anyone can spend after 16 blocks (cleanup)

### Why 330 Satoshis?

- Large enough to be non-dust
- Small enough to not waste significant funds
- Both parties get an anchor (660 sats total)

---

## CPFP Fee Bumping

Child Pays for Parent (CPFP) allows boosting parent transaction fees:

```text
1. Broadcast commitment tx (low fee)
2. Create child transaction spending anchor
3. Child includes additional UTXO for fees
4. Child pays high enough fee for both txs
5. Miners include both in the same block
```

### Fee Calculation

Total fee for package:

```text
package_fee = commitment_fee + child_fee
package_size = commitment_size + child_size
effective_rate = package_fee / package_size
```

You need the effective rate to meet current mempool minimums.

---

## Channel Types

Lightning supports multiple channel types negotiated at open:

| Type | Feature Bit | Anchors | Zero-Fee HTLC |
|------|-------------|---------|---------------|
| Legacy | - | No | No |
| Static Remote Key | 12/13 | No | No |
| Anchors | 20/21 | Yes | No |
| Anchors Zero Fee HTLC | 22/23 | Yes | Yes |

### Zero-Fee HTLC Anchors

The latest format (anchors_zero_fee_htlc_tx) also removes fees from HTLC transactions:

- HTLC-success and HTLC-timeout transactions use 0 fee
- They can be fee-bumped via CPFP when broadcast
- Maximum flexibility for fee management

---

## Reserve Requirements

Anchor channels require keeping a UTXO reserve for fee bumping:

```text
Recommended reserve:
- At least 1 UTXO per channel
- Size: Enough for emergency fee bump (10,000+ sats)
- Separate from channel funds (on-chain wallet)
```

**Warning**: Without reserve UTXOs, you cannot fee-bump your commitment transaction!

---

## Implementation (LND)

### Opening Anchor Channels

```bash
# Open channel requesting anchors (default in modern LND)
lncli openchannel --node_key=<pubkey> --local_amt=100000

# Explicitly request anchors
lncli openchannel --node_key=<pubkey> --local_amt=100000 --channel_type=anchors

# Check channel type
lncli listchannels | jq '.channels[].commitment_type'
```

### Fee Bumping a Force Close

```bash
# Initiate force close
lncli closechannel --funding_txid=<txid> --output_index=<idx> --force

# If commitment tx is stuck, bump fees
lncli wallet bumpfee <commitment_txid>

# Or manually create CPFP transaction
lncli wallet bumpforceclosefee <channel_point>
```

### Managing Reserve UTXOs

```bash
# Check available UTXOs
lncli listunspent

# Ensure you have fee-bumping capacity
lncli wallet estimatefee --conf_target=6
```

---

## Migration

### Upgrading Existing Channels

Existing non-anchor channels cannot be upgraded in place. Options:

1. **Close and reopen**: Cooperative close, then open new anchor channel
2. **Splice** (when available): Modify channel on-chain to add anchors
3. **Leave as-is**: Old channels still work, just without fee bumping

### Checking Channel Types

```bash
# LND: List channels with commitment type
lncli listchannels | jq '.channels[] | {chan_id, commitment_type}'

# Look for:
# - "LEGACY" - Old format, no anchors
# - "STATIC_REMOTE_KEY" - Newer, still no anchors
# - "ANCHORS" - Anchor outputs enabled
# - "SCRIPT_ENFORCED_LEASE" - Liquidity lease channels
```

---

## Trade-offs

### Advantages

- **Fee flexibility**: Adjust fees at broadcast time
- **No stuck transactions**: Can always bump fees higher
- **Lower dust exposure**: HTLC outputs can be smaller
- **Safer force closes**: Respond to fee spikes effectively

### Disadvantages

- **Reserve requirement**: Must maintain on-chain UTXOs
- **Slightly larger transactions**: Two extra outputs (660 sats)
- **Complexity**: More transaction types to handle
- **UTXO management**: Need to ensure reserves exist

---

## Common Issues

### Cannot Bump Fees

**Problem**: No UTXOs available for CPFP.

**Solutions**:
- Maintain dedicated fee-bump reserve
- Fund on-chain wallet before force close
- Use RBF on the child transaction if possible

### Channel Open Rejected

**Problem**: Peer doesn't support anchor channels.

**Solutions**:
- Use legacy channel type: `--channel_type=legacy`
- Find peer running modern software
- Accept the limitations of non-anchor channels

### Anchor Spent by Others

**Problem**: After 16 blocks, anyone can spend anchors.

**Reality**: This is by design for cleanup. If you need to bump fees, do it within 16 blocks of broadcast.

---

## Best Practices

1. **Maintain UTXO reserve**: Keep 50,000+ sats in on-chain wallet per channel
2. **Monitor mempool**: Know current fee rates for emergencies
3. **Use anchor channels**: Default for new channels
4. **Automate fee bumping**: Configure automatic bump on stuck transactions
5. **Test force close**: Verify fee bumping works on testnet first

---

## Example: Emergency Fee Bump

Scenario: Commitment transaction stuck, counterparty might cheat.

```bash
# 1. Check commitment tx status
bitcoin-cli getmempoolentry <commitment_txid>

# 2. If not in mempool or low fee, bump it
lncli wallet bumpforceclosefee <channel_point> --conf_target=2

# 3. Monitor for confirmation
watch -n 30 'bitcoin-cli getmempoolentry <commitment_txid>'

# 4. Verify penalty protection (if breach)
lncli pendingchannels | jq '.waiting_close_channels'
```

---

## Summary

Anchor outputs provide:

- **Dynamic fees**: Adjust commitment tx fees at broadcast time
- **CPFP support**: Bump fees using child transactions
- **Stuck transaction prevention**: Always confirmable with enough fee
- **Modern standard**: Default for new Lightning channels

---

## Related Topics

- [Channels](/docs/lightning/channels) - Channel lifecycle and force close
- [Watchtowers](/docs/lightning/watchtowers) - Automated breach response
- [Zero-Conf Channels](/docs/advanced/zero-conf-channels) - Instant channel opening

---

## Resources

- [BOLT 3: Anchor Outputs](https://github.com/lightning/bolts/blob/master/03-transactions.md#anchor-outputs)
- [LND Anchor Channels Guide](https://docs.lightning.engineering/the-lightning-network/payment-channels/etymology#anchor-channel)
