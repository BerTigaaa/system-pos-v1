export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 items-center justify-center p-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-cyan-400/5 blur-2xl" />

        <div className="relative z-10 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/20">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            BertigaPos
          </h1>
          <p className="text-blue-200/80 text-lg mb-10 leading-relaxed">
            Solusi POS modern untuk usaha Anda. Kelola penjualan, stok, dan
            laporan dengan mudah dalam satu platform.
          </p>

          <div className="space-y-4 text-left">
            {[
              { icon: "✓", text: "Manajemen stok real-time" },
              { icon: "✓", text: "Laporan penjualan otomatis" },
              { icon: "✓", text: "Multi-pengguna & kasir" },
              { icon: "✓", text: "Gratis 14 hari trial" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-blue-100/90">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-300 font-bold">
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </div>
    </div>
  );
}
