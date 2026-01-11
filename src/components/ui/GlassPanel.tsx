import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassPanel({ children, className, ...props }: GlassPanelProps) {
  return (
    <div 
      className={cn(
        "backdrop-blur-md bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 rounded-xl shadow-xl", 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
