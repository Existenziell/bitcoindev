# Signing & Sighash

When you [build a transaction](/docs/bitcoin-development/transactions), each input must be signed so that the [script](/docs/bitcoin/script) spending condition is satisfied. The **sighash type** controls which parts of the transaction are committed to when signing. This page covers how to choose and use sighash types in code, signing order for [multisig](/docs/wallets/multisig), and how signing fits into [PSBT](/docs/bitcoin-development/psbt) workflows. For the protocol definition of sighash types, see [Sighash Types](/docs/bitcoin/sighash-types).

## Sighash Types in Practice

- **SIGHASH_ALL (0x01)** or **SIGHASH_DEFAULT (0x00)** for [Taproot](/docs/bitcoin/taproot): Normal payments. Signer commits to all inputs and all outputs. Use this unless you need a contract pattern.
- **SIGHASH_ALL | SIGHASH_ANYONECANPAY (0x81)**: [CoinJoin](/docs/wallets/privacy) and similar: signer commits to all outputs and only *this* input; other inputs can be added later.
- **SIGHASH_NONE** or **SIGHASH_SINGLE**: Used in some [smart contracts](/docs/wallets/smart-contracts); rarely needed in wallet code.

Libraries usually default to SIGHASH_ALL (or SIGHASH_DEFAULT for Taproot). Only set another type when you explicitly need it.

## Setting Sighash Type When Signing

:::code-group
```rust
use bitcoin::sighash::EcdsaSighashType;
use bitcoin::secp256k1::Secp256k1;

// Default: SIGHASH_ALL
let sighash_type = EcdsaSighashType::All;

// For CoinJoin-style: commit to all outputs, this input only
let sighash_type_anyone = EcdsaSighashType::AllPlusAnyoneCanPay;

// When signing (e.g. with rust-bitcoin), pass sighash_type to sign_ecdsa or equivalent
// let sig = secp.sign_ecdsa_low_r(&msg, &secret_key);
// let sig_with_type = sig.to_vec(); sig_with_type.push(sighash_type as u8);
```

```python
# Default: SIGHASH_ALL (0x01)
SIGHASH_ALL = 0x01
SIGHASH_ALL_ANYONECANPAY = 0x81

# When building the sighash and signing (e.g. with python-bitcoinlib or ecdsa)
# use the sighash type in the signature hash computation, then append the byte to the sig
# sig = key.sign_digest(sighash, sigencode=...) 
# sig_der + bytes([sighash_type])
```

```cpp
// Default: SIGHASH_ALL
const uint8_t SIGHASH_ALL = 0x01;
const uint8_t SIGHASH_ALL_ANYONECANPAY = 0x81;

// When signing (e.g. with libsecp256k1), compute the sighash with the type,
// sign it, then append the sighash type byte to the signature in the witness/scriptSig.
```

```go
import "github.com/btcsuite/btcd/txscript"

// Default: SIGHASH_ALL
sighashType := txscript.SigHashAll

// For CoinJoin: commit to all outputs, this input only
sighashType = txscript.SigHashAll | txscript.SigHashAnyOneCanPay

// When signing: pass sighashType to txscript.RawTxInSignature or similar
// sig, _ := txscript.RawTxInSignature(tx, idx, prevOutScript, sighashType, privKey)
```

```javascript
const bitcoin = require('bitcoinjs-lib');

// Default: SIGHASH_ALL (0x01)
const SIGHASH_ALL = 0x01;
const SIGHASH_ALL_ANYONECANPAY = 0x81;

// When signing with bitcoinjs-lib / PSBT, the default is SIGHASH_ALL.
// To set per input:
psbt.signInput(inputIndex, keyPair); // uses default
// For custom sighash, some APIs accept options: { sighashType: SIGHASH_ALL_ANYONECANPAY }
```
:::

## Signing Order in Multisig

For M-of-N multisig, each of the M signers must sign the same [transaction](/docs/bitcoin-development/transactions) (or PSBT). Order does not matter for validity: any M signers can sign in any order. The resulting witness is a stack of M signatures (and possibly a script); the script verifies that M of N pubkeys signed. When using PSBT, each signer adds their signature to the PSBT; the finalizer combines them into the correct witness order required by the script.

:::code-group
```rust
// Multisig: each signer calls sign once per input they are responsible for.
// PSBT flow: creator builds PSBT -> signer1.sign(&mut psbt) -> signer2.sign(&mut psbt) -> finalize
use bdk::psbt::Psbt;

fn sign_psbt_input(psbt: &mut Psbt, input_index: usize, secret_key: &SecretKey) -> Result<(), Error> {
    let _ = psbt.sign(secret_key, &Secp256k1::new())?;
    Ok(())
}
```

```python
# Multisig: each signer signs the PSBT; order of signers does not matter.
# After all M signatures are present, finalize the PSBT.
from psbt import PSBT

def sign_psbt_input(psbt: PSBT, input_index: int, private_key) -> None:
    psbt.sign_input(input_index, private_key)
```

