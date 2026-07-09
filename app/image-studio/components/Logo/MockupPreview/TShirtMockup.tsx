"use client"

interface TShirtMockupProps {
  logoUrl: string
  brandName?: string
  darkMode?: boolean
  logoFilter?: React.CSSProperties
}

export function TShirtMockup({ logoUrl, brandName = 'Brand', darkMode = true, logoFilter }: TShirtMockupProps) {
  const shirtColor = darkMode ? '#1a1a1a' : '#ffffff'
  const textColor = darkMode ? '#a1a1aa' : '#71717a'

  return (
    <div className="relative">
      {/* T-Shirt Container */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          aspectRatio: '1 / 1.1',
          background: darkMode
            ? 'linear-gradient(180deg, #18181b 0%, #09090b 100%)'
            : 'linear-gradient(180deg, #f4f4f5 0%, #e4e4e7 100%)',
        }}
      >
        {/* T-Shirt Shape */}
        <svg
          viewBox="0 0 400 440"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }}
        >
          {/* T-Shirt Body */}
          <path
            d="M80 100 L40 140 L70 160 L70 400 L330 400 L330 160 L360 140 L320 100 L260 100 C260 130 230 160 200 160 C170 160 140 130 140 100 Z"
            fill={shirtColor}
            stroke={darkMode ? '#333' : '#d4d4d8'}
            strokeWidth="2"
          />
          {/* Left Sleeve */}
          <path
            d="M80 100 L40 140 L70 160 L80 120 Z"
            fill={shirtColor}
            stroke={darkMode ? '#333' : '#d4d4d8'}
            strokeWidth="2"
          />
          {/* Right Sleeve */}
          <path
            d="M320 100 L360 140 L330 160 L320 120 Z"
            fill={shirtColor}
            stroke={darkMode ? '#333' : '#d4d4d8'}
            strokeWidth="2"
          />
          {/* Collar */}
          <path
            d="M140 100 C140 130 170 160 200 160 C230 160 260 130 260 100"
            fill="none"
            stroke={darkMode ? '#333' : '#d4d4d8'}
            strokeWidth="2"
          />
          {/* Subtle fold lines */}
          <line x1="200" y1="160" x2="200" y2="380" stroke={darkMode ? '#222' : '#e4e4e7'} strokeWidth="1" opacity="0.5" />
        </svg>

        {/* Logo Placement Area */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50%',
            height: '35%',
          }}
        >
          <img
            src={logoUrl}
            alt={`${brandName} logo on t-shirt`}
            className="max-w-full max-h-full object-contain"
            style={{
              mixBlendMode: darkMode ? 'screen' : 'multiply',
              ...logoFilter,
            }}
          />
        </div>

        {/* Brand name below logo */}
        <div
          className="absolute text-center"
          style={{
            top: '68%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: textColor,
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}
        >
          {brandName}
        </div>

        {/* Subtle fabric texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.5' fill='%23888'/%3E%3Ccircle cx='3' cy='3' r='0.5' fill='%23888'/%3E%3C/svg%3E")`,
            backgroundSize: '4px 4px',
          }}
        />
      </div>

      {/* Shadow/Reflection Effect */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
