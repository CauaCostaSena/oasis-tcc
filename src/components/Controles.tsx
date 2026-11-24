// Switch e checkbox neon: só HTML + CSS (globals.css), por isso servem em formulários do servidor e do navegador.

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className">;

export function Switch(props: Props) {
  return (
    <span className="switch">
      <input type="checkbox" role="switch" {...props} />
      <span />
    </span>
  );
}

// Direção de cada uma das 12 partículas que saem ao marcar.
const PARTICULAS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * 2 * Math.PI;
  return { "--x": `${Math.round(Math.cos(a) * 22)}px`, "--y": `${Math.round(Math.sin(a) * 22)}px` } as React.CSSProperties;
});

export function NeonCheckbox(props: Props) {
  return (
    <span className="neon-check">
      <input type="checkbox" {...props} />
      <span className="cx">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M3,12.5l7,7L21,5" />
        </svg>
        <i />
        <i />
        <i />
        <i />
      </span>
      {PARTICULAS.map((estilo, i) => (
        <b key={i} style={estilo} />
      ))}
    </span>
  );
}
