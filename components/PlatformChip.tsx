"use client";

export const PLATFORMS = [
  "Google Ads",
  "Meta Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "Pinterest Ads",
  "Microsoft Ads",
  "GTM",
] as const;

export type Platform = (typeof PLATFORMS)[number];

interface PlatformChipProps {
  platform: Platform;
  selected: boolean;
  onClick: () => void;
}

export default function PlatformChip({
  platform,
  selected,
  onClick,
}: PlatformChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-mono border transition-colors ${
        selected
          ? "bg-white text-black border-white"
          : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-400 hover:text-zinc-200"
      }`}
    >
      {platform}
    </button>
  );
}
