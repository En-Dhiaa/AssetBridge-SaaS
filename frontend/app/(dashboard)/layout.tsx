import Navbar from "@/components/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AssetBridge SaaS Platform. All partner API integrations operate under official SLA & commercial licenses.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>SSRF Sandboxed</span>
            <span>•</span>
            <span>Immutable Audit Trail</span>
            <span>•</span>
            <span>AES-256 at Rest</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
