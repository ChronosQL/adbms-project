import { Check } from "lucide-react";

const BookingStepIndicator = ({ steps, currentStep, maxReachedStep = currentStep, onStepClick }) => (
  <div className="flex items-center justify-center mb-10">
    {steps.map((step, index) => {
      const isCompleted = index < currentStep;
      const isActive    = index === currentStep;
      const isVisited   = index <= maxReachedStep && index !== currentStep;
      const isClickable = isVisited && onStepClick;
      return (
        <div key={index} className="flex items-center">
          {/* Circle */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => isClickable && onStepClick(index)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                ${isCompleted || isVisited ? "bg-[#EF8354] text-white shadow-md shadow-[#EF8354]/30" : ""}
                ${isActive    ? "bg-[#EF8354] text-white shadow-lg shadow-[#EF8354]/40 scale-110" : ""}
                ${!isCompleted && !isActive && !isVisited ? "bg-slate-100 text-slate-400" : ""}
                ${isClickable ? "cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-[#EF8354]/40" : "cursor-default"}
              `}
            >
              {(isCompleted || isVisited) ? <Check className="w-5 h-5" /> : index + 1}
            </div>
            <span
              onClick={() => isClickable && onStepClick(index)}
              className={`text-xs mt-1 font-medium whitespace-nowrap transition-colors
                ${isActive              ? "text-[#EF8354]" : ""}
                ${isCompleted           ? "text-slate-600" : ""}
                ${isVisited && !isActive ? "text-slate-600" : ""}
                ${!isCompleted && !isActive && !isVisited ? "text-slate-400" : ""}
                ${isClickable ? "cursor-pointer hover:text-[#EF8354]" : ""}
              `}
            >
              {step}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-16 sm:w-24 mx-2 mb-5 transition-all duration-500 ${
                index < maxReachedStep ? "bg-[#EF8354]" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      );
    })}
  </div>
);

export default BookingStepIndicator;
