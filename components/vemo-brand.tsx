import Image from "next/image";
import { cn } from "@/lib/utils";

export function VemoMark({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden", className)}>
      <Image
        src="/vemo-mark.png"
        alt={decorative ? "" : "Vemo"}
        fill
        sizes="64px"
        className="absolute inset-0 size-full scale-[1.45] object-contain"
      />
    </span>
  );
}

export function VemoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <Image
        src="/vemo-logo.png"
        alt="Vemo"
        loading="eager"
        fill
        sizes="256px"
        className="object-cover object-center"
      />
    </span>
  );
}
