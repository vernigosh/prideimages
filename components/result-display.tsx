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
    <div className="absolute left-8 top-8">
      <div
        className="rounded-3xl p-4 shadow-2xl border-2 border-black"
        style={{
          backgroundColor: "#ffb8ad",
          width: "600px", // 50% of original 1200px
          height: "200px", // 50% of original 400px
        }}
      >
        <div className="text-center h-full flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-3 uppercase">{trick.name}</h2>
          <div className="rounded-xl p-3 border-2 border-black bg-white flex-1 flex items-center justify-center">
            <p className="text-lg md:text-xl text-black font-bold leading-relaxed">{trick.definition}</p>{" "}
            {/* Reduced from 4xl-6xl */}
          </div>
          <div className="mt-3 text-black text-base font-bold">
            {" "}
            {/* Reduced from mt-6 and 4xl */}
            Challenge accepted! You have 2 minutes to execute this technique.
          </div>
        </div>
      </div>
    </div>
  )
}
