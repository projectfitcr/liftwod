const paths: Record<string, React.ReactNode> = {
  today: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M9 14.5l2 2 4-4.5" />
    </>
  ),
  schedule: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4M7 13h3M7 17h3M14 13h3M14 17h3" />
    </>
  ),
  whiteboard: (
    <>
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <path d="M7 8h6M7 11h10M12 17v4M8 21h8" />
    </>
  ),
  results: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 010 7M18.5 14.7c1.9.8 3 2.3 3 4.3" />
    </>
  ),
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5l1.8 3.2 3.7.5-1.2 3.5 2.5 2.8-3.3 1.7-.7 3.7-3.8-1.1-3.8 1.1-.7-3.7-3.3-1.7 2.5-2.8L4.5 6.2l3.7-.5L12 2.5z" />
    </>
  ),
};

export type IconName = keyof typeof paths & string;

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
