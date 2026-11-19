// Logo mark: a padlock on a green tile, with the red / yellow / green flag band underneath.
export default function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" fill="#007934" />
      <rect x="0" y="27" width="10.67" height="5" fill="#d52b1e" />
      <rect x="10.67" y="27" width="10.67" height="5" fill="#f9e300" />
      <rect x="21.33" y="27" width="10.67" height="5" fill="#007934" />
      <path
        d="M11.5 14v-2.5a4.5 4.5 0 0 1 9 0V14"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="9" y="14" width="14" height="10" fill="#fff" />
      <circle cx="16" cy="18.5" r="1.6" fill="#007934" />
    </svg>
  );
}
