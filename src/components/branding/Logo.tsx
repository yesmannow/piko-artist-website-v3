import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

export default function Logo({
  size = 48,
  className,
  priority = false,
  alt = "Piko FG",
}: LogoProps) {
  return (
    <Image
      src="/images/branding/piko-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("transition-all duration-300", className)}
      priority={priority}
      sizes={`${size}px`}
    />
  );
}

