import type { Metadata } from "next"
import "./globals.css"
import Providers from "@/lib/providers"
import AppSidebar from "@/components/layout/app-sidebar"
import Topbar from "@/components/layout/topbar"
import { Inter } from "next/font/google"

export const metadata: Metadata = {
  title: "Remora",
  description: "Project-wise task tracking",
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <Topbar />
              {/* Center content and constrain width for a cleaner look */}
              <main className="flex-1 p-4">
                <div className="mx-auto w-full max-w-6xl">{children}</div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
