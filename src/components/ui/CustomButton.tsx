import { Button as ShadcnButton } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

// Derive props from the Shadcn component
type ShadcnButtonProps = React.ComponentProps<typeof ShadcnButton>;

interface CustomButtonProps extends Omit<ShadcnButtonProps, "variant"> {
    isLoading?: boolean;
    icon?: React.ReactNode;
    // Allow 'gradient' plus original variants
    variant?: ShadcnButtonProps["variant"] | "gradient";
}

export function Button({ className, variant, size, isLoading, icon, children, ...props }: CustomButtonProps) {
    const isGradient = variant === 'gradient';
    
    return (
        <ShadcnButton 
            className={cn(
                isLoading && "opacity-70 cursor-not-allowed",
                isGradient && "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white border-0",
                className
            )}
            // Pass 'default' if it's our custom variant, otherwise pass the variant as is
            variant={isGradient ? "default" : variant}
            size={size}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && icon && <span className="mr-2">{icon}</span>}
            {children}
        </ShadcnButton>
    )
}
