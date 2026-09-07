'use client';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in-out">
      <img
        src="/brand/logo.png"
        alt="Loading"
        className="h-10 w-auto"
      />
    </div>
  );
}
