# Denominations

Bitcoin is highly divisible: one bitcoin (BTC) equals 100 million of the smallest on-chain unit, the satoshi (sat). This design supports both large transfers and tiny amounts, and it scales as the nominal value of each unit changes over time. Common units include satoshis for small amounts, bits (µBTC, or one millionth of a BTC) for everyday thinking, and millibits (mBTC) or whole BTC for larger sums. Understanding how these units relate helps when reading fees, block rewards, and prices across wallets and Lightning apps.

## Conversion Table

| Denomination | Symbol | Value in BTC |
|-------------|--------|--------------|
| Satoshi | SAT | 0.00000001 |
| Microbit | µBTC (uBTC) | 0.000001 |
| Millibit | mBTC | 0.001 |
| Centibit | cBTC | 0.01 |
| Decibit | dBTC | 0.1 |
| Bitcoin | BTC | 1 |
| DecaBit | daBTC | 10 |
| Hectobit | hBTC | 100 |
| Kilobit | kBTC | 1,000 |
| Megabit | MBTC | 1,000,000 |

The [Lightning Network](/docs/lightning) uses **millisatoshis** (1/1000 of a satoshi) for routing and invoice amounts.

---

## Denominations Visualized

:::denomination-calculator

:::