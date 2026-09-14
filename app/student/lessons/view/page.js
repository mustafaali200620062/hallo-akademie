'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// ✅ إعداد PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function ViewerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [fileUrl, setFileUrl] = useState(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)
  const [numPages, setNumPages] = useState(null)

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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
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
          {numPages && (
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
              {numPages} صفحة
            </span>
          )}
        </div>
        <button
          onClick={() => router.push('/student/lessons')}
          className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
        >
          ✕ إغلاق
        </button>
      </div>

      {/* عرض الملف */}
      <div className="flex flex-col items-center py-6 overflow-auto" style={{ height: 'calc(100vh - 60px)' }}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-white text-xl">جاري تحميل المستند...</div>}
          error={<div className="text-red-400 text-xl">فشل تحميل المستند</div>}
          options={{
            cMapUrl: '/cmaps/',
            cMapPacked: true,
          }}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="mb-4 shadow-2xl">
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={Math.min(window.innerWidth - 40, 800)}
              />
            </div>
          ))}
        </Document>
      </div>

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

        /* ✅ إخفاء أزرار التحميل والطباعة */
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