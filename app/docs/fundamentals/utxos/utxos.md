# The UTXO Model

The UTXO (Unspent Transaction Output) model is one of Bitcoin's most fundamental and elegant design choices. Unlike traditional account-based systems where balances are stored in accounts, Bitcoin tracks ownership through discrete, spendable transaction outputs. Understanding UTXOs is essential to understanding how Bitcoin actually works. A **UTXO** is a transaction output that hasn't been spent yet. It represents the actual "coins" in Bitcoin's accounting model. When you "have 1 BTC," you don't have a balance in an account. You actually possess one or more UTXOs that sum to that amount. Key characteristics:

- **Discrete units**: Each UTXO is a separate, indivisible unit
- **All-or-nothing spending**: You must spend an entire UTXO; partial spending isn't possible
- **Consumption**: When a UTXO is spent, it's completely consumed and removed from the [UTXO set](/docs/glossary#utxo-set)
- **Creation**: Every transaction creates new UTXOs as outputs

---

## UTXO vs Account-Based Systems

Bitcoin's UTXO model differs fundamentally from traditional account-based systems:

| Aspect | UTXO Model (Bitcoin) | Account-Based (Traditional) |
|--------|---------------------|----------------------------|
| **Storage** | Discrete outputs | Account balances |
| **Spending** | Consume entire UTXO | Debit from account balance |
| **Privacy** | Each UTXO is separate | All transactions linked to account |
| **Verification** | Check if output exists and unspent | Check if account has sufficient balance |
| **Parallel Processing** | Multiple UTXOs can be processed simultaneously | Account updates must be sequential |
| **State** | UTXO set represents current state | Account balances represent state |

**Why the UTXO Model?**

- **Simpler verification**: Nodes only need to check if a UTXO exists and hasn't been spent
- **Better privacy**: Each UTXO is independent; transactions don't automatically link
- **Parallel processing**: Multiple transactions can be validated simultaneously
- **Clear ownership**: No ambiguity about what can be spent

---

## The UTXO Lifecycle

The UTXO lifecycle follows this flow:

```mermaid
flowchart LR
  Out[Transaction Output in block]
  UTXO[UTXO unspent]
  Ref[Referenced by Transaction Input]
  Consumed[Consumed removed from UTXO set]
  New[New Outputs Created]
  Out --> UTXO
  UTXO --> Ref
  Ref --> Consumed
  Consumed --> New
```

### Step-by-Step Lifecycle

1. **Output Creation**: A transaction creates outputs with specific amounts and spending conditions (scriptPubKeys)
2. **UTXO Status**: If an output hasn't been spent, it's a UTXO
3. **Spending**: A transaction input references a UTXO (by transaction ID and output index)
4. **Consumption**: The UTXO is consumed: it can never be spent again
5. **New UTXOs**: The transaction creates new outputs, which become new UTXOs

---

## Understanding the Relationships

### Addresses → Outputs → UTXOs

**Addresses are not accounts.** They're human-readable encodings of spending conditions that get embedded in transaction outputs.

```mermaid
flowchart TD
  Addr[Address]
  Script[Output ScriptPubKey]
  UTXO[UTXO]
  Addr -->|encoded as| Script
  Script -->|when unspent| UTXO
```

When someone sends bitcoin to your address:
1. Your address is converted to a scriptPubKey
2. This scriptPubKey is placed in a transaction output
3. That output becomes a UTXO you can spend (if you control the private key)

**Important**: An address doesn't "hold" bitcoin. Bitcoin is held in UTXOs that have scriptPubKeys matching your address's spending conditions.

### UTXOs → Inputs

When you want to spend bitcoin, you reference existing UTXOs as inputs:

```mermaid
flowchart TD
  In[Input Structure]
  In --> PrevTXID[Previous TXID]
  In --> OutIdx[Output Index]
  In --> ScriptSig[ScriptSig]
  In --> Seq[Sequence]
```

Each input references exactly one UTXO. The input must provide proof (via ScriptSig and witness data) that it satisfies the spending conditions encoded in that UTXO's scriptPubKey.

### Inputs → Outputs

Every transaction must create at least one output. When you spend UTXOs:

```mermaid
flowchart TD
  Tx[Transaction]
  Inputs[Inputs consuming UTXOs]
  Outputs[Outputs creating new UTXOs]
  Tx --> Inputs
  Tx --> Outputs
  Inputs --> I1[Input 1: 0.5 BTC UTXO]
  Inputs --> I2[Input 2: 0.3 BTC UTXO]
  Outputs --> O1[Output 1: 0.7 BTC to recipient]
  Outputs --> O2[Output 2: 0.1 BTC change]
```

