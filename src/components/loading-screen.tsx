'use client';

export function LoadingScreen({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3.5 bg-white/90 backdrop-blur-xs animate-fade-in-out">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-cyan-100 opacity-75" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Rajendra Swim System"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
      <div className="flex flex-col items-center text-center space-y-0.5">
        <span className="font-heading font-black text-sm tracking-wider uppercase text-slate-900">
          RAJENDRA <span className="text-[#0284c7]">SWIM SYSTEM</span>
        </span>
        {text && (
          <span className="text-[11px] font-semibold text-slate-500 animate-pulse">
            {text}
          </span>
        )}
      </div>
    </div>
  );
}

