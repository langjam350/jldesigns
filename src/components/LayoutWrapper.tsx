"use client";
import dynamic from 'next/dynamic'
import ClientWrapper from "./ClientWrapper"

const Navigation = dynamic(() => import('./Navigation'), { ssr: false })

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClientWrapper>
      <Navigation />
      {children}
    </ClientWrapper>
  )
}