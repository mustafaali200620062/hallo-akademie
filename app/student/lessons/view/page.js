'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ViewerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [fileUrl, setFileUrl] = useState(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    // ✅ منع كليك يمين
    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    // ✅ منع Ctrl+S / Ctrl+P / Ctrl+U / Ctrl+Shift+I / F12 / Ctrl+C / Ctrl+A
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'c') ||
        (e.ctrlKey && e.key === 'a')
      ) {
        e.preventDefault()
        return false
      }
    }

    // ✅ منع تحديد النص
    const handleSelectStart = (e) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectstart', handleSelectStart)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('selectstart', handleSelectStart)
    }
  }, [])

  useEffect(() => {
    if (!lessonId) {
      router.push('/student/lessons')
      return
    }
    fetchFileUrl()
  }, [lessonId])

  const fetchFileUrl = async () => {
    try {
      const res = await fetch(`/api/files/${lessonId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setFileUrl(data.url)
      setTitle(data.title || 'عرض الملف')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-2xl font-bold text-white">جاري التحميل...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-6 py-3 rounded-lg mb-4 font-bold">
            ❌ {error}
          </div>
          <button
            onClick={() => router.push('/student/lessons')}
            className="bg-white text-gray-900 px-6 py-2 rounded-lg font-bold"
          >
            ← العودة
          </button>
        </div>
      </div>
    )
  }

  // ✅ استخدام Google Docs Viewer لعرض PDF بدون أدوات تحميل
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  return (
    <div className="min-h-screen bg-black select-none">
      {/* شريط علوي */}
      <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          <h1 className="font-bold text-lg">{title}</h1>
        </div>
        <button
          onClick={() => router.push('/student/lessons')}
          className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
        >
          ✕ إغلاق
        </button>
      </div>

      {/* عرض الملف */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 60px)' }}>
        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          title={title}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />

        {/* طبقة شفافة لمنع التفاعل المباشر */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'transparent' }}
        />
      </div>

      <style jsx global>{`
        body {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -webkit-touch-callout: none;
        }

        iframe {
          pointer-events: auto;
        }

        img, iframe {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
      `}</style>
    </div>
  )
}

export default function StudentLessonViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-2xl font-bold text-white">جاري التحميل...</div>
      </div>
    }>
      <ViewerContent />
    </Suspense>
  )
}