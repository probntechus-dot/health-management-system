import "@/styles/marketing.css"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="scroll-smooth">{children}</div>
}