```cpp
// Each signer adds their signature to the PSBT for the inputs they control.
// Finalizer merges signatures into the witness in the order required by the script.
void sign_psbt_input(PartiallySignedTransaction& psbt, size_t input_index, const CKey& key) {
    // Use your library's PSBT sign API with key and input index
}
```

```go
// Each signer signs the PSBT for the inputs they own.
// Finalize combines signatures into the witness.
func signPSBTInput(psbt *psbt.Packet, inputIndex int, privKey *btcec.PrivateKey) error {
	return psbt.Sign(inputIndex, privKey, nil)
}
```

```javascript
// Each signer signs the PSBT; finalize combines signatures.
function signPSBTInput(psbt, inputIndex, keyPair) {
  psbt.signInput(inputIndex, keyPair);
}
```
:::

## Single Input: Sign and Attach

For a single-sig input, you compute the sighash for that input (using the chosen sighash type), sign it with the private key, and place the signature (and public key if needed) in the witness or scriptSig. Libraries (e.g. rust-bitcoin, bitcoinjs-lib, btcsuite) do this when you call “sign input” or “sign transaction.”

:::code-group
```rust
use bitcoin::secp256k1::{Secp256k1, SecretKey};
use bitcoin::sighash::SighashCache;

// Concept: get sighash for input, sign, set witness
fn sign_single_input(
    tx: &mut Transaction,
    input_index: usize,
    prev_out_script: &ScriptBuf,
    value: Amount,
    secret_key: &SecretKey,
    sighash_type: EcdsaSighashType,
) {
    let mut cache = SighashCache::new(tx);
    let sighash = cache.legacy_signature_hash(input_index, prev_out_script, value, sighash_type).unwrap();
    let secp = Secp256k1::new();
    let msg = secp256k1::Message::from_digest_slice(sighash.as_ref()).unwrap();
    let sig = secp.sign_ecdsa_low_r(&msg, secret_key);
    let sig_bytes = sig.serialize_der();
    let mut sig_with_type = sig_bytes.to_vec();
    sig_with_type.push(sighash_type as u8);
    // Set witness or scriptSig from sig_with_type and pubkey
    tx.input[input_index].witness.push(sig_with_type);
    tx.input[input_index].witness.push(secret_key.public_key(&secp).serialize());
}
```

```python
# Concept: compute sighash, sign, set witness
def sign_single_input(tx, input_index, prev_out_script, value, privkey, sighash_type=SIGHASH_ALL):
    sighash = legacy_signature_hash(tx, input_index, prev_out_script, value, sighash_type)
    sig = privkey.sign_digest(sighash, sigencode=der_encode)
    sig_with_type = sig + bytes([sighash_type])
    tx.vin[input_index].script_sig = CScript([sig_with_type, privkey.pubkey])
    # Or for SegWit: set tx.wit.vtxinwit[input_index].script_witness
```

```cpp
// Compute sighash for input, sign with key, set witness/scriptSig
void sign_single_input(CMutableTransaction& tx, size_t idx, const CScript& scriptPubKey,
                       int64_t value, const CKey& key, uint8_t sighashType) {
    uint256 sighash;
    SignatureHash(scriptPubKey, tx, idx, sighashType, value, SigVersion::BASE, sighash);
    std::vector<unsigned char> sig;
    key.Sign(sighash, sig);
    sig.push_back(sighashType);
    // Set tx.vin[idx].scriptSig or witness
}
```

```go
// Concept: compute witness signature and set witness
sig, err := txscript.RawTxInWitnessSignature(
	tx, txscript.NewTxSigHashes(tx, prevOutFetcher),
	inputIndex, prevOutValue, prevOutScript, sighashType, privKey,
)
if err != nil {
	return err
}
tx.TxIn[inputIndex].Witness = wire.TxWitness{sig, pubKey}
```

```javascript
// bitcoinjs-lib: signInput does sighash + sign + witness
psbt.signInput(0, keyPair);
const tx = psbt.finalizeAllInputs().extractTransaction();
```
:::

## PSBT Signing Flow

1. **Creator** builds an unsigned PSBT (inputs, outputs, optional [descriptors](/docs/bitcoin-development/descriptors)).
2. **Signers** each call “sign” for the inputs they control; the PSBT stores partial signatures.
3. **Finalizer** combines partial signatures into the witness (and checks that required M-of-N are present).
4. **Extract** the final transaction and broadcast.

See PSBT for structure and [Transaction Construction](/docs/bitcoin-development/transactions) for building the underlying transaction.

## Related Topics

- Sighash Types - Protocol definition of sighash types
- Transaction Construction - Building and signing transactions
- PSBT - Partially signed transactions and multi-party signing
- [Key Management](/docs/bitcoin-development/keys) - Private keys and signing
- [Script Patterns](/docs/bitcoin-development/script-patterns) - Multisig and contract scripts
- [Smart Contracts](/docs/wallets/smart-contracts) - When to use non-default sighash types
