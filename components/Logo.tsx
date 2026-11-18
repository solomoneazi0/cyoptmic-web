import { LOGO_PATHS, LOGO_VIEWBOX } from "@/lib/logo-paths";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} fill="currentColor" aria-hidden="true">
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
