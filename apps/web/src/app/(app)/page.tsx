import { EmptyState } from "@/app/components/ui/empty-state";

export default function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        titleAs="h1"
        title="Nenhuma conversa ainda"
        description="Crie um canal ou comece uma conversa pela barra lateral."
      />
    </div>
  );
}
