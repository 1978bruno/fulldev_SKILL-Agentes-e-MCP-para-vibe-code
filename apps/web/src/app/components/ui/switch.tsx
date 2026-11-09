"use client";

import { Switch as RadixSwitch } from "radix-ui";
import { cn } from "@/app/utils/cn";

type SwitchProps = Omit<React.ComponentProps<typeof RadixSwitch.Root>, "children">;

// Switch do design system (Figma, Primitivos): 40 × 24, raio pill, desligado em border-strong e
// ligado em primary, com o polegar de 20 px em on-primary e elevation-1.
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <RadixSwitch.Root
      className={cn(
        "inline-flex h-6 w-10 shrink-0 items-center rounded-pill bg-border-strong p-0.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/30 disabled:opacity-50 data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb className="block size-5 rounded-pill bg-on-primary shadow-1 transition-transform duration-100 data-[state=checked]:translate-x-4" />
    </RadixSwitch.Root>
  );
}
