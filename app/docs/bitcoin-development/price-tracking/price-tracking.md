# Bitcoin Price Tracking

Bitcoin amounts are usually stored and transmitted in [satoshis](/docs/fundamentals/denominations); for user-facing apps you often need to show equivalent value in fiat or other units. Price feeds power balance displays, conversion inputs, and fee estimation in familiar currencies. This guide covers integrating price APIs, handling rate limits, and caching.

## API Providers

### CoinGecko

**Advantages:**
- Free tier available
- Good rate limits
- Historical data
- Multiple currencies

:::code-group
```rust
use reqwest;
use serde_json::Value;

async fn get_price_coingecko() -> Result<f64, Box<dyn std::error::Error>> {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
    let resp: Value = reqwest::get(url).await?.json().await?;
    Ok(resp["bitcoin"]["usd"].as_f64().unwrap_or(0.0))
}
```

```python
import requests

def get_price_coingecko():
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {"ids": "bitcoin", "vs_currencies": "usd,eur"}
    response = requests.get(url, params=params)
    return response.json()["bitcoin"]["usd"]
```

```cpp
#include <curl/curl.h>
#include <nlohmann/json.hpp>

double get_price_coingecko() {
    CURL* curl = curl_easy_init();
    std::string response;
    curl_easy_setopt(curl, CURLOPT_URL,
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    auto json = nlohmann::json::parse(response);
    return json["bitcoin"]["usd"].get<double>();
}
```

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func getPriceCoinGecko() (float64, error) {
	url := "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	var data map[string]map[string]float64
	if err := json.Unmarshal(body, &data); err != nil {
		return 0, err
	}

	return data["bitcoin"]["usd"], nil
}

func main() {
	price, err := getPriceCoinGecko()
	if err != nil {
		panic(err)
	}
	fmt.Printf("Bitcoin price: $%.2f\n", price)
}
```

```javascript
async function getPriceCoingecko() {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur';
  const response = await fetch(url);
  const data = await response.json();
  return data.bitcoin.usd;
}
```
:::

### Mempool.space API

An alternative source using the mempool.space API:

:::code-group
```rust
async fn get_price_mempool() -> Result<f64, Box<dyn std::error::Error>> {
    let url = "https://mempool.space/api/v1/prices";
    let resp: Value = reqwest::get(url).await?.json().await?;
    Ok(resp["USD"].as_f64().unwrap_or(0.0))
}
```

```python
def get_price_mempool():
    response = requests.get("https://mempool.space/api/v1/prices")
    return response.json()["USD"]
```

```cpp
double get_price_mempool() {
    // Similar to CoinGecko example with different URL
    std::string url = "https://mempool.space/api/v1/prices";
    // ... fetch and parse JSON
    return json["USD"].get<double>();
}
```

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func getPriceMempool() (float64, error) {
	url := "https://mempool.space/api/v1/prices"
	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	var data map[string]float64
	if err := json.Unmarshal(body, &data); err != nil {
		return 0, err
	}

	return data["USD"], nil
}

func main() {
	price, err := getPriceMempool()
	if err != nil {
		panic(err)
	}
	fmt.Printf("Bitcoin price: $%.2f\n", price)
}
```

```javascript
async function getPriceMempool() {
  const response = await fetch('https://mempool.space/api/v1/prices');
  const data = await response.json();
  return data.USD;
}
```
:::

---

## Centralized Price Service

### Service Architecture

**Benefits:**
- Single source of truth
- Caching reduces API calls
- Fallback mechanisms
- Rate limit management

**Implementation:**

```python
class BitcoinPriceService:
    def __init__(self):
        self.cache = {}
        self.cache_duration = 60  # seconds
        self.rate_limiter = RateLimiter()
    
    def get_price(self, currency='USD'):
        # Check cache first
        cache_key = f"price_{currency}"
        if cache_key in self.cache:
            cached_price, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.cache_duration:
                return cached_price
        
        # Try CoinGecko first
        try:
            price = self._get_price_coingecko(currency)
            self.cache[cache_key] = (price, time.time())
            return price
        except Exception:
            # Fallback to Yahoo Finance
            price = self._get_price_yahoo(currency)
            self.cache[cache_key] = (price, time.time())
            return price
```

---

## Caching Strategies

### In-Memory Caching

:::code-group
```rust
use std::collections::HashMap;
use std::time::{Duration, Instant};

struct PriceCache {
    cache: HashMap<String, (f64, Instant)>,
    duration: Duration,
}

impl PriceCache {
    fn get(&self, currency: &str) -> Option<f64> {
        self.cache.get(currency).and_then(|(price, time)| {
            if time.elapsed() < self.duration { Some(*price) } else { None }
        })
    }

    fn set(&mut self, currency: &str, price: f64) {
        self.cache.insert(currency.to_string(), (price, Instant::now()));
    }
}
```

```python
import time

cache = {}
CACHE_DURATION = 60  # seconds

def get_cached_price(currency):
    key = f"price_{currency}"
    if key in cache:
        price, timestamp = cache[key]
        if time.time() - timestamp < CACHE_DURATION:
            return price
    return None

def set_cached_price(currency, price):
    cache[f"price_{currency}"] = (price, time.time())
```

```cpp
#include <unordered_map>
#include <chrono>

class PriceCache {
    std::unordered_map<std::string, std::pair<double, std::chrono::steady_clock::time_point>> cache;
    std::chrono::seconds duration{60};
public:
    std::optional<double> get(const std::string& currency) {
        auto it = cache.find(currency);
        if (it != cache.end()) {
            auto elapsed = std::chrono::steady_clock::now() - it->second.second;
            if (elapsed < duration) return it->second.first;
        }
        return std::nullopt;
    }
    void set(const std::string& currency, double price) {
        cache[currency] = {price, std::chrono::steady_clock::now()};
    }
};
```

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type PriceCache struct {
	cache    map[string]priceEntry
	duration time.Duration
	mu       sync.RWMutex
}

