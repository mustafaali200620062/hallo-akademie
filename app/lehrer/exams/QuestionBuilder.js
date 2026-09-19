'use client'

import { useState, useEffect } from 'react'

export default function QuestionBuilder({ question, index, onUpdate, onDelete, examId, onSaved }) {
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(question.id ? true : false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  // ✅ جلب Signed URL للمعاينة
  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (question.media_url && (question.question_type === 'image' || question.question_type === 'audio')) {
        try {
          // لو الرابط مش كامل، نعمل Signed URL من الـ API
          const res = await fetch('/api/files/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: question.media_url })
          })
          const data = await res.json()
          if (res.ok && data.url) {
            setPreviewUrl(data.url)
          }
        } catch (error) {
          console.error('Error getting preview URL:', error)
        }
      }
    }
    fetchPreviewUrl()
  }, [question.media_url, question.question_type])

  const addOption = () => {
    const newOptions = [...(question.options || []), '']
    onUpdate(index, 'options', newOptions)
    setSaved(false)
  }

  const removeOption = (optIndex) => {
    if ((question.options || []).length <= 2) return
    const newOptions = question.options.filter((_, i) => i !== optIndex)
    onUpdate(index, 'options', newOptions)
    setSaved(false)
  }

  const updateOption = (optIndex, value) => {
    const newOptions = [...question.options]
    newOptions[optIndex] = value
    onUpdate(index, 'options', newOptions)
    setSaved(false)
  }

  const toggleCorrect = (optIndex) => {
    let correct = [...(question.correct_answers || [])]
    if (correct.includes(optIndex)) {
      correct = correct.filter(i => i !== optIndex)
    } else {
      correct.push(optIndex)
    }
    onUpdate(index, 'correct_answers', correct)
    setSaved(false)
  }

  // ✅ رفع الملف
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadError(null)

    // ✅ التحقق من الحجم
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)} MB). الحد الأقصى 10 MB`)
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const res = await fetch('/api/upload-question-media', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل الرفع')
      }

      onUpdate(index, 'media_url', data.url)
      onUpdate(index, 'media_type', type)
      setSaved(false)
    } catch (error) {
      console.error('Error uploading:', error)
      setUploadError('فشل رفع الملف: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveMedia = () => {
    if (!confirm('هل تريد حذف الملف المرفوع؟')) return
    onUpdate(index, 'media_url', '')
    onUpdate(index, 'media_type', '')
    setPreviewUrl(null)
    setSaved(false)
  }

  // ✅ حفظ السؤال
  const handleSaveQuestion = async () => {
    if (!question.question_text?.trim()) {
      alert('يرجى كتابة نص السؤال')
      return
    }

    if (question.question_type === 'image' && !question.media_url) {
      alert('يرجى رفع صورة للسؤال')
      return
    }

    if (question.question_type === 'audio' && !question.media_url) {
      alert('يرجى رفع مقطع صوتي للسؤال')
      return
    }

    if (question.question_type !== 'matching') {
      const validOptions = (question.options || []).filter(o => o?.trim())
      if (validOptions.length < 2) {
        alert('يرجى إدخال خيارين على الأقل')
        return
      }
      if (!(question.correct_answers || []).length) {
        alert('يرجى تحديد الإجابة الصحيحة')
        return
      }
    }

    setSaving(true)

    try {
      const res = await fetch('/api/exam-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: examId,
          question_type: question.question_type,
          question_text: question.question_text,
          media_url: question.media_url || null,
          media_type: question.media_type || null,
          options: JSON.stringify(question.options || []),
          correct_answers: JSON.stringify(question.correct_answers || []),
          correct_answer: JSON.stringify(question.correct_answers || []),
          points: question.points || 1,
          explanation: question.explanation || '',
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ السؤال')
      }

      setSaved(true)
      alert('✅ تم حفظ السؤال بنجاح!')
      if (onSaved) onSaved()

    } catch (error) {
      console.error('Error saving question:', error)
      alert('فشل حفظ السؤال: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`bg-white border-2 rounded-xl p-4 mb-4 ${saved ? 'border-green-400' : 'border-gray-200'}`}>
      {/* رأس السؤال */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800">
            سؤال {index + 1} • {
              question.question_type === 'multiple_choice' ? 'اختيار من متعدد' :
              question.question_type === 'matching' ? 'مطابقة' :
              question.question_type === 'image' ? 'صورة' :
              question.question_type === 'audio' ? 'صوتي' : 'اختيار من متعدد'
            }
          </h3>
          {saved && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
              ✅ محفوظ
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="text-red-600 hover:text-red-800 font-bold"
        >
          🗑️
        </button>
      </div>

      {/* نص السؤال */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="نص السؤال"
          value={question.question_text}
          onChange={(e) => {
            onUpdate(index, 'question_text', e.target.value)
            setSaved(false)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
        />
      </div>

      {/* رفع صورة/صوت + معاينة */}
      {(question.question_type === 'image' || question.question_type === 'audio') && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {question.question_type === 'image' ? '🖼️ ارفع صورة (حد أقصى 10 ميجا)' : '🎵 ارفع مقطع صوتي (حد أقصى 10 ميجا)'}
          </label>

          {!question.media_url ? (
            <input
              type="file"
              accept={question.question_type === 'image' ? 'image/*' : 'audio/*'}
              onChange={(e) => handleFileUpload(e, question.question_type)}
              disabled={uploading}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-bold hover:file:bg-blue-700 disabled:opacity-50"
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <span className="text-green-800 font-bold text-sm">
                    {question.question_type === 'image' ? 'تم رفع الصورة' : 'تم رفع المقطع الصوتي'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="text-red-600 hover:text-red-800 font-bold text-sm"
                >
                  🗑️ حذف
                </button>
              </div>

              {/* ✅ معاينة الصورة */}
              {question.question_type === 'image' && previewUrl && (
                <div className="bg-white border-2 border-green-300 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-600 mb-2">📸 معاينة الصورة:</p>
                  <img
                    src={previewUrl}
                    alt="معاينة"
                    className="max-w-full max-h-60 rounded-lg mx-auto shadow-md object-contain"
                    onError={(e) => {
                      e.target.parentElement.innerHTML = '<p class="text-red-500 text-sm font-bold text-center">⚠️ تعذر تحميل الصورة</p>'
                    }}
                  />
                </div>
              )}

              {/* ✅ معاينة الصوت */}
              {question.question_type === 'audio' && previewUrl && (
                <div className="bg-white border-2 border-green-300 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-600 mb-2">🎵 معاينة المقطع الصوتي:</p>
                  <audio controls className="w-full">
                    <source src={previewUrl} type="audio/mpeg" />
                    متصفحك لا يدعم الصوت
                  </audio>
                </div>
              )}
            </div>
          )}

          {uploading && (
            <p className="text-sm text-blue-600 font-bold mt-2 animate-pulse">
              ⏳ جاري الرفع...
            </p>
          )}

          {uploadError && (
            <div className="mt-2 bg-red-50 border border-red-300 rounded-lg p-2">
              <p className="text-sm text-red-700 font-bold">❌ {uploadError}</p>
            </div>
          )}
        </div>
      )}

      {/* الدرجة */}
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm font-bold text-gray-700">النقاط:</label>
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={question.points}
          onChange={(e) => {
            onUpdate(index, 'points', parseFloat(e.target.value) || 1)
            setSaved(false)
          }}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
        />
      </div>

      {/* الخيارات */}
      {question.question_type !== 'matching' && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            الخيارات (اختر الإجابة/الإجابات الصحيحة):
          </label>
          {(question.options || []).map((opt, optIndex) => (
            <div key={optIndex} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(question.correct_answers || []).includes(optIndex)}
                onChange={() => toggleCorrect(optIndex)}
                className="w-5 h-5 text-green-600 rounded"
              />
              <input
                type="text"
                placeholder={`خيار ${optIndex + 1}`}
                value={opt}
                onChange={(e) => updateOption(optIndex, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
              {(question.options || []).length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(optIndex)}
                  className="text-red-600 hover:text-red-800 font-bold px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-blue-600 hover:text-blue-800 font-bold text-sm"
          >
            + إضافة خيار
          </button>
        </div>
      )}

      {/* المطابقة */}
      {question.question_type === 'matching' && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            الأزواج:
          </label>
          {(question.options || []).map((pair, pairIndex) => (
            <div key={pairIndex} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="العمود الأيمن"
                value={pair.left || ''}
                onChange={(e) => {
                  const newOptions = [...question.options]
                  newOptions[pairIndex] = { ...newOptions[pairIndex], left: e.target.value }
                  onUpdate(index, 'options', newOptions)
                  setSaved(false)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
              <span className="text-gray-500">←</span>
              <input
                type="text"
                placeholder="العمود الأيسر"
                value={pair.right || ''}
                onChange={(e) => {
                  const newOptions = [...question.options]
                  newOptions[pairIndex] = { ...newOptions[pairIndex], right: e.target.value }
                  onUpdate(index, 'options', newOptions)
                  setSaved(false)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
              <button
                type="button"
                onClick={() => {
                  const newOptions = question.options.filter((_, i) => i !== pairIndex)
                  onUpdate(index, 'options', newOptions)
                  setSaved(false)
                }}
                className="text-red-600 hover:text-red-800 font-bold px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newOptions = [...(question.options || []), { left: '', right: '' }]
              onUpdate(index, 'options', newOptions)
              setSaved(false)
            }}
            className="text-blue-600 hover:text-blue-800 font-bold text-sm"
          >
            + إضافة زوج
          </button>
        </div>
      )}

      {/* شرح الإجابة */}
      <div className="mt-3">
        <textarea
          placeholder="شرح الإجابة (اختياري)"
          value={question.explanation}
          onChange={(e) => {
            onUpdate(index, 'explanation', e.target.value)
            setSaved(false)
          }}
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
        />
      </div>

      {/* زر حفظ السؤال */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSaveQuestion}
          disabled={saving || saved}
          className={`w-full py-3 rounded-xl font-extrabold transition-all ${
            saved
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
          }`}
        >
          {saving ? '⏳ جاري الحفظ...' : saved ? '✅ تم الحفظ' : '💾 حفظ السؤال'}
        </button>
      </div>
    </div>
  )
}