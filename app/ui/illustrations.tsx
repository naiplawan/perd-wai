/* Minimal flat illustrations drawn for Perd Wai. Decorative only: always aria-hidden. */

const ink = "var(--illustration-ink)";

export function CafeStorefront({ className }: { className?: string }) {
  const stripes = Array.from({ length: 6 }, (_, index) => index);
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 240 180">
      {/* ground */}
      <path d="M4 167h232" stroke="var(--border)" strokeLinecap="round" strokeWidth="3" />
      {/* building */}
      <rect fill="var(--illustration-cream)" height="112" rx="6" stroke={ink} strokeWidth="2.5" width="180" x="30" y="54" />
      {/* sign board with a cup */}
      <rect fill="var(--primary)" height="26" rx="5" stroke={ink} strokeWidth="2.5" width="96" x="72" y="16" />
      <path d="M110 25h16v6a8 8 0 0 1-16 0z" fill="var(--illustration-cream)" />
      <path d="M126 27h2.5a3 3 0 0 1 0 6H126" stroke="var(--illustration-cream)" strokeWidth="2" />
      <path d="M118 42v12M100 42v12M140 42v12" stroke={ink} strokeWidth="2.5" />
      {/* striped, scalloped awning */}
      {stripes.map((index) => (
        <path
          d={`M${30 + index * 30} 54h30v14a15 15 0 0 1-30 0z`}
          fill={index % 2 === 0 ? "var(--primary)" : "var(--illustration-paper)"}
          key={index}
          stroke={ink}
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
      ))}
      {/* window with a table and cup */}
      <rect fill="var(--positive-subtle)" height="58" rx="4" stroke={ink} strokeWidth="2.5" width="80" x="44" y="94" />
      <path d="M58 140h52M70 140v12M98 140v12" stroke={ink} strokeLinecap="round" strokeWidth="2.5" />
      <path d="M78 128h12v5a6 6 0 0 1-12 0z" fill="var(--illustration-coffee)" />
      <path d="M82 122q-2-3 0-6M87 122q-2-3 0-6" stroke="var(--illustration-coffee)" strokeLinecap="round" strokeWidth="2" />
      {/* door */}
      <rect fill="var(--primary)" height="72" rx="4" stroke={ink} strokeWidth="2.5" width="46" x="146" y="94" />
      <rect fill="var(--positive-subtle)" height="22" rx="3" width="30" x="154" y="102" />
      <circle cx="184" cy="134" fill="var(--warning)" r="3" />
      {/* plant */}
      <path d="M8 167l3-22h20l3 22z" fill="var(--warning)" stroke={ink} strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M21 145c-9-6-12-16-8-24 7 3 10 13 8 24zM21 145c4-10 12-15 20-13-1 8-10 13-20 13z" fill="var(--chart-2)" stroke={ink} strokeLinejoin="round" strokeWidth="2.5" />
      {/* coins */}
      <ellipse cx="222" cy="160" fill="var(--warning)" rx="11" ry="4.5" stroke={ink} strokeWidth="2.5" />
      <path d="M211 160v-7m22 7v-7" stroke={ink} strokeWidth="2.5" />
      <ellipse cx="222" cy="153" fill="#e8c27a" rx="11" ry="4.5" stroke={ink} strokeWidth="2.5" />
    </svg>
  );
}

export type CupLevel = "full" | "half" | "low";

/** A coffee cup whose fill tracks how healthy the plan is. */
export function CoffeeCup({ level, className }: { level: CupLevel; className?: string }) {
  // The cup is a trapezoid from (16,26)–(64,26) at the rim to (24,64)–(56,64) at the base.
  const surface = level === "full" ? 31 : level === "half" ? 45 : 58;
  const inset = ((surface - 26) / 38) * 8;
  const steam = level === "full" ? [30, 40, 50] : level === "half" ? [40] : [];

  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 80 84">
      {steam.map((x) => (
        <path d={`M${x} 20q-4-4 0-8t0-8`} key={x} stroke="var(--illustration-steam)" strokeLinecap="round" strokeWidth="2.5" />
      ))}
      <ellipse cx="40" cy="72" fill="var(--illustration-paper)" rx="30" ry="6" stroke={ink} strokeWidth="2.5" />
      <path d="M16 26h48l-8 38H24z" fill="var(--card)" />
      <path d={`M${16 + inset} ${surface}h${48 - inset * 2}L56 64H24z`} fill="var(--illustration-coffee)" />
      <path d="M64 33h3a7 7 0 0 1 0 14h-5" stroke={ink} strokeLinecap="round" strokeWidth="2.5" />
      <path d="M16 26h48l-8 38H24z" stroke={ink} strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );
}
