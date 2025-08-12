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
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="rounded-3xl p-8 shadow-2xl border-4 border-black"
        style={{
          backgroundColor: "#ffb8ad",
          width: "1200px",
          height: "400px",
        }}
      >
        <div className="text-center h-full flex flex-col justify-center">
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">{trick.name}</h2>
          <div className="rounded-xl p-6 border-2 border-black bg-white flex-1 flex items-center justify-center">
            <p className="text-4xl md:text-6xl text-black font-bold leading-tight">{trick.definition}</p>
          </div>
          <div className="mt-6 text-black text-4xl font-bold">
            Challenge accepted! You have 2 minutes to execute this technique.
          </div>
        </div>
      </div>
    </div>
  )
}
