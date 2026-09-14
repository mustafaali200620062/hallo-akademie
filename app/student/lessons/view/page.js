'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// ✅ تحميل PDF Viewer فقط على الـ client
const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-2xl font-bold text-white">جاري التحميل...</div>
    </div>
  ),
})

function ViewerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [fileUrl, setFileUrl] = useState(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

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

  return (
    <div className="min-h-screen bg-gray-900 select-none">
      {/* شريط علوي */}
      <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-lg border-b border-gray-700">
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
      <PDFViewer fileUrl={fileUrl} />

      <style jsx global>{`
        body {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -webkit-touch-callout: none;
        }

        img, canvas {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }

        .react-pdf__Page__annotations,
        .annotationLayer {
          display: none !important;
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