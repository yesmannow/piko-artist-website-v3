import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AudioProvider } from "@/context/AudioContext";
import { VideoProvider } from "@/context/VideoContext";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { FloatingVideoPlayer } from "@/components/FloatingVideoPlayer";
import { PageTransition } from "@/components/PageTransition";
import { MobileNav } from "@/components/layout/MobileNav";
import { TacticalBar } from "@/components/navigation/TacticalBar";
import { InstallApp } from "@/components/InstallApp";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollRestorationManager } from "@/components/ScrollRestorationManager";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      <VideoProvider>
        <div className="pt-20 md:pt-24">
          <Navbar />
          <SmoothScroll>
            <ScrollRestorationManager />
            <PageTransition>{children}</PageTransition>
          </SmoothScroll>
          <Footer />
          <FloatingVideoPlayer />
          <PersistentPlayer />
          <MobileNav />
          <TacticalBar />
          <InstallApp />
          <InstallPrompt />
        </div>
      </VideoProvider>
    </AudioProvider>
  );
}

