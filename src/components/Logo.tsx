interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 36, showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E21B70" />
            <stop offset="100%" stopColor="#FF6B9D" />
          </linearGradient>
        </defs>

        {/* Background rounded square */}
        <rect width="40" height="40" rx="11" fill="url(#logoGrad)" />

        {/* Fork — left side */}
        {/* Tines */}
        <line x1="10" y1="9" x2="10" y2="16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="13" y1="9" x2="13" y2="16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        {/* Neck */}
        <path d="M10 16 Q10 19 11.5 19 Q13 19 13 16" fill="white" />
        <line x1="11.5" y1="19" x2="11.5" y2="30" stroke="white" strokeWidth="1.8" strokeLinecap="round" />

        {/* Spoon — right side */}
        <ellipse cx="28.5" cy="13" rx="3.5" ry="4.5" fill="white" />
        <line x1="28.5" y1="17.5" x2="28.5" y2="30" stroke="white" strokeWidth="1.8" strokeLinecap="round" />

        {/* W between utensils */}
        <path
          d="M16 13 L18 22 L20 17 L22 22 L24 13"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Wordmark */}
      {showText && (
        <span className="text-xl font-extrabold tracking-tight text-gray-900 leading-none">
          Wispr<span className="text-primary">Food</span>
        </span>
      )}
    </div>
  );
}
