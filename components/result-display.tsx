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
          background:
            "linear-gradient(180deg, rgba(255, 184, 173, 0.8) 0%, rgba(255, 154, 139, 0.8) 50%, rgba(255, 122, 107, 0.8) 100%)",
          width: "600px", // 50% of original 1200px
          height: "200px", // 50% of original 400px
        }}
      >
        <div className="text-center h-full flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-black mb-3 uppercase">{trick.name}</h2>
          <div className="rounded-xl p-3 border-2 border-black bg-white flex-1 flex items-center justify-center">
            <p className="text-xl md:text-2xl text-black font-bold leading-relaxed">{trick.definition}</p>
          </div>
          <div className="mt-3 text-black text-lg font-bold uppercase">ACCEPTED, YOU HAVE 2 MINUTES.</div>
        </div>
      </div>
    </div>
  )
}
