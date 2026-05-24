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
const BOX_HIDDEN_DURATION = 4 * 60 * 1000 // 4 minutes hidden (5 min total cycle)

// Cooldown for !trivia chat messages
const CHAT_COOLDOWN = 60 * 1000 // 60 seconds cooldown

// How long each answer option slide shows
const OPTION_SLIDE_DURATION = 10 * 1000 // 10 seconds per option

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
  const [previousQuestion, setPreviousQuestion] = useState<TriviaQuestion | null>(null)
  const [guesses, setGuesses] = useState<Map<string, string>>(new Map()) // username -> answer
  const [correctGuessers, setCorrectGuessers] = useState<string[]>([])
  const [recentGuessNotification, setRecentGuessNotification] = useState<{ username: string; answer: string } | null>(null)
  const [triviaScores, setTriviaScores] = useState<Map<string, number>>(new Map()) // cumulative scores
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [allTimeScores, setAllTimeScores] = useState<{ username: string; score: number }[]>([])
  const leaderboardCooldownRef = useRef<number>(0)
  const LEADERBOARD_COOLDOWN = 60000 // 1 minute cooldown
  
  // Front page mode - curated accessible questions for new audiences
  const [frontPageMode, setFrontPageMode] = useState(false)
  const FRONT_PAGE_ACCESSIBLE_IDS = [1, 5, 11, 26, 27, 29, 32, 35, 39, 41, 51, 52, 53, 54, 63, 64]
  const FRONT_PAGE_DEEP_CUT_IDS = [12, 55, 57, 59, 60, 65, 66]
  
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const prevPhaseRef = useRef<"work" | "break" | null>(null)
  const hasCompletedFirstCycleRef = useRef(false) // Track if we've completed at least one full cycle
  
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
    
    if (frontPageMode) {
      // 3:1 ratio - 3 accessible questions, then 1 deep cut
      const accessibleQs = questions.filter(q => FRONT_PAGE_ACCESSIBLE_IDS.includes(q.id))
      const deepCutQs = questions.filter(q => FRONT_PAGE_DEEP_CUT_IDS.includes(q.id))
      
      // Shuffle both pools
      const shuffledAccessible = shuffleArray(accessibleQs)
      const shuffledDeepCuts = shuffleArray(deepCutQs)
      
      // Build 3:1 pattern
      const frontPageQuestions: TriviaQuestion[] = []
      let accessibleIndex = 0
      let deepCutIndex = 0
      
      while (accessibleIndex < shuffledAccessible.length || deepCutIndex < shuffledDeepCuts.length) {
        // Add 3 accessible
        for (let i = 0; i < 3 && accessibleIndex < shuffledAccessible.length; i++) {
          frontPageQuestions.push(shuffledAccessible[accessibleIndex++])
        }
        // Add 1 deep cut
        if (deepCutIndex < shuffledDeepCuts.length) {
          frontPageQuestions.push(shuffledDeepCuts[deepCutIndex++])
        }
      }
      
      setShuffledQuestions(frontPageQuestions)
    } else {
      setShuffledQuestions(shuffleArray(questions))
    }
    setCurrentQuestionIndex(0)
  }, [shuffleArray, frontPageMode])

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
          setCurrentSlide(prev => (prev + 1) % 8) // 0-7 cycle (A, B, C, D twice)
          setIsSlideTransitioning(false)
        }, 500) // 500ms for fade out
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
          sendChatMessage(`a) ${currentQuestion.a} | b) ${currentQuestion.b} | c) ${currentQuestion.c} | d) ${currentQuestion.d} — Type !a !b !c or !d to guess! Answer revealed at 5 min break!`)
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

  // Handle !nextq command to skip to next question
  useEffect(() => {
    const handleNextQuestion = () => {
      // Save current question as previous before advancing
      if (currentQuestion) {
        setPreviousQuestion(currentQuestion)
      }
      // Advance to next question
      setCurrentQuestionIndex(prev => {
        const next = prev + 1
        if (next >= shuffledQuestions.length) {
          // Reshuffle and start from beginning
          setShuffledQuestions(shuffleArray(triviaData.questions))
          return 0
        }
        return next
      })
      // Reset guesses and slide
      setGuesses(new Map())
      setCurrentSlide(0)
    }
    
  window.addEventListener("nextTriviaQuestion", handleNextQuestion)
  return () => window.removeEventListener("nextTriviaQuestion", handleNextQuestion)
  }, [shuffledQuestions.length, shuffleArray, currentQuestion])
  
  // Handle !frontpage command to toggle front page mode
  const [frontPageNotification, setFrontPageNotification] = useState<string | null>(null)
  
  useEffect(() => {
    const handleFrontPageToggle = () => {
      setFrontPageMode(prev => {
        const newMode = !prev
        console.log(`[v0] Front page mode: ${newMode ? "ON" : "OFF"}`)
        
        // Show notification
        setFrontPageNotification(newMode ? "FRONT PAGE MODE: ON" : "FRONT PAGE MODE: OFF")
        setTimeout(() => setFrontPageNotification(null), 5000)
        
        // Send chat message
        sendChatMessage(newMode 
          ? "FRONT PAGE MODE ON - Curated questions for new audiences (3 accessible : 1 deep cut)"
          : "FRONT PAGE MODE OFF - All questions enabled"
        )
        
        return newMode
      })
    }
    
    window.addEventListener("toggleFrontPageMode", handleFrontPageToggle)
    return () => window.removeEventListener("toggleFrontPageMode", handleFrontPageToggle)
  }, [])

  // Handle !answer command to show previous question's answer
  useEffect(() => {
    const handleShowAnswer = () => {
      if (previousQuestion) {
        const correctLetter = previousQuestion.answer.toLowerCase()
        const correctText = previousQuestion[previousQuestion.answer as keyof TriviaQuestion] as string
        sendChatMessage(`PREVIOUS QUESTION: ${previousQuestion.question}`)
        setTimeout(() => {
          sendChatMessage(`ANSWER: ${correctLetter}) ${correctText}`)
        }, 1000)
      } else {
        sendChatMessage(`No previous question yet!`)
      }
    }
    
    window.addEventListener("showPreviousAnswer", handleShowAnswer)
    return () => window.removeEventListener("showPreviousAnswer", handleShowAnswer)
  }, [previousQuestion])

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
    setTimeout(() => setRecentGuessNotification(null), 5000)
  }, [phase])

  // Listen for guess events
  useEffect(() => {
    window.addEventListener("triviaGuess", handleGuess as EventListener)
    return () => window.removeEventListener("triviaGuess", handleGuess as EventListener)
  }, [handleGuess])

  // Listen for leaderboard request (with flip animation)
  useEffect(() => {
    const handleLeaderboardRequest = () => {
      const now = Date.now()
      if (now - leaderboardCooldownRef.current < LEADERBOARD_COOLDOWN) {
        console.log("[v0] Leaderboard on cooldown")
        return
      }
      leaderboardCooldownRef.current = now
      
      // Fetch all-time scores
      fetch("/api/trivia-scores")
        .then(res => res.json())
        .then(data => {
          if (data.scores) {
            setAllTimeScores(data.scores)
          }
        })
        .catch(err => console.error("[v0] Error fetching all-time scores:", err))
      
      setShowLeaderboard(true)
      
      // Hide after 30 seconds
      setTimeout(() => {
        setShowLeaderboard(false)
      }, 30000)
    }
    
    window.addEventListener("requestTriviaLeaderboard", handleLeaderboardRequest)
    return () => window.removeEventListener("requestTriviaLeaderboard", handleLeaderboardRequest)
  }, [triviaScores])

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
      hasCompletedFirstCycleRef.current = false // Reset on hide
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
              
              // Save current question as previous before advancing
              setPreviousQuestion(currentQuestion)
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
            // Only send if we've completed at least one cycle (not on initial startup)
            if (hasCompletedFirstCycleRef.current) {
              const nextIndex = (currentQuestionIndex + 1) >= shuffledQuestions.length ? 0 : (currentQuestionIndex + 1)
              const nextQuestion = shuffledQuestions[nextIndex]
              if (nextQuestion) {
                sendChatMessage(`PRIDE TRIVIA: ${nextQuestion.question}`)
                setTimeout(() => {
                  sendChatMessage(`a) ${nextQuestion.a} | b) ${nextQuestion.b} | c) ${nextQuestion.c} | d) ${nextQuestion.d} — Type !a !b !c or !d to guess! Answer revealed at 5 min break!`)
                }, 1500)
              }
            }
          } else {
            // Break started - reveal answer
            window.dispatchEvent(new CustomEvent("breakStart", { detail: { cycle: s.cycle } }))
            
            // Mark that we've completed at least one cycle (break means work phase completed)
            hasCompletedFirstCycleRef.current = true
            
            // Calculate correct guessers and send chat messages only if we have guesses
            if (currentQuestion && guesses.size > 0) {
              const correctAnswer = currentQuestion.answer.toLowerCase()
              const winners: string[] = []
              guesses.forEach((answer, username) => {
                if (answer === correctAnswer) {
                  winners.push(username)
                }
              })
              setCorrectGuessers(winners)
              
              // Update cumulative scores
              if (winners.length > 0) {
                setTriviaScores(prev => {
                  const newScores = new Map(prev)
                  winners.forEach(username => {
                    newScores.set(username, (newScores.get(username) || 0) + 1)
                  })
                  return newScores
                })
                
                // Save to database for all-time scores
                fetch("/api/trivia-scores", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ winners })
                }).catch(err => console.error("[v0] Error saving trivia scores:", err))
              }
              
              const correctLetter = correctAnswer.toLowerCase()
              const correctText = currentQuestion[correctAnswer as keyof TriviaQuestion] as string
              
              // Post question first
              sendChatMessage(`QUESTION: ${currentQuestion.question}`)
              
              // Post answer after a delay
              setTimeout(() => {
                sendChatMessage(`ANSWER: ${correctLetter}) ${correctText}`)
              }, 1500)
              
              // Post context after another delay
              setTimeout(() => {
                sendChatMessage(`FUN FACT: ${currentQuestion.context}`)
              }, 3000)
              
              // Post winners after final delay
              setTimeout(() => {
                if (winners.length > 0) {
                  const winnerList = winners.length <= 5 
                    ? winners.map(w => `@${w}`).join(", ")
                    : `${winners.slice(0, 5).map(w => `@${w}`).join(", ")} and ${winners.length - 5} more`
                  sendChatMessage(`WINNERS: Congrats ${winnerList}!`)
                } else {
                  sendChatMessage(`No one got it this time! Better luck next question!`)
                }
              }, 4500)
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
            animation: "fadeInOut 5s ease-in-out forwards",
          }}
        >
          <div
            className="px-8 py-4 rounded-full text-black font-black text-2xl font-sans uppercase"
            style={{ backgroundColor: "#ffb8ad" }}
          >
            @{recentGuessNotification.username} guessed {recentGuessNotification.answer}
          </div>
        </div>
      )}
      
      {/* Front page mode notification */}
      {frontPageNotification && (
        <div
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
          style={{
            animation: "fadeInOut 5s ease-in-out forwards",
          }}
        >
          <div
            className="px-8 py-4 rounded-full text-white font-black text-2xl font-sans uppercase"
            style={{ 
              background: "linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)",
            }}
          >
            {frontPageNotification}
          </div>
        </div>
      )}
      
      {/* Main trivia box - fades in/out during work phase */}
      <div className="absolute left-8 top-[calc(50%-240px)]" style={{ width: "600px" }}>
        {/* Question box - fades in/out */}
        <div
            className="rounded-3xl shadow-2xl border-2 border-black overflow-hidden transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, #ffe5e5 0%, #ffe5e5 15%, #fff5e5 25%, #fffde5 35%, #f0ffe5 45%, #e5f5ff 55%, #e5e5ff 70%, #f0e5ff 85%, #ffe5f5 100%)",
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
                <span className="text-3xl flex-shrink-0">🏳️‍🌈</span>
                <h2 className="text-2xl font-black text-black font-sans leading-relaxed uppercase">
                  Pride Trivia: {currentQuestion.question}
                </h2>
              </div>
              
              {/* Main content area with large letter indicator on left */}
              <div className="flex items-center gap-4">
                {/* Large letter indicator */}
                <div 
                  className={`w-20 h-20 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 bg-white transition-opacity duration-500 ${isSlideTransitioning ? 'opacity-0' : 'opacity-100'}`}
                >
                  <span className="text-4xl font-black text-black font-sans">
                    {["A", "B", "C", "D"][currentSlide % 4]}
                  </span>
                </div>
                
                {/* Text content - just the answer option with fade transition */}
                <div className="bg-white rounded-xl p-4 border-2 border-black flex-1 min-h-[80px] flex items-center">
                  <p className={`text-2xl font-black text-black font-sans leading-relaxed uppercase transition-all duration-500 ${isSlideTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                    {currentQuestion[["a", "b", "c", "d"][currentSlide % 4] as keyof TriviaQuestion] as string}
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between text-black">
                <div className="text-2xl font-black font-sans uppercase">
                  {guessCount} {guessCount === 1 ? "person has" : "people have"} guessed
                </div>
                <div className="text-2xl font-black font-sans uppercase">
                  Type !a !b !c or !d
                </div>
              </div>
            </div>
          ) : timeLeft <= 60 ? (
            /* BREAK PHASE - Last minute: Get ready message */
            <div className="flex flex-col items-center justify-center gap-6 py-12">
              <span className="text-6xl">🏳️‍🌈</span>
              <h2 className="text-4xl font-black text-black font-sans text-center uppercase">
                Get ready for the next question!
              </h2>
              <p className="text-2xl text-black font-sans uppercase">
                Work cycle starting soon...
              </p>
            </div>
          ) : (
            /* BREAK PHASE - Show answer and context */
            <div className="flex flex-col gap-4">
              {/* Header with question - same style as work phase */}
              <div className="flex items-start gap-2">
                <span className="text-3xl flex-shrink-0">🏳️‍🌈</span>
                <h2 className="text-2xl font-black text-black font-sans leading-relaxed uppercase">
                  Pride Trivia: {currentQuestion.question}
                </h2>
              </div>
              
              {/* Correct Answer - with letter circle like work phase */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#c8f7dc" }}
                >
                  <span className="text-4xl font-black text-black font-sans">
                    {currentQuestion.answer.toUpperCase()}
                  </span>
                </div>
                <div 
                  className="rounded-xl p-4 border-2 border-black flex-1 min-h-[80px] flex items-center"
                  style={{ backgroundColor: "#c8f7dc" }}
                >
                  <p className="text-2xl font-black text-black font-sans leading-relaxed uppercase">
                    {currentQuestion[currentQuestion.answer as keyof TriviaQuestion] as string}
                  </p>
                </div>
              </div>
              
              {/* Context */}
              <div className="bg-white rounded-xl p-4 border-2 border-black">
                <p className="text-xl text-black font-sans leading-relaxed uppercase">
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
      
      {/* Circular Progress Timer - Right Side with Flip Animation */}
      <div className="absolute right-8 top-[calc(50%-240px)]" style={{ perspective: "1000px" }}>
        <div 
          className="relative transition-transform duration-700 ease-in-out"
          style={{ 
            transformStyle: "preserve-3d",
            transform: showLeaderboard ? "rotateY(180deg)" : "rotateY(0deg)",
            width: "320px",
            height: "480px"
          }}
        >
          {/* Front - Timer */}
          <div 
            className="absolute w-full h-full"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex flex-col items-center justify-center gap-4 h-full">
          <div className="relative w-72 h-72">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background ring */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="12"
              />
              {/* Progress ring with flowing gradient animation */}
              <defs>
                <linearGradient id="prideGradient" x1="-100%" y1="0%" x2="100%" y2="0%" spreadMethod="repeat">
                  {phase === "work" ? (
                    <>
                      <stop offset="0%" stopColor="#e040fb" />
                      <stop offset="25%" stopColor="#ffa5c5" />
                      <stop offset="50%" stopColor="#e040fb" />
                      <stop offset="75%" stopColor="#ffa5c5" />
                      <stop offset="100%" stopColor="#e040fb" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#42a5f5" />
                      <stop offset="25%" stopColor="#6ee4f2" />
                      <stop offset="50%" stopColor="#42a5f5" />
                      <stop offset="75%" stopColor="#6ee4f2" />
                      <stop offset="100%" stopColor="#42a5f5" />
                    </>
                  )}
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    from="0 0"
                    to="1 0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="url(#prideGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 85}
                strokeDashoffset={2 * Math.PI * 85 * (1 - progressPercent / 100)}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div 
                className="text-5xl font-black text-white font-sans"
                style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div 
                className="text-xl font-bold text-white font-sans uppercase mt-1"
                style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
              >
                {phase === "work" ? "WORK TIME" : "BREAK"}
              </div>
            </div>
          </div>
          {/* Subtitle below ring */}
          <div 
            className="text-2xl text-white font-sans uppercase text-center font-black"
            style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
          >
            Type !trivia to view question
          </div>
          <div 
            className="text-2xl text-white font-sans uppercase text-center font-black"
            style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
          >
            Type !a !b !c !d to guess
          </div>
            </div>
          </div>
          
          {/* Back - Leaderboard */}
          <div 
            className="absolute w-full h-full"
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            <div 
              className="rounded-3xl p-6 border-2 border-black h-full"
              style={{
                background: "linear-gradient(135deg, rgba(255,229,229,0.95) 0%, rgba(255,245,229,0.95) 25%, rgba(240,255,229,0.95) 50%, rgba(229,245,255,0.95) 75%, rgba(240,229,255,0.95) 100%)",
              }}
            >
              <div className="text-center mb-4">
                <h2 className="text-2xl font-black text-black font-sans uppercase tracking-wider">TRIVIA LEADERS</h2>
              </div>
              
              {/* This Stream */}
              <div className="mb-6">
                <div className="text-lg font-black text-black/70 font-sans uppercase mb-3">This Stream</div>
                <div className="space-y-2">
                  {Array.from(triviaScores.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([username, score], index) => (
                      <div key={username} className="flex items-center justify-between text-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-black font-sans">
                            {index === 0 ? "1." : index === 1 ? "2." : index === 2 ? "3." : `${index + 1}.`}
                          </span>
                          <span className="font-black text-black font-sans uppercase truncate max-w-[160px]">{username}</span>
                        </div>
                        <span className="font-black text-black font-sans">{score}</span>
                      </div>
                    ))}
                  {triviaScores.size === 0 && (
                    <div className="text-center text-xl font-black text-black/50 font-sans">No scores yet</div>
                  )}
                </div>
              </div>
              
              {/* All Time */}
              <div>
                <div className="text-lg font-black text-black/70 font-sans uppercase mb-3">All Time</div>
                <div className="space-y-2">
                  {allTimeScores.slice(0, 5).map((user, index) => (
                    <div key={user.username} className="flex items-center justify-between text-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-black font-sans">
                          {index === 0 ? "1." : index === 1 ? "2." : index === 2 ? "3." : `${index + 1}.`}
                        </span>
                        <span className="font-black text-black font-sans uppercase truncate max-w-[160px]">{user.username}</span>
                      </div>
                      <span className="font-black text-black font-sans">{user.score}</span>
                    </div>
                  ))}
                  {allTimeScores.length === 0 && (
                    <div className="text-center text-xl font-black text-black/50 font-sans">No scores yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        
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
