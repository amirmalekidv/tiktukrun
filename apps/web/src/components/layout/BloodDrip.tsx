'use client'

const drops = [
  { left: '5%', height: 30, delay: 0, duration: 4 },
  { left: '15%', height: 50, delay: 1.5, duration: 5 },
  { left: '28%', height: 25, delay: 0.8, duration: 4.5 },
  { left: '42%', height: 60, delay: 2.2, duration: 3.5 },
  { left: '58%', height: 35, delay: 0.3, duration: 5.5 },
  { left: '70%', height: 45, delay: 1.8, duration: 4 },
  { left: '82%', height: 20, delay: 1, duration: 3.8 },
  { left: '92%', height: 55, delay: 2.8, duration: 4.2 },
]

export default function BloodDrip() {
  return (
    <div className="blood-drip-container relative z-20" aria-hidden="true">
      {drops.map((drop, i) => (
        <div
          key={i}
          className="blood-drop"
          style={{
            left: drop.left,
            height: `${drop.height}px`,
            '--delay': `${drop.delay}s`,
            '--duration': `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
