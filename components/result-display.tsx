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
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 max-w-2xl mx-4 shadow-2xl animate-in zoom-in duration-500">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">{trick.name}</h2>
          <div className="bg-black/20 rounded-xl p-6">
            <p className="text-xl md:text-2xl text-black font-medium leading-relaxed">{trick.definition}</p>
          </div>
          <div className="mt-6 text-black/70 text-lg">
            Challenge accepted! You have 2 minutes to execute this technique.
          </div>
        </div>
      </div>
    </div>
  )
}
