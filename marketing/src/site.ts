/**
 * Everything the marketing pages say about the app lives here. It starts from
 * the app's own config (id, name, theme colours in web/src/index.css) and is
 * yours to edit: change the copy, add sections, or rewrite the pages in
 * src/pages/. Keep claims true — no invented pricing, customers or reviews.
 *
 * The Privacy Policy and Terms are a starting point, not legal advice. Review
 * them against what your app actually does before you rely on them.
 */
export const site = {
  name: 'APPNAME',
  appUrl: 'https://APPNAME.proappstore.online/',
  /** Who runs the app; named as the operator on the legal pages. */
  owner: 'The APPNAME team',
  /** Where people can reach you. Leave empty to point them at the app instead. */
  contactEmail: '',
  /** Jurisdiction whose law governs the Terms. Leave empty to omit the clause. */
  governingLaw: '',
  /** Shown on the legal pages; update it whenever you change them. */
  legalUpdated: '2026-10-18',
  colors: {
    accent: '#d86f4d',
    /** Buttons and links: dark enough for white text and for text on paper. */
    accentDeep: '#9f4427',
    accentSoft: '#ffd4bf',
    ink: '#111111',
    muted: '#666666',
    paper: '#ffffff',
    paperDeep: '#f7f7f7',
  },
  headline: 'Explore APPNAME.',
  summary: 'Describe in one or two sentences what APPNAME does and who it is for.',
  cta: 'Open APPNAME',
  benefits: [
    { title: 'First benefit', body: 'What someone can do with APPNAME that matters to them.' },
    { title: 'Second benefit', body: 'Another concrete outcome, in plain words.' },
    { title: 'Third benefit', body: 'A third reason to try it.' },
  ],
  howItWorks: [
    { title: 'Open the app', body: 'Go to APPNAME in any modern browser. It installs like an app on phone and desktop.' },
    { title: 'Sign in', body: 'Use your GitHub or Google account. No new password to remember.' },
    { title: 'Get started', body: 'Describe the first thing a new user does.' },
  ],
}

/** How the legal pages tell people to reach you, e.g. "You can {contact}." */
export const contact = site.contactEmail
  ? `email us at ${site.contactEmail}`
  : `contact us through ${site.appUrl}`
