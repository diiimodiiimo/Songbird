import type { Metadata } from 'next'
import { Inter, Crimson_Text } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const crimsonText = Crimson_Text({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-crimson',
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "SongBird",
  description: "Your personal music journal and social platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={crimsonText.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


