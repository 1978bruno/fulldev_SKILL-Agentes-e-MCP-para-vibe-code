import { OpenNavigationButton } from "./navigation-drawer";

// Topo das telas sem cabeçalho (a Home vazia e o erro da lista): só abaixo de md, com o botão da
// gaveta.
export function NarrowTopBar() {
  return (
    <div className="flex h-header shrink-0 items-center px-2 md:hidden">
      <OpenNavigationButton />
    </div>
  );
}
