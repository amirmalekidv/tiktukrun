'use client'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen, title, message, confirmText = 'تأیید', cancelText = 'انصراف',
  danger = false, isLoading = false, onConfirm, onCancel
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative admin-card p-6 w-full max-w-sm animate-fade-in">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-600/20' : 'bg-amber-500/20'}`}>
          <i className={`fas ${danger ? 'fa-triangle-exclamation text-red-400' : 'fa-circle-question text-amber-400'} text-2xl`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-100 text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-400 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isLoading && <i className="fas fa-spinner fa-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
