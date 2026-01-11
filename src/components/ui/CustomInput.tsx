import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className, label, icon, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && <Label className="text-gray-300 font-medium">{label}</Label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}
          <ShadcnInput 
            className={cn(
              "bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-teal/50 focus:ring-brand-teal/20",
              icon ? "pl-10" : "",
              className
            )} 
            ref={ref} 
            {...props} 
          />
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
