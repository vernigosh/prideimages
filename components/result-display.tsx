"use client"

interface Trick {
  name: string
  definition: string
}

interface ResultDisplayProps {
  trick: Trick
}

export function ResultDisplay({ trick }: ResultDisplayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-brand-black/20 backdrop-blur-sm">
      <div
        style={{ backgroundColor: "#ffb8ad" }}
        className="rounded-3xl p-8 max-w-5xl mx-4 shadow-2xl border-4 border-brand-black"
      >
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-brand-black font-sans mb-6">{trick.name}</h2>
          <div style={{ backgroundColor: "#ffffff" }} className="rounded-xl p-6 border-2 border-brand-black">
            <p className="text-xl md:text-2xl text-brand-black font-medium leading-relaxed font-sans">
              {trick.definition}
            </p>
          </div>
          <div className="mt-6 text-brand-black text-lg font-semibold font-sans">
            Challenge accepted! You have 2 minutes to execute this technique.
          </div>
        </div>
      </div>
    </div>
  )
}
