# Wallet Security & Self-Custody

**Not your keys, not your coins.** This fundamental principle of Bitcoin ownership means that if you don't control your private keys, you don't truly own your Bitcoin. This guide explains how to securely store your Bitcoin using cold wallets, hardware wallets, and air-gapped systems.

---

## Why Self-Custody Matters

When you store Bitcoin on an exchange or custodial service, you're trusting a third party with your funds. While this may be convenient, it comes with significant risks:

- **Exchange hacks:** Exchanges can be hacked, leading to loss of funds
- **Regulatory risk:** Exchanges can freeze accounts or halt withdrawals
- **Counterparty risk:** The exchange could go bankrupt or disappear
- **No true ownership:** You don't control your private keys

**Self-custody** means you control your private keys, giving you true ownership of your Bitcoin. However, with great power comes great responsibility: you must secure your keys properly.

---

## Understanding Private Keys and Seed Phrases

### Private Keys

A **private key** is a secret cryptographic key that proves ownership of Bitcoin. Whoever controls the private key controls the Bitcoin. If you lose your private key, you lose your Bitcoin forever. There's no password recovery.

### Seed Phrases

A **seed phrase** (also called a recovery phrase or mnemonic) is a human-readable backup of your private keys. It's typically 12 or 24 words that can be used to recover all your Bitcoin if you lose access to your wallet.

**Critical:** Your seed phrase IS your Bitcoin. Anyone who has your seed phrase can steal your Bitcoin. Protect it accordingly.

---

## Types of Wallets

| Wallet Type | Connection | Security | Convenience | Best For |
|-------------|------------|----------|-------------|----------|
| **Hot Wallets** | Internet-connected | Lower | High | Small amounts, daily use, frequent transactions |
| **Cold Wallets** | Offline | Highest | Lower | Long-term storage, significant amounts |

**Hot Wallets:** Mobile apps, desktop software, web wallets. Easy to use but more vulnerable to hacking.

**Cold Wallets:** Hardware wallets, air-gapped systems. Private keys never touch the internet. Much more secure but less convenient.

---

## Hardware Wallets

A **hardware wallet** is a physical device designed specifically for storing private keys securely. It's a specialized computer that:

- Generates private keys offline
- Signs transactions without exposing keys to your computer
- Stores keys in a secure chip (secure element)
- Requires physical confirmation for transactions

### How Hardware Wallets Work

1. **Key Generation:** Private keys are generated on the device and never leave it
2. **Transaction Signing:** When you want to send Bitcoin, the transaction is sent to the device
3. **Physical Confirmation:** You confirm the transaction on the device itself
4. **Secure Signing:** The device signs the transaction with your private key (which never leaves the device)
5. **Transaction Broadcast:** The signed transaction is sent back to your computer and broadcast to the network

**Key Point:** Your private keys never leave the hardware wallet. Even if your computer is infected with malware, your keys remain secure.

### Popular Hardware Wallets

| Wallet | Open Source | Air-Gap | Multi-Crypto | Best For |
|--------|------------|---------|-------------|----------|
| **Ledger** | No | No | Yes | Beginners, multi-crypto users |
| **Trezor** | Yes | No | Yes (Bitcoin-focused) | Security-conscious, open-source preference |
| **Coldcard** | Yes | Yes | Bitcoin-only | Advanced users, maximum security |
| **BitBox02** | Yes | No | Bitcoin-only | Simplicity, open-source |

**Important:** Always purchase hardware wallets directly from the manufacturer or authorized resellers. Never buy used hardware wallets, as they may be compromised.

---

## Air-Gapped Systems

An **air-gapped** system is a computer or device that has never been connected to the internet. This provides the highest level of security because:

- No network attacks possible
- No malware can reach the device
- Private keys are completely isolated

### Air-Gapped Wallet Setup

1. **Use a dedicated device:** A computer that will never connect to the internet
2. **Install wallet software:** Download and install Bitcoin wallet software on the air-gapped device
3. **Generate keys offline:** Create your wallet and seed phrase on the air-gapped device
4. **Create watch-only wallet:** On your internet-connected computer, create a watch-only wallet using your public keys (not private keys)
5. **Receive Bitcoin:** Use the watch-only wallet to generate receiving addresses
6. **Sign transactions offline:** Create transactions on your internet-connected computer, transfer to air-gapped device, sign offline, then transfer back

**Advanced:** This approach provides maximum security but requires more technical knowledge and setup.

---

## Seed Phrase Security

### Physical Storage

**Best practices:**
- Write your seed phrase on paper or metal (fire/water resistant)
- Store in multiple secure locations
- Never store digitally (photos, cloud, email, notes apps)
- Consider splitting your seed phrase across multiple locations
- Use a metal backup for fire/water protection

### What NOT to Do

❌ **Never store digitally:** No photos, cloud storage, email, or digital notes  
❌ **Never share:** Don't share your seed phrase with anyone  
❌ **Never store all copies in one place:** Use multiple locations  
❌ **Never use online generators:** Only generate seed phrases on trusted, offline devices  
❌ **Never type into a computer:** If possible, write it down manually

### Seed Phrase Backup Strategies

