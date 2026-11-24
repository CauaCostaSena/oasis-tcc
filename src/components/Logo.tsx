import { Palmtree } from "lucide-react";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`display inline-flex items-center gap-2 text-xl font-bold ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-on-primary">
        <Palmtree size={18} />
      </span>
      Oásis
    </span>
  );
}
