import localFont from "next/font/local"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

const inter = localFont({
  src: "../public/fonts/Inter-Variable.woff2",
  variable: "--font-sans",
  display: "swap",
})

const plusJakarta = localFont({
  src: "../public/fonts/PlusJakartaSans-Variable.woff2",
  variable: "--font-heading",
  display: "swap",
})

const geistMono = localFont({
  src: "../public/fonts/GeistMono-Variable.woff2",
  variable: "--font-mono",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", inter.variable, plusJakarta.variable, geistMono.variable, "font-sans")}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
