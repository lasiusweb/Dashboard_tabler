import corePackage from '@firstcrop/core/package.json'

const version = corePackage.version

export const site = {
  title: 'FirstCrop',
  version,
  docsUrl: 'https://docs.firstcrop.in',
  cdnUrl: `https://cdn.jsdelivr.net/npm/@firstcrop/core@${version}`,
  // site.email — used by parts/modals/success.html ({{ site.email }}). Verified
  // against the reference build (support@firstcrop.in).
  email: 'support@firstcrop.in',
  previewUrl: 'https://preview.firstcrop.in',
  githubUrl: 'https://github.com/firstcrop/firstcrop',
  githubSponsorsUrl: 'https://github.com/firstcrop/firstcrop',
  icons: { link: 'https://firstcrop.in/icons' },
  // site.emails — used by preview/pages/emails.html. From shared/data/site.json.
  // `count` is intentionally absent in the source data (site.emails.count is
  // undefined → renders empty, producing "Buy  emails" with a double space).
  emails: { price: '$29', buy_link: 'https://firstcrop.in/buy-emails', count: '' },
  // dev key used in the development build (Liquid: site.googleMapsDevKey)
  googleMapsDevKey: 'AIzaSyCL-BY8-sq12m0S9H-S_yMqDmcun3A9znw',
  // From shared/data/icons-info.json.
  iconsCount: 5986,
  descriptionShort: 'Premium and Open Source dashboard template with responsive and high quality UI.',
  description: 'FirstCrop is packed with beautifully crafted components and powerful features. Jump in and start building a stunning dashboard — all for free!',
  themeColor: '#2fb344',
  cssPlugins: ['flags', 'socials', 'payments', 'vendors', 'marketing', 'themes'],
  themeColors: ['blue', 'azure', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan'],
  themeFonts: ['sans-serif', 'serif', 'monospace', 'comic'],
  themeBases: ['slate', 'gray', 'zinc', 'neutral', 'stone'],
  themeRadiuses: ['0', '0.5', '1', '1.5', '2'],
}
