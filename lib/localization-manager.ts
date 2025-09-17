import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface LanguageData {
  code: string
  name: string
  nativeName: string
  isActive: boolean
  isDefault: boolean
}

export interface TranslationData {
  languageId: string
  key: string
  value: string
  context?: string
}

export interface LocalizedContent {
  [key: string]: string
}

export class LocalizationManager {
  private supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', isDefault: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', isDefault: false },
    { code: 'fr', name: 'French', nativeName: 'Français', isDefault: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', isDefault: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', isDefault: false },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', isDefault: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', isDefault: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
    { code: 'ko', name: 'Korean', nativeName: '한국어', isDefault: false },
    { code: 'zh', name: 'Chinese', nativeName: '中文', isDefault: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', isDefault: false },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isDefault: false }
  ]

  private defaultTranslations = {
    en: {
      'welcome.title': 'Welcome to Beauty Crafter',
      'welcome.subtitle': 'Your beauty services platform',
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.forgot_password': 'Forgot Password?',
      'booking.title': 'Book Your Service',
      'booking.select_service': 'Select Service',
      'booking.select_provider': 'Select Provider',
      'booking.select_date': 'Select Date',
      'booking.select_time': 'Select Time',
      'booking.confirm': 'Confirm Booking',
      'profile.title': 'Profile',
      'profile.edit': 'Edit Profile',
      'profile.save': 'Save Changes',
      'services.title': 'Services',
      'services.search': 'Search Services',
      'services.filter': 'Filter',
      'reviews.title': 'Reviews',
      'reviews.write': 'Write Review',
      'reviews.rating': 'Rating',
      'reviews.comment': 'Comment',
      'notifications.title': 'Notifications',
      'notifications.mark_read': 'Mark as Read',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.notifications': 'Notifications',
      'settings.privacy': 'Privacy',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.confirm': 'Confirm',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success',
      'common.required': 'This field is required',
      'common.invalid_email': 'Invalid email address',
      'common.password_too_short': 'Password must be at least 8 characters',
      'common.terms_agreement': 'I agree to the Terms of Service',
      'common.privacy_agreement': 'I agree to the Privacy Policy'
    },
    es: {
      'welcome.title': 'Bienvenido a Beauty Crafter',
      'welcome.subtitle': 'Tu plataforma de servicios de belleza',
      'auth.login': 'Iniciar Sesión',
      'auth.register': 'Registrarse',
      'auth.email': 'Correo Electrónico',
      'auth.password': 'Contraseña',
      'auth.forgot_password': '¿Olvidaste tu contraseña?',
      'booking.title': 'Reserva tu Servicio',
      'booking.select_service': 'Seleccionar Servicio',
      'booking.select_provider': 'Seleccionar Proveedor',
      'booking.select_date': 'Seleccionar Fecha',
      'booking.select_time': 'Seleccionar Hora',
      'booking.confirm': 'Confirmar Reserva',
      'profile.title': 'Perfil',
      'profile.edit': 'Editar Perfil',
      'profile.save': 'Guardar Cambios',
      'services.title': 'Servicios',
      'services.search': 'Buscar Servicios',
      'services.filter': 'Filtrar',
      'reviews.title': 'Reseñas',
      'reviews.write': 'Escribir Reseña',
      'reviews.rating': 'Calificación',
      'reviews.comment': 'Comentario',
      'notifications.title': 'Notificaciones',
      'notifications.mark_read': 'Marcar como Leído',
      'settings.title': 'Configuración',
      'settings.language': 'Idioma',
      'settings.notifications': 'Notificaciones',
      'settings.privacy': 'Privacidad',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.confirm': 'Confirmar',
      'common.back': 'Atrás',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior',
      'common.loading': 'Cargando...',
      'common.error': 'Ocurrió un error',
      'common.success': 'Éxito',
      'common.required': 'Este campo es obligatorio',
      'common.invalid_email': 'Dirección de correo inválida',
      'common.password_too_short': 'La contraseña debe tener al menos 8 caracteres',
      'common.terms_agreement': 'Acepto los Términos de Servicio',
      'common.privacy_agreement': 'Acepto la Política de Privacidad'
    }
  }

  /**
   * Initialize supported languages
   */
  async initializeLanguages(): Promise<void> {
    try {
      for (const lang of this.supportedLanguages) {
        await prisma.language.upsert({
          where: { code: lang.code },
          update: lang,
          create: lang
        })
      }

      // Initialize default translations
      await this.initializeDefaultTranslations()
    } catch (error) {
      console.error('Error initializing languages:', error)
      throw new Error('Failed to initialize languages')
    }
  }

  /**
   * Initialize default translations
   */
  private async initializeDefaultTranslations(): Promise<void> {
    try {
      for (const [langCode, translations] of Object.entries(this.defaultTranslations)) {
        const language = await prisma.language.findUnique({
          where: { code: langCode }
        })

        if (!language) continue

        for (const [key, value] of Object.entries(translations)) {
          await prisma.translation.upsert({
            where: {
              languageId_key: {
                languageId: language.id,
                key
              }
            },
            update: { value },
            create: {
              languageId: language.id,
              key,
              value
            }
          })
        }
      }
    } catch (error) {
      console.error('Error initializing default translations:', error)
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages() {
    try {
      const languages = await prisma.language.findMany({
        where: { isActive: true },
        orderBy: { isDefault: 'desc' }
      })

      return languages
    } catch (error) {
      console.error('Error getting supported languages:', error)
      throw new Error('Failed to get supported languages')
    }
  }

  /**
   * Get translations for a language
   */
  async getTranslations(languageCode: string): Promise<LocalizedContent> {
    try {
      const language = await prisma.language.findUnique({
        where: { code: languageCode }
      })

      if (!language) {
        // Fallback to default language
        const defaultLanguage = await prisma.language.findFirst({
          where: { isDefault: true }
        })

        if (!defaultLanguage) {
          return {}
        }

        return await this.getTranslations(defaultLanguage.code)
      }

      const translations = await prisma.translation.findMany({
        where: { languageId: language.id }
      })

      const localizedContent: LocalizedContent = {}
      translations.forEach(translation => {
        localizedContent[translation.key] = translation.value
      })

      return localizedContent
    } catch (error) {
      console.error('Error getting translations:', error)
      return {}
    }
  }

  /**
   * Get translation for a specific key
   */
  async getTranslation(languageCode: string, key: string): Promise<string> {
    try {
      const language = await prisma.language.findUnique({
        where: { code: languageCode }
      })

      if (!language) {
        // Fallback to default language
        const defaultLanguage = await prisma.language.findFirst({
          where: { isDefault: true }
        })

        if (!defaultLanguage) {
          return key
        }

        return await this.getTranslation(defaultLanguage.code, key)
      }

      const translation = await prisma.translation.findUnique({
        where: {
          languageId_key: {
            languageId: language.id,
            key
          }
        }
      })

      return translation?.value || key
    } catch (error) {
      console.error('Error getting translation:', error)
      return key
    }
  }

  /**
   * Add or update translation
   */
  async setTranslation(
    languageCode: string,
    key: string,
    value: string,
    context?: string
  ): Promise<void> {
    try {
      const language = await prisma.language.findUnique({
        where: { code: languageCode }
      })

      if (!language) {
        throw new Error('Language not found')
      }

      await prisma.translation.upsert({
        where: {
          languageId_key: {
            languageId: language.id,
            key
          }
        },
        update: { value, context },
        create: {
          languageId: language.id,
          key,
          value,
          context
        }
      })
    } catch (error) {
      console.error('Error setting translation:', error)
      throw new Error('Failed to set translation')
    }
  }

  /**
   * Detect user language from request
   */
  detectLanguageFromRequest(request: Request): string {
    try {
      const acceptLanguage = request.headers.get('accept-language')
      if (!acceptLanguage) return 'en'

      const languages = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase())

      // Check if any of the user's preferred languages are supported
      for (const lang of languages) {
        const supportedLang = this.supportedLanguages.find(
          supported => supported.code === lang || supported.code === lang.split('-')[0]
        )
        if (supportedLang) {
          return supportedLang.code
        }
      }

      return 'en' // Default fallback
    } catch (error) {
      console.error('Error detecting language:', error)
      return 'en'
    }
  }

  /**
   * Get localized date format
   */
  getLocalizedDateFormat(languageCode: string): string {
    const dateFormats: Record<string, string> = {
      'en': 'MM/DD/YYYY',
      'es': 'DD/MM/YYYY',
      'fr': 'DD/MM/YYYY',
      'de': 'DD.MM.YYYY',
      'it': 'DD/MM/YYYY',
      'pt': 'DD/MM/YYYY',
      'ru': 'DD.MM.YYYY',
      'ja': 'YYYY/MM/DD',
      'ko': 'YYYY/MM/DD',
      'zh': 'YYYY/MM/DD',
      'ar': 'DD/MM/YYYY',
      'hi': 'DD/MM/YYYY'
    }

    return dateFormats[languageCode] || 'MM/DD/YYYY'
  }

  /**
   * Get localized currency format
   */
  getLocalizedCurrencyFormat(languageCode: string): string {
    const currencyFormats: Record<string, string> = {
      'en': 'USD',
      'es': 'USD',
      'fr': 'EUR',
      'de': 'EUR',
      'it': 'EUR',
      'pt': 'USD',
      'ru': 'RUB',
      'ja': 'JPY',
      'ko': 'KRW',
      'zh': 'CNY',
      'ar': 'USD',
      'hi': 'INR'
    }

    return currencyFormats[languageCode] || 'USD'
  }

  /**
   * Get localized time format
   */
  getLocalizedTimeFormat(languageCode: string): string {
    const timeFormats: Record<string, string> = {
      'en': '12h',
      'es': '24h',
      'fr': '24h',
      'de': '24h',
      'it': '24h',
      'pt': '24h',
      'ru': '24h',
      'ja': '24h',
      'ko': '24h',
      'zh': '24h',
      'ar': '12h',
      'hi': '12h'
    }

    return timeFormats[languageCode] || '12h'
  }

  /**
   * Get RTL (Right-to-Left) support for language
   */
  isRTLLanguage(languageCode: string): boolean {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur']
    return rtlLanguages.includes(languageCode)
  }

  /**
   * Get localized number format
   */
  getLocalizedNumberFormat(languageCode: string): {
    decimalSeparator: string
    thousandsSeparator: string
  } {
    const numberFormats: Record<string, { decimalSeparator: string; thousandsSeparator: string }> = {
      'en': { decimalSeparator: '.', thousandsSeparator: ',' },
      'es': { decimalSeparator: ',', thousandsSeparator: '.' },
      'fr': { decimalSeparator: ',', thousandsSeparator: ' ' },
      'de': { decimalSeparator: ',', thousandsSeparator: '.' },
      'it': { decimalSeparator: ',', thousandsSeparator: '.' },
      'pt': { decimalSeparator: ',', thousandsSeparator: '.' },
      'ru': { decimalSeparator: ',', thousandsSeparator: ' ' },
      'ja': { decimalSeparator: '.', thousandsSeparator: ',' },
      'ko': { decimalSeparator: '.', thousandsSeparator: ',' },
      'zh': { decimalSeparator: '.', thousandsSeparator: ',' },
      'ar': { decimalSeparator: '.', thousandsSeparator: ',' },
      'hi': { decimalSeparator: '.', thousandsSeparator: ',' }
    }

    return numberFormats[languageCode] || { decimalSeparator: '.', thousandsSeparator: ',' }
  }

  /**
   * Get translation statistics
   */
  async getTranslationStats() {
    try {
      const stats = await prisma.language.findMany({
        include: {
          _count: {
            select: { translations: true }
          }
        }
      })

      return stats.map(lang => ({
        code: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
        isActive: lang.isActive,
        isDefault: lang.isDefault,
        translationCount: lang._count.translations
      }))
    } catch (error) {
      console.error('Error getting translation stats:', error)
      throw new Error('Failed to get translation stats')
    }
  }

  /**
   * Export translations for a language
   */
  async exportTranslations(languageCode: string): Promise<Record<string, string>> {
    try {
      const translations = await this.getTranslations(languageCode)
      return translations
    } catch (error) {
      console.error('Error exporting translations:', error)
      throw new Error('Failed to export translations')
    }
  }

  /**
   * Import translations for a language
   */
  async importTranslations(
    languageCode: string,
    translations: Record<string, string>
  ): Promise<void> {
    try {
      for (const [key, value] of Object.entries(translations)) {
        await this.setTranslation(languageCode, key, value)
      }
    } catch (error) {
      console.error('Error importing translations:', error)
      throw new Error('Failed to import translations')
    }
  }
}

export const localizationManager = new LocalizationManager()
