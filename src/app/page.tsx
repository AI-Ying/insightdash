export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Insight<span className="text-blue-400">Dash</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Open Source BI Analytics Dashboard
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/register"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 transition-colors"
          >
            Get Started
          </a>
          <a
            href="https://github.com/AI-Ying/insightdash"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-700 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
