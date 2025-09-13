export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-4">HCK Bookmarklet API</h1>
          <p className="text-gray-300 mb-6">
            API endpoint for the HCK Prova Paulista bookmarklet with OpenRouter integration
          </p>

          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <code className="text-green-400 text-sm">POST /api/chat</code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">✨ Features</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Multiple AI models</li>
                <li>• Image vision support</li>
                <li>• CORS enabled</li>
                <li>• Error handling</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">🤖 Models</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Gemini 1.5 Flash</li>
                <li>• Llama 3.3 70B</li>
                <li>• DeepSeek Reasoner</li>
                <li>• DeepSeek Chat</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Note:</strong> This API is designed specifically for the HCK bookmarklet. Update your
              bookmarklet's API_ENDPOINT to use this deployment URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
