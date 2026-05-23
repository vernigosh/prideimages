"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import triviaData from "@/data/pride-trivia.json"

interface TriviaQuestion {
  id: number
  question: string
  a: string
  b: string
  c: string
  d: string
  answer: string
  context: string
}

interface Guess {
  username: string
  answer: string
  timestamp: number
}

interface PrideTriviaTimerProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

const WORK_DURATION = 25 * 60
const SHORT_BREAK = 5 * 60

// Clock-synced timer: work from x:00-x:25 and x:30-x:55, breaks at x:25-x:30 and x:55-x:00
function getClockState() {
  const now = new Date()
  const minutesIntoBlock = now.getMinutes() % 30
  const totalSecondsIntoBlock = minutesIntoBlock * 60 + now.getSeconds()

  let currentPhase: "work" | "break"
  let remaining: number

  if (totalSecondsIntoBlock < WORK_DURATION) {
    currentPhase = "work"
    remaining = WORK_DURATION - totalSecondsIntoBlock
  } else {
    currentPhase = "break"
    const secondsIntoBreak = totalSecondsIntoBlock - WORK_DURATION
    remaining = Math.max(SHORT_BREAK - secondsIntoBreak, 0)
  }

  const blockIndex = Math.floor(now.getMinutes() / 30)
  const cycle = now.getHours() * 2 + blockIndex + 1

  return { currentPhase, remaining, cycle }
}

function getNextBreakTime() {
  const now = new Date()
  const mins = now.getMinutes()
  let nextBreakMin: number
  if (mins < 25) {
    nextBreakMin = 25
  } else if (mins < 55) {
    nextBreakMin = 55
  } else {
    nextBreakMin = 25
  }
  const target = new Date(now)
  if (nextBreakMin <= mins) {
    target.setHours(target.getHours() + 1)
  }
  target.setMinutes(nextBreakMin, 0, 0)
  return `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`
}

