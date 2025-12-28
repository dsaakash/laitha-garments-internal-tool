'use client'

export default function PalaceBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Sky gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #ffecd2 0%, #fcb69f 25%, #ff9a9e 50%, #fecfef 75%, #ffecd2 100%)',
        }}
      />
      
      {/* Palace facade layers */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            /* Palace base */
            linear-gradient(to bottom, 
              transparent 0%,
              transparent 40%,
              rgba(255, 182, 193, 0.2) 50%,
              rgba(255, 192, 203, 0.25) 60%,
              rgba(255, 182, 193, 0.2) 70%,
              transparent 100%
            ),
            /* Windows pattern - Hawa Mahal style */
            repeating-linear-gradient(
              90deg,
              transparent 0%,
              transparent 7.8%,
              rgba(255, 255, 255, 0.15) 8%,
              rgba(255, 255, 255, 0.15) 8.5%,
              transparent 9%,
              transparent 100%
            ),
            /* Vertical architectural elements */
            repeating-linear-gradient(
              0deg,
              transparent 0%,
              transparent 4.8%,
              rgba(255, 255, 255, 0.1) 5%,
              rgba(255, 255, 255, 0.1) 5.2%,
              transparent 5.4%,
              transparent 100%
            )
          `,
          backgroundSize: '100% 100%, 12% 100%, 100% 8%',
        }}
      />
      
      {/* Domes and architectural details */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 250% 120% at 20% 28%, rgba(255, 215, 0, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 250% 120% at 80% 28%, rgba(255, 215, 0, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 200% 100% at 50% 52%, rgba(255, 182, 193, 0.25) 0%, transparent 45%)
          `,
          backgroundSize: '100% 100%',
        }}
      />
      
      {/* Decorative jali patterns */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(255, 255, 255, 0.06) 4px,
              rgba(255, 255, 255, 0.06) 8px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 4px,
              rgba(255, 255, 255, 0.04) 4px,
              rgba(255, 255, 255, 0.04) 8px
            )
          `,
          backgroundSize: '50px 50px',
          opacity: 0.5,
        }}
      />
      
      {/* Palace silhouette at horizon */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: 'linear-gradient(to top, rgba(255, 182, 193, 0.35) 0%, rgba(255, 192, 203, 0.25) 15%, rgba(255, 182, 193, 0.15) 30%, transparent 50%)',
        }}
      />
    </div>
  )
}

