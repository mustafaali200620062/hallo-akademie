'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// ✅ إعداد PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function PDFViewer({ fileUrl }) {
  const [numPages, setNumPages] = useState(null)

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  return (
    <div className="flex flex-col items-center py-6 overflow-auto" style={{ height: 'calc(100vh - 60px)' }}>
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div className="text-white text-xl">جاري تحميل المستند...</div>}
        error={<div className="text-red-400 text-xl">فشل تحميل المستند</div>}
      >
        {numPages && Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} className="mb-4 shadow-2xl">
            <Page
              pageNumber={index + 1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={Math.min(typeof window !== 'undefined' ? window.innerWidth - 40 : 800, 800)}
            />
          </div>
        ))}
      </Document>
    </div>
  )
}