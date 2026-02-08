# Genesis Block

The Genesis Block is block height 0: the first block in the Bitcoin blockchain and the moment the network went live. It was mined by [Satoshi Nakamoto](/docs/history/people#satoshi-nakamoto) on **January 3, 2009**, with a block reward of 50 BTC.

## The Coinbase Message

The block’s [coinbase transaction](/docs/bitcoin/coinbase-transaction) embeds a short text in its input data, arbitrary data miners are free to include. Satoshi chose a headline from that day’s *The Times* (London):

**"The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"**

That line does two things: it **timestamped** the block (proof it wasn’t pre-mined before that date) and **stated Bitcoin’s purpose**: an alternative to a financial system dependent on central bank bailouts. The headline referred to the UK Chancellor of the Exchequer and bank rescues during the 2008–2009 crisis, the same context in which the [Bitcoin whitepaper](/whitepaper) had been published weeks earlier.

In the raw block data, the message appears as readable text in the coinbase input. The hex dump below shows the block bytes; the right-hand column is the ASCII interpretation, where the headline is visible.

<img src="/images/docs/genesis-block.jpg" alt="Genesis block hex dump showing The Times headline in the coinbase data" class="doc-img" width="928" height="484" />
<p class="doc-img-legend">Genesis block data: the coinbase message visible in the hex dump (right column)</p>

## Technical Details

- **Hardcoded**: The genesis block is hardcoded into Bitcoin clients as the fixed root of the chain. Nodes accept it by definition rather than by verifying a previous block.
- **Block hash**: The mainnet genesis block hash is `000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f`. You can [view the block on a block explorer](https://www.blockchain.com/explorer/blocks/btc/0).
- **Unspendable reward**: The 50 BTC created in the genesis block cannot be spent. Due to a quirk in the original implementation, that output is not considered spendable by the consensus rules, so those coins are permanently locked. Block 1 (mined days later) is the first block whose reward could eventually be spent.

## See Also

- [Bitcoin History](/docs/history) – Timeline of milestones, including the 2009 launch
- [Block Construction](/docs/mining/block-construction) – How the coinbase transaction and coinbase data work
- [Coinbase Transaction](/docs/bitcoin/coinbase-transaction) – Structure of the coinbase
- [Block Subsidy](/docs/bitcoin/subsidy) – Subsidy formula and halving schedule (block 0 = 50 BTC)
- [Glossary: Genesis Block](/docs/glossary#genesis-block) – Short definition and links
