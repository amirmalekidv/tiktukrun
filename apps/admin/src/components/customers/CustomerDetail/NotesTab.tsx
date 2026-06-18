'use client'
import { useState } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { timeAgo } from '@/lib/utils'
import { useCustomerNotes } from '@/hooks/useCustomers'
import { customersApi } from '@/lib/api/customers'
import toast from 'react-hot-toast'
import type { AdminNote } from '@/types'

interface Props { customerId: string }

export function NotesTab({ customerId }: Props) {
  const { data: res, isLoading, mutate: reloadNotes } = useCustomerNotes(customerId)
  const notes: AdminNote[] = res?.data || []
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!newNote.trim()) return
    setSaving(true)
    try {
      await customersApi.addNote(customerId, newNote)
      toast.success('یادداشت ذخیره شد')
      setNewNote('')
      reloadNotes()
    } catch { toast.error('خطا در ذخیره یادداشت') }
    setSaving(false)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Add note */}
      <div className="admin-card p-4">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="یادداشت جدید..."
          rows={3}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAdd}
            disabled={!newNote.trim() || saving}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            {saving && <i className="fas fa-spinner fa-spin text-xs" />}
            ذخیره یادداشت
          </button>
        </div>
      </div>

      {isLoading ? <SkeletonTable rows={3} /> : notes.length === 0 ? (
        <EmptyState icon="fa-note-sticky" title="یادداشتی وجود ندارد" />
      ) : (
        <div className="space-y-3">
          {notes.map((n: AdminNote) => (
            <div key={n.id} className="admin-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">{n.adminName}</span>
                <span className="text-xs text-slate-600">{timeAgo(n.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
