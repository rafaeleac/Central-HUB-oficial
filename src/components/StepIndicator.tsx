import { CheckCircle2, ChevronRight } from "lucide-react";

interface Step {
  number: number;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  return (
    <div className="w-full mb-8 px-2 sm:px-4">
      <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 flex-wrap">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-1 sm:gap-2 md:gap-4">
            {/* Círculo com número */}
            <div className="relative flex flex-col items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm md:text-base transition-all shadow-md ${
                  currentStep >= step.number
                    ? "bg-[#ffdd00] text-black shadow-lg shadow-[#ffdd00]/40"
                      : "bg-gray-300 dark:bg-neutral-700 text-gray-800 dark:text-neutral-400"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                ) : (
                  step.number
                )}
              </div>
              {/* Label e descrição */}
              <div className="mt-1 sm:mt-2 text-center">
                <p
                  className={`font-semibold text-xs transition-colors ${
                    currentStep >= step.number
                      ? "text-[#ffdd00] dark:text-[#ffdd00]"
                        : "text-gray-700 dark:text-neutral-500"
                  }`}
                >
                  {step.label}
                </p>
                  <p className="text-xs text-gray-600 dark:text-neutral-600 hidden lg:block">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Linha conectora */}
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-1 sm:w-2 md:w-4 lg:w-8 rounded-full transition-colors ${
                  currentStep > step.number
                    ? "bg-[#ffdd00]"
                    : "bg-gray-300 dark:bg-neutral-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;

