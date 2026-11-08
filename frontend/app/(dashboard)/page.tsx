"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Link as LinkIcon,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Server,
  Layers,
  ExternalLink,
  Lock,
  RefreshCw,
  ArrowRight,
  HardDrive,
  Cpu,
  KeyRound,
  FileCheck
} from "lucide-react";
import { api, AnalyzeResult } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

interface PartnerStatus {
  id: string;
  name: string;
  iconText: string;
  badgeColor: string;
  active: boolean;
  quotaRemaining: string;
}

const PARTNER_PROVIDERS: PartnerStatus[] = [
  { id: "magnific", name: "Magnific AI", iconText: "MAG", badgeColor: "from-pink-500 to-rose-600", active: true, quotaRemaining: "3,580 / 5,000" },
  { id: "motionarray", name: "Motion Array", iconText: "MA", badgeColor: "from-amber-500 to-orange-600", active: true, quotaRemaining: "20,880 / 25,000" },
  { id: "envato", name: "Envato Elements", iconText: "ENV", badgeColor: "from-emerald-500 to-teal-600", active: true, quotaRemaining: "12,570 / 15,000" },
  { id: "freepik", name: "Freepik Enterprise", iconText: "FPK", badgeColor: "from-blue-500 to-indigo-600", active: true, quotaRemaining: "43,880 / 50,000" },
  { id: "storyblocks", name: "Storyblocks", iconText: "SB", badgeColor: "from-purple-500 to-violet-600", active: true, quotaRemaining: "16,900 / 20,000" },
  { id: "artgrid", name: "Artgrid Cinema", iconText: "AG", badgeColor: "from-yellow-500 to-amber-600", active: true, quotaRemaining: "8,160 / 10,000" }
];

