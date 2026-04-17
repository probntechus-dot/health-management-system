"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import { SparklesIcon, MailIcon, PhoneIcon, MessageCircleIcon } from "lucide-react"

const SUPPORT_EMAIL = "support@example.com"
const SUPPORT_PHONE = "+92 300 1234567"
const SUPPORT_WHATSAPP = "https://wa.me/923001234567"

interface BuyButtonProps {
  itemId: string
  itemName: string
  size?: "default" | "sm" | "lg"
  className?: string
}

export function BuyButton({ itemId, itemName, size = "default", className }: BuyButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size={size}
        onClick={() => setOpen(true)}
        className={cn(
          "border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:from-amber-600 hover:to-orange-600",
          className,
        )}
      >
        <SparklesIcon />
        Buy
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-amber-500" />
              Purchase &ldquo;{itemName}&rdquo;
            </DialogTitle>
            <DialogDescription>
              To unlock this premium item, please contact our support team and mention the item ID:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{itemId}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Purchase%20request:%20${encodeURIComponent(itemName)}`}
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <MailIcon className="size-4 text-muted-foreground" />
              <span className="font-medium">{SUPPORT_EMAIL}</span>
            </a>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <PhoneIcon className="size-4 text-muted-foreground" />
              <span className="font-medium">{SUPPORT_PHONE}</span>
            </a>
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <MessageCircleIcon className="size-4 text-muted-foreground" />
              <span className="font-medium">WhatsApp</span>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm",
        className,
      )}
    >
      <SparklesIcon className="size-2.5" />
      Premium
    </span>
  )
}
