const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    if (!isServer) {
      // Stub out @supabase/realtime-js on the client — the app doesn't use Realtime.
      // Saves ~100KB from the client JS bundle.
      config.resolve.alias['@supabase/realtime-js'] = path.resolve(__dirname, 'src/lib/realtime-stub.js');
    }
    return config;
  },
  // Static export for simple hosting (optional, remove if using server features)
  // output: 'export',

  // Strict mode for better React practices
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'miruwaeplbzfqmdwacsh.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },

  async redirects() {
    /** Old hsk1-dialogue{N} URLs → descriptive slugs (permanent 308) */
    const slugMap = {
      1:'what-is-your-name',2:'are-you-chinese',3:'do-you-like-china',4:'do-you-have-telegram',
      5:'can-you-speak-chinese',6:'how-much-are-bananas',7:'what-time-is-it',8:'where-are-you',
      9:'whats-your-phone-number',10:'where-is-the-bathroom',11:'what-do-you-want-to-eat',12:'i-feel-sick',
      13:'how-old-are-you',14:'who-is-she',15:'going-to-the-supermarket',16:'are-you-free-today',
      17:'are-you-tired',18:'are-you-free-tomorrow',19:'how-do-you-get-to-school',20:'my-phone-is-dead',
      21:'my-treat',22:'are-you-cold',23:'did-you-bring-an-umbrella',24:'i-am-thirsty',
      25:'where-is-your-home',26:'is-chinese-hard',27:'do-you-have-cash',28:'are-you-listening',
      29:'at-the-bank',30:'wrong-wechat',31:'too-noisy',32:'traffic-jam',
      33:'i-forgot',34:'are-you-ready',35:'i-will-walk-you-out',36:'wrong-number',
      37:'wait-for-me',38:'i-am-nervous',39:'is-homework-done',40:'ordering-food',
      41:'can-i-pay-by-card',42:'delivery-arrived',43:'fasten-your-seatbelt',44:'working-overtime',
      45:'tell-me-next-time',46:'losing-weight',47:'ramadan',
    };
    const dialogueRedirects = Object.entries(slugMap).map(([n, slug]) => ({
      source: `/:locale/chinese/hsk1/dialogues/hsk1-dialogue${n}`,
      destination: `/:locale/chinese/hsk1/dialogues/${slug}`,
      permanent: true,
    }));
    return [
      ...dialogueRedirects,
      { source: '/:locale/chinese/hsk1', destination: '/:locale/chinese', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/(icon|apple-icon|opengraph-image)(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
