export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/login',
        REGISTER: '/register',
        LOGOUT: '/logout',
        UPDATE_PROFILE: '/profile/update',
        CHANGE_PASSWORD: '/profile/change-password',
    },
    NOTIFICATIONS: {
        ALL: '/notifications',
        MARK_READ: (id) => `/notifications/${id}/read`,
        MARK_ALL_READ: '/notifications/read-all',
        DELETE_READ: '/notifications/delete-read',
        ARCHIVE: '/notifications/archive',
        DELETE: (id) => `/notifications/${id}`,
    },
    SESSIONS: {
        ALL: '/sessions',
        REVOKE: (id) => `/sessions/${id}`,
        REVOKE_OTHERS: '/sessions/others',
    },
    USERS: {
        ALL: '/users',
        DELETE: (id) => `/users/${id}`,
        UPDATE: (id) => `/users/${id}`,
        UPDATE_ROLE: (id) => `/users/${id}/role`,
        UPDATE_STATUS: (id) => `/users/${id}/status`,
    },
    SCREENS: {
        ALL: '/screens',
        UPDATE: (id) => `/screens/${id}`,
        DELETE: (id) => `/screens/${id}`,
        AVAILABILITY: (id) => `/screens/${id}/availability`,
        COMMAND: '/screens/command',
    },
    ADS: {
        ALL: '/ads',
        CREATE: '/ads',
        CALCULATE_COST: '/ads/calculate-cost',
        STATUS: (id) => `/ads/${id}/status`,
        DELETE: (id) => `/ads/${id}`
    },
    DURATION_DISCOUNTS: {
        ALL: '/duration-discounts',
        CREATE: '/duration-discounts',
        UPDATE: (id) => `/duration-discounts/${id}`,
        DELETE: (id) => `/duration-discounts/${id}`
    },
    FREQUENCY_PACKAGES: {
        ALL: '/frequency-packages',
        CREATE: '/frequency-packages',
        UPDATE: (id) => `/frequency-packages/${id}`,
        DELETE: (id) => `/frequency-packages/${id}`
    },
    SCREEN_PRICING: {
        ALL: '/screen-pricing-slots',
        UPDATE: (id) => `/screen-pricing-slots/${id}`,
        DELETE: (id) => `/screen-pricing-slots/${id}`
    },
    FINANCIAL: {
        LEDGER: '/financial/ledger',
        MY_EARNINGS: '/financial/my-earnings',
        REQUEST_PAYOUT: '/financial/request-payout',
        APPROVE_PAYOUT: (id) => `/financial/approve-payout/${id}`,
        REJECT_PAYOUT: (id) => `/financial/reject-payout/${id}`,
        APPROVE: (id) => `/financial/approve-payment/${id}`,
        RECORD_PAYMENT: '/financial/payments',
    },
    PAYMENT: {
        METHODS: '/payment-methods',
        METHOD: (id) => `/payment-methods/${id}`
    },
    REPORTS: {
        OWNER_ANALYTICS: '/reports/owner-analytics',
        SCREEN: '/reports/screen'
    },
    PAYMENTS: {
        STRIPE_CREATE_INTENT: '/payments/stripe/create-intent',
        STRIPE_CONFIRM: '/payments/stripe/confirm'
    },
    LOOKUPS: {
        ROLES: '/lookups/roles',
        ROLE: (id) => `/lookups/roles/${id}`,
        GOVERNORATES: '/lookups/governorates',
        GOVERNORATE: (id) => `/lookups/governorates/${id}`,
        REGIONS_BY_GOV: (govId) => `/lookups/governorates/${govId}/regions`,
        REGIONS: '/lookups/regions',
        REGION: (id) => `/lookups/regions/${id}`,
        STREETS_BY_REGION: (regionId) => `/lookups/regions/${regionId}/streets`,
        STREETS: '/lookups/streets',
        STREET: (id) => `/lookups/streets/${id}`,
        SCREEN_TYPES: '/lookups/screen-types',
        CATEGORIES: '/lookups/categories',
        CATEGORY: (id) => `/lookups/categories/${id}`,
        FULL_LOCATION: '/lookups/full-location',
        USERS_BY_ROLE: (roleName) => `/lookups/users-by-role/${roleName}`
    },
    ADVERTISER: {
        DASHBOARD: '/advertiser/dashboard',
        FINANCIALS: '/advertiser/financials'
    },
    DASHBOARD: {
        OVERVIEW: '/dashboard/overview'
    },
    LOGS: {
        PLAYBACK: '/logs/playback',
        PLAYBACK_EXPORT: '/logs/playback/export',
        PLAYBACK_CLEANUP: '/logs/playback/cleanup'
    },
    SUPPORT: {
        ALL:    '/support/tickets',
        CREATE: '/support/tickets',
        SHOW:   (id) => `/support/tickets/${id}`,
    },
    OWNER: {
        DASHBOARD: '/owner/dashboard'
    },
    SETTINGS: {
        ALL: '/settings',
        UPDATE: '/settings'
    }
};
