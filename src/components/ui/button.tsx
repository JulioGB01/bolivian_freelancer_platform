import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/btn inline-flex shrink-0 items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-bo-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-black",
        brand: "bg-bo-green text-white hover:bg-brand-700",
        lime: "bg-lime text-ink hover:brightness-95",
        light: "bg-white text-ink hover:bg-paper",
        destructive: "bg-bo-red text-white hover:brightness-95",
        outline: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
        "outline-light": "border border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10",
        ghost: "text-ink/70 hover:bg-ink/5 hover:text-ink",
        link: "text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
