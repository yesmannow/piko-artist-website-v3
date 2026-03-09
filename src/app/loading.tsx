import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      {/* Piko Logo with Pulse Animation */}
      <div className="relative mb-8">
        <Image
          src="/images/branding/piko-logo.png"
          alt="Piko Logo"
          width={200}
          height={80}
          className="animate-pulse"
          style={{ opacity: 0.5 }}
          priority
        />
      </div>

      {/* Toxic Lime Progress Bar */}
      <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-toxic-lime rounded-full origin-left animate-loading-bar" />
      </div>
    </div>
  );
}

