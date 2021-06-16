interface DbSubscription {
  user_id: string,
  tier: SubscriptionTier,
  stripe_sub_id: string | null
}

interface DbSeat {
  owner_user_id: string,
  seat_member_user_id: string,
  role: string,
  expired: boolean
}

interface DbServerSettings {
  title: string,
  brandName: string,
  productName: string,
  company: string,
  contactEmail: string,
  mergePublicMarketplace: boolean,
  icons: {
    mainIcon: string,
    favicon: string,
  },
  colors: {
    mainColor: string,
    secondaryColor: string,
    mainTextColor: string,
    secondaryTextColor: string
  },
  customHtml: string,
  customCss: string,
  messages: {
    passwordResetEmail: string,
    inviteConfirmationEmail: string,
    referralEmail: string
  },
  metadata: unknown
}
