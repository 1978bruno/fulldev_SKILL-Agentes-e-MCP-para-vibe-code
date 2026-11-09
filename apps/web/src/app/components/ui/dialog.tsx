"use client";

import { X } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import { IconButton } from "./icon-button";

// Dialog do design system (docs/design-system.md, "Dialog"): largura máxima de 512, raio card,
// elevation-3 e foco no primeiro campo, que o Radix dá ao abrir. Fecha pelo Esc, pelo X e pelo
// clique fora, e devolve o foco a quem o abriu.
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

type DialogContentProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  onCloseAutoFocus?: (event: Event) => void;
  // Falso enquanto um envio está em andamento: nem Esc, nem clique fora, nem o X fecham.
  dismissible?: boolean;
};

export function DialogContent({
  title,
  description,
  children,
  onCloseAutoFocus,
  dismissible = true,
}: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-surface-overlay" />
      <RadixDialog.Content
        // Sem descrição, nada a ligar: o Radix avisa no console se o atributo não vier.
        {...(description ? {} : { "aria-describedby": undefined })}
        onOpenAutoFocus={(event) => {
          // O foco vai para o primeiro campo, e não para o X do cabeçalho, o primeiro focável.
          const field = (event.currentTarget as HTMLElement).querySelector<HTMLElement>(
            "input:not([disabled]), textarea:not([disabled])",
          );
          if (!field) return;
          event.preventDefault();
          field.focus();
        }}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={(event) => {
          if (!dismissible) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (!dismissible) event.preventDefault();
        }}
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[512px] -translate-x-1/2 -translate-y-1/2 animate-pop-in flex-col overflow-y-auto rounded-card bg-surface-raised shadow-3 outline-none"
      >
        <DialogHeader title={title} description={description} dismissible={dismissible} />
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

// DialogHeader (Figma, Primitivos): título, descrição e o X de fechar.
function DialogHeader({
  title,
  description,
  dismissible,
}: {
  title: string;
  description?: string;
  dismissible: boolean;
}) {
  return (
    <div className="flex items-start gap-4 pb-2 pl-6 pr-4 pt-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <RadixDialog.Title className="text-heading font-black text-fg">{title}</RadixDialog.Title>
        {description && (
          <RadixDialog.Description className="text-body text-fg-muted">
            {description}
          </RadixDialog.Description>
        )}
      </div>
      <RadixDialog.Close asChild>
        <IconButton icon={X} label="Fechar" disabled={!dismissible} />
      </RadixDialog.Close>
    </div>
  );
}

export function DialogBody({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 px-6 py-3">{children}</div>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start justify-end gap-3 px-6 pb-5 pt-3">{children}</div>;
}
