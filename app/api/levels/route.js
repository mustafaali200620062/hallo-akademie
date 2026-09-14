import { NextResponse } from 'next/server'
import { db } from '@/db'
import { levels } from '@/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    const allLevels = await db
      .select()
      .from(levels)
      .orderBy(asc(levels.code))

    return NextResponse.json(allLevels || [])
  } catch (error) {
    console.error('❌ Error fetching levels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}