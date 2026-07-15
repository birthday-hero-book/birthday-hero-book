import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand ${inverse ? "brand--inverse" : ""}`} href="/" aria-label="Birthday Hero Book home">
      <span className="brand-mark" aria-hidden="true"><span>✦</span></span>
      <span className="brand-words">Birthday Hero <em>Book</em></span>
    </Link>
  );
}

export function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export function CheckIcon() {
  return <span className="check-icon" aria-hidden="true">✓</span>;
}