// Send chat message via StreamElements bot
async function sendChatMessage(message: string) {
  try {
    await fetch("/api/send-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
  } catch (error) {
    console.error("[v0] Failed to send chat message:", error)
  }
}

export function PrideTriviaTimer({ isVisible, onConnectionChange, onHide }: PrideTriviaTimerProps) {
  const [phase, setPhase] = useState<"work" | "break">("work")
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [cycleCount, setCycleCount] = useState(1)
  const [showPulse, setShowPulse] = useState(false)
  
  // Trivia state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [guesses, setGuesses] = useState<Map<string, string>>(new Map()) // username -> answer
  const [correctGuessers, setCorrectGuessers] = useState<string[]>([])
  const [recentGuessNotification, setRecentGuessNotification] = useState<{ username: string; answer: string } | null>(null)
  
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const prevPhaseRef = useRef<"work" | "break" | null>(null)
  
  isVisibleRef.current = isVisible

  const questions: TriviaQuestion[] = triviaData.questions

  const currentQuestion = questions[currentQuestionIndex]

  // Handle guess commands from chat
  const handleGuess = useCallback((event: CustomEvent) => {
    const { username, answer } = event.detail
    const normalizedAnswer = answer.toLowerCase()
    
    if (!["a", "b", "c", "d"].includes(normalizedAnswer)) return
    if (phase !== "work") return // Only accept guesses during work phase
    
    setGuesses(prev => {
      const newGuesses = new Map(prev)
      newGuesses.set(username.toLowerCase(), normalizedAnswer)
      return newGuesses
    })
    
    // Show notification briefly
    setRecentGuessNotification({ username, answer: normalizedAnswer.toUpperCase() })
    setTimeout(() => setRecentGuessNotification(null), 3000)
  }, [phase])

  // Listen for guess events
  useEffect(() => {
    window.addEventListener("triviaGuess", handleGuess as EventListener)
    return () => window.removeEventListener("triviaGuess", handleGuess as EventListener)
  }, [handleGuess])

  // Main timer effect
  useEffect(() => {
    if (!isVisible) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTickRef.current = 0
      setPhase("work")
      setTimeLeft(WORK_DURATION)
      setCycleCount(1)
      onConnectionChange(false)
      return
    }

    const state = getClockState()
    setPhase(state.currentPhase)
    setTimeLeft(state.remaining)
    setCycleCount(state.cycle)
    prevPhaseRef.current = state.currentPhase
    onConnectionChange(true)
    lastTickRef.current = Date.now()

    const tick = () => {
      if (!isVisibleRef.current) return

      const now = Date.now()
      if (now - lastTickRef.current >= 1000) {
        lastTickRef.current = now
        const s = getClockState()
        
        if (prevPhaseRef.current !== null && s.currentPhase !== prevPhaseRef.current) {
          if (s.currentPhase === "work") {
            // New work cycle - advance to next question
            window.dispatchEvent(new CustomEvent("workCycleStart", { detail: { cycle: s.cycle } }))
            setShowPulse(true)
            setTimeout(() => setShowPulse(false), 10000)
            
            // Calculate correct guessers before resetting
            if (currentQuestion) {
              const correctAnswer = currentQuestion.answer.toLowerCase()
              const winners: string[] = []
              guesses.forEach((answer, username) => {
                if (answer === correctAnswer) {
                  winners.push(username)
                }
              })
              setCorrectGuessers(winners)
            }
            
            // Advance to next question
            setCurrentQuestionIndex(prev => {
              const next = prev + 1
              return next >= questions.length ? 0 : next
            })
            
            // Reset guesses for new question
            setGuesses(new Map())
            
            sendChatMessage("PRIDE TRIVIA! Type !a !b !c or !d to guess! 25 minutes to answer!")
          } else {
            // Break started - reveal answer
            window.dispatchEvent(new CustomEvent("breakStart", { detail: { cycle: s.cycle } }))
            
            // Calculate correct guessers
            if (currentQuestion) {
              const correctAnswer = currentQuestion.answer.toLowerCase()
              const winners: string[] = []
              guesses.forEach((answer, username) => {
                if (answer === correctAnswer) {
                  winners.push(username)
                }
              })
              setCorrectGuessers(winners)
              
              const correctLetter = correctAnswer.toUpperCase()
              const correctText = currentQuestion[correctAnswer as keyof TriviaQuestion] as string
              sendChatMessage(`ANSWER: ${correctLetter}) ${correctText} | ${winners.length} got it right!`)
            }
          }
        }
        prevPhaseRef.current = s.currentPhase
        
        setPhase(s.currentPhase)
        setTimeLeft(s.remaining)
        setCycleCount(s.cycle)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    const handleVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      } else if (isVisibleRef.current) {
        lastTickRef.current = Date.now()
        const s = getClockState()
        setPhase(s.currentPhase)
        setTimeLeft(s.remaining)
        setCycleCount(s.cycle)
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [isVisible, currentQuestion, guesses, questions.length, onConnectionChange])

  if (!isVisible || !currentQuestion) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const guessCount = guesses.size
  
  // Calculate progress percentage for the timer bar
  const totalDuration = phase === "work" ? WORK_DURATION : SHORT_BREAK
  const progressPercent = (timeLeft / totalDuration) * 100

  return (
    <>
      {/* Purple pulse overlay for new work cycle */}
      {showPulse && (
        <div 
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: "radial-gradient(ellipse at center, rgba(147, 51, 234, 0.3) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 70%)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}
      
      {/* Guess notification - appears briefly like flower notifications */}
      {recentGuessNotification && (
        <div 
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-out"
          style={{
            animation: "fadeInOut 3s ease-in-out forwards",
          }}
        >
          <div 
            className="px-6 py-3 rounded-full text-black font-bold text-xl font-sans"
            style={{ backgroundColor: "#ffb8ad" }}
          >
            @{recentGuessNotification.username} guessed {recentGuessNotification.answer}
          </div>
        </div>
      )}
      
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
        {/* Timer progress bar above the box */}
        <div 
          className="mb-4 rounded-2xl border-2 border-black text-center overflow-hidden relative"
          style={{ backgroundColor: "#ffffff", width: "600px" }}
        >
          {/* Progress fill */}
          <div 
            className="absolute inset-0 transition-all duration-1000 ease-linear"
            style={{ 
              backgroundColor: "#ffb8ad",
              width: `${progressPercent}%`,
            }}
          />
          {/* Text overlay */}
          <div className="relative z-10 px-6 py-3">
            <div className="text-4xl font-bold text-black font-sans">
              {phase === "work" ? "WORK TIME" : "BREAK TIME"} — {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>
        
        <div
          className="rounded-3xl shadow-2xl border-2 border-black overflow-hidden"
          style={{
            backgroundColor: "#ffb8ad",
            width: "600px",
          }}
        >
          <div className="p-6">
          {phase === "work" ? (
            /* WORK PHASE - Show question */
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-center">
                <h2 className="text-2xl font-bold text-black uppercase font-sans">
                  Pride Trivia 🏳️‍🌈✨
                </h2>
              </div>
              
              {/* Question */}
              <div className="bg-white rounded-xl p-4 border-2 border-black">
                <p className="text-xl font-bold text-black font-sans leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
              
              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {["a", "b", "c", "d"].map((letter) => (
                  <div 
                    key={letter}
                    className="bg-white rounded-xl p-3 border-2 border-black flex items-start gap-2"
                  >
                    <span className="text-lg font-bold text-black font-sans uppercase flex-shrink-0">
                      {letter})
                    </span>
                    <span className="text-lg text-black font-sans">
                      {currentQuestion[letter as keyof TriviaQuestion] as string}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between text-black">
                <div className="text-lg font-bold font-sans">
                  {guessCount} {guessCount === 1 ? "person has" : "people have"} guessed
                </div>
                <div className="text-lg font-sans">
                  Type !a !b !c or !d
                </div>
              </div>
            </div>
          ) : (
            /* BREAK PHASE - Show answer and context */
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-center">
                <h2 className="text-2xl font-bold text-black uppercase font-sans">
                  Answer Revealed!
                </h2>
              </div>
              
              {/* Question reminder */}
              <div className="bg-white/50 rounded-xl p-3 border-2 border-black">
                <p className="text-lg text-black font-sans">
                  {currentQuestion.question}
                </p>
              </div>
              
              {/* Correct Answer */}
              <div className="bg-green-500 rounded-xl p-4 border-2 border-black">
                <p className="text-2xl font-bold text-white font-sans">
                  {currentQuestion.answer.toUpperCase()}) {currentQuestion[currentQuestion.answer as keyof TriviaQuestion] as string}
                </p>
              </div>
              
              {/* Context */}
              <div className="bg-white rounded-xl p-4 border-2 border-black">
                <p className="text-lg text-black font-sans leading-relaxed">
                  {currentQuestion.context}
                </p>
              </div>
              
              {/* Correct guessers ticker */}
              {correctGuessers.length > 0 && (
                <div className="relative overflow-hidden h-8">
                  <div 
                    className="absolute whitespace-nowrap animate-scroll-left flex items-center gap-4"
                    style={{
                      animation: `scrollLeft ${Math.max(10, correctGuessers.length * 2)}s linear infinite`,
                    }}
                  >
                    <span className="text-white font-bold font-sans text-lg drop-shadow-md">
                      Got it right:
                    </span>
                    {correctGuessers.map((username, i) => (
                      <span key={i} className="text-white font-bold font-sans text-lg drop-shadow-md">
                        @{username}
                      </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    <span className="text-white font-bold font-sans text-lg drop-shadow-md">
                      Got it right:
                    </span>
                    {correctGuessers.map((username, i) => (
                      <span key={`dup-${i}`} className="text-white font-bold font-sans text-lg drop-shadow-md">
                        @{username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {correctGuessers.length === 0 && (
                <div className="text-center text-black font-bold font-sans text-lg">
                  No one got it right this time!
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
        
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  )
}
