# Governance & Evolution

Bitcoin has no central authority. Its evolution happens through a decentralized process of rough consensus, where changes are proposed, discussed, and adopted (or rejected) by the community.

## How Bitcoin Evolves

### The Process

```text
1. Proposal: BIP (Bitcoin Improvement Proposal)
2. Discussion: Community review and debate
3. Implementation: Code written and tested
4. Activation: Network-wide adoption
5. Deployment: Soft fork or hard fork
```

### Key Principles

- **Rough consensus**: No formal voting, but broad agreement needed
- **Code is law**: Running code determines network rules
- **Backward compatibility**: Soft forks preferred over hard forks
- **Conservative changes**: Slow, careful evolution

---

## Bitcoin Improvement Proposals (BIPs)

### BIP Types

| Type | Description | Examples |
|------|-------------|----------|
| **Standards Track** | Protocol changes | BIP 141 (SegWit), BIP 341 (Taproot) |
| **Informational** | Guidelines, information | BIP 2 (BIP Process) |
| **Process** | Process changes | BIP 1, BIP 2 |

### BIP Lifecycle

```text
Draft → Proposed → Final → Withdrawn/Replaced
```

---

## Activation Mechanisms

### Soft Fork Activation

**BIP 9 (Version Bits)**:
- Miners signal in block version
- Requires 95% threshold
- Grace period for activation

**User-Activated Soft Fork (UASF)**:
- Nodes enforce rules
- Community-driven
- Used for SegWit activation

### Hard Fork Activation

- Requires all nodes to upgrade
- Or acceptance of chain split
- Rarely used (Bitcoin Cash split)

For the full history of Bitcoin upgrades (soft and hard forks), see [Forks](/philosophy/history/forks).

---

## Key Stakeholders

### Miners

- **Role**: Secure network, process transactions
- **Influence**: Can signal for soft forks
- **Limits**: Can't force unwanted changes

### Developers

- **Role**: Write code, propose changes
- **Influence**: Technical expertise
- **Limits**: Can't force adoption

### Users/Node Operators

- **Role**: Run nodes, validate rules
- **Influence**: Ultimate authority (choose software)
- **Power**: Can reject changes by not upgrading

### Exchanges & Businesses

- **Role**: Provide services, liquidity
- **Influence**: Economic weight
- **Limits**: Must follow network rules

---

## Historical Examples

### SegWit Activation

```text
Process:
1. Proposed in 2015
2. Years of debate (Blocksize Wars)
3. UASF movement (BIP 148)
4. Activated August 2017
5. ~80% adoption today
```

### Taproot Activation

```text
Process:
1. Proposed 2018
2. Community discussion
3. BIP 9 activation
4. Activated November 2021
5. Growing adoption
```

---

## Challenges

### Coordination Problems

- **No central authority**: Hard to coordinate changes
- **Diverse interests**: Different stakeholders want different things
- **Slow process**: Changes take years

### Controversies

- **Blocksize Wars**: Major debate over scaling
- **Activation methods**: Disagreement on how to activate
- **Philosophical differences**: Different visions for Bitcoin

---

## Related Topics

- [BIPs](/philosophy/history/bips) - Bitcoin Improvement Proposals
- Forks - Protocol upgrades
- [Controversies](/philosophy/controversies) - Major debates

---

## Resources

- [BIP Repository](https://github.com/bitcoin/bips)
- [Bitcoin Dev Mailing List](https://lists.linuxfoundation.org/mailman/listinfo/bitcoin-dev)
- [Bitcoin Optech](https://bitcoinops.org/) - Technical newsletter
