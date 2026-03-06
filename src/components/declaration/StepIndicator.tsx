import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => (
  <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 scrollbar-none">
    {steps.map((step, i) => (
      <div key={step} className="flex-1 flex items-center gap-1 min-w-0">
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shrink-0",
              i < currentStep && "gradient-primary text-primary-foreground",
              i === currentStep && "gradient-accent text-accent-foreground shadow-card",
              i > currentStep && "bg-muted text-muted-foreground"
            )}
          >
            {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span
            className={cn(
              "text-[9px] mt-1 font-medium truncate max-w-full text-center",
              i === currentStep ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {step}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className={cn(
              "h-0.5 flex-1 rounded-full -mt-4 min-w-2",
              i < currentStep ? "gradient-primary" : "bg-muted"
            )}
          />
        )}
      </div>
    ))}
  </div>
);

export default StepIndicator;
