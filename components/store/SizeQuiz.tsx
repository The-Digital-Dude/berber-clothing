"use client"
import { useState } from "react"

type Question = { label: string; options: string[] }

const QUESTIONS: Question[] = [
  { label: "What is your height?", options: ["Under 155cm", "155–165cm", "165–175cm", "175–185cm", "Over 185cm"] },
  { label: "What is your weight?", options: ["Under 50kg", "50–60kg", "60–70kg", "70–80kg", "80–90kg", "Over 90kg"] },
  { label: "How do you prefer your fit?", options: ["Slim / Fitted", "Regular", "Relaxed / Oversized"] },
]

const SIZE_MAP: Record<string, string> = {
  "Under 155cm-Under 50kg-Slim / Fitted": "XS",
  "155–165cm-50–60kg-Slim / Fitted": "S",
  "155–165cm-50–60kg-Regular": "M",
  "165–175cm-60–70kg-Regular": "M",
  "165–175cm-70–80kg-Regular": "L",
  "175–185cm-70–80kg-Regular": "L",
  "175–185cm-80–90kg-Regular": "XL",
  "Over 185cm-Over 90kg-Regular": "2XL",
}

function getRecommendation(answers: string[]): string {
  const key = answers.join("-")
  if (SIZE_MAP[key]) return SIZE_MAP[key]
  const heightIdx = ["Under 155cm", "155–165cm", "165–175cm", "175–185cm", "Over 185cm"].indexOf(answers[0])
  const weightIdx = ["Under 50kg", "50–60kg", "60–70kg", "70–80kg", "80–90kg", "Over 90kg"].indexOf(answers[1])
  const score = heightIdx + weightIdx
  const base = ["XS", "S", "M", "L", "XL", "2XL"][Math.min(Math.max(Math.round(score / 2), 0), 5)]
  if (answers[2] === "Relaxed / Oversized") {
    const sizes = ["XS", "S", "M", "L", "XL", "2XL"]
    return sizes[Math.min(sizes.indexOf(base) + 1, sizes.length - 1)]
  }
  if (answers[2] === "Slim / Fitted") {
    const sizes = ["XS", "S", "M", "L", "XL", "2XL"]
    return sizes[Math.max(sizes.indexOf(base) - 1, 0)]
  }
  return base
}

export default function SizeQuiz({ onSelect }: { onSelect?: (size: string) => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<string | null>(null)

  const handleAnswer = (option: string) => {
    const next = [...answers, option]
    if (step + 1 < QUESTIONS.length) {
      setAnswers(next)
      setStep(step + 1)
    } else {
      setResult(getRecommendation(next))
    }
  }

  const reset = () => { setStep(0); setAnswers([]); setResult(null) }

  return (
    <>
      <button onClick={() => { setOpen(true); reset() }} className="text-sm underline text-gray-500 hover:text-black">
        Not sure of your size? Take the quiz
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Size Finder</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {result ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">We recommend</p>
                <p className="text-5xl font-bold mb-4">{result}</p>
                <p className="text-sm text-gray-400 mb-6">Based on your answers. Sizes vary by style — check the size chart too.</p>
                <div className="flex gap-3">
                  {onSelect && (
                    <button
                      onClick={() => { onSelect(result); setOpen(false) }}
                      className="flex-1 py-2 bg-black text-white rounded-lg text-sm font-medium"
                    >
                      Select {result}
                    </button>
                  )}
                  <button onClick={reset} className="flex-1 py-2 border rounded-lg text-sm">Retake</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-1">Question {step + 1} of {QUESTIONS.length}</p>
                <div className="w-full h-1 bg-gray-100 rounded mb-4">
                  <div className="h-1 bg-black rounded" style={{ width: `${((step) / QUESTIONS.length) * 100}%` }} />
                </div>
                <p className="font-medium mb-4">{QUESTIONS[step].label}</p>
                <div className="space-y-2">
                  {QUESTIONS[step].options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className="w-full text-left px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-sm transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
