"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Layers,
  FileText,
  Power,
  ExternalLink,
  Hash,
  Database,
  Search,
  DownloadCloud
} from "lucide-react";
import { api, PartnerAgreement, AuditEntry } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

export default function CompliancePage() {
  const [agreements, setAgreements] = useState<PartnerAgreement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainStatus, setChainStatus] = useState<{
    chain_intact: boolean;
    verification_status: string;
    message: string;
  } | null>(null);

  const [togglingPartner, setTogglingPartner] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agrees, logs] = await Promise.all([
        api.getComplianceAgreements(),
        api.getAuditTrail()
      ]);
      setAgreements(agrees);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to load compliance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    try {
      const res = await api.verifyAuditChain();
      setChainStatus(res);
    } catch (err: any) {
      setChainStatus({
        chain_intact: false,
        verification_status: "ERROR",
        message: err.message || "Failed to contact verification service"
      });
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleToggleKillSwitch = async (partnerId: string, currentActive: boolean) => {
    const nextState = !currentActive;
    const action = nextState ? "enable" : "pause (kill switch)";
    if (!confirm(`Are you sure you want to ${action} partner adapter '${partnerId}'?`)) return;

    setTogglingPartner(partnerId);
    try {
      await api.toggleKillSwitch(partnerId, nextState, "Admin compliance control toggle");
      await loadData();
    } catch (err) {
      alert("Failed to toggle adapter status");
    } finally {
      setTogglingPartner(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Compliance & Partner SLA Governance
              </h1>
              <p className="text-xs text-slate-400">
                Mathematical proof of authorized commercial usage, quotas, and tamper-evident audit logging.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyChain}
            disabled={verifyingChain}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold text-slate-200 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${verifyingChain ? "animate-spin" : ""}`} />
            {verifyingChain ? "Verifying SHA-256 Hashes..." : "Verify Audit Chain Integrity"}
          </button>
        </div>
      </div>

      {/* Chain Status Result Toast/Alert */}
      {chainStatus && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            chainStatus.chain_intact
              ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
              : "bg-red-950/40 border-red-800/80 text-red-300"
          }`}
        >
          {chainStatus.chain_intact ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">
              {chainStatus.verification_status} — {chainStatus.chain_intact ? "Chain 100% Intact" : "Tampering Detected"}
            </p>
            <p className="mt-0.5 text-slate-300">{chainStatus.message}</p>
          </div>
        </div>
      )}

      {/* Partner Agreement Matrix */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            Partner Agreements & Authorized Quotas
          </h2>
          <span className="text-xs text-slate-400">Instant Admin Kill-Switch Enabled</span>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Partner & Name</th>
                  <th className="py-3.5 px-4">Agreement Code</th>
                  <th className="py-3.5 px-4">Commercial License Scope</th>
                  <th className="py-3.5 px-4">Monthly Quota</th>
                  <th className="py-3.5 px-4">Audit Status</th>
                  <th className="py-3.5 px-4 text-right">Kill Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {agreements.map((agr) => {
                  const pct = Math.min(100, Math.round((agr.used_quota / (agr.monthly_quota || 1)) * 100));
                  const isPaused = agr.kill_switch_active || agr.status === "PAUSED";
                  return (
                    <tr key={agr.partner_id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-200">
                        {agr.partner_name}
                      </td>
                      <td className="py-3.5 px-4 text-cyan-400">{agr.agreement_code}</td>
                      <td className="py-3.5 px-4 font-sans text-slate-300 max-w-xs truncate">
                        {agr.license_type}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{agr.used_quota.toLocaleString()} used</span>
                            <span>{agr.monthly_quota.toLocaleString()}</span>
                          </div>
                          <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-sans font-semibold">
                          {agr.compliance_score}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <button
                          onClick={() => handleToggleKillSwitch(agr.partner_id, !isPaused)}
                          disabled={togglingPartner === agr.partner_id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            isPaused
                              ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                              : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-red-950/50 hover:text-red-400 hover:border-red-800"
                          }`}
                        >
                          <Power className="h-3 w-3" />
                          {isPaused ? "PAUSED (Activate)" : "Kill Switch"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Append-Only Cryptographic Audit Log */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              Append-Only Tamper-Evident Audit Trail (SHA-256 Merkle Chain)
            </h2>
            <p className="text-xs text-slate-400">
              Each record cryptographically encapsulates the prior record's hash. Tampering breaks the chain.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing latest {auditLogs.length} certified transactions
          </span>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4"># ID & Time</th>
                  <th className="py-3.5 px-4">User & IP</th>
                  <th className="py-3.5 px-4">Partner / Asset</th>
                  <th className="py-3.5 px-4">License Ref</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Cryptographic Hash Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      No downloads logged yet. Enter a URL on the Downloader page to generate audit entries.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="text-slate-400">#{log.id}</span>
                        <div className="text-[10px] text-slate-400">{log.created_at.slice(0, 19).replace("T", " ")}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 truncate max-w-[120px]">{log.user_id}</div>
                        <div className="text-[10px] text-slate-400">{log.user_ip}</div>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] uppercase font-mono font-bold">
                          {log.partner_id}
                        </span>
                        <div className="text-xs font-medium text-slate-200 truncate max-w-[180px] mt-0.5">
                          {log.asset_title}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400">
                        {log.license_agreement_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {formatBytes(log.bytes_transferred)}
                      </td>
                      <td className="py-3.5 px-4 text-[10px]">
                        <div className="flex items-center gap-1 text-cyan-400 truncate max-w-[200px]" title={log.current_hash}>
                          <Hash className="h-3 w-3 shrink-0" />
                          <span>{log.current_hash.slice(0, 16)}...</span>
                        </div>
                        <div className="text-slate-400 text-[9px] truncate max-w-[200px]">
                          prev: {log.previous_hash.slice(0, 12)}...
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
