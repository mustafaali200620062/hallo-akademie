'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LehrerLessonsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allFiles, setAllFiles] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedGroups, setSelectedGroups] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

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
    await fetchData(parsed.id)
  }

  const fetchData = async (teacherId) => {
    try {
      // ✅ جلب جميع الملفات
      const filesRes = await fetch('/api/lessons')
      const filesData = await filesRes.json()
      if (filesRes.ok) setAllFiles(filesData || [])

      // ✅ جلب مجموعات المدرس
      const groupsRes = await fetch('/api/groups')
      const groupsData = await groupsRes.json()
      if (groupsRes.ok) {
        const teacherGroups = groupsData.filter(g => g.teacher_id === teacherId)
        setGroups(teacherGroups || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('حدث خطأ في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  // ✅ فتح نافذة اختيار المجموعات
  const openAssignModal = (file) => {
    setSelectedFile(file)
    setSelectedGroups([])
  }

  // ✅ تبديل اختيار المجموعة
  const toggleGroup = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId))
    } else {
      setSelectedGroups([...selectedGroups, groupId])
    }
  }

  // ✅ إضافة الملف للمجموعات المختارة
  const handleAssign = async () => {
    if (selectedGroups.length === 0) {
      setError('يرجى اختيار مجموعة واحدة على الأقل')
      return
    }

    try {
      const res = await fetch('/api/lessons/assign-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: selectedFile.id,
          group_ids: selectedGroups,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess(`✅ تم إضافة الملف لـ ${selectedGroups.length} مجموعة`)
      setSelectedFile(null)
      setSelectedGroups([])
      const userData = JSON.parse(localStorage.getItem('user'))
      await fetchData(userData.id)
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      setError(error.message)
    }
  }

  // ✅ معاينة ملف
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold">الشرح</h1>
            </div>
            <button
              onClick={() => router.push('/lehrer')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              ← العودة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 font-bold">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 font-bold">
            {success}
          </div>
        )}

        {groups.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4 font-bold">
            ⚠️ لا توجد مجموعات مخصصة لك. تواصل مع الإدارة.
          </div>
        )}

        {/* قائمة الملفات */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              📚 جميع الملفات المتاحة ({allFiles.length})
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              اختر ملف عشان تضيفه لمجموعاتك
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">العنوان</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المستوى</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">المجموعة الحالية</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allFiles.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-bold">
                      <div className="text-4xl mb-2">📭</div>
                      لا توجد ملفات متاحة
                    </td>
                  </tr>
                ) : (
                  allFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{file.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {file.level_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-bold">
                        {file.group_name || 'غير معين'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handlePreview(file.id)}
                          className="text-blue-600 hover:text-blue-800 font-bold transition-colors mr-3"
                        >
                          👁️ معاينة
                        </button>
                        {groups.length > 0 && (
                          <button
                            onClick={() => openAssignModal(file)}
                            className="text-purple-600 hover:text-purple-800 font-bold transition-colors"
                          >
                            ➕ إضافة لمجموعة
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ✅ نافذة اختيار المجموعات */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                ➕ إضافة ملف لمجموعات
              </h2>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900">📄 {selectedFile.title}</p>
                <p className="text-sm text-gray-600">المستوى: {selectedFile.level_code}</p>
              </div>

              <label className="block text-sm font-bold text-gray-700 mb-3">
                اختر المجموعات ({selectedGroups.length} مختارة):
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groups.map((group) => (
                  <label
                    key={group.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedGroups.includes(group.id)
                        ? 'bg-purple-50 border-purple-400'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="font-bold text-gray-900">
                      {group.name} - {group.level_code}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAssign}
                  disabled={selectedGroups.length === 0}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  ✅ إضافة ({selectedGroups.length})
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}