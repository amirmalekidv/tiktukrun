'use client'

export default function FogEffect() {
  const stars = Array.from({ length: 64 }, (_, i) => ({
    top: `${(i * 37) % 100}%`,
    left: `${(i * 61) % 100}%`,
    delay: `${(i % 11) * 0.35}s`,
    scale: 0.55 + (i % 5) * 0.28,
  }))

  return (
    <div className="stars" aria-hidden="true">
      {stars.map((star, i) => (
        <span
          key={i}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
            transform: `scale(${star.scale})`,
          }}
        />
      ))}
    </div>
  )
}
