'use client'
import { useEffect, useRef } from 'react'

interface DataPoint { date: string; revenue: number; bookings: number }

interface Props {
  data: DataPoint[]
}

export function RevenueChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<unknown>(null)

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return
    
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      if (chartRef.current) {
        (chartRef.current as { destroy(): void }).destroy()
      }

      const labels = data.map(d => {
        const date = new Date(d.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      })

      const ctx = canvasRef.current!.getContext('2d')!
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 200)
      gradient.addColorStop(0, 'rgba(220,38,38,0.3)')
      gradient.addColorStop(1, 'rgba(220,38,38,0.0)')

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'درآمد',
              data: data.map(d => d.revenue / 1000000),
              borderColor: '#dc2626',
              backgroundColor: gradient,
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: '#dc2626',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
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
                title: (items) => `تاریخ: ${items[0].label}`,
                label: (item) => ` درآمد: ${item.parsed.y.toFixed(1)} میلیون تومان`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(51,65,85,0.3)', drawTicks: false },
              ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 10 },
              border: { display: false },
            },
            y: {
              grid: { color: 'rgba(51,65,85,0.3)' },
              ticks: {
                color: '#64748b',
                font: { size: 10 },
                callback: (v) => `${v}M`,
              },
              border: { display: false },
            },
          },
        },
      })
    }

    loadChart()

    return () => {
      if (chartRef.current) (chartRef.current as { destroy(): void }).destroy()
    }
  }, [data])

  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">درآمد ۳۰ روزه</h3>
          <p className="text-xs text-slate-500 mt-0.5">بر اساس میلیون تومان</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-3 h-0.5 bg-red-500 rounded" />
          <span>درآمد</span>
        </div>
      </div>
      <div className="chart-container" style={{ height: 200 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
