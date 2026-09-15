// Système de design InspectPro — repris du web (palette bleu foncé) pour
// une cohérence visuelle entre les deux apps.

export const theme = {
  colors: {
    navy900: '#0A1628',
    navy800: '#0F1F38',
    navy700: '#152A4A',
    navy600: '#1C3A61',
    navy500: '#25507F',

    accent: '#2563EB',
    accentSoft: '#EFF4FF',

    bgPage: '#F4F6FB',
    surface: '#FFFFFF',
    border: '#E4E9F2',
    borderStrong: '#CBD5E5',

    textPrimary: '#101828',
    textSecondary: '#5B6472',
    textMuted: '#8A93A2',
    textOnDark: '#E7ECF7',
    textOnDarkMuted: '#93A0BD',

    success: '#16A34A',
    successSoft: '#E9F9EF',
    warning: '#D97706',
    warningSoft: '#FDF3E3',
    danger: '#DC2626',
    dangerSoft: '#FDECEC',
    dangerStrong: '#7A1212',
    neutral: '#8A93A2',
    neutralSoft: '#F1F3F7',
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 },
  spacing: (n) => n * 4,
}

// Statut d'inspection -> couleur + libellé FR (identique au web)
export const STATUT_INSPECTION = {
  en_cours: { label: 'En cours', couleur: theme.colors.warning, fond: theme.colors.warningSoft },
  terminee: { label: 'Terminée', couleur: theme.colors.accent, fond: theme.colors.accentSoft },
  validee: { label: 'Validée', couleur: theme.colors.success, fond: theme.colors.successSoft },
  archivee: { label: 'Archivée', couleur: theme.colors.textSecondary, fond: theme.colors.neutralSoft },
}

export const STATUT_CONTROLE = {
  C: { fg: '#16A34A', label: 'Conforme' },
  O: { fg: '#D97706', label: 'Observation' },
  NC: { fg: '#EA580C', label: 'Non conforme' },
  DM: { fg: '#DC2626', label: 'Défaut majeur' },
  DI: { fg: '#7A1212', label: 'Danger immédiat' },
  NA: { fg: '#8A93A2', label: 'Non applicable' },
}
