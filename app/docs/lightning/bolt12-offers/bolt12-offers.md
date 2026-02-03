# Lightning Offers (BOLT12)

**BOLT12** is a Lightning protocol extension that introduces **offers** (and related structures such as **invoice requests** and **refunds**) as a more flexible alternative to [BOLT11](/docs/lightning/invoices) invoices. Offers allow payers to request an [invoice](/docs/lightning/invoices) from a payee without the payee having to be online first, support **reusable** payment identifiers, and enable use cases like recurring payments and better keysend-style flows.

## BOLT11 vs BOLT12

| Aspect | BOLT11 (Invoices) | BOLT12 (Offers) |
|--------|-------------------|------------------|
| **Creation** | Payee creates invoice when they want to be paid | Payee creates offer (can be static, reusable) |
| **Amount** | Fixed at creation (or any for `amount=any`) | Can be fixed or "any amount" in the offer |
| **Payee online** | Payee typically online to create invoice | Offer can be published; payee only needs to be online when *invoice* is requested |
| **Reusability** | One invoice ≈ one payment | One offer can yield many invoices (e.g., recurring) |
| **Encoding** | Bech32 (`lnbc...`, `lntb...`) | Bech32 with `lno`/`lnr`/etc. prefixes |

BOLT12 is specified in [BOLT 12](https://github.com/lightning/bolts/blob/master/12-offer-encoding.md) and related BOLTs. Support is implemented in [Core Lightning](https://github.com/ElementsProject/lightning) and [LDK](https://github.com/lightningdevkit/rust-lightning); [LND](https://github.com/lightningnetwork/lnd) and others are adding or have partial support.

---

## Offers

An **offer** is a signed, self-describing payment request that:

- Identifies the **payee** (node [public key](/docs/bitcoin/cryptography))
- May fix an **amount** or allow **any amount**
- Can specify **metadata** (description, chain, etc.)
- Can require **features** the payer must support
- Does **not** include a [payment hash](/docs/lightning/routing/htlc) or [invoice](/docs/lightning/invoices); those are created only when the payee generates an invoice in response to an **invoice request**

### Offer String (BOLT12)

Offers are encoded as Bech32 strings with human-readable prefix `lno` (mainnet) or `lnt` (testnet/signet):

```text
lno1pg257enxv4ezqcneype82um50yq...  (simplified example)
```

The payload is [TLV](https://github.com/lightning/bolts/blob/master/01-messaging.md#type-length-value-format)-encoded and includes chain, amount (optional), description, node id, and signature.

---

## Invoice Requests

To pay via an offer, the **payer** sends an **invoice request** to the payee. The invoice request:

- References the offer (or its contents)
- Can specify or refine the **amount** (if the offer allows any amount)
- Can include **payer metadata** (e.g., for refunds or identification)
- Is sent over the Lightning network to the payee’s node (or a [Blinded Path](https://github.com/lightning/bolts/blob/master/04-onion-routing.md#blinded-paths))

The **payee** responds with a BOLT12 **invoice** (or a BOLT11 invoice if that’s what was negotiated). That invoice is then paid like any other [Lightning](/docs/lightning) payment (e.g., [HTLC](/docs/lightning/routing/htlc) [routing](/docs/lightning/routing-fees)).

---

## Keysend and Spontaneous Payments

**Keysend** (BOLT11-era) allows sending to a node [public key](/docs/bitcoin/cryptography) without a pre-made [invoice](/docs/lightning/invoices): the payer chooses the [payment hash](/docs/lightning/routing/htlc) (and preimage) and the recipient must accept it. BOLT12 **offers** and **invoice requests** provide a more structured way to do “spontaneous” or “push” payments: the payer fetches an invoice (or an “any amount” invoice) from the payee via the offer protocol, so the payee controls the [payment hash](/docs/lightning/routing/htlc) and metadata. This can reduce probing and improve [privacy](/docs/wallets/privacy).

---

## Recurring and Subscription Payments

Because offers can be **reusable**, a payee can publish one offer that generates a new [invoice](/docs/lightning/invoices) for each payment. Examples:

- **Subscriptions**: Same offer each period; payer sends an invoice request with the period’s amount (or the offer specifies it), payee returns an invoice, payer pays.
- **Donations / any-amount**: Offer with “any amount”; payer sends desired amount in the invoice request; payee returns an invoice for that amount.

---

## Refunds

BOLT12 defines **refund** flow: the payee can issue a **refund** (a kind of offer or invoice that pays *from* the payee *to* the payer). This is useful when the payee needs to return funds (e.g., cancelled order, overpayment). Refund semantics and encodings are part of the BOLT12 suite.

---

## Blinded Paths and Privacy

To request an [invoice](/docs/lightning/invoices) from an offer, the payer must reach the payee. BOLT12 can use **blinded paths** (onion-routed, [blinded](/docs/lightning/onion) identifiers) so that the payer does not need to know the payee’s direct node id or IP. The offer can contain a blinded path to the payee, improving [privacy](/docs/wallets/privacy).

---

## Current Support

- **Core Lightning (CLN)**: Full BOLT12 support (offers, invoice requests, refunds).
- **LDK**: Offer and invoice-request support for use in wallets and services.
- **LND**: BOLT12 support is in progress or partial; check release notes.
- **Eclair**: Check latest docs for BOLT12 status.

Wallets and merchants that support BOLT12 can publish offers (e.g., on the web, in apps) and accept payment once the payer requests an invoice and pays it.

---

## Related Topics

- [Invoices (BOLT11)](/docs/lightning/invoices) - Classic Lightning invoices
- [Lightning Channels](/docs/lightning/channels) - Channel mechanics
- [Routing & HTLCs](/docs/lightning/routing-fees) - How payments are routed
- [Onion Routing](/docs/lightning/onion) - Privacy and blinded paths

---

## Resources

- [BOLT 12: Offer Encoding](https://github.com/lightning/bolts/blob/master/12-offer-encoding.md)
- [Core Lightning BOLT12](https://docs.corelightning.org/docs/home)
- [LDK: Offers](https://lightningdevkit.org/)
