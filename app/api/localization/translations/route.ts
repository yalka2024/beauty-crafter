import { NextRequest, NextResponse } from 'next/server'
import { localizationManager } from '@/lib/localization-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const languageCode = searchParams.get('lang') || 'en'

    const translations = await localizationManager.getTranslations(languageCode)

    return NextResponse.json({
      success: true,
      data: translations
    })
  } catch (error) {
    console.error('Error getting translations:', error)
    return NextResponse.json(
      { error: 'Failed to get translations' },
      { status: 500 }
    )
  }
}
