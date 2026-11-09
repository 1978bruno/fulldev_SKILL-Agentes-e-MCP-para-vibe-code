import { ArrowDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";

type NewMessagesPillProps = {
  onClick: () => void;
};

// Pílula "Novas mensagens" (Figma, NewMessagesPill; spec da F03, "Rolagem e pílula"): aparece sobre
// o fim da lista quando chega uma Mensagem enquanto a Pessoa lê mais acima, e leva ao fim.
export function NewMessagesPill({ onClick }: NewMessagesPillProps) {
  return (
    <Button
      size="sm"
      icon={ArrowDown}
      onClick={onClick}
      className="animate-pop-in rounded-pill shadow-2"
    >
      Novas mensagens
    </Button>
  );
}
