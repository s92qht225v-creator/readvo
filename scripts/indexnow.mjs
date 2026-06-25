// IndexNow submitter — pings Bing, Yandex (and other IndexNow partners) with the
// site's URLs in a single request, via the api.indexnow.org aggregator.
//
// Usage:
//   node scripts/indexnow.mjs                 # submit every URL in the live sitemap
//   node scripts/indexnow.mjs <url> [url...]  # submit specific URLs
//
// The key is published at https://blim.uz/<KEY>.txt (public/), which is how
// IndexNow verifies we own the domain. Rotate by replacing that file + KEY.

const HOST = 'blim.uz';
const KEY = '09861250e06736c9fca9f92c10955b08';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP = `https://${HOST}/sitemap.xml`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

async function sitemapUrls() {
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`sitemap fetch ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function submit(urls) {
  // IndexNow accepts up to 10,000 URLs per request.
  for (let i = 0; i < urls.length; i += 10000) {
    const batch = urls.slice(i, i + 10000);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
    });
    const body = await res.text();
    console.log(`batch ${i / 10000 + 1}: ${batch.length} urls -> HTTP ${res.status} ${body || '(empty = accepted)'}`);
  }
}

const argv = process.argv.slice(2);
const urls = argv.length ? argv : await sitemapUrls();
console.log(`Submitting ${urls.length} URLs to IndexNow (${ENDPOINT})`);
await submit(urls);
console.log('Done.');
