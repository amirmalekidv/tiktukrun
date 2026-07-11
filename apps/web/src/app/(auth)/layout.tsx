export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#05070a]/80 to-black/70" />
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(176,38,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-20">
        {children}
      </div>
    </div>
  )
}
