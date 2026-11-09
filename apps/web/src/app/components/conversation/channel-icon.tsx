import { Hash, Lock } from "lucide-react";
import type { ConversationKind } from "@/app/services/chat-api";

type ChannelIconProps = {
  kind: ConversationKind;
  size: number;
  className?: string;
};

// ChannelIcon (Figma, Entities): o cadeado no Canal privado e o # no público.
export function ChannelIcon({ kind, size, className }: ChannelIconProps) {
  const Icon = kind === "private_channel" ? Lock : Hash;
  return <Icon size={size} aria-hidden className={className} />;
}
