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
    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
      <div
        className="rounded-3xl p-8 max-w-5xl mx-4 shadow-2xl border-4 border-black"
        style={{ backgroundColor: "#ffb8ad" }}
      >
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">{trick.name}</h2>
          <div className="rounded-xl p-6 border-2 border-black bg-white">
            <p className="text-xl md:text-2xl text-black font-medium leading-relaxed">{trick.definition}</p>
          </div>
          <div className="mt-6 text-black text-lg font-semibold">
            Challenge accepted! You have 2 minutes to execute this technique.
          </div>
        </div>
      </div>
    </div>
  )
}
