'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateGamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [teacherId, setTeacherId] = useState(null)
  const [groups, setGroups] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // ✅ بيانات اللعبة
  const [title, setTitle] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [mode, setMode] = useState('solo') // solo | teams

  // ✅ الأزواج (pairs)
  const [pairs, setPairs] = useState([
    { left: { type: 'text', value: '' }, right: { type: 'text', value: '' } }
  ])

  // ✅ حالة الرفع لكل صورة (لكل pair ولكل جهة)
  const [uploading, setUploading] = useState({})

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsed = JSON.parse(userData)
    if (parsed.role !== 'Lehrer' && parsed.role !== 'Eigentümer') {
      router.push('/unauthorized')
      return
    }
    setTeacherId(parsed.id)
    await fetchGroups(parsed.id)
  }

  const fetchGroups = async (tId) => {
    try {
      const res = await fetch('/api/groups')
      const data = await res.json()
      if (res.ok) {
        const teacherGroups = data.filter(g => g.teacher_id === tId)
        setGroups(teacherGroups || [])
        if (teacherGroups.length > 0) {
          setSelectedGroup(teacherGroups[0].id)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setError('حدث خطأ في جلب المجموعات')
    } finally {
      setLoading(false)
    }
  }

  // ✅ إضافة زوج جديد
  const addPair = () => {
    setPairs(prev => [
      ...prev,
      { left: { type: 'text', value: '' }, right: { type: 'text', value: '' } }
    ])
  }

  // ✅ حذف زوج
  const removePair = (index) => {
    if (pairs.length <= 1) {
      setError('لازم يكون فيه زوج واحد على الأقل')
      return
    }
    setPairs(prev => prev.filter((_, i) => i !== index))
  }

  // ✅ تحديث قيمة (نص)
  const updatePairValue = (index, side, value) => {
    setPairs(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index] }
      copy[index][side] = { ...copy[index][side], value }
      return copy
    })
  }

  // ✅ تغيير النوع (نص / صورة)
  const changePairType = (index, side, newType) => {
    setPairs(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index] }
      copy[index][side] = { type: newType, value: '' }
      return copy
    })
  }

  // ✅ رفع صورة
  const handleUploadImage = async (index, side, file) => {
    if (!file) return

    const key = `${index}-${side}`
    setUploading(prev => ({ ...prev, [key]: true }))
    setError(null)

    // ✅ التحقق من الحجم
    if (file.size > 10 * 1024 * 1024) {
      setError(`حجم الصورة كبير جداً (${(file.size / 1024 / 1024).toFixed(1)} MB). الحد الأقصى 10 MB`)
      setUploading(prev => ({ ...prev, [key]: false }))
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const res = await fetch('/api/upload-question-media', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل رفع الصورة')
      }

      if (!data.url) {
        throw new Error('لم يتم إرجاع رابط الصورة')
      }

      // ✅ تحديث قيمة الزوج بالمسار
      updatePairValue(index, side, data.url)

    } catch (err) {
      setError('فشل رفع الصورة: ' + err.message)
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }))
    }
  }

  // ✅ حفظ اللعبة
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // ✅ التحقق
    if (!title.trim()) {
      setError('اكتب اسم اللعبة')
      return
    }
    if (!selectedGroup) {
      setError('اختر مجموعة')
      return
    }

    // ✅ التحقق من الأزواج
    const validPairs = pairs.filter(p =>
      p.left.value && p.right.value
    )

    if (validPairs.length < 2) {
      setError('لازم يكون فيه زوجين مكتملين على الأقل')
      return
    }

    // ✅ تجهيز المحتوى
    const content = {
      pairs: validPairs.map(p => ({
        left: { type: p.left.type, value: p.left.value },
        right: { type: p.right.type, value: p.right.value }
      }))
    }

    setSaving(true)

    try {
      const res = await fetch('/api/teacher/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          group_id: selectedGroup,
          title: title.trim(),
          game_type: 'matching',
          mode: mode,
          content: content
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم إنشاء اللعبة بنجاح!')
      setTimeout(() => {
        router.push('/lehrer/games')
      }, 1000)

    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img src="/logo.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 border-r-black animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-black text-gray-700 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-6">

      {/* ═══ Header ═══ */}
      <div className="bg-red-600 text-white shadow-lg sticky top-0 z-30 safe-top">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
              <h1 className="text-base md:text-xl font-extrabold truncate">🎮 لعبة جديدة</h1>
            </div>
            <button
              onClick={() => router.push('/lehrer/games')}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors flex-shrink-0 active:scale-95"
            >
              ← رجوع
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6">

        {/* ═══ Alerts ═══ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-3 md:mb-4 font-bold text-xs md:text-sm fade-in-up">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 md:px-4 py-2.5 md:py-3 rounded-lg mb-3 md:mb-4 font-bold text-xs md:text-sm fade-in-up">
            {success}
          </div>
        )}

        {/* ═══ في حالة مفيش مجموعات ═══ */}
        {groups.length === 0 ? (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 md:p-8 text-center fade-in-up">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-base md:text-lg font-extrabold text-yellow-800 mb-2">
              مفيش مجموعات عندك
            </p>
            <p className="text-xs md:text-sm font-bold text-yellow-700">
              لازم يكون عندك مجموعة أول عشان تعمل لعبة
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

            {/* ═══════════════════════════════ */}
            {/* 1. المعلومات الأساسية */}
            {/* ═══════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-gray-100">
              <h2 className="text-base md:text-lg font-extrabold mb-4 text-gray-800 flex items-center gap-2">
                📝 المعلومات الأساسية
              </h2>

              {/* اسم اللعبة */}
              <div className="mb-4">
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  اسم اللعبة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 md:px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 font-bold text-sm md:text-base transition-colors"
                  placeholder="مثال: كلمات الدرس الأول"
                />
              </div>

              {/* المجموعة */}
              <div className="mb-4">
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  المجموعة <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3.5 md:px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 font-bold text-sm md:text-base"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      📚 {g.name} - {g.level_code}
                    </option>
                  ))}
                </select>
              </div>

              {/* الوضع */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">
                  وضع اللعب <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('solo')}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                      mode === 'solo'
                        ? 'bg-blue-50 border-blue-400 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl md:text-3xl mb-1">👤</div>
                    <div className={`font-extrabold text-sm md:text-base ${mode === 'solo' ? 'text-blue-800' : 'text-gray-700'}`}>
                      فردي
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-500 font-bold mt-0.5">
                      كل طالب يلعب لوحده
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('teams')}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                      mode === 'teams'
                        ? 'bg-purple-50 border-purple-400 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl md:text-3xl mb-1">👥</div>
                    <div className={`font-extrabold text-sm md:text-base ${mode === 'teams' ? 'text-purple-800' : 'text-gray-700'}`}>
                      فرق
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-500 font-bold mt-0.5">
                      الطلاب يتقسموا فرق
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════ */}
            {/* 2. الأزواج (Pairs) */}
            {/* ═══════════════════════════════ */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4 gap-2">
                <h2 className="text-base md:text-lg font-extrabold text-gray-800 flex items-center gap-2">
                  🎯 الأزواج ({pairs.length})
                </h2>
              </div>

              {/* شرح */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 md:p-3 mb-4">
                <p className="text-[11px] md:text-xs font-bold text-blue-700">
                  💡 كل زوج = كلمة + مطابقتها. ممكن تكون نص أو صورة.
                </p>
              </div>

              {/* الأزواج */}
              <div className="space-y-3 md:space-y-4">
                {pairs.map((pair, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-3 md:p-4 border-2 border-gray-200">
                    {/* رأس الزوج */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs md:text-sm font-extrabold text-gray-700">
                        زوج #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePair(index)}
                        disabled={pairs.length <= 1}
                        className="text-red-500 hover:text-red-700 text-xs md:text-sm font-bold disabled:opacity-30 active:scale-90 p-1"
                      >
                        🗑️ حذف
                      </button>
                    </div>

                    {/* الطرفان */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Left */}
                      <PairInput
                        side="left"
                        pair={pair.left}
                        uploading={uploading[`${index}-left`]}
                        onTypeChange={(t) => changePairType(index, 'left', t)}
                        onValueChange={(v) => updatePairValue(index, 'left', v)}
                        onUpload={(file) => handleUploadImage(index, 'left', file)}
                      />

                      {/* Right */}
                      <PairInput
                        side="right"
                        pair={pair.right}
                        uploading={uploading[`${index}-right`]}
                        onTypeChange={(t) => changePairType(index, 'right', t)}
                        onValueChange={(v) => updatePairValue(index, 'right', v)}
                        onUpload={(file) => handleUploadImage(index, 'right', file)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* زر إضافة زوج */}
              <button
                type="button"
                onClick={addPair}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-extrabold py-3 rounded-xl transition-colors active:scale-95 text-sm md:text-base"
              >
                ➕ إضافة زوج جديد
              </button>
            </div>

            {/* ═══════════════════════════════ */}
            {/* 3. زر الحفظ */}
            {/* ═══════════════════════════════ */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-base md:text-lg btn-app"
            >
              {saving ? '⏳ جاري الحفظ...' : '✅ إنشاء اللعبة'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// مكون الزوج (نص / صورة)
// ═══════════════════════════════════════════════
function PairInput({ side, pair, uploading, onTypeChange, onValueChange, onUpload }) {
  const sideLabel = side === 'left' ? '🔵 الطرف الأول' : '🔴 الطرف الثاني'

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] md:text-xs font-bold text-gray-600">
          {sideLabel}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onTypeChange('text')}
            className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-bold transition-colors active:scale-95 ${
              pair.type === 'text'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📝 نص
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('image')}
            className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-bold transition-colors active:scale-95 ${
              pair.type === 'image'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🖼️ صورة
          </button>
        </div>
      </div>

      {/* حقل النص */}
      {pair.type === 'text' && (
        <input
          type="text"
          value={pair.value}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-bold text-xs md:text-sm focus:outline-none focus:border-blue-500"
          placeholder="اكتب النص..."
        />
      )}

      {/* رفع الصورة */}
      {pair.type === 'image' && (
        <div>
          {pair.value ? (
            <div className="relative">
              <img
                src={`/api/files/preview?key=${encodeURIComponent(pair.value)}`}
                alt="صورة"
                className="w-full h-24 md:h-32 object-contain rounded-lg bg-gray-50 border border-gray-200"
                onError={(e) => {
                  e.target.parentElement.innerHTML = '<p class="text-red-500 text-xs font-bold text-center py-4">⚠️ تعذر تحميل الصورة</p>'
                }}
              />
              <button
                type="button"
                onClick={() => onValueChange('')}
                className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold active:scale-90"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-24 md:h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              {uploading ? (
                <div className="text-center">
                  <div className="text-2xl animate-pulse mb-1">⏳</div>
                  <p className="text-[10px] md:text-xs font-bold text-blue-600">جاري الرفع...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl mb-1">📸</div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-600">اضغط لرفع صورة</p>
                  <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5">حد أقصى 10MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUpload(e.target.files[0])}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}
    </div>
  )
}