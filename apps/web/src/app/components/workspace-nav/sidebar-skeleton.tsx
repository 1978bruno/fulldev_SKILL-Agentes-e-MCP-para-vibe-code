const WIDTHS = ["w-24", "w-36", "w-28", "w-40", "w-32", "w-36", "w-28"];

// "Barra lateral / Carregando" (25:19071): linhas de esqueleto no lugar das seções.
export function SidebarSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4 px-4 pt-2.5 motion-safe:animate-pulse">
      {WIDTHS.map((width, index) => (
        <span key={index} className={`h-2 rounded-control bg-sidebar-hover ${width}`} />
      ))}
      <span className="sr-only">Carregando suas conversas</span>
    </div>
  );
}
