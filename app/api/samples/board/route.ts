import { getSampleBoard } from '@/lib/actions/samples'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await getSampleBoard()
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({
      samples: result.samples,
      timestamp: result.timestamp,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
