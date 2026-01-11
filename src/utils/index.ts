export const appRoutes: Record<string, string> = {
  Home: "/",
  NewDraw: "/NewDraw",
  DrawHistory: "/DrawHistory",
  CreateRaffle: "/CreateRaffle",
  Raffles: "/Raffles",
  Campaigns: "/Campaigns",
  CampaignEntries: "/CampaignEntries",
  CampaignLanding: "/CampaignLanding",
  Members: "/Members",
  Partners: "/Partners",
  Settings: "/Settings",
  Testimonials: "/Testimonials",
  ThankYou: "/ThankYou",
  Wallet: "/Wallet"
};

export function createPageUrl(page: string) {
  return appRoutes[page] ?? `/${page}`;
}

