import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '날씨 정보 수집',
  description: '날씨API를 통한 데이터 스크래핑',
}

export default async function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        </body>
    </html>
  )
}
