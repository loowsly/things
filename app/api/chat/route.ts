import { type NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

// Model mapping for OpenRouter
const MODEL_MAPPING: Record<string, string> = {
  "gemini-1.5-flash": "google/gemini-flash-1.5",
  "meta-llama/Llama-3.3-70B-Instruct-Turbo": "meta-llama/llama-3.3-70b-instruct",
  "deepseek-reasoner": "deepseek/deepseek-r1",
  "deepseek-chat": "deepseek/deepseek-chat",
}

interface Message {
  role: "user" | "assistant" | "system"
  content:
    | string
    | Array<{
        type: "text" | "image_url"
        text?: string
        image_url?: {
          url: string
        }
      }>
}

interface ChatRequest {
  messages: Message[]
  modelId: string
}

// Helper function to detect if content contains images
function hasImageContent(messages: Message[]): boolean {
  return messages.some((msg) => Array.isArray(msg.content) && msg.content.some((item) => item.type === "image_url"))
}

// Helper function to extract images from content
function extractImages(content: string): string[] {
  const imageRegex = /\[IMAGEM\]:\s*(https?:\/\/[^\s]+)/gi
  const matches = []
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    matches.push(match[1])
  }

  return matches
}

// Helper function to format content for vision models
function formatContentForVision(
  content: string,
): Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> {
  const images = extractImages(content)
  const textContent = content.replace(/\[IMAGEM\]:\s*https?:\/\/[^\s]+/gi, "").trim()

  const formattedContent: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = []

  if (textContent) {
    formattedContent.push({
      type: "text",
      text: textContent,
    })
  }

  images.forEach((imageUrl) => {
    formattedContent.push({
      type: "image_url",
      image_url: {
        url: imageUrl,
      },
    })
  })

  return formattedContent
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, modelId } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required and cannot be empty" }, { status: 400 })
    }

    // Map the model ID to OpenRouter format
    const openRouterModel = MODEL_MAPPING[modelId] || modelId

    // Check if we need to handle images
    const userMessage = messages[messages.length - 1]
    const hasImages = typeof userMessage.content === "string" && userMessage.content.includes("[IMAGEM]:")

    // Prepare the messages for OpenRouter
    let formattedMessages = messages

    if (hasImages && typeof userMessage.content === "string") {
      // Format the last message for vision capabilities
      const visionContent = formatContentForVision(userMessage.content)

      formattedMessages = [
        ...messages.slice(0, -1),
        {
          ...userMessage,
          content: visionContent,
        },
      ]
    }

    // Add system prompt for question answering
    const systemPrompt = `Você é um assistente especializado em resolver questões de múltipla escolha. 

INSTRUÇÕES IMPORTANTES:
1. Analise cuidadosamente o enunciado e as alternativas fornecidas
2. Para questões com imagens, descreva brevemente o que vê na imagem antes de responder
3. Forneça uma resposta clara e direta
4. SEMPRE termine sua resposta com a letra da alternativa correta (A, B, C, D ou E) em uma linha separada
5. Use raciocínio lógico e conhecimento acadêmico para chegar à resposta

Formato da resposta:
[Sua explicação aqui]

Resposta: [LETRA]`

    const messagesWithSystem = [{ role: "system" as const, content: systemPrompt }, ...formattedMessages]

    // Make request to OpenRouter
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": request.headers.get("referer") || "https://your-domain.com",
        "X-Title": "HCK Bookmarklet",
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: messagesWithSystem,
        temperature: 0.1,
        max_tokens: 1000,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("OpenRouter API Error:", errorData)

      return NextResponse.json(
        {
          error: "Failed to get response from AI model",
          details: errorData.error?.message || `HTTP ${response.status}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json({ error: "Invalid response format from AI model" }, { status: 500 })
    }

    const aiResponse = data.choices[0].message.content
    const modelUsed = data.model || openRouterModel

    // Return response in the format expected by the bookmarklet
    return NextResponse.json({
      response: aiResponse,
      model: modelUsed,
      source: "openrouter_api",
      details: {
        modelOrigin: modelUsed,
        usage: data.usage,
      },
    })
  } catch (error) {
    console.error("API Error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, request-id, traceparent",
    },
  })
}
