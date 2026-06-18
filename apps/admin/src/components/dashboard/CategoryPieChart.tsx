'use client'
import { useEffect, useRef } from 'react'
import { toPersianNum } from '@/lib/utils'

interface CategoryStat { name: string; count: number; revenue: number; color: string }
interface Props { data: CategoryStat[] }

export function CategoryPieChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<unknown>(null)

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return
    
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      if (chartRef.current) (chartRef.current as { destroy(): void }).destroy()

      chartRef.current = new Chart(canvasRef.current!, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.name),
          datasets: [{
            data: data.map(d => d.count),
            backgroundColor: data.map(d => d.color),
            borderColor: 'rgba(15,23,42,0.8)',
            borderWidth: 3,
            hoverBorderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.95)',
              titleColor: '#94a3b8',
              bodyColor: '#f1f5f9',
              borderColor: 'rgba(51,65,85,0.5)',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (item) => ` ${item.formattedValue} رزرو`,
              },
            },
          },
        },
      })
    }

    loadChart()
    return () => { if (chartRef.current) (chartRef.current as { destroy(): void }).destroy() }
  }, [data])

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="admin-card p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">دسته‌بندی‌ها</h3>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
          <canvas ref={canvasRef} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-slate-500">کل</p>
            <p className="text-lg font-bold text-slate-200">{toPersianNum(total)}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span className="text-slate-400 truncate max-w-[100px]">{d.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-300">{toPersianNum(d.count)}</span>
                <span className="text-slate-600 w-8 text-left">{toPersianNum(total > 0 ? Math.round(d.count / total * 100) : 0)}٪</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
