/**
 * Every string the admin dashboard shows (Hebrew, RTL). Keep them here, not in the components.
 * House rules: no em-dashes, no dot-forms; infinitives and "מי ש" instead.
 */

export const ADMIN = {
  title: 'לוח הבקרה של MESSY',
  subtitle: 'כל מי שנכנס למערכת, ואיפה כל אחד עומד',
  logoAlt: 'lionelmitelpunkt /messy',

  loading: 'טוען את התמונה מהמחסן',
  loadFailed: 'לא הצלחתי לקרוא מהמחסן. אפשר לנסות שוב.',
  unauthorized: 'אין הרשאה. לרענן את הדף ולהזין שם וסיסמה.',
  noStore: 'אין חיבור למחסן (BLOB_READ_WRITE_TOKEN לא מוגדר).',
  retry: 'לנסות שוב',
  refresh: 'לרענן',
  generatedAt: 'נכון לשעה',

  counters: {
    interviews: 'ראיונות',
    held: 'בהמתנה לשחרור',
    previewsLive: 'תצוגות באוויר',
    mailed: 'נשלחו מיילים',
    paid: 'שילמו',
    tombstoned: 'נמחקו',
  },

  people: {
    heading: 'אנשים',
    empty: 'עדיין אין אף אחד במערכת.',
    unnamed: 'ללא שם',
    createdAt: 'נקלט בתאריך',
    expiresAt: 'התמליל נמחק בתאריך',
    emailYes: 'השאיר מייל',
    emailNo: 'בלי מייל',
    tombstoned: 'נמחק',
    paid: 'שילם',
    comments: 'הערות',
    stageLabel: 'שלב',
    heldTag: 'עצור',
    previewLink: 'תצוגה',
    ownerLink: 'דף הבעלים',
    mailHeading: 'מיילים',
    mail: {
      preview: 'תצוגה',
      reminder: 'תזכורת',
      end: 'סיום',
    },
    mailStatus: {
      sent: 'נשלח',
      scheduled: 'מתוזמן',
      cancelled: 'בוטל',
      none: 'לא נשלח',
    },
    release: 'לשחרר',
    markPaid: 'התקבל תשלום',
    purge: 'למחוק',
    confirmPurge: (name: string) => `למחוק את כל מה שיש על ${name}? זה כולל את האתר, הקבצים והרשומה. אי אפשר לבטל.`,
    confirmYes: 'כן, למחוק',
    confirmNo: 'ביטול',
    cancelReminder: 'לבטל תזכורת',
    commandSent: 'ההוראה נרשמה, הרץ הבא בתוך 10 דקות',
    commandFailed: 'ההוראה לא נרשמה. אפשר לנסות שוב.',
    structureTag: {
      ok: 'מבנה תקין',
      warn: 'אזהרת מבנה',
      fail: 'מבנה נכשל',
    },
    pendingTag: {
      release: 'שחרור ממתין',
      purge: 'מחיקה ממתינה',
      paid: 'רישום התשלום ממתין',
      cancel_reminder: 'ביטול תזכורת ממתין',
    },
    busy: 'רושם',
  },

  stages: {
    none: 'חדש',
    intake: 'נקלט',
    content: 'תוכן',
    illustrate: 'איור',
    structure: 'מבנה',
    build: 'נבנה',
    deploy_preview: 'תצוגה באוויר',
    email_preview: 'מייל נשלח',
    comments: 'הערות',
    fix: 'תיקון',
    go_live: 'באוויר',
  },

  founding: {
    heading: 'מונה המקימים',
    count: 'מקימים',
    paid: 'שילמו',
    openLocks: 'מקומות שמורים',
    missing: 'אין עדיין קובץ מונה',
  },

  digest: {
    heading: 'היומן',
    empty: 'אין עדיין יומן במחסן.',
  },
} as const;
