"use client";

import { Menu } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { IconButton } from "@/app/components/ui/icon-button";

type NavigationDrawerProps = {
  // O Rail e a barra lateral, renderizados no servidor.
  navigation: React.ReactNode;
  children: React.ReactNode;
};

// Navegação do shell (design system, "Layout e responsividade"): em md ou mais, o Rail e a barra
// lateral ficam em linha; abaixo de md, entram numa gaveta (Dialog do Radix) aberta pelo
// OpenNavigationButton. O Root envolve o shell, para os botões da página serem o gatilho dela e o
// foco voltar a eles quando a gaveta fecha.
export function NavigationDrawer({ navigation, children }: NavigationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className="hidden md:flex">{navigation}</div>
      {children}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 animate-fade-in bg-surface-overlay md:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          // Escolher um Canal (ou qualquer link da navegação) fecha a gaveta.
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a[href]")) setIsOpen(false);
          }}
          className="fixed inset-y-0 left-0 z-40 flex max-w-full animate-fade-in shadow-3 outline-none md:hidden"
        >
          <Dialog.Title className="sr-only">Navegação</Dialog.Title>
          {navigation}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// "Abrir navegação" (ConversationHeader, Menu): só abaixo de md, onde o Rail e a barra lateral
// estão na gaveta.
export function OpenNavigationButton() {
  return (
    <Dialog.Trigger asChild>
      <IconButton icon={Menu} label="Abrir navegação" className="md:hidden" />
    </Dialog.Trigger>
  );
}
