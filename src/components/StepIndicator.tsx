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
    <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              {/* Círculo do step */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep >= step.number
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>

              {/* Label e descrição */}
              <div className="mt-2 text-center">
                <p
                  className={`font-semibold text-xs md:text-sm ${
                    currentStep >= step.number ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Divisor */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-1 mb-8">
                <div
                  className={`h-full rounded-full transition-colors ${
                    currentStep > step.number
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
