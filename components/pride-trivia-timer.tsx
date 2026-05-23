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

// How long the box stays visible/hidden during work phase
const BOX_VISIBLE_DURATION = 60 * 1000 // 60 seconds visible (enough for 2 full Q&A cycles)
const BOX_HIDDEN_DURATION = 2 * 60 * 1000 // 2 minutes hidden

// Cooldown for !trivia chat messages
const CHAT_COOLDOWN = 60 * 1000 // 60 seconds cooldown

// How long each answer option slide shows
const OPTION_SLIDE_DURATION = 5 * 1000 // 5 seconds per option

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
  
  // Box visibility state (fades in/out during work phase)
  const [boxVisible, setBoxVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const boxVisibilityTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Chat cooldown tracking
  const lastChatTimeRef = useRef<number>(0)
  
  // Slide animation state (0-3 for A, B, C, D)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isSlideTransitioning, setIsSlideTransitioning] = useState(false)
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Trivia state
  const [shuffledQuestions, setShuffledQuestions] = useState<TriviaQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [guesses, setGuesses] = useState<Map<string, string>>(new Map()) // username -> answer
  const [correctGuessers, setCorrectGuessers] = useState<string[]>([])
  const [recentGuessNotification, setRecentGuessNotification] = useState<{ username: string; answer: string } | null>(null)
  
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const prevPhaseRef = useRef<"work" | "break" | null>(null)
  
  isVisibleRef.current = isVisible

  // Shuffle function using Fisher-Yates algorithm
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  // Derive current question from shuffled questions
  const currentQuestion = shuffledQuestions[currentQuestionIndex]

  // Initialize shuffled questions on mount
  useEffect(() => {
    const questions: TriviaQuestion[] = triviaData.questions
    setShuffledQuestions(shuffleArray(questions))
  }, [shuffleArray])

  // Cycle through slides (question -> A -> B -> C -> D -> question...)
  useEffect(() => {
    if (!isVisible || !boxVisible || phase !== "work") {
      // Reset to question when not showing
      setCurrentSlide(0)
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current)
        slideTimerRef.current = null
      }
      return
    }
    
    const scheduleNextSlide = () => {
      slideTimerRef.current = setTimeout(() => {
        // Start fade out
        setIsSlideTransitioning(true)
        // After fade out, change slide and fade in
        setTimeout(() => {
          setCurrentSlide(prev => (prev + 1) % 4) // 0-3 cycle (A, B, C, D)
          setIsSlideTransitioning(false)
        }, 300) // 300ms for fade out
      }, OPTION_SLIDE_DURATION)
    }
    
    scheduleNextSlide()
    
    return () => {
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current)
      }
    }
  }, [isVisible, boxVisible, phase, currentSlide])

  // Handle !trivia command to toggle box visibility and send question to chat
  useEffect(() => {
    const handleToggle = () => {
      setIsFading(true)
      setTimeout(() => {
        setBoxVisible(prev => !prev)
        setIsFading(false)
      }, 300) // Match fade duration
      
      // Send current question to chat for mobile viewers (with cooldown)
      const now = Date.now()
      if (currentQuestion && phase === "work" && (now - lastChatTimeRef.current) >= CHAT_COOLDOWN) {
        lastChatTimeRef.current = now
        sendChatMessage(`CURRENT QUESTION: ${currentQuestion.question}`)
        setTimeout(() => {
          sendChatMessage(`A) ${currentQuestion.a} | B) ${currentQuestion.b} | C) ${currentQuestion.c} | D) ${currentQuestion.d}`)
        }, 1000)
      }
      
      // Reset the auto-cycle timer when manually toggled
      if (boxVisibilityTimerRef.current) {
        clearTimeout(boxVisibilityTimerRef.current)
      }
      // Set up next auto-toggle
      boxVisibilityTimerRef.current = setTimeout(() => {
        setIsFading(true)
        setTimeout(() => {
          setBoxVisible(prev => !prev)
          setIsFading(false)
        }, 300)
      }, boxVisible ? BOX_HIDDEN_DURATION : BOX_VISIBLE_DURATION)
    }
    
    window.addEventListener("toggleTriviaBox", handleToggle)
    return () => window.removeEventListener("toggleTriviaBox", handleToggle)
  }, [boxVisible, currentQuestion, phase])

  // Auto-cycle box visibility during work phase
  useEffect(() => {
    if (!isVisible || phase !== "work") {
      // During break, always show the box
      if (phase === "break" && !boxVisible) {
        setBoxVisible(true)
      }
      if (boxVisibilityTimerRef.current) {
        clearTimeout(boxVisibilityTimerRef.current)
        boxVisibilityTimerRef.current = null
      }
      return
    }
    
    const scheduleToggle = () => {
      const duration = boxVisible ? BOX_VISIBLE_DURATION : BOX_HIDDEN_DURATION
      boxVisibilityTimerRef.current = setTimeout(() => {
        setIsFading(true)
        setTimeout(() => {
          setBoxVisible(prev => !prev)
          setIsFading(false)
        }, 300)
      }, duration)
    }
    
    scheduleToggle()
    
    return () => {
      if (boxVisibilityTimerRef.current) {
        clearTimeout(boxVisibilityTimerRef.current)
      }
    }
  }, [isVisible, phase, boxVisible])
  
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
            
            // Advance to next question (or reshuffle if we've gone through all)
            setCurrentQuestionIndex(prev => {
              const next = prev + 1
              if (next >= shuffledQuestions.length) {
                // Reshuffle and start from beginning
                setShuffledQuestions(shuffleArray(triviaData.questions))
                return 0
              }
              return next
            })
            
            // Reset guesses for new question
            setGuesses(new Map())
            
            // Send question to chat (use next question since we just advanced)
            const nextIndex = (currentQuestionIndex + 1) >= shuffledQuestions.length ? 0 : (currentQuestionIndex + 1)
            const nextQuestion = shuffledQuestions[nextIndex]
            if (nextQuestion) {
              sendChatMessage(`PRIDE TRIVIA: ${nextQuestion.question}`)
              setTimeout(() => {
                sendChatMessage(`A) ${nextQuestion.a} | B) ${nextQuestion.b} | C) ${nextQuestion.c} | D) ${nextQuestion.d} — Type !a !b !c or !d to guess!`)
              }, 1500)
            }
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
              
              if (winners.length > 0) {
                const winnerList = winners.length <= 5 
                  ? winners.map(w => `@${w}`).join(", ")
                  : `${winners.slice(0, 5).map(w => `@${w}`).join(", ")} and ${winners.length - 5} more`
                sendChatMessage(`ANSWER: ${correctLetter}) ${correctText} — Congrats ${winnerList}!`)
              } else {
                sendChatMessage(`ANSWER: ${correctLetter}) ${correctText} — No one got it this time!`)
              }
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
  }, [isVisible, currentQuestion, guesses, shuffledQuestions.length, shuffleArray, onConnectionChange])

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
      
      {/* Main trivia box - fades in/out during work phase */}
      <div className="absolute left-8 top-[calc(50%-140px)]" style={{ marginTop: "25px" }}>
        {/* Timer progress bar - always visible */}
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
            {phase === "work" && !boxVisible ? (
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-black font-sans">
                  Type !trivia to view question
                </div>
                <div className="text-4xl font-bold text-black font-sans">
                  WORK TIME — {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
              </div>
            ) : (
              <div className="text-4xl font-bold text-black font-sans">
                {phase === "work" ? "WORK TIME" : "BREAK TIME"} — {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
        
        {/* Question box - fades in/out */}
        <div
          className="rounded-3xl shadow-2xl border-2 border-black overflow-hidden transition-opacity duration-300"
          style={{
            backgroundColor: "#ffb8ad",
            width: "600px",
            opacity: (boxVisible && !isFading) ? 1 : 0,
            pointerEvents: boxVisible ? "auto" : "none"
          }}
        >
          <div className="p-6">
          {phase === "work" ? (
            /* WORK PHASE - Question in header, cycle through A/B/C/D */
            <div className="flex flex-col gap-4">
              {/* Header with question */}
              <div className="flex items-start gap-2">
                <span className="text-2xl flex-shrink-0">🏳️‍🌈</span>
                <h2 className="text-xl font-bold text-black font-sans leading-relaxed">
                  Pride Trivia: {currentQuestion.question}
                </h2>
              </div>
              
              {/* Main content area with large letter indicator on left */}
              <div className="flex items-center gap-4">
                {/* Large letter indicator */}
                <div 
                  className={`w-20 h-20 rounded-full border-4 border-black flex items-center justify-center flex-shrink-0 bg-white transition-opacity duration-300 ${isSlideTransitioning ? 'opacity-0' : 'opacity-100'}`}
                >
                  <span className="text-4xl font-bold text-black font-sans">
                    {["A", "B", "C", "D"][currentSlide % 4]}
                  </span>
                </div>
                
                {/* Text content - just the answer option with fade transition */}
                <div className="bg-white rounded-xl p-4 border-2 border-black flex-1 min-h-[80px] flex items-center">
                  <p className={`text-xl font-bold text-black font-sans leading-relaxed transition-all duration-300 ${isSlideTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                    {currentQuestion[["a", "b", "c", "d"][currentSlide % 4] as keyof TriviaQuestion] as string}
                  </p>
                </div>
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
              {/* Header with question - same style as work phase */}
              <div className="flex items-start gap-2">
                <span className="text-2xl flex-shrink-0">🏳️‍🌈</span>
                <h2 className="text-xl font-bold text-black font-sans leading-relaxed">
                  Pride Trivia: {currentQuestion.question}
                </h2>
              </div>
              
              {/* Correct Answer - with letter circle like work phase */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-black flex items-center justify-center flex-shrink-0 bg-green-500">
                  <span className="text-4xl font-bold text-white font-sans">
                    {currentQuestion.answer.toUpperCase()}
                  </span>
                </div>
                <div className="bg-green-500 rounded-xl p-4 border-2 border-black flex-1 min-h-[80px] flex items-center">
                  <p className="text-xl font-bold text-white font-sans leading-relaxed">
                    {currentQuestion[currentQuestion.answer as keyof TriviaQuestion] as string}
                  </p>
                </div>
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
