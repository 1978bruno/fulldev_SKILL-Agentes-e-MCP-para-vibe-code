import { splitLinks } from "@/app/utils/message-links";

// Texto da Mensagem como foi escrito, com as quebras de linha. Só os endereços http(s) viram
// links, que abrem em outra aba; nada mais vira marcação.
export function MessageBody({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-body text-fg">
      {splitLinks(text).map((segment, index) =>
        segment.kind === "link" ? (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-link hover:text-link-hover hover:underline"
          >
            {segment.href}
          </a>
        ) : (
          segment.text
        ),
      )}
    </p>
  );
}