| Strategy | Security | Complexity | Risk of Loss | Risk of Theft |
|----------|----------|------------|-------------|---------------|
| **Single Location** | Medium | Low | High (single point of failure) | Medium |
| **Multiple Locations** | High | Medium | Low | Higher (if not secured) |
| **Split Storage** | Highest | High | Low (need all parts) | Low (parts separated) |
| **Metal Backup** | High | Medium | Low (fire/water resistant) | Depends on storage |

**Best Practice:** Combine strategies - use multiple locations with metal backups for maximum security.

---

## Multi-Signature Wallets

A **multi-signature (multisig)** wallet requires multiple private keys to authorize a transaction. For example, a 2-of-3 multisig requires 2 out of 3 keys to sign.

### Benefits

- **No single point of failure:** Losing one key doesn't mean losing your Bitcoin
- **Enhanced security:** Requires compromise of multiple keys
- **Flexibility:** Can distribute keys across different locations and people
- **Recovery options:** Can set up with trusted parties or locations

### Example Setup

**2-of-3 Multisig:**
- Key 1: Your hardware wallet (primary)
- Key 2: Backup hardware wallet (stored securely)
- Key 3: Trusted party or secure location

**Benefits:** If you lose one key, you still have access. If one key is compromised, your funds are still safe.

**When to use:** Large holdings, institutional custody, high-security requirements.

---

## Security Best Practices by Amount

| Amount | Wallet Type | Seed Backup | Additional Security |
|--------|-------------|-------------|---------------------|
| **< $1,000** | Mobile wallet | Paper/metal, single location | Reputable software, keep updated |
| **$1,000 - $10,000** | Hardware wallet | Multiple locations, metal backup | Test recovery process |
| **> $10,000** | Hardware/air-gapped | Multiple locations, metal backups | Multisig (2-of-3 or 3-of-5), professional consultation |

---

## Common Security Mistakes

**Storing seed phrase digitally:** Photos, cloud storage, email, or notes apps can be hacked. Never store seed phrases digitally.

**Sharing seed phrase:** Never share your seed phrase with anyone, even if they claim to be from support or an exchange.

**Using custodial wallets for large amounts:** While convenient, custodial wallets add counterparty risk. Use self-custody for significant amounts.

**Not testing recovery:** Always test that you can recover your wallet from your seed phrase before storing significant amounts.

**Buying used hardware wallets:** Used hardware wallets may be compromised. Always buy new from the manufacturer.

**Not verifying addresses:** Always verify receiving addresses on your hardware wallet screen, not just on your computer.

---

## Physical Security

### Home Storage

- Use a fireproof safe
- Consider a safety deposit box for backups
- Don't store all copies in one location
- Tell trusted family members where backups are (but not the seed phrase itself)

### Travel Considerations

- Don't travel with your seed phrase
- Use a hardware wallet for travel (can be replaced if lost)
- Keep seed phrase backups in secure home locations
- Consider a travel wallet with small amounts separate from main holdings

---

## Recovery Planning

### Test Your Recovery

Before storing significant amounts:

1. Create a test wallet
2. Write down the seed phrase
3. Delete the wallet
4. Restore from seed phrase
5. Verify you can access the wallet

**Critical:** If you can't recover your test wallet, you won't be able to recover your real wallet. Fix your backup process before storing significant amounts.

### Estate Planning

Consider how your Bitcoin will be accessed if something happens to you:

- Store seed phrase backups in locations accessible to trusted family members
- Document your wallet setup and recovery process
- Consider multi-signature with trusted parties
- Update your will or estate plan to include Bitcoin holdings

**Important:** Balance security with accessibility. If you're the only one who knows where your seed phrase is, your Bitcoin may be lost if something happens to you.

---

## When to Use Custodial Services

While self-custody is generally recommended, custodial services may make sense for:

- **Very small amounts:** Convenience may outweigh risk
- **Active trading:** Exchanges are necessary for trading
- **Institutional needs:** Some institutions require custodial services
- **Lack of technical knowledge:** If you're not comfortable with self-custody, use a reputable custodian while you learn

**Trade-offs:** Understand that custodial services add counterparty risk. Use reputable, regulated services if you choose this route.

---

## Getting Started

1. **Start small:** Begin with a small amount while you learn
2. **Choose a hardware wallet:** Research and purchase a reputable hardware wallet
3. **Set up securely:** Follow the device's setup instructions carefully
4. **Backup seed phrase:** Write it down on paper and metal, store securely
5. **Test recovery:** Delete and restore your wallet to verify your backup works
6. **Gradually increase:** As you become more comfortable, you can increase your holdings

---

## Related Topics

- [Risk Management](/philosophy/investment/risk-management) - Understanding investment risks, including custody risk
- [Privacy](/philosophy/investment/privacy) - Privacy considerations for protecting your financial information
- [Interactive Tools](/philosophy/investment/tools) - Wallet tools and other helpful resources
- [Wallet Development](/docs/wallets) - Technical wallet development (for developers)
- [Key Management](/docs/bitcoin-development/keys) - Technical key management (for developers)

---

**Remember:** Your Bitcoin is only as secure as your private keys. Take the time to learn proper security practices before storing significant amounts. The security of your Bitcoin is entirely in your hands.
