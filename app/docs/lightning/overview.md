# The Lightning Network

The Lightning Network is a second-layer payment protocol built on top of Bitcoin. It enables instant, low-cost payments by creating a network of bidirectional payment channels between nodes.

## History

The Lightning Network was proposed in 2015 by Joseph Poon and Thaddeus Dryja in their whitepaper "The Bitcoin Lightning Network: Scalable Off-Chain Instant Payments." The concept addresses Bitcoin's scalability limitations by moving most transactions off-chain while maintaining the security guarantees of the Bitcoin blockchain.

The first mainnet Lightning implementations launched in 2018, including LND (Lightning Labs), c-lightning/CLN (Blockstream), and Eclair (ACINQ).

---

## Key Concepts

- **Payment Channels**: Two-party channels that allow unlimited off-chain transactions
- **Off-Chain Transactions**: Payments settle instantly without blockchain confirmation
- **HTLCs**: Hash Time-Locked Contracts enable trustless multi-hop routing
- **Onion Routing**: Privacy-preserving payment routing (similar to Tor)
- **Instant Settlement**: Payments complete in milliseconds, not minutes

---

## How It Works

1. **Open Channel**: Two parties lock Bitcoin in a 2-of-2 multisig address
2. **Update Balance**: Parties exchange signed commitment transactions to update the channel balance
3. **Route Payments**: Payments can route through multiple channels using HTLCs
4. **Close Channel**: Final state is broadcast to the Bitcoin blockchain

```text
[Open channel] --> [Update balance with HTLCs] --> [Route payments] --> [Close channel]
```

---

## Scalability

The Lightning Network can theoretically handle millions of transactions per second because:

- Most transactions never touch the blockchain
- Channels can be reused for unlimited payments
- Network capacity grows with each new channel
- Fees are minimal (typically < 1 satoshi)

---

## Trade-offs

| Aspect | On-Chain Bitcoin | Lightning Network |
|--------|------------------|-------------------|
| Speed | 10-60 minutes | Milliseconds |
| Fees | Variable (1-100+ sats/vB) | Near zero |
| Finality | Probabilistic | Instant (conditional) |
| Capacity | ~7 TPS | Millions TPS |
| Requirement | None | Channel liquidity |
| Online | No | Yes (for receiving) |

---

## Getting Started with Lightning

This section covers practical setup and operations for running a Lightning node.

### Prerequisites

- **Bitcoin Node**: Fully synced Bitcoin Core node
- **Lightning Implementation**: LND, CLN (Core Lightning), Eclair, or LDK-based
- **Network**: Signet (recommended for testing) or mainnet

### Bitcoin Node Configuration

Add to your `bitcoin.conf`:

```ini
# ZMQ Notifications (required for Lightning)
zmqpubrawblock=tcp://127.0.0.1:28332
zmqpubrawtx=tcp://127.0.0.1:28333

# Recommended settings
txindex=1
server=1
```

Bitcoin Core must be built with ZMQ support for Lightning to work.

### Lightning Node Configuration (LND)

Create `lnd.conf`:

```ini
[Application Options]
debuglevel=info
maxpendingchannels=10

[Bitcoin]
bitcoin.active=1
bitcoin.signet=1
bitcoin.node=bitcoind

[Bitcoind]
bitcoind.rpchost=localhost
bitcoind.rpcuser=your_rpc_user
bitcoind.rpcpass=your_rpc_password
bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332
bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333
```

Start LND:

```bash
lnd --configfile=/path/to/lnd.conf
```

### Funding Your Node

Get a deposit address from your Lightning node:

```bash
lncli newaddress p2wkh
```

Send Bitcoin to this address and wait for confirmation (typically 3-6 blocks for safety).

---

## Opening Channels

### Connect to a Peer

```bash
lncli connect <pubkey>@<host>:<port>
```

### Open a Channel

```bash
# Open a channel with 100,000 satoshis capacity
lncli openchannel --node_key=<pubkey> --local_amt=100000
```

The channel opening process:

1. Create funding transaction (2-of-2 multisig)
2. Exchange initial commitment transactions
3. Broadcast funding transaction
4. Wait for confirmations (typically 3-6 blocks)
5. Channel becomes active

### Check Channel Status

```bash
lncli listchannels
lncli pendingchannels
```

---

## Creating and Paying Invoices

### Create an Invoice

```bash
# Create invoice for 1000 satoshis
lncli addinvoice --amt=1000 --memo="Coffee payment"
```

This returns a BOLT11 invoice string starting with `lnbc` (mainnet), `lntb` (testnet), or `lntbs` (signet).

### Pay an Invoice

```bash
lncli payinvoice <bolt11_invoice>
```

### Track Payment Status

```bash
lncli listpayments
lncli trackpayment <payment_hash>
```

---

## Node Operations

### Get Node Info

```bash
lncli getinfo
```

### Check Balances

```bash
# On-chain balance
lncli walletbalance

# Channel balance
lncli channelbalance
```

### List Connected Peers

```bash
lncli listpeers
```

---

## Troubleshooting

### Channel Not Opening

- Verify Bitcoin node is synced and ZMQ is configured
- Check you have sufficient on-chain balance
- Ensure peer is reachable and accepting channels

### Payment Failing

- **No route found**: Insufficient network connectivity
- **Insufficient balance**: Not enough outbound liquidity
- **HTLC timeout**: Route too long or node offline

### Node Not Starting

- Check Bitcoin RPC credentials
- Verify ZMQ ports match configuration
- Review LND logs: `tail -f ~/.lnd/logs/bitcoin/mainnet/lnd.log`

---

## Best Practices

### Security

- Back up your channel state and wallet seed
- Use strong RPC credentials
- Keep Lightning software updated
- Consider running a [watchtower](/docs/lightning/watchtowers)

### Channel Management

- Open channels to well-connected nodes
- Maintain balanced channels for routing
- Monitor channel health regularly
- Close inactive or problematic channels

---

## Next Steps

- Learn about [Payment Channels](/docs/lightning/channels)
- [Routing Fees](/docs/lightning/routing-fees), [HTLCs](/docs/lightning/routing/htlc), and [Multi-Part Payments](/docs/lightning/routing/mpp)
- Explore [Onion Routing](/docs/lightning/onion) for privacy
- [Invoices (BOLT11)](/docs/lightning/invoices) and [Offers (BOLT12)](/docs/lightning/bolt12-offers) for payment requests and recurring payments

---

## Resources

- [BOLT Specifications](https://github.com/lightning/bolts) - Protocol specifications
- [LND Documentation](https://docs.lightning.engineering/)
- [Core Lightning Documentation](https://docs.corelightning.org/)
- [Lightning Network Whitepaper](https://lightning.network/lightning-network-paper.pdf)
