'use client'

import Link from 'next/link'
import { CalculatorIcon } from '@/app/components/Icons'
import DenominationCalculator from '@/app/components/DenominationCalculator'

export default function DenominationsCalculatorPage() {
  return (
    <>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <CalculatorIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Denomination Calculator</h1>
        <p className="text-secondary text-center">
          Convert between satoshis (sats), BTC, bits (µBTC), millibits (mBTC), and other units. See the full
          reference table in <Link href="/docs/fundamentals/denominations" className="text-btc hover:underline">Denominations</Link>.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <DenominationCalculator />
      </div>
    </>
  )
}
