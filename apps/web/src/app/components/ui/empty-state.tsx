type EmptyStateProps = {
  title: string;
  description: string;
  titleAs?: "h1" | "h2";
};

export function EmptyState({
  title,
  description,
  titleAs: Title = "h2",
}: EmptyStateProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 px-6 py-12">
      <div className="flex w-full max-w-96 flex-col gap-1 text-center">
        <Title className="text-title font-black text-fg">{title}</Title>
        <p className="text-body text-fg-muted">{description}</p>
      </div>
    </div>
  );
}
