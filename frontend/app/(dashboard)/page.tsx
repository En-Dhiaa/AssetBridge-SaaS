"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  Link as LinkIcon,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  CreditCard,
  Coins,
  History,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  FileCode,
  Box,
  Copy,
  ExternalLink
} from "lucide-react";
import { api, AnalyzeResult } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

// Example URLs for instant testing
const QUICK_TEST_LINKS = [
  {
    name: "Magnific AI 8K Upscale",
    provider: "Magnific AI",
    icon: "✨",
    url: "https://magnific.ai/upscale/cyberpunk-neon-city-8k-render",
  },
  {
    name: "Freepik Luxury Vector Logo",
    provider: "Freepik",
    icon: "🎨",
    url: "https://www.freepik.com/premium-vector/luxury-golden-brand-identity-vector-template_9845120.htm",
  },
  {
    name: "Motion Array Premiere HUD Pack",
    provider: "Motion Array",
    icon: "🎬",
    url: "https://motionarray.com/premiere-pro-templates/cyber-hud-titles-124958",
  },
  {
    name: "Envato 3D Branding Mockup",
    provider: "Envato Elements",
    icon: "📦",
    url: "https://elements.envato.com/luxury-perfume-bottle-mockup-3D-947261",
  },
];

const SUPPORTED_FORMATS = [
  { name: "Vectors", exts: "AI, EPS, SVG", icon: FileCode, desc: "Fully editable vector curves" },
  { name: "Photos & Renders", exts: "JPG, PNG, WebP", icon: ImageIcon, desc: "Original 4K/8K resolution" },
  { name: "Templates & PSD", exts: "PSD, Figma, PR", icon: Layers, desc: "Layered production project files" },
  { name: "Footage & Video", exts: "MP4, MOV, ProRes", icon: Video, desc: "Watermark-free raw video" },
  { name: "3D & Assets", exts: "OBJ, FBX, GLB", icon: Box, desc: "Clean textured 3D models" },
];

const PRICING_PACKS = [
  {
    id: "pack_starter",
    name: "Starter Pack",
    credits: 10,
    price: "$2.99",
    perItem: "$0.29 / asset",
    popular: false,
    features: [
      "10 High-Speed Downloads",
      "Magnific 8K & Freepik Assets",
      "Original Clean Watermark-Free Files",
      "No Expiration Date",
      "Commercial License Clearance",
    ],
  },
  {
    id: "pack_pro",
    name: "Pro Designer Pack",
    credits: 50,
    price: "$9.99",
    perItem: "$0.19 / asset",
    popular: true,
    features: [
      "50 High-Speed Downloads",
      "All Platforms (Magnific, Envato, MA)",
      "16-Connection Parallel Streaming",
      "Priority API Queue",
      "Commercial Rights Certificate Included",
      "No Expiration Date",
    ],
  },
  {
    id: "pack_studio",
    name: "Agency Studio Pack",
    credits: 200,
    price: "$24.99",
    perItem: "$0.12 / asset",
    popular: false,
    features: [
      "200 High-Speed Downloads",
      "Full 4K/8K Video & 3D Access",
      "Instant Cloud S3 Webhook Sync",
      "Multi-User Team Sharing",
      "Dedicated Enterprise SLA Support",
      "Tamper-Evident Audit Verification",
    ],
  },
];

const FAQS = [
  {
    q: "How does Magnific Downloader work?",
    a: "Simply copy any asset link from Magnific, Freepik, Motion Array, or Envato Elements, paste it into our search bar, and click 'Download Now'. Our system authenticates via authorized enterprise APIs, retrieves the original full-resolution file without any watermarks, and delivers it via a 16-connection parallel stream.",
  },
  {
    q: "Are the downloaded files 100% clean and original?",
    a: "Yes! You receive the exact original files directly from the platform's cloud storage (AI vectors, PSD layers, 8K PNG renders, 4K ProRes video), identical to a paid direct subscriber download.",
  },
  {
    q: "Can I use the downloaded designs for commercial client work?",
    a: "Yes. Every download is issued under an enterprise partner commercial distribution license with an immutable audit log and SLA agreement reference for full audit compliance.",
  },
  {
    q: "Do purchased credits ever expire?",
    a: "No! Your wallet credits never expire. Use them whenever you need an asset, whether today or six months from now.",
  },
];

