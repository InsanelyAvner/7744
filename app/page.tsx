import { Metadata } from 'next'
import BlueGridCrypto from '@/components/blue-grid-crypto'

export const metadata: Metadata = {
  title: '7744 shades of blue',
  description: 'cool encryption stuff',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      
      <BlueGridCrypto />
    </main>
  )
}