type priceEntry struct {
	price     float64
	timestamp time.Time
}

func NewPriceCache(duration time.Duration) *PriceCache {
	return &PriceCache{
		cache:    make(map[string]priceEntry),
		duration: duration,
	}
}

func (pc *PriceCache) Get(currency string) (float64, bool) {
	pc.mu.RLock()
	defer pc.mu.RUnlock()

	entry, exists := pc.cache[currency]
	if !exists {
		return 0, false
	}

	if time.Since(entry.timestamp) < pc.duration {
		return entry.price, true
	}

	return 0, false
}

func (pc *PriceCache) Set(currency string, price float64) {
	pc.mu.Lock()
	defer pc.mu.Unlock()

	pc.cache[currency] = priceEntry{
		price:     price,
		timestamp: time.Now(),
	}
}

func main() {
	cache := NewPriceCache(60 * time.Second)
	cache.Set("USD", 50000.0)

	if price, ok := cache.Get("USD"); ok {
		fmt.Printf("Cached price: $%.2f\n", price)
	}
}
```

```javascript
const cache = new Map();
const CACHE_DURATION = 60000; // milliseconds

function getCachedPrice(currency) {
  const entry = cache.get(currency);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.price;
  }
  return null;
}

function setCachedPrice(currency, price) {
  cache.set(currency, { price, timestamp: Date.now() });
}
```
:::

---

## Rate Limiting

### Implementing Rate Limits

**Simple Rate Limiter:**

```python
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_calls=10, period=60):
        self.max_calls = max_calls
        self.period = period
        self.calls = deque()
    
    def can_call(self):
        now = time.time()
        # Remove old calls
        while self.calls and self.calls[0] < now - self.period:
            self.calls.popleft()
        
        if len(self.calls) < self.max_calls:
            self.calls.append(now)
            return True
        return False
```

### Respecting API Limits

**Best Practices:**
- Check rate limits before calling
- Implement exponential backoff
- Use caching to reduce calls
- Monitor API usage

---

## Multi-Source Fallbacks

### Fallback Chain

**Priority Order:**

1. **Primary**: CoinGecko (best rate limits)
2. **Secondary**: Yahoo Finance (backup)
3. **Tertiary**: Local cache (if available)

**Implementation:**

```python
def get_price_with_fallback(currency='USD'):
    # Try primary source
    try:
        return get_price_coingecko(currency)
    except Exception as e:
        print(f"CoinGecko failed: {e}")
    
    # Try secondary source
    try:
        return get_price_yahoo(currency)
    except Exception as e:
        print(f"Yahoo Finance failed: {e}")
    
    # Try cache
    cached = get_cached_price(currency)
    if cached:
        return cached
    
    # All failed
    raise Exception("All price sources failed")
```

---

## Error Handling

### API Errors

**Handle Common Errors:**

```python
def get_price_safe(currency='USD'):
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        # Handle timeout
        return get_cached_price(currency)
    except requests.exceptions.HTTPError as e:
        # Handle HTTP errors
        if e.response.status_code == 429:
            # Rate limited, use cache
            return get_cached_price(currency)
        raise
    except Exception as e:
        # Handle other errors
        return get_cached_price(currency)
```

---

## Thread Safety

### Concurrent Access

**Thread-Safe Cache:**

```python
import threading

class ThreadSafePriceService:
    def __init__(self):
        self.cache = {}
        self.lock = threading.Lock()
    
    def get_price(self, currency='USD'):
        with self.lock:
            # Check cache
            if currency in self.cache:
                price, timestamp = self.cache[currency]
                if time.time() - timestamp < 60:
                    return price
            
            # Fetch new price
            price = self._fetch_price(currency)
            self.cache[currency] = (price, time.time())
            return price
```

---

## Best Practices

### For Developers

1. **Use Caching**: Reduce API calls
2. **Implement Fallbacks**: Multiple data sources
3. **Rate Limiting**: Respect API limits
4. **Error Handling**: Handle all error cases
5. **Thread Safety**: Support concurrent access

### For Performance

1. **Cache Duration**: Balance freshness vs. API calls
2. **Batch Requests**: Request multiple currencies at once
3. **Connection Pooling**: Reuse HTTP connections
4. **Async Operations**: Use async/await for I/O

---

## Common Issues

### Rate Limit Exceeded

**Problem**: API rate limit reached

**Solutions:**
- Implement caching
- Use multiple API sources
- Reduce request frequency
- Upgrade API tier (if available)

### Stale Data

**Problem**: Cached data too old

**Solutions:**
- Reduce cache duration
- Implement cache invalidation
- Add timestamp checks
- Force refresh option

### API Downtime

**Problem**: API service unavailable

**Solutions:**
- Implement fallback sources
- Use cached data
- Retry with exponential backoff
- Monitor API status

---

## Summary

Price tracking requires:

- **API Integration**: Multiple data sources
- **Caching**: Reduce API calls and improve performance
- **Rate Limiting**: Respect API limits
- **Fallbacks**: Multiple sources for reliability
- **Error Handling**: Handle all error cases
- **Thread Safety**: Support concurrent access

---

## Related Topics

- [Payment Requests](/docs/bitcoin-development/payment-requests) - Fiat amounts on invoices and payment requests
- [Getting Started](/docs/development) - Bitcoin development introduction
- [Libraries & SDKs](/docs/development/libraries) - HTTP client libraries for each language
- [Blockchain Monitoring](/docs/bitcoin-development/blockchain-monitoring) - Real-time blockchain data
