/** Esqueleto mostrado enquanto a página busca os dados. */
export default function Carregando({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Carregando">
      <div className="esqueleto h-9 w-64 max-w-full" />
      <div className="esqueleto mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="esqueleto h-44" />
        ))}
      </div>
    </div>
  );
}
