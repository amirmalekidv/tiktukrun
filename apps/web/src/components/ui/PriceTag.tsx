import { formatToman } from '@/lib/utils'

interface PriceTagProps {
  amount: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function PriceTag({ amount, className = '', size = 'md' }: PriceTagProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <div className={`price-tag ${sizeClass} ${className}`}>
      <span className="font-bold">{formatToman(amount)}</span>
      <span className="text-[#00f5ff]/70 text-xs font-normal mr-1">تومان</span>
    </div>
  )
}
