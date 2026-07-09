import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1A1A1A",
}

export const metadata: Metadata = {
  title: "SongBird",
  description: "Your personal music journal and social platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/SongBirdlogo.png",
    apple: "/SongBirdlogo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SongBird",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


