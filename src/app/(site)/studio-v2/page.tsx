import { HeroUIProvider } from '@heroui/react';
import { Timeline } from '@/components/studio-v2/Timeline';

export const metadata = {
  title: 'Studio V2 - Timeline Mixer | Piko',
  description: 'Multi-track timeline-based DJ mixing studio',
};

export default function StudioV2Page() {
  return (
    <HeroUIProvider>
      <div className="h-screen w-full bg-black text-white overflow-hidden">
        <Timeline />
      </div>
    </HeroUIProvider>
  );
}
