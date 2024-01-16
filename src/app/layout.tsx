'use client';

import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import { Providers } from './providers'
import { BlockSmallWidth } from './block-small-width';
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import '../global.css'

import React from 'react';
import { Provider } from 'react-redux';
import store from '../redux/store';

const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'DiagnoseAI Uploader',
//   description: 'This project manages the DiagnoseAI uploads',
// }
// removed because of use client

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light text-foreground bg-background">
      <body className={`${inter.className} max-h-screen h-screen flex flex-col`}>
        <Provider store={store}> {/* Redux Provider */}
        <BlockSmallWidth>
          <Header />
          <div className="flex flex-auto h-0">
            <Sidebar />

            <div className="flex-1">
              <Providers>
                    {children}
              </Providers>
            </div>
          </div>
        </BlockSmallWidth>
        </Provider>
      </body>
    </html>
  );
}