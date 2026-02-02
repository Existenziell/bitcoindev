# Watchtowers

Watchtowers are third-party services that monitor the Bitcoin blockchain for channel breaches on your behalf. They provide security for Lightning nodes that cannot be online 24/7.

## Why Watchtowers?

Lightning channels rely on both parties being able to detect and respond to cheating attempts. If your counterparty broadcasts an old commitment transaction, you must respond with a penalty transaction before the timelock expires.

**The Problem**: If your node is offline when a breach occurs, you cannot detect or respond to it.

**The Solution**: Watchtowers monitor the blockchain for you and broadcast penalty transactions automatically.

---

## How Watchtowers Work

### Registration

1. Your node generates encrypted breach hints for each channel state
2. You send these hints to a watchtower
3. The watchtower stores them without knowing your channel details

### Monitoring

1. Watchtower monitors the blockchain for new transactions
2. For each new transaction, it checks against stored hints
3. If a hint matches, the watchtower can decrypt and broadcast the penalty

### Penalty Execution

When a breach is detected:

1. Watchtower decrypts the penalty transaction
2. Broadcasts it to the Bitcoin network
3. Penalty transaction claims all channel funds
4. Watchtower may take a fee from recovered funds

```text
Normal Flow:
Node → Watchtower: Encrypted breach hints (per state update)
Watchtower → Blockchain: Monitor for matching transactions

Breach Detection:
Counterparty → Blockchain: Old commitment transaction
Watchtower → Blockchain: Penalty transaction (claims funds)
```

---

## Breach Hint Structure

Breach hints allow watchtowers to detect breaches without knowing channel details:

```text
[Breach Hint]
├── Locator (16 bytes): SHA256(breach_txid)[0:16]
├── Encrypted Blob: AES-encrypted penalty tx
└── Session Info: Tower identification
```

The locator is derived from the commitment transaction ID. When a watchtower sees a transaction matching a locator, it can decrypt and broadcast the penalty.

---

## Privacy Considerations

Well-designed watchtower protocols preserve privacy:

| Information | Known to Watchtower |
|-------------|---------------------|
| Channel partners | No (encrypted) |
| Channel capacity | No (encrypted) |
| Channel balance | No (encrypted) |
| Number of updates | Yes (hint count) |
| Breach occurred | Yes (if triggered) |

### Encrypted Blobs

The penalty transaction is encrypted with a key derived from the commitment transaction:

```text
encryption_key = SHA256(breach_txid || session_key)
encrypted_blob = AES_CTR(penalty_tx, encryption_key)
```

Watchtowers cannot read the blob until they see the actual breach transaction on-chain.

---

## Watchtower Implementations

### LND Watchtower (wtclient/wtserver)

LND includes built-in watchtower support:

```bash
# Enable watchtower client in lnd.conf
[wtclient]
wtclient.active=true

# Connect to a watchtower
lncli wtclient add <tower_pubkey>@<host>:<port>

# List connected towers
lncli wtclient towers

# Check tower stats
lncli wtclient stats
```

### Running Your Own Tower (LND)

```bash
# Enable watchtower server in lnd.conf
[watchtower]
watchtower.active=true
watchtower.listen=0.0.0.0:9911

# Get your tower's URI
lncli tower info
```

### The Eye of Satoshi (TEOS)

An independent watchtower implementation:

```bash
# Install TEOS
cargo install teos

# Run the tower
teosd --btc_network=mainnet

# Register with TEOS from your node
# (implementation specific)
```

---

## Watchtower Economics

### Costs

For tower operators:

- **Storage**: ~200-500 bytes per channel state
- **Bandwidth**: Monitoring blockchain and receiving hints
- **Computation**: Checking transactions against hints

For users:

- **Bandwidth**: Sending hints after each channel update
- **Fees**: Some towers charge per-hint or percentage of recovered funds

### Fee Models

| Model | Description |
|-------|-------------|
| Free (altruistic) | Community-run, no fees |
| Per-hint | Fixed fee per state update |
| Recovery percentage | Tower keeps % of penalty funds |
| Subscription | Monthly/yearly flat fee |

---

## Backup Strategies

Watchtowers complement but don't replace proper backups:

### What Watchtowers Protect Against

- Counterparty broadcasting old state while you're offline
- Short-term node downtime
- Network connectivity issues

### What Watchtowers Don't Protect Against

- Loss of node data (seed, channel state)
- Cooperative close disputes
- Your own mistakes (broadcasting old state)

### Recommended Setup

1. **Multiple watchtowers**: Don't rely on a single tower
2. **Static Channel Backups (SCB)**: For disaster recovery
3. **Regular node backups**: Full database backups
4. **Monitoring**: Alerts for extended downtime

---

## Watchtower Selection

When choosing watchtowers, consider:

### Reliability

- Uptime track record
- Geographic distribution
- Infrastructure quality

### Privacy

- Protocol used (encrypted blobs?)
- Data retention policy
- Logging practices

### Trust Model

```text
[Self-hosted: most trust, most effort] --> [Friend tower: trusted party] --> [Community towers: reputation-based] --> [Commercial towers: contractual]
```

---

## Protocol Variants

### BOLT Draft (Original)

The original watchtower proposal (never finalized as BOLT):

- Simple locator-based matching
- Single tower per channel
- Basic encrypted blobs

### TEOS Protocol

Enhanced protocol with:

- Appointment-based scheduling
- Accountability proofs
- Multiple tower support

### VLS (Validating Lightning Signer)

Alternative approach where signing is done remotely:

- Signer validates all transactions
- Can refuse to sign old states
- Eliminates need for breach monitoring

---

## Common Issues

### Tower Unreachable

**Problem**: Cannot connect to watchtower.

**Solutions**:
- Check network connectivity
- Verify tower address/port
- Try alternative towers
- Run your own tower

### Hint Upload Failures

**Problem**: Failed to send breach hints.

**Solutions**:
- Retry with backoff
- Check tower capacity
- Verify authentication

### False Positives

**Problem**: Tower broadcasts penalty for valid close.

**Mitigation**:
- Use encrypted blobs (tower can't read until breach)
- Watchtower only acts on actual old commitment txids

---

## Setup Example (LND)

Complete setup for watchtower protection:

```bash
# 1. Enable watchtower client
# Add to lnd.conf:
[wtclient]
wtclient.active=true

# 2. Restart LND
systemctl restart lnd

# 3. Add public watchtowers
lncli wtclient add 024...@tower1.example.com:9911
lncli wtclient add 025...@tower2.example.com:9911

# 4. Verify connection
lncli wtclient towers

# 5. Check statistics
lncli wtclient stats
```

---

## Summary

Watchtowers provide:

- **Offline protection**: Monitor blockchain when your node is down
- **Automated response**: Broadcast penalties without manual intervention
- **Privacy preservation**: Encrypted hints protect channel details
- **Decentralized security**: Multiple towers reduce single points of failure

---

## Best Practices

1. **Use multiple watchtowers** from different operators
2. **Run your own tower** if possible for maximum privacy
3. **Verify tower reliability** before trusting with real funds
4. **Combine with backups** for complete protection
5. **Monitor tower connections** to ensure they're active

---

## Related Topics

- [Channels](/docs/lightning/channels) - Channel security and force close
- [Anchor Outputs](/docs/lightning/anchor-outputs) - Fee bumping for penalties

---

## Resources

- [BOLT Draft: Watchtower Protocol](https://github.com/lightning/bolts/pull/851)
- [LND Watchtower Documentation](https://docs.lightning.engineering/lightning-network-tools/lnd/watchtower)
- [The Eye of Satoshi](https://github.com/talaia-labs/rust-teos)
