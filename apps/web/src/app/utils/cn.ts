import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// A escala de texto do design system (text-body, text-small...) tem nomes próprios; sem isto o
// tailwind-merge a confunde com cor e descarta o text-<cor> da mesma classe.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "heading", "title", "body", "small", "caption", "micro"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
