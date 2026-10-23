"use client";

import { useState } from "react";
import { Terminal, Send, CheckCircle2, XCircle, Code, Copy, Check, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function DocsClient() {
  const [testRegNumber, setTestRegNumber] = useState("KURO-1001");
  const [consumeCredits, setConsumeCredits] = useState<number>(0);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleTestApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiResponse(null);
    setResponseStatus(null);
    setLatency(null);

    const start = performance.now();

    try {
      const payload: Record<string, unknown> = {
        registrationNumber: testRegNumber.trim(),
      };
      if (consumeCredits > 0) {
        payload.consumeCredits = consumeCredits;
        payload.reason = "Interactive Console Test";
      }

      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setResponseStatus(res.status);

      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      console.error(err);
      setApiResponse(JSON.stringify({ error: "Failed to connect to API" }, null, 2));
      setResponseStatus(0);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Terminal className="h-6 w-6 text-indigo-400" />
          EXE Client Integration & API Test Bench
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Interface your desktop EXE application with Kuro Manager using standard HTTPS + JSON.
        </p>
      </div>

      {/* Interactive API Test Bench */}
      <Card className="border-indigo-500/30 bg-[#121422]/90 glow-card">
        <CardHeader className="border-b border-zinc-800/80 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Live Authorization Test Bench
          </CardTitle>
          <p className="text-xs text-zinc-400">
            Simulate an authorization query or credit deduction directly against <code className="text-indigo-300 font-mono">POST /api/authorize</code>.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <form onSubmit={handleTestApi} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Registration Number
                </label>
                <Input
                  value={testRegNumber}
                  onChange={(e) => setTestRegNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KURO-1001"
                  required
                  className="font-mono text-sm tracking-wide text-white"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setTestRegNumber("KURO-1001")}
                    className="text-[11px] text-indigo-400 hover:underline font-mono cursor-pointer"
                  >
                    Use KURO-1001 (Active)
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={() => setTestRegNumber("KURO-2049")}
                    className="text-[11px] text-rose-400 hover:underline font-mono cursor-pointer"
                  >
                    Use KURO-2049 (Disabled)
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={() => setTestRegNumber("NON-EXISTENT")}
                    className="text-[11px] text-zinc-400 hover:underline font-mono cursor-pointer"
                  >
                    Non-existent
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Credits to Consume (0 = Check Only)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={consumeCredits}
                  onChange={(e) => setConsumeCredits(Math.max(0, parseInt(e.target.value) || 0))}
                  className="font-mono text-white text-sm"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  If set &gt; 0, the server atomically validates and decrements the client balance.
                </p>
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full gap-2 font-medium">
                <Send className="h-4 w-4" />
                Send Authorization Request
              </Button>
            </form>

            {/* Response Window */}
            <div className="flex flex-col rounded-xl border border-zinc-800 bg-[#0b0c13] p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-sans font-semibold">
                  API Response
                </span>
                {responseStatus !== null && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        responseStatus === 200
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      HTTP {responseStatus}
                    </span>
                    {latency !== null && (
                      <span className="text-[10px] text-zinc-500">{latency}ms</span>
                    )}
                  </div>
                )}
              </div>

              <pre className="flex-1 overflow-x-auto text-zinc-200 leading-relaxed">
                {apiResponse || "// Click 'Send Authorization Request' to test the endpoint"}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Protocol Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base text-white">Endpoint Specification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-zinc-300">
            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Method & URL:</span>
              <div className="bg-zinc-900 px-3 py-2 rounded-lg font-mono text-indigo-300 border border-zinc-800">
                POST /api/authorize
              </div>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Headers:</span>
              <div className="bg-zinc-900 p-2.5 rounded-lg font-mono text-zinc-300 border border-zinc-800 space-y-1">
                <div>Content-Type: application/json</div>
                <div className="text-zinc-400"># Optional: if KURO_CLIENT_API_KEY is set</div>
                <div className="text-zinc-400">x-kuro-api-key: your-client-api-key</div>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Request Body Schema:</span>
              <pre className="bg-zinc-900 p-2.5 rounded-lg font-mono text-zinc-300 border border-zinc-800">
{`{
  "registrationNumber": "KURO-1001",
  "consumeCredits": 0 // optional
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base text-white">Response Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-zinc-300">
            <div>
              <span className="text-emerald-400 font-semibold block mb-1">200 OK (Authorized):</span>
              <pre className="bg-zinc-900 p-2.5 rounded-lg font-mono text-emerald-300 border border-zinc-800">
{`{
  "authorized": true,
  "creditsRemaining": 42
}`}
              </pre>
            </div>

            <div>
              <span className="text-rose-400 font-semibold block mb-1">404 / 403 (Unauthorized / Disabled):</span>
              <pre className="bg-zinc-900 p-2.5 rounded-lg font-mono text-rose-300 border border-zinc-800">
{`{
  "authorized": false,
  "message": "Registration not found"
}
// Or if disabled:
{
  "authorized": false,
  "message": "Registration is disabled"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
