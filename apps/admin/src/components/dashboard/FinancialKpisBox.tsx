import { formatToman, toPersianNum } from '@/lib/utils'

interface Props {
  cac: number
  clv: number
  churnRate: number
  nps: number
}

export function FinancialKpisBox({ cac, clv, churnRate, nps }: Props) {
  const items = [
    {
      label: 'CAC', fullLabel: 'هزینه جذب مشتری',
      value: formatToman(cac),
      icon: 'fa-user-plus', color: 'text-sky-400 bg-sky-400/10',
      subtitle: 'Customer Acquisition Cost'
    },
    {
      label: 'CLV', fullLabel: 'ارزش طول عمر مشتری',
      value: formatToman(clv),
      icon: 'fa-heart', color: 'text-emerald-400 bg-emerald-400/10',
      subtitle: 'Customer Lifetime Value'
    },
    {
      label: 'Churn', fullLabel: 'نرخ ریزش',
      value: `${toPersianNum(churnRate.toFixed(1))}٪`,
      icon: 'fa-user-minus', color: 'text-red-400 bg-red-400/10',
      subtitle: 'Churn Rate'
    },
    {
      label: 'NPS', fullLabel: 'شاخص خالص توصیه',
      value: toPersianNum(nps),
      icon: 'fa-thumbs-up', color: 'text-amber-400 bg-amber-400/10',
      subtitle: 'Net Promoter Score'
    },
  ]

  return (
    <div className="admin-card p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">شاخص‌های مالی کلیدی</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.label} className="p-3 rounded-xl" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${item.color}`}>
              <i className={`fas ${item.icon} text-sm`} />
            </div>
            <p className="text-lg font-bold text-slate-100">{item.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.fullLabel}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{item.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
