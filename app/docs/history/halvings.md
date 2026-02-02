# Bitcoin Halving Schedule

Bitcoin's block reward halves every 210,000 blocks, which occurs approximately every 4 years. This creates a predictable, decreasing inflation rate and ensures the total supply will never exceed 21 million BTC.

## Supply Formula

The total Bitcoin supply follows a geometric series:

```
Total Supply = 210,000 × 50 × (1 + 1/2 + 1/4 + 1/8 + ...)
             = 210,000 × 50 × 2
             = 21,000,000 BTC
```

This geometric series ensures that:
- Each halving period creates 210,000 blocks
- Each period creates half the Bitcoin of the previous period
- The series converges to exactly 21 million BTC
- After 32 halvings, the subsidy becomes effectively 0

---

## Complete Halving Schedule

| Event | Date | Block Height | Block Reward (BTC) | Total BTC Created in Period |
|-------|------|--------------|-------------------|----------------------------|
| **Bitcoin Launch** | 3 January 2009 | 0 (genesis block) | 50 | 10,500,000 BTC |
| **Halving 1** | 28 November 2012 | 210,000 | 25 | 5,250,000 BTC |
| **Halving 2** | 9 July 2016 | 420,000 | 12.5 | 2,625,000 BTC |
| **Halving 3** | 11 May 2020 | 630,000 | 6.25 | 1,312,500 BTC |
| **Halving 4** | 20 April 2024 | 840,000 | 3.125 | 656,250 BTC |
| **Halving 5** | ~2028 | 1,050,000 | 1.5625 | 328,125 BTC |
| **Halving 6** | ~2032 | 1,260,000 | 0.78125 | 164,062.5 BTC |
| **Halving 7** | ~2036 | 1,470,000 | 0.390625 | 82,031.25 BTC |
| **Halving 8** | ~2040 | 1,680,000 | 0.1953125 | 41,015.625 BTC |
| **Halving 9** | ~2044 | 1,890,000 | 0.09765625 | 20,507.8125 BTC |
| **Halving 10** | ~2048 | 2,100,000 | 0.048828125 | 10,253.90625 BTC |
| **Halving 11** | ~2052 | 2,310,000 | 0.0244140625 | 5,126.953125 BTC |
| **Halving 12** | ~2056 | 2,520,000 | 0.01220703125 | 2,563.4765625 BTC |
| **Halving 13** | ~2060 | 2,730,000 | 0.006103515625 | 1,281.73828125 BTC |
| **Halving 14** | ~2064 | 2,940,000 | 0.0030517578125 | 640.869140625 BTC |
| **Halving 15** | ~2068 | 3,150,000 | 0.00152587890625 | 320.4345703125 BTC |
| **Halving 16** | ~2072 | 3,360,000 | 0.000762939453125 | 160.21728515625 BTC |
| **Halving 17** | ~2076 | 3,570,000 | 0.0003814697265625 | 80.108642578125 BTC |
| **Halving 18** | ~2080 | 3,780,000 | 0.00019073486328125 | 40.0543212890625 BTC |
| **Halving 19** | ~2084 | 3,990,000 | 0.000095367431640625 | 20.02716064453125 BTC |
| **Halving 20** | ~2088 | 4,200,000 | 0.0000476837158203125 | 10.013580322265625 BTC |
| **Halving 21** | ~2092 | 4,410,000 | 0.00002384185791015625 | 5.0067901611328125 BTC |
| **Halving 22** | ~2096 | 4,620,000 | 0.000011920928955078125 | 2.50339508056640625 BTC |
| **Halving 23** | ~2100 | 4,830,000 | 0.0000059604644775390625 | 1.251697540283203125 BTC |
| **Halving 24** | ~2104 | 5,040,000 | 0.00000298023223876953125 | 0.6258487701416015625 BTC |
| **Halving 25** | ~2108 | 5,250,000 | 0.000001490116119384765625 | 0.31292438507080078125 BTC |
| **Halving 26** | ~2112 | 5,460,000 | 0.0000007450580596923828125 | 0.156462192535400390625 BTC |
| **Halving 27** | ~2116 | 5,670,000 | 0.00000037252902984619140625 | 0.0782310962677001953125 BTC |
| **Halving 28** | ~2120 | 5,880,000 | 0.000000186264514923095703125 | 0.03911554813385009765625 BTC |
| **Halving 29** | ~2124 | 6,090,000 | 0.0000000931322574615478515625 | 0.019557774066925048828125 BTC |
| **Halving 30** | ~2128 | 6,300,000 | 0.00000004656612873077392578125 | 0.0097788870334625244140625 BTC |
| **Halving 31** | ~2132 | 6,510,000 | 0.000000023283064365386962890625 | 0.00488944351673126220703125 BTC |
| **Halving 32** | ~2136 | 6,720,000 | 0.0000000116415321826934814453125 | 0.002444721758365631103515625 BTC |
| **Halving 33+** | After 2140 | After 6,930,000 | 0 BTC | 0 BTC |

**Note**: After halving 33, the subsidy becomes effectively 0 (less than 1 satoshi per block). The last Bitcoin will be mined around December 22, 2137.

---

## Key Facts

- **Total Supply**: Exactly 21,000,000 BTC
- **Total Halvings**: 32 halving events
- **Halving Interval**: Every 210,000 blocks (~4 years)
- **Initial Block Reward**: 50 BTC per block
- **Current Block Reward**: 3.125 BTC (after 4th halving in 2024)
- **Final Halving**: Block 6,720,000 (halving #32)
- **Block Height at Completion**: ~6,930,000
- **All Coins Issued**: December 22, 2137 (estimated)

---

## After All Coins Are Issued

Once all 21 million Bitcoin have been created (around December 22, 2137):

- **No New Bitcoin**: Block rewards will be 0
- **Miner Income**: Miners will rely entirely on transaction fees
- **Network Security**: Economic incentives remain through fee collection
- **Inflation**: Bitcoin becomes deflationary (supply decreases if coins are lost)

---

## Related Topics

- [Subsidy Equation](/docs/bitcoin/subsidy) - Mathematical formula and implementation details
