type NexusMarkProps = {
  className?: string;
};

export function NexusMark({ className }: NexusMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 48 48"
    >
      <path
        d="M9 14.5 24 6l15 8.5v19L24 42 9 33.5v-19Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="m15 18 9-5 9 5v12l-9 5-9-5V18Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="24" cy="24" fill="currentColor" r="3.5" />
    </svg>
  );
}