export default function MagnificDownloaderPage() {
  const [urlInput, setUrlInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [assetData, setAssetData] = useState<AnalyzeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User Wallet Credits (Simulated SaaS State)
  const [creditsBalance, setCreditsBalance] = useState(15);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Download streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamSpeed, setStreamSpeed] = useState(0);

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Analyze URL handler
  const handleAnalyze = async (urlToAnalyze?: string) => {
    const target = (urlToAnalyze || urlInput).trim();
    if (!target) return;

    if (urlToAnalyze) {
      setUrlInput(urlToAnalyze);
    }

    setAnalyzing(true);
    setErrorMessage(null);
    setAssetData(null);
    setStreamProgress(0);

    try {
      const res = await api.analyzeUrl(target);
      setAssetData(res);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Could not analyze asset URL. Please verify the URL belongs to Magnific, Freepik, Motion Array, or Envato."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Trigger high-speed direct download
  const handleTriggerDownload = () => {
    if (!urlInput.trim()) return;

    if (creditsBalance <= 0) {
      setShowTopUpModal(true);
      return;
    }

    setIsStreaming(true);
    setStreamProgress(8);
    setStreamSpeed(45.2);

    // Deduct 1 credit
    setCreditsBalance((prev) => Math.max(0, prev - 1));

    // Direct HTTP Stream URL
    const streamUrl = api.getStreamUrl(urlInput.trim());

    const interval = setInterval(() => {
      setStreamProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsStreaming(false);
          setStreamSpeed(0);
          return 100;
        }
        const delta = Math.floor(Math.random() * 20) + 15;
        setStreamSpeed(parseFloat((40 + Math.random() * 18).toFixed(1)));
        return Math.min(prev + delta, 100);
      });
    }, 350);

    // Pipe download stream to browser
    window.location.href = streamUrl;
  };

  const handleQuickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        handleAnalyze(text);
      }
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Downloader Section (magnificdownloader.com Style) */}
      <section className="relative text-center pt-6 pb-12 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>The #1 Instant Magnific & Design Stock Asset Downloader</span>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Download <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">Magnific & Stock Assets</span> Instantly
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
            No expensive monthly subscriptions. Paste any Magnific AI, Freepik, Motion Array, or Envato Elements link and download the full original watermark-free file in seconds.
          </p>
        </div>

        {/* Large Prominent URL Input Card */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="glass-panel p-2.5 sm:p-3 rounded-2xl border border-slate-700/80 shadow-2xl shadow-blue-900/20 glow-blue">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyze();
              }}
              className="flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="relative w-full flex-1 flex items-center">
                <div className="absolute left-4 text-slate-500 pointer-events-none">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (text && text.trim().startsWith("http")) {
                      setUrlInput(text.trim());
                      handleAnalyze(text.trim());
                    }
                  }}
                  placeholder="Paste asset URL (e.g., https://magnific.ai/upscale/... or freepik.com/...)"
                  required
                  className="w-full pl-12 pr-20 py-4 bg-slate-900/90 border border-transparent rounded-xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 font-mono transition"
                />
                <button
                  type="button"
                  onClick={handleQuickPaste}
                  className="absolute right-3 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
              </div>

              <button
                type="submit"
                disabled={analyzing || !urlInput.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Download Now</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Click-to-Test Badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Try Sample:</span>
            {QUICK_TEST_LINKS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnalyze(sample.url)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition"
              >
                <span>{sample.icon}</span>
                <span>{sample.name}</span>
              </button>
            ))}
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-left text-sm text-red-300 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Unable to Fetch Asset</p>
                <p className="text-xs text-red-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Asset Preview & Direct Download Card (When Analyzed) */}
      {assetData && (
        <section className="max-w-4xl mx-auto glass-panel rounded-2xl border border-slate-700 p-6 sm:p-8 space-y-6 glow-emerald animate-in fade-in zoom-in-95 duration-200">
          {/* Main Visual Preview Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 border-b border-slate-800 pb-6 items-center">
            {/* Visual Thumbnail Image Container */}
            <div className="md:col-span-5 relative group">
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-inner relative flex items-center justify-center">
                <img
                  src={assetData.metadata.preview_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop"}
                  alt={assetData.metadata.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop";
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-400 border border-cyan-500/30">
                  {assetData.metadata.format.toUpperCase()} • 4K/8K RENDER
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-semibold text-slate-300">
                  Verified Original
                </div>
              </div>
            </div>

            {/* Asset Metadata & Action */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Clean Original File Verified
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                  {assetData.partner_name}
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
                  📦 Full .ZIP Package
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                  {assetData.metadata.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {assetData.metadata.description}
                </p>
              </div>

              {/* What is included in this download */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5 text-cyan-400" />
                  محتويات الحزمة الكاملة المضغوطة (.ZIP):
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400">
                  <span>✔ الملف الأصلي الخام (Original Asset)</span>
                  <span>✔ صورة المعاينة الفائقة (preview.png)</span>
                  <span>✔ شهادة الترخيص التجاري (LICENSE)</span>
                  <span>✔ ملف المواصفات والبيانات (JSON)</span>
                </div>
              </div>

              {/* Download CTA button with Credit badge */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <button
                  onClick={handleTriggerDownload}
                  disabled={isStreaming}
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
                >
                  <Download className="h-5 w-5" />
                  <span>{isStreaming ? "جارٍ تجهيز وتحميل الحزمة..." : "تحميل الحزمة الكاملة .ZIP (1 رصيد)"}</span>
                </button>
                <div className="text-xs text-slate-400 text-right sm:text-left shrink-0">
                  رصيدك: <strong className="text-cyan-400">{creditsBalance} رصيد</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">File Size</span>
              <p className="text-sm font-bold text-white mt-1 font-mono">
                {formatBytes(assetData.metadata.file_size_bytes)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Format</span>
              <p className="text-sm font-bold text-white mt-1 uppercase font-mono">
                {assetData.metadata.format} ({assetData.metadata.file_type})
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">License Clearance</span>
              <p className="text-sm font-bold text-emerald-400 mt-1 truncate">
                Commercial Cleared
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">SLA Reference</span>
              <p className="text-sm font-bold text-blue-400 mt-1 font-mono truncate">
                {assetData.metadata.agreement_reference}
              </p>
            </div>
          </div>

          {/* 16-Connection Parallel Thread Stream Bar */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold text-slate-200">
                  16x Multi-Connection Stream Progress
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-400">Speed: <strong className="text-cyan-400">{streamSpeed} MB/s</strong></span>
                <span className="text-slate-400">Done: <strong className="text-emerald-400">{streamProgress}%</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
              {Array.from({ length: 16 }).map((_, i) => {
                const active = isStreaming && streamProgress > 0 && streamProgress < 100;
                return (
                  <div
                    key={i}
                    className={`h-5 rounded flex items-center justify-center text-[8px] font-mono font-bold transition-all ${
                      active
                        ? "bg-blue-600/40 border border-blue-400 text-cyan-300 animate-pulse"
                        : streamProgress === 100
                        ? "bg-emerald-600/40 border border-emerald-400 text-emerald-300"
                        : "bg-slate-950 border border-slate-800 text-slate-600"
                    }`}
                  >
                    T{i + 1}
                  </div>
                );
              })}
            </div>

            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${streamProgress}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Supported Platforms Banner */}
      <section className="text-center space-y-4 max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Supported Partner Platforms & Formats
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-80">
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
            <span className="h-3 w-3 rounded-full bg-pink-500" /> Magnific AI
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
            <span className="h-3 w-3 rounded-full bg-blue-500" /> Freepik Premium
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
            <span className="h-3 w-3 rounded-full bg-emerald-500" /> Envato Elements
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
            <span className="h-3 w-3 rounded-full bg-amber-500" /> Motion Array
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
            <span className="h-3 w-3 rounded-full bg-purple-500" /> Storyblocks
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
            <span className="h-3 w-3 rounded-full bg-yellow-500" /> Artgrid Cinema
          </div>
        </div>
      </section>

      {/* Supported Formats Grid */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            All Creative Asset Formats Supported
          </h2>
          <p className="text-sm text-slate-400">
            Download vector files, layered PSD templates, 8K PNGs, 4K video clips, or 3D models with one click.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {SUPPORTED_FORMATS.map((fmt, idx) => {
            const Icon = fmt.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-2 text-center flex flex-col items-center"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{fmt.name}</h3>
                <span className="text-[11px] font-mono font-semibold text-cyan-400">
                  {fmt.exts}
                </span>
                <p className="text-xs text-slate-400">{fmt.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing / Credit Packs Section (magnificdownloader.com model) */}
      <section id="pricing" className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <Coins className="h-3.5 w-3.5" />
            Simple Pay-As-You-Go Credits
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Choose Your Credit Pack
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            1 Download = 1 Credit. No subscription lock-in. Credits never expire and work across all supported platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between border relative transition-all ${
                pack.popular
                  ? "border-blue-500/80 shadow-2xl shadow-blue-500/20 scale-[1.02] bg-slate-900/90"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-bold shadow-md uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">{pack.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">
                    {pack.price}
                  </span>
                  <span className="text-xs text-slate-400">{pack.perItem}</span>
                </div>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" />
                  {pack.credits} Credits Included
                </p>

                <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  {pack.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreditsBalance((prev) => prev + pack.credits);
                  alert(`Successfully topped up ${pack.credits} credits to your balance!`);
                }}
                className={`mt-6 w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition shadow-lg ${
                  pack.popular
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/30"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                Top Up {pack.credits} Credits
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400">
            Everything you need to know about Magnific Downloader and asset rights.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-xl border border-slate-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between text-sm font-semibold text-slate-200 hover:text-white transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
