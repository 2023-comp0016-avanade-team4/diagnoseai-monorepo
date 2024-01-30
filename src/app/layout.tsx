import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import { Providers } from './providers'
import { BlockSmallWidth } from './block-small-width';
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import '../global.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DiagnoseAI Uploader',
  description: 'This project manages the DiagnoseAI uploads',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light text-foreground bg-background">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <BlockSmallWidth>
          <Header />
          <div className="flex flex-auto">
            <Sidebar />

            <div className="flex-1">
              <Providers>
                {children}
              </Providers>
            </div>
          </div>
        </BlockSmallWidth>
      </body>
    </html>
  )
}