**Key Rule**: `Sum of Input Values ≥ Sum of Output Values`

The difference becomes the transaction fee paid to miners.

### Transaction Structure

A transaction is the bridge between consuming old UTXOs and creating new ones:

```mermaid
flowchart TD
  Tx[Transaction]
  Tx --> Ver[Version]
  Tx --> Inputs[Inputs]
  Tx --> Outputs[Outputs]
  Tx --> Lock[Locktime]
  Inputs --> InDesc["Each input: TXID, output_index, scriptSig, sequence"]
  Outputs --> OutDesc["Each output: value, scriptPubKey"]
```

---

## Practical Examples

### Simple Transaction Flow

**Scenario**: Alice wants to send 0.1 BTC to Bob. She has a UTXO worth 0.5 BTC.

```
Before:
- Alice's UTXO: 0.5 BTC (unspent)

Transaction:
- Input: Alice's 0.5 BTC UTXO
- Output 1: 0.1 BTC to Bob's address
- Output 2: 0.4 BTC change back to Alice
- Fee: 0.0 BTC (for simplicity)

After:
- Alice's old UTXO: CONSUMED (no longer exists)
- Bob's new UTXO: 0.1 BTC (can now spend)
- Alice's new UTXO: 0.4 BTC (change, can spend)
```

**Key Points**:
- The entire 0.5 BTC UTXO was consumed
- Two new UTXOs were created
- Alice's "balance" is now a different UTXO (the change)

### Multiple UTXO Spending

**Scenario**: Alice wants to send 0.8 BTC but has multiple smaller UTXOs.

```
Alice's UTXOs:
- UTXO 1: 0.3 BTC
- UTXO 2: 0.4 BTC
- UTXO 3: 0.2 BTC
Total: 0.9 BTC

Transaction:
- Input 1: UTXO 1 (0.3 BTC)
- Input 2: UTXO 2 (0.4 BTC)
- Input 3: UTXO 3 (0.2 BTC)
- Output 1: 0.8 BTC to Bob
- Output 2: 0.09 BTC change to Alice
- Fee: 0.01 BTC

Result:
- All three UTXOs consumed
- Two new UTXOs created (payment + change)
```

This demonstrates **coin selection**: the process of choosing which UTXOs to spend. Wallets must select UTXOs that sum to at least the payment amount plus fees.

### Change Outputs Explained

Change outputs are crucial to understand:

**Why Change?**
- You must spend entire UTXOs
- If your UTXO (0.5 BTC) is larger than your payment (0.1 BTC), you need change
- Change creates a new UTXO back to an address you control

**Privacy Consideration**: Change outputs can reveal that you're the sender, as they typically go back to addresses you control. Advanced wallets use techniques to make change less obvious.

---

## The UTXO Set

The **UTXO Set** is the complete database of all unspent transaction outputs at any given point in time. It represents the current state of Bitcoin ownership.

### What It Is

The UTXO set is essentially Bitcoin's "ledger state." Instead of storing account balances, Bitcoin stores the set of all spendable outputs.

**Current Size**: Approximately 70-100 million UTXOs, requiring several gigabytes of storage.

### Why Nodes Maintain It

Full nodes maintain the UTXO set for fast transaction validation:

1. **Existence Check**: When validating a transaction input, nodes check if the referenced UTXO exists
2. **Double-Spend Prevention**: Nodes verify the UTXO hasn't already been spent
3. **Efficiency**: Without the UTXO set, nodes would need to scan the entire blockchain for each validation

**Without UTXO Set**: To validate a transaction, you'd need to:
- Search through all blocks to find the output
- Check if it was spent in any subsequent transaction
- This would be extremely slow

**With UTXO Set**: Validation is nearly instant:
- Look up UTXO in the set (fast database query)
- Verify it exists and is unspent
- Remove it from the set when spent

### How It's Maintained

The UTXO set is updated with each new block:

```mermaid
flowchart TD
  Block[New Block Arrives]
  ForEach[For each transaction]
  Block --> ForEach
  ForEach --> Remove[Remove consumed UTXOs from set - inputs]
  ForEach --> Add[Add new UTXOs to set - outputs]
  Remove --> Updated[UTXO set updated]
  Add --> Updated
```

**Example**:
```
UTXO Set Before Block: 100,000,000 UTXOs

Block Contains:
- 1,000 transactions
- 2,500 inputs (consuming UTXOs)
- 2,600 outputs (creating UTXOs)

UTXO Set After Block: 100,000,100 UTXOs
(100M - 2,500 + 2,600 = 100,000,100)
```

### Performance Implications

Keeping the UTXO set manageable is critical for node performance:

