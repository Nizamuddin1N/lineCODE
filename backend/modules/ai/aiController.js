import axios from "axios"

/*
  Prompts defined outside the function — they never change
  so no reason to recreate them on every request.
*/
const prompts = {
  improve: (language) =>
    `Improve this ${language} code. Make it cleaner, more efficient, and follow best practices. Return only the improved code with a brief comment explaining the key changes.`,
  explain: (language) =>
    `Explain what this ${language} code does in simple terms. Be concise — max 5 bullet points.`,
  fix: (language) =>
    `Find and fix any bugs or issues in this ${language} code. Return the fixed code with comments marking what you changed and why.`,
  complete: (language) =>
    `Complete this unfinished ${language} code. Return the full completed version.`,
}

/*
  Free models in priority order.
  If one is rate limited, automatically try the next.
*/
const FREE_MODELS = [
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "microsoft/phi-4-reasoning-plus:free",
  "deepseek/deepseek-v3-base:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
]

export const getSuggestion = async (req, res) => {
  const { code, language, type, fullContent } = req.body

  if (!code && !fullContent)
    return res.status(400).json({ error: "No code provided" })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: "AI service not configured. Add OPENROUTER_API_KEY to backend/.env"
    })
  }

  const promptFn = prompts[type] || prompts.improve
  const prompt = promptFn(language || "javascript")
  const codeToAnalyze = code?.trim() || fullContent?.slice(0, 3000)

  let lastError = null

  for (const model of FREE_MODELS) {
    try {
      console.log(`Trying model: ${model}`)

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: [
            {
              role: "user",
              content: `${prompt}\n\n\`\`\`${language}\n${codeToAnalyze}\n\`\`\``,
            },
          ],
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "lineCODE",
          },
        }
      )

      const suggestion = response.data.choices[0].message.content
      console.log(`Success with model: ${model}`)
      return res.json({ suggestion })

    } catch (err) {
      const status = err.response?.data?.error?.code
      console.log(`Model ${model} failed with ${status} — trying next`)
      lastError = err

      if (status !== 429 && status !== 404) break
    }
  }

  console.error("All models failed:", lastError?.response?.data || lastError?.message)
  res.status(500).json({
    error: "All AI models are currently rate limited. Try again in a minute.",
  })
}