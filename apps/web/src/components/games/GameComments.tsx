'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  getGameComments,
  addGameComment,
  toggleCommentLike,
  deleteGameComment,
} from '@/lib/api'
import { toPersianDigits, getRelativeTime } from '@/lib/utils'
import type { GameComment } from '@/types'

function CommentItem({
  comment,
  onReply,
  onDeleted,
  isReply = false,
}: {
  comment: GameComment
  onReply: (parentId: string, text: string) => Promise<void>
  onDeleted: () => void
  isReply?: boolean
}) {
  const [liked, setLiked] = useState(Boolean(comment.likedByMe))
  const [likes, setLikes] = useState(comment.likesCount ?? 0)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)

  const handleLike = async () => {
    const isLoggedIn =
      typeof localStorage !== 'undefined' && !!localStorage.getItem('accessToken')
    if (!isLoggedIn) {
      if (typeof window !== 'undefined') window.location.href = '/login'
      return
    }
    const prevLiked = liked
    const prevLikes = likes
    setLiked(!prevLiked)
    setLikes(prevLikes + (prevLiked ? -1 : 1))
    try {
      const res = await toggleCommentLike(comment.id)
      setLiked(Boolean(res.likedByMe))
      setLikes(res.likesCount ?? prevLikes)
    } catch {
      setLiked(prevLiked)
      setLikes(prevLikes)
    }
  }

  const submitReply = async () => {
    if (replyText.trim().length < 2 || busy) return
    setBusy(true)
    try {
      await onReply(comment.id, replyText.trim())
      setReplyText('')
      setShowReply(false)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('این نظر حذف شود؟')) return
    try {
      await deleteGameComment(comment.id)
      onDeleted()
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`${isReply ? 'mr-8 mt-3 border-r-2 border-red-900/30 pr-4' : 'border-b border-red-950/30 pb-5 last:border-0'}`}>
      <div className="flex items-center gap-3 mb-2">
        {comment.user?.avatar ? (
          <img src={comment.user.avatar} alt={comment.user.name} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-red-900 flex items-center justify-center text-white text-sm">
            {(comment.user?.name || 'ک').charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-sm">{comment.user?.name || 'کاربر ناشناس'}</span>
            <span className="text-gray-500 text-xs">{getRelativeTime(comment.createdAt)}</span>
          </div>
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mr-12">{comment.text}</p>
      <div className="flex items-center gap-4 mt-2 mr-12 text-xs text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-400' : 'hover:text-red-400'}`}
        >
          <i className={`${liked ? 'fas' : 'far'} fa-heart`} />
          {toPersianDigits(likes)}
        </button>
        {!isReply && (
          <button onClick={() => setShowReply((v) => !v)} className="flex items-center gap-1 hover:text-red-400 transition-colors">
            <i className="fas fa-reply" />
            پاسخ
          </button>
        )}
        <button onClick={handleDelete} className="flex items-center gap-1 hover:text-red-400 transition-colors">
          <i className="fas fa-trash" />
          حذف
        </button>
      </div>

      {showReply && (
        <div className="mt-3 mr-12 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="پاسخ خود را بنویسید..."
            className="flex-1 bg-gray-900/50 border border-red-900/30 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-red-600"
          />
          <button
            onClick={submitReply}
            disabled={busy}
            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            ارسال
          </button>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDeleted={onDeleted}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function GameComments({ gameId }: { gameId: string }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, mutate, isLoading } = useSWR(
    gameId ? `comments-${gameId}` : null,
    () => getGameComments(gameId, 1, 50)
  )

  const comments = (data?.data ?? []) as GameComment[]
  const total = data?.total ?? comments.length

  const requireLogin = () => {
    const isLoggedIn =
      typeof localStorage !== 'undefined' && !!localStorage.getItem('accessToken')
    if (!isLoggedIn) {
      if (typeof window !== 'undefined') window.location.href = '/login'
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (text.trim().length < 2 || submitting) return
    if (!requireLogin()) return
    setSubmitting(true)
    setNotice(null)
    try {
      await addGameComment(gameId, text.trim())
      setText('')
      setNotice('نظر شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.')
      mutate()
    } catch (e: any) {
      setNotice(e?.message || 'خطا در ثبت نظر')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, replyText: string) => {
    if (!requireLogin()) return
    try {
      await addGameComment(gameId, replyText, parentId)
      setNotice('پاسخ شما ثبت شد و پس از تأیید نمایش داده می‌شود.')
      mutate()
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="dark-card rounded-2xl p-6">
      <h2 className="font-cinzel font-bold text-xl text-white mb-6 flex items-center gap-2">
        <i className="fas fa-comment-dots text-red-500" />
        دیدگاه‌های کاربران ({toPersianDigits(total)})
      </h2>

      {/* New comment box */}
      <div className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="نظر خود را درباره این بازی بنویسید..."
          rows={3}
          maxLength={2000}
          className="w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-red-600 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-600 text-xs">{toPersianDigits(text.length)}/۲۰۰۰</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || text.trim().length < 2}
            className="bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {submitting ? 'در حال ارسال...' : 'ثبت دیدگاه'}
          </button>
        </div>
        {notice && <p className="text-green-400 text-xs mt-2">{notice}</p>}
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-900/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">هنوز دیدگاهی ثبت نشده است. اولین نفر باشید!</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onReply={handleReply}
              onDeleted={() => mutate()}
            />
          ))}
        </div>
      )}
    </section>
  )
}