- **Storage**: Each UTXO requires storage (typically 50-100 bytes)
- **Memory**: Active UTXOs are kept in fast storage (RAM or SSD)
- **Validation Speed**: Larger sets mean slower lookups
- **Sync Time**: New nodes must build the UTXO set from scratch

**Why Dust Outputs Matter**: Creating many tiny UTXOs (dust) bloats the UTXO set without providing much value. This is why:
- Wallets avoid creating dust outputs
- Some nodes prune dust outputs
- Fee rates make spending dust uneconomical

### AssumeUTXO

**AssumeUTXO** is a feature that allows new nodes to bootstrap faster by starting with a trusted UTXO set snapshot instead of building it from scratch.

**Traditional Bootstrap**:
1. Download all blocks
2. Process each block sequentially
3. Build UTXO set incrementally
4. Takes days or weeks

**With AssumeUTXO**:
1. Download trusted UTXO set snapshot
2. Verify snapshot matches a known block
3. Continue from that point
4. Much faster (hours instead of days)

This makes running a full node more accessible while maintaining security through cryptographic verification of the snapshot.

### Querying the UTXO Set

Bitcoin nodes provide RPC commands to query UTXO set information:

**`gettxoutsetinfo`**: Returns statistics about the UTXO set
- Total number of UTXOs
- Total amount of bitcoin in UTXOs
- Size of the UTXO set
- Block height of the set

**`gettxout`**: Query a specific UTXO
- Check if a specific output is unspent
- Get the value and scriptPubKey
- Useful for wallet balance checking

See the [RPC Commands](/docs/bitcoin/rpc#9-utxo-set-information) documentation for details.

---

## Privacy Implications

The UTXO model has important privacy characteristics:

### Positive Aspects

- **UTXO Independence**: Each UTXO is separate; spending one doesn't automatically reveal others
- **No Account Linking**: Unlike account-based systems, there's no single "account" that links all your transactions
- **Change Outputs**: While change can be identified, it's not always obvious

### Privacy Challenges

- **UTXO Linking**: If you spend multiple UTXOs together, they're likely yours
- **Change Identification**: Change outputs often go back to the sender
- **Address Reuse**: Using the same address links all UTXOs sent to it
- **Blockchain Analysis**: Sophisticated analysis can cluster UTXOs by owner

**Best Practices**:
- Generate new addresses for each transaction
- Use [coin selection](/docs/wallets/coin-selection) strategies that enhance privacy
- Consider [CoinJoin](/docs/glossary#coinjoin) for better privacy
- Avoid address reuse

---

## Common Misconceptions

### "I have a balance in my address"

**Reality**: Addresses don't hold balances. You control UTXOs whose scriptPubKeys match addresses derived from your keys. Your "balance" is the sum of UTXOs you can spend.

### "Bitcoin works like a bank account"

**Reality**: Bitcoin is fundamentally different. There are no accounts, only discrete UTXOs. Each transaction consumes entire UTXOs and creates new ones.

### "I can send part of a UTXO"

**Reality**: You must spend entire UTXOs. If you need to send less, you create a change output back to yourself.

### "UTXOs are stored in my wallet"

**Reality**: UTXOs exist on the blockchain. Your wallet tracks which UTXOs you can spend by monitoring addresses you control. The wallet doesn't "store" the UTXOs: they're on every full node.

### "The UTXO set is the blockchain"

**Reality**: The blockchain contains all historical transactions. The UTXO set is a derived database containing only unspent outputs. It's much smaller than the full blockchain.

---

## Why This Matters

Understanding the UTXO model is essential because:

1. **Transaction Construction**: You must understand UTXOs to build valid transactions
2. **Fee Calculation**: Transaction size (and thus fees) depends on the number of inputs/outputs
3. **Privacy**: UTXO management affects your privacy
4. **Wallet Design**: Wallets must implement coin selection algorithms
5. **Node Operation**: Running a node requires understanding UTXO set management

The UTXO model is not just a technical detail: it's fundamental to how Bitcoin works. Every transaction, every wallet, every node interacts with the UTXO model. Understanding it deeply will make you a better Bitcoin user, developer, or node operator.

---

## Related Topics

- [Transaction Construction](/docs/bitcoin-development/transactions) - How to build transactions using UTXOs
- [Coin Selection](/docs/wallets/coin-selection) - Algorithms for choosing which UTXOs to spend
- [Address Types](/docs/wallets/address-types) - How addresses relate to UTXO scriptPubKeys
- [RPC Commands](/docs/bitcoin/rpc#9-utxo-set-information) - Querying the UTXO set
- [Blockchain Monitoring](/docs/bitcoin-development/blockchain-monitoring) - Tracking UTXOs programmatically
