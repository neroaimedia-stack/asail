import Image from "next/image";

export function AsailLogo({ centered = false }: { centered?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${centered ? "justify-center" : ""}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--asail-blue)] text-sm font-bold text-white shadow-[var(--asail-blue-glow)]">
        A
      </div>
      <span className="text-lg font-semibold tracking-tight">Asail</span>
    </div>
  );
}

export function PublicLogoImage({ height = 28 }: { height?: number }) {
  return (
    <Image
      alt="Asail"
      className="hidden dark:brightness-[1.8] dark:invert"
      height={height}
      src="/logo.png"
      width={height * 4}
    />
  );
}