export default function DashboardPage() {
  const [targetUrl, setTargetUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Streaming & Progress State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [speedMbps, setSpeedMbps] = useState(0);
  const [activeConnections, setActiveConnections] = useState(16);

  // Partner connect modal state
  const [selectedPartnerForConnect, setSelectedPartnerForConnect] = useState<PartnerStatus | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  // Handle URL analyze
  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim()) return;

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setStreamProgress(0);

    try {
      const res = await api.analyzeUrl(targetUrl.trim());
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze URL. Ensure it matches authorized partner domains.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Trigger high-speed direct stream
  const handleStartStream = () => {
    if (!targetUrl) return;
    setIsStreaming(true);
    setStreamProgress(5);
    setSpeedMbps(42.8);

    // Simulate connection thread updates & trigger native browser stream
    const streamUrl = api.getStreamUrl(targetUrl);

    const interval = setInterval(() => {
      setStreamProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsStreaming(false);
          setSpeedMbps(0);
          return 100;
        }
        const delta = Math.floor(Math.random() * 18) + 12;
        setSpeedMbps(parseFloat((38 + Math.random() * 15).toFixed(1)));
        return Math.min(prev + delta, 100);
      });
    }, 400);

    // Prompt browser file download stream
    window.location.href = streamUrl;
  };

  // Connect partner credentials
  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerForConnect || !apiKeyInput.trim()) return;
    setConnecting(true);
    setConnectMessage(null);
    try {
      await api.connectPartnerAccount(
        selectedPartnerForConnect.id,
        `${selectedPartnerForConnect.name} Account`,
        apiKeyInput.trim()
      );
      setConnectMessage(`Successfully encrypted and saved AES-256 credentials for ${selectedPartnerForConnect.name}!`);
      setTimeout(() => {
        setSelectedPartnerForConnect(null);
        setApiKeyInput("");
        setConnectMessage(null);
      }, 1500);
    } catch (err: any) {
      setConnectMessage("Error saving credentials: " + err.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Enterprise Partner Accounts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Active Authorized Partner Integrations (AES-256 Secured)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            6 Official APIs Connected • Click to update token
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PARTNER_PROVIDERS.map((partner) => (
            <div
              key={partner.id}
              onClick={() => setSelectedPartnerForConnect(partner)}
              className="glass-panel p-3 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/80 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r ${partner.badgeColor} text-white shadow-sm`}>
                  {partner.iconText}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
              </div>
              <h3 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition truncate">
                {partner.name}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Quota: <span className="text-emerald-400 font-mono">{partner.quotaRemaining}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Download Card */}
      <section className="glass-panel rounded-2xl border border-slate-800 p-6 sm:p-8 glow-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Zap className="h-48 w-48 text-blue-500" />
        </div>

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
            <Zap className="h-3.5 w-3.5" />
            16-Connection Parallel Multi-Stream Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Commercial Asset Download Gateway
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Paste any authorized design, template, 8K upscale, or footage link from Magnific, Motion Array, Envato, Freepik, Storyblocks, or Artgrid. We verify partner compliance and deliver via zero-wait multi-connection streaming.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <LinkIcon className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Paste item URL (e.g., https://elements.envato.com/cyber-title-pack-ABC123)..."
              required
              className="w-full pl-10 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={analyzing || !targetUrl.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing via API...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Inspect & Fetch
              </>
            )}
          </button>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 text-sm text-red-300">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Validation or Upstream Error</p>
              <p className="text-xs text-red-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </section>

      {/* Analysis Result Card */}
      {analysis && (
        <section className="glass-panel rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6 glow-emerald animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center border-b border-slate-800 pb-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified SLA Clearance
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono">
                  {analysis.partner_name}
                </span>
                {analysis.cached && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-mono">
                    Redis Cached (10m TTL)
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {analysis.metadata.title}
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                {analysis.metadata.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={handleStartStream}
                disabled={isStreaming}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isStreaming ? "Streaming..." : "Download (16x Stream)"}
              </button>
            </div>
          </div>

          {/* Metadata Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] text-slate-400">File Size</p>
              <p className="text-sm font-bold text-slate-200 mt-1 font-mono">
                {formatBytes(analysis.metadata.file_size_bytes)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] text-slate-400">Format / Extension</p>
              <p className="text-sm font-bold text-slate-200 mt-1 uppercase font-mono">
                {analysis.metadata.format} ({analysis.metadata.file_type})
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] text-slate-400">Agreement Reference</p>
              <p className="text-sm font-bold text-blue-400 mt-1 font-mono truncate">
                {analysis.metadata.agreement_reference}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[11px] text-slate-400">Partner Quota Balance</p>
              <p className="text-sm font-bold text-emerald-400 mt-1 font-mono">
                {analysis.quota.remaining_quota.toLocaleString()} remaining
              </p>
            </div>
          </div>

          {/* 16-Connection Parallel Visualizer */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Parallel Streaming Pipeline (16 Concurrent Async HTTP/2 Connections)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">Speed:</span>
                <span className="text-cyan-400 font-bold">{speedMbps} MB/s</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Progress:</span>
                <span className="text-emerald-400 font-bold">{streamProgress}%</span>
              </div>
            </div>

            {/* 16 Connection Thread Blocks */}
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
              {Array.from({ length: 16 }).map((_, idx) => {
                const isActive = isStreaming && streamProgress > 0 && streamProgress < 100;
                return (
                  <div
                    key={idx}
                    className={`h-7 rounded flex flex-col items-center justify-center border transition-all ${
                      isActive
                        ? "bg-blue-600/30 border-blue-400 animate-pulse text-cyan-300"
                        : streamProgress === 100
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-600"
                    }`}
                  >
                    <span className="text-[9px] font-mono font-bold">T{idx + 1}</span>
                  </div>
                );
              })}
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${streamProgress}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Connect Account Modal / Dialog */}
      {selectedPartnerForConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${selectedPartnerForConnect.badgeColor} flex items-center justify-center text-xs font-bold text-white`}>
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Link {selectedPartnerForConnect.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official API Token / OAuth2 Secret
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartnerForConnect(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/50 text-xs text-blue-300 flex items-start gap-2">
                <Lock className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  All tokens are encrypted immediately with <strong>AES-256-GCM</strong> using an isolated hardware-grade master key. Plaintext secrets are never stored at rest.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Partner API Key or OAuth Bearer Token
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Enter your verified ${selectedPartnerForConnect.name} secret...`}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {connectMessage && (
                <p className="text-xs text-emerald-400 font-medium">
                  {connectMessage}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPartnerForConnect(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting || !apiKeyInput.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition disabled:opacity-50"
                >
                  {connecting ? "Encrypting & Saving..." : "Encrypt & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
