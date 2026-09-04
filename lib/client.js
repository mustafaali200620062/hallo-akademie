// هذا الملف للاستخدام في Client Components فقط

// دالة لجلب البروفايل
export async function fetchProfile() {
  try {
    const res = await fetch('/api/profile')
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

// دالة لجلب الطلاب
export async function fetchStudents() {
  try {
    const res = await fetch('/api/students')
    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error('Error fetching students:', error)
    return []
  }
}

// دالة لجلب طلبات الانضمام
export async function fetchRequests() {
  try {
    const res = await fetch('/api/requests')
    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error('Error fetching requests:', error)
    return []
  }
}

// دالة لجلب الإحصائيات
export async function fetchStats() {
  try {
    const res = await fetch('/api/stats')
    if (!res.ok) return { students: 0, teachers: 0, assistants: 0, pendingRequests: 0 }
    return await res.json()
  } catch (error) {
    console.error('Error fetching stats:', error)
    return { students: 0, teachers: 0, assistants: 0, pendingRequests: 0 }
  }
}