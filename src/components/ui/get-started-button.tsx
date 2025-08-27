import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function GetStartedButton({ onClick, label = 'new challenge' }: { onClick?: () => void; label?: string }) {
  return (
    <Button
      className="group relative overflow-hidden rounded-xl border border-zinc-300 bg-zinc-800 text-white hover:bg-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 md:px-8"
      size="lg"
      onClick={onClick}
    >
      <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
        {label}
      </span>
      <i className="absolute right-1 top-1 bottom-1 rounded-xl z-10 grid w-1/4 place-items-center transition-all duration-500 bg-white/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </i>
    </Button>
  );
}


