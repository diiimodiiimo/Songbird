'use client'

interface ProgressDotsProps {
  totalSteps: number
  currentStep: number
  className?: string
}

export default function ProgressDots({ totalSteps, currentStep, className = '' }: ProgressDotsProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i === currentStep
              ? 'bg-accent w-3 h-3'
              : i < currentStep
              ? 'bg-accent/60'
              : 'bg-text/20'
          }`}
        />
      ))}
    </div>
  )
}



