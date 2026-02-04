# Payment Requests

Requesting and receiving Bitcoin payments in applications involves generating a [address](/docs/bitcoin-development/addresses) (or reusing a dedicated one per invoice), communicating amount and recipient to the payer (e.g. via a **bitcoin: URI** or QR code), and [verifying](/docs/bitcoin/transaction-lifecycle) that payment was received. This guide covers BIP 21 `bitcoin:` URIs, generating and parsing payment requests, and handling verification and refunds. For fiat conversion on invoices, see [Price Tracking](/docs/bitcoin-development/price-tracking). For watching addresses, see [Blockchain Monitoring](/docs/bitcoin-development/blockchain-monitoring).

## One Address per Invoice

Use a **unique address per payment request** so you can match incoming [transactions](/docs/bitcoin/transaction-lifecycle) to the correct order or customer. Do not reuse a single address for multiple invoices if you need to know who paid what.

## BIP 21 bitcoin: URI

[BIP 21](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki) defines the `bitcoin:` URI scheme so wallets can pre-fill address and amount.

Format:

```text
bitcoin:<address>?amount=<amount_btc>&label=<label>&message=<message>
```

- **address**: Required; Bitcoin address (e.g. P2WPKH, P2TR).
- **amount**: Optional; decimal BTC (e.g. `0.001` for 100,000 sats).
- **label**: Optional; recipient or purpose (for payer's wallet only; not on-chain).
- **message**: Optional; description (for payer's wallet only; not on-chain).

All query parameters must be [URI-encoded](https://datatracker.ietf.org/doc/html/rfc3986).

## Generating a bitcoin: URI

:::code-group
```rust
use urlencoding::encode;

fn bitcoin_uri(address: &str, amount_sats: Option<u64>, label: Option<&str>, message: Option<&str>) -> String {
    let mut uri = format!("bitcoin:{}", address);
    let mut params = Vec::new();
    if let Some(sats) = amount_sats {
        let btc = sats as f64 / 100_000_000.0;
        params.push(format!("amount={}", btc));
    }
    if let Some(l) = label {
        params.push(format!("label={}", encode(l)));
    }
    if let Some(m) = message {
        params.push(format!("message={}", encode(m)));
    }
    if !params.is_empty() {
        uri.push('?');
        uri.push_str(&params.join("&"));
    }
    uri
}
```

```python
from urllib.parse import urlencode, quote

def bitcoin_uri(address: str, amount_sats: int | None = None, label: str | None = None, message: str | None = None) -> str:
    base = f"bitcoin:{address}"
    params = {}
    if amount_sats is not None:
        params["amount"] = amount_sats / 100_000_000
    if label is not None:
        params["label"] = label
    if message is not None:
        params["message"] = message
    if params:
        return f"{base}?{urlencode(params)}"
    return base
```

```cpp
#include <string>
#include <sstream>
#include <iomanip>

std::string bitcoin_uri(const std::string& address, std::optional<uint64_t> amount_sats,
                        std::optional<std::string> label, std::optional<std::string> message) {
    std::ostringstream uri;
    uri << "bitcoin:" << address;
    std::vector<std::string> params;
    if (amount_sats) {
        double btc = *amount_sats / 100000000.0;
        std::ostringstream a;
        a << std::fixed << std::setprecision(8) << btc;
        params.push_back("amount=" + a.str());
    }
    if (label) params.push_back("label=" + url_encode(*label));
    if (message) params.push_back("message=" + url_encode(*message));
    if (!params.empty()) {
        uri << "?";
        for (size_t i = 0; i < params.size(); ++i)
            uri << (i ? "&" : "") << params[i];
    }
    return uri.str();
}
```

```go
package main

import (
	"net/url"
	"strconv"
	"strings"
)

func bitcoinURI(address string, amountSats *uint64, label, message string) string {
	base := "bitcoin:" + address
	var params url.Values
	if amountSats != nil {
		params.Set("amount", strconv.FormatFloat(float64(*amountSats)/1e8, 'f', 8, 64))
	}
	if label != "" {
		params.Set("label", label)
	}
	if message != "" {
		params.Set("message", message)
	}
	if len(params) > 0 {
		return base + "?" + params.Encode()
	}
	return base
}
```

```javascript
function bitcoinUri(address, amountSats = null, label = null, message = null) {
  const base = `bitcoin:${address}`;
  const params = new URLSearchParams();
  if (amountSats != null) params.set('amount', (amountSats / 100_000_000).toString());
  if (label != null) params.set('label', label);
  if (message != null) params.set('message', message);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
```
:::

## Parsing a bitcoin: URI

:::code-group
```rust
use url::Url;

fn parse_bitcoin_uri(uri: &str) -> Result<(String, Option<u64>, Option<String>, Option<String>), Box<dyn std::error::Error>> {
    let u = Url::parse(uri)?;
    if u.scheme() != "bitcoin" {
        return Err("not a bitcoin URI".into());
    }
    let address = u.host_str().unwrap_or_default().to_string();
    let amount = u.query_pairs()
        .find(|(k, _)| k == "amount")
        .and_then(|(_, v)| v.parse::<f64>().ok())
        .map(|btc| (btc * 100_000_000.0) as u64);
    let label = u.query_pairs().find(|(k, _)| k == "label").map(|(_, v)| v.into_owned());
    let message = u.query_pairs().find(|(k, _)| k == "message").map(|(_, v)| v.into_owned());
    Ok((address, amount, label, message))
}
```

```python
from urllib.parse import urlparse, parse_qs

def parse_bitcoin_uri(uri: str) -> tuple[str, int | None, str | None, str | None]:
    if not uri.startswith("bitcoin:"):
        raise ValueError("not a bitcoin URI")
    parsed = urlparse(uri)
    address = parsed.netloc or parsed.path.lstrip("/")
    qs = parse_qs(parsed.query)
    amount = None
    if "amount" in qs:
        try:
            amount = int(float(qs["amount"][0]) * 100_000_000)
        except (ValueError, IndexError):
            pass
    label = qs.get("label", [None])[0]
    message = qs.get("message", [None])[0]
    return address, amount, label, message
```

```cpp
#include <string>
#include <regex>
#include <optional>

struct BitcoinURI {
    std::string address;
    std::optional<uint64_t> amount_sats;
    std::optional<std::string> label;
    std::optional<std::string> message;
};

BitcoinURI parse_bitcoin_uri(const std::string& uri) {
    BitcoinURI out;
    if (uri.substr(0, 8) != "bitcoin:") return out;
    size_t q = uri.find('?', 8);
    out.address = uri.substr(8, q == std::string::npos ? q : q - 8);
    if (q != std::string::npos) {
        // Parse query string for amount, label, message
        std::string query = uri.substr(q + 1);
        // ... parse key=value pairs, set out.amount_sats, out.label, out.message
    }
    return out;
}
```

```go
package main

import (
	"net/url"
	"strconv"
	"strings"
)

func parseBitcoinURI(uri string) (address string, amountSats *uint64, label, message string, err error) {
	if !strings.HasPrefix(uri, "bitcoin:") {
		return "", nil, "", "", nil
	}
	uri = uri[8:]
	idx := strings.Index(uri, "?")
	if idx >= 0 {
		address = uri[:idx]
		parsed, _ := url.ParseQuery(uri[idx+1:])
		if a := parsed.Get("amount"); a != "" {
			if f, e := strconv.ParseFloat(a, 64); e == nil {
				sats := uint64(f * 1e8)
				amountSats = &sats
			}
		}
		label = parsed.Get("label")
		message = parsed.Get("message")
	} else {
		address = uri
	}
	return address, amountSats, label, message, nil
}
```

```javascript
function parseBitcoinUri(uri) {
  if (!uri.startsWith('bitcoin:')) throw new Error('not a bitcoin URI');
  const rest = uri.slice(8);
  const [addrPart, qs] = rest.split('?');
  const address = addrPart || '';
  const params = qs ? Object.fromEntries(new URLSearchParams(qs)) : {};
  const amount = params.amount != null ? Math.round(parseFloat(params.amount) * 100_000_000) : null;
  return { address, amountSats: amount, label: params.label || null, message: params.message || null };
}
```
:::

## QR Codes

Encode the `bitcoin:` URI in a QR code so mobile wallets can scan it. Use a QR library for your language (e.g. `qrcode` in Rust, `qrcode` in Python, `go-qrcode` in Go). The payload is the URI string; error correction level is optional (e.g. medium for small codes, high for noisy environments).

## Verifying Payment

- **Unconfirmed**: The [transaction](/docs/bitcoin/transaction-lifecycle) is in the [mempool](/docs/mining/mempool); it can be replaced ([RBF](/docs/bitcoin/transaction-fees)) or double-spent. Do not treat as final for high-value or physical goods unless you accept the risk.
- **Confirmations**: Each block on top of the block that includes the tx adds one confirmation. Many applications wait for 1–6 confirmations before considering payment final. See [Transaction Lifecycle](/docs/bitcoin/transaction-lifecycle).
- **Watching**: Use Blockchain Monitoring (e.g. address watch, ZMQ, or API) to detect when a payment to your invoice address is included in a block and reaches the desired confirmation depth.

## Refunds

- **Never** refund to "the address that sent" by default: that address may belong to an exchange or shared wallet, not the customer. Either ask the customer for a refund address or use a refund address they provided at payment time (e.g. in a payment protocol flow).
- If you used a plain `bitcoin:` URI or copy-paste, contact the payer and ask for a refund address, then send a normal [transaction](/docs/bitcoin-development/transactions) to that address.
- BIP 70 (payment protocol) is deprecated; prefer BIP 21 and your own backend for verification and refund handling.

## Related Topics

- [Address Generation](/docs/bitcoin-development/addresses) - Generating unique addresses per invoice
- Blockchain Monitoring - Watching for incoming payments
- Price Tracking - Converting fiat to satoshis for invoice amount
- Transaction Lifecycle - Confirmations and finality
- [Transaction Fees](/docs/bitcoin/transaction-fees) - RBF and accepting unconfirmed payments
