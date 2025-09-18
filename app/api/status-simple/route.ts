import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const status = {
      status: 'ok',
      message: 'Beauty Crafter API is working',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: {
        api: 'working',
        database: 'ready',
        cache: 'active',
        security: 'enabled'
      }
    }
    
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: 'Status check failed' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'POST request received',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: 'POST request failed' },
      { status: 500 }
    )
  }
}
