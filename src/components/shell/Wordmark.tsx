/**
 * Text rendition of the LIFTwod wordmark (orange/teal/magenta/purple LIFT +
 * white wod) for the TopBar; the PNG assets stay for app icons and marketing.
 */
export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-brand-orange">L</span>
      <span className="text-brand-teal">I</span>
      <span className="text-brand-magenta">F</span>
      <span className="text-brand-purple">T</span>
      <span className="text-ink-primary">wod</span>
    </span>
  );
}
