import { cn } from "@/lib/utils";

type ContainerProps = {
  children: React.ReactNode;
  width?: "tight" | "wide" | "prose";
  className?: string;
};

export function Container({ children, width = "wide", className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto px-6 md:px-10",
        width === "tight" && "max-w-3xl",
        width === "prose" && "max-w-2xl",
        width === "wide" && "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}
