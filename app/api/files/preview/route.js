// @ts-nocheck
import { NextResponse } from 'next/server'
import { getFileUrl } from '@/lib/r2'

export async function POST(request) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'File key required' }, { status: 400 })
    }

    const signedUrl = await getFileUrl(key, 3600)

    return NextResponse.json({
      success: true,
      url: signedUrl,
    })
  } catch (error) {
    console.error('❌ Error getting preview URL:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}