'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerGroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupStudents, setGroupStudents] = useState([])
  const [groupLessons, setGroupLessons] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [teacherId, setTeacherId] = useState(null)

  // ✅ حالة نافذة تعديل النقاط
  const [pointsModal, setPointsModal] = useState({
    open: false,
    student: null,
    mode: 'add', // 'add' | 'subtract'
    points: '',
    reason: '',
    saving: false,
  })

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
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()

      if (groupsRes.ok) {
        const teacherGroups = groupsData.filter(g => g.teacher_id === tId)
        setGroups(teacherGroups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      setError('حدث خطأ في جلب المجموعات')
    } finally {
      setLoading(false)
    }
  }

  // ✅ فتح تفاصيل المجموعة
  const openGroupDetails = async (group) => {
    setSelectedGroup(group)

    try {
      const studentsRes = await fetch(`/api/groups/students?group_id=${group.id}`)
      const studentsData = await studentsRes.json()
      if (studentsRes.ok) setGroupStudents(studentsData || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }

    try {
      const lessonsRes = await fetch(`/api/groups/lessons?group_id=${group.id}`)
      const lessonsData = await lessonsRes.json()
      if (lessonsRes.ok) setGroupLessons(lessonsData || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  // ✅ إعادة تحميل الطلاب
  const reloadStudents = async () => {
    if (!selectedGroup) return
    try {
      const res = await fetch(`/api/groups/students?group_id=${selectedGroup.id}`)
      const data = await res.json()
      if (res.ok) setGroupStudents(data || [])
    } catch (error) {
      console.error('Error reloading students:', error)
    }
  }

  // ✅ فتح نافذة تعديل النقاط
  const openPointsModal = (student, mode) => {
    setPointsModal({
      open: true,
      student,
      mode, // 'add' | 'subtract'
      points: '',
      reason: '',
      saving: false,
    })
  }

  const closePointsModal = () => {
    setPointsModal({
      open: false,
      student: null,
      mode: 'add',
      points: '',
      reason: '',
      saving: false,
    })
  }

  // ✅ حفظ تعديل النقاط
  const handleSavePoints = async () => {
    const points = parseInt(pointsModal.points)

    if (!points || points <= 0) {
      setError('يجب إدخال قيمة صحيحة أكبر من صفر')
      return
    }

    // ✅ القيمة النهائية (سالب أو موجب)
    const pointsChange = pointsModal.mode === 'add' ? points : -points

    // ✅ التحقق من عدم تجاوز الرصيد
    const currentTotal = pointsModal.student.total_points || 0
    if (pointsChange < 0 && Math.abs(pointsChange) > currentTotal) {
      setError(`لا يمكن خصم ${Math.abs(pointsChange)} نقطة - رصيد الطالب الحالي ${currentTotal} نقطة`)
      return
    }

    setPointsModal(prev => ({ ...prev, saving: true }))
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/teacher/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: pointsModal.student.student_id,
          teacher_id: teacherId,
          points_change: pointsChange,
          reason: pointsModal.reason.trim() || null,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess(data.message || '✅ تم تحديث النقاط بنجاح')
      closePointsModal()
      await reloadStudents()
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      setError(err.message)
      setPointsModal(prev => ({ ...prev, saving: false }))
    }
  }

  // ✅ حذف شرح
  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشرح من المجموعة؟')) return

    try {
      const res = await fetch(`/api/groups/lessons?lesson_id=${lessonId}&group_id=${selectedGroup.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('✅ تم حذف الشرح من المجموعة')
      await openGroupDetails(selectedGroup)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error.message)
    }
  }

  // ✅ معاينة شرح
  const handlePreview = async (lessonId) => {
    try {
      const res = await fetch(`/api/files/${lessonId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setError(error.message)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
              <h1 className="text-base md:text-xl font-extrabold truncate">
                {selectedGroup ? `📋 ${selectedGroup.name}` : 'مجموعاتي'}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {selectedGroup && (
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="bg-white/20 hover:bg-white/30 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors active:scale-95"
                >
                  ← رجوع
                </button>
              )}
              <button
                onClick={() => router.push('/lehrer')}
                className="bg-white/20 hover:bg-white/30 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-colors active:scale-95"
              >
                🏠
              </button>
            </div>
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

        {/* ═══ قائمة المجموعات ═══ */}
        {!selectedGroup && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {groups.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center text-gray-500 fade-in-up">
                <div className="text-5xl md:text-6xl mb-4">📭</div>
                <p className="text-base md:text-lg font-bold">لا توجد مجموعات مخصصة لك</p>
              </div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => openGroupDetails(group)}
                  className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition-all text-right border-2 border-transparent hover:border-red-400 active:scale-[0.98] fade-in-up"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg md:text-xl font-extrabold text-gray-900 truncate">{group.name}</h2>
                    <span className="text-2xl flex-shrink-0">📚</span>
                  </div>
                  <span className="inline-block px-2.5 md:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs md:text-sm font-bold">
                    {group.level_code} - {group.level_title}
                  </span>
                  <p className="text-gray-600 text-xs md:text-sm mt-3 line-clamp-2">
                    {group.description || 'لا يوجد وصف'}
                  </p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2 font-bold">
                    اضغط لعرض التفاصيل ←
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {/* ═══ تفاصيل المجموعة ═══ */}
        {selectedGroup && (
          <div className="fade-in-up">
            {/* معلومات المجموعة */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 truncate">{selectedGroup.name}</h2>
                <span className="px-2.5 md:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs md:text-sm font-bold flex-shrink-0">
                  {selectedGroup.level_code}
                </span>
              </div>
              <p className="text-gray-600 text-xs md:text-sm mt-2">{selectedGroup.description || 'لا يوجد وصف'}</p>
            </div>

            {/* الطلاب */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-extrabold text-gray-800 mb-4">
                👨‍🎓 الطلاب ({groupStudents.length})
              </h3>

              {groupStudents.length === 0 ? (
                <p className="text-gray-500 font-bold text-center py-4 text-sm md:text-base">لا يوجد طلاب</p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {groupStudents.map((student) => (
                    <div key={student.id} className="p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                            {student.full_name?.charAt(0) || 'S'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-gray-900 text-sm md:text-base truncate">
                              {student.full_name}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-500 font-bold truncate" dir="ltr">
                              📱 {student.phone || 'بدون رقم'}
                            </p>
                          </div>
                        </div>

                        {/* النقاط */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg px-2.5 md:px-3 py-1 text-center">
                            <div className="text-[9px] md:text-xs text-yellow-700 font-bold">النقاط</div>
                            <div className="text-sm md:text-lg font-extrabold text-yellow-800">
                              {student.total_points || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* الأزرار */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPointsModal(student, 'add')}
                          className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-extrabold py-2 md:py-2.5 rounded-lg transition-colors text-xs md:text-sm active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          ➕ زيادة
                        </button>
                        <button
                          onClick={() => openPointsModal(student, 'subtract')}
                          className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-extrabold py-2 md:py-2.5 rounded-lg transition-colors text-xs md:text-sm active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          ➖ خصم
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* الشروح */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
              <h3 className="text-base md:text-lg font-extrabold text-gray-800 mb-4">
                📖 الشروح ({groupLessons.length})
              </h3>
              {groupLessons.length === 0 ? (
                <p className="text-gray-500 font-bold text-center py-4 text-sm md:text-base">لا توجد شروح في هذه المجموعة</p>
              ) : (
                <div className="space-y-3">
                  {groupLessons.map((lesson) => (
                    <div key={lesson.id} className="p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-2 md:gap-3 mt-2 text-[10px] md:text-xs text-gray-500 font-bold flex-wrap">
                            <span>📅 {formatDate(lesson.assigned_at || lesson.created_at)}</span>
                            <span>👤 {lesson.creator_name || 'الإدارة'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handlePreview(lesson.id)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-[11px] md:text-sm px-2.5 md:px-3 py-1 bg-blue-50 rounded-lg active:scale-95"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-red-600 hover:text-red-800 font-bold text-[11px] md:text-sm px-2.5 md:px-3 py-1 bg-red-50 rounded-lg active:scale-95"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ نافذة تعديل النقاط ═══ */}
      {pointsModal.open && pointsModal.student && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in-up"
          onClick={closePointsModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header النافذة */}
            <div className={`p-4 md:p-5 ${pointsModal.mode === 'add' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base md:text-lg font-extrabold">
                  {pointsModal.mode === 'add' ? '➕ زيادة نقاط' : '➖ خصم نقاط'}
                </h3>
                <button
                  onClick={closePointsModal}
                  className="text-white/80 hover:text-white text-xl md:text-2xl p-1 active:scale-90"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs md:text-sm mt-1 opacity-90 font-bold">
                {pointsModal.student.full_name}
              </p>
            </div>

            {/* Body النافذة */}
            <div className="p-4 md:p-5 space-y-4">

              {/* النقاط الحالية */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs md:text-sm font-bold text-yellow-700">الرصيد الحالي</span>
                <span className="text-lg md:text-xl font-extrabold text-yellow-800">
                  {pointsModal.student.total_points || 0}
                </span>
              </div>

              {/* عدد النقاط */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  عدد النقاط <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={pointsModal.points}
                  onChange={(e) => setPointsModal(prev => ({ ...prev, points: e.target.value }))}
                  className="w-full px-3.5 md:px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 font-extrabold text-center text-lg md:text-xl"
                  placeholder="5"
                  dir="ltr"
                  autoFocus
                />
              </div>

              {/* السبب */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">
                  السبب (اختياري)
                </label>
                <textarea
                  value={pointsModal.reason}
                  onChange={(e) => setPointsModal(prev => ({ ...prev, reason: e.target.value }))}
                  rows="2"
                  className="w-full px-3.5 md:px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 font-medium text-sm md:text-base resize-none"
                  placeholder="مثال: أداء ممتاز في الحصة..."
                />
              </div>

              {/* معاينة النتيجة */}
              {pointsModal.points && parseInt(pointsModal.points) > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
                  <span className="text-xs md:text-sm font-bold text-gray-600">
                    الرصيد بعد التعديل:{' '}
                  </span>
                  <span className="font-extrabold text-base md:text-lg text-gray-900">
                    {pointsModal.mode === 'add'
                      ? (pointsModal.student.total_points || 0) + parseInt(pointsModal.points)
                      : (pointsModal.student.total_points || 0) - parseInt(pointsModal.points)
                    }
                  </span>
                </div>
              )}

              {/* الأزرار */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={closePointsModal}
                  disabled={pointsModal.saving}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-colors text-sm md:text-base active:scale-95 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSavePoints}
                  disabled={pointsModal.saving || !pointsModal.points}
                  className={`flex-1 text-white font-extrabold py-3 rounded-xl transition-colors text-sm md:text-base active:scale-95 disabled:opacity-50 ${
                    pointsModal.mode === 'add'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {pointsModal.saving ? '⏳ جاري الحفظ...' : '✅ تأكيد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}