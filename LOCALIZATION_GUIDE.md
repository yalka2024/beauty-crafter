# Localization (i18n) Setup Guide

## Steps
1. Install i18n library (e.g., next-i18next, react-i18next)
2. Create `public/locales/{lang}/common.json` for each language
3. Wrap app with i18n provider in `_app.tsx`
4. Use `t('key')` for all user-facing text
5. Add language switcher to UI
6. Test translations on all pages

## Example (next-i18next)
- https://github.com/isaachinman/next-i18next

_Last updated: [DATE]_
