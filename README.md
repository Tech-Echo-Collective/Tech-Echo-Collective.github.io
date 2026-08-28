# Tech Echo Collective website

Official multilingual website for [Tech Echo Collective](https://tech-echo-collective.github.io/).

## Languages

- English: `/`
- 简体中文: `/zh/`
- Français: `/fr/`
- Español: `/es/`

The site is plain HTML and CSS for direct GitHub Pages hosting. Search metadata, reciprocal `hreflang` links, structured data, `robots.txt`, and `sitemap.xml` are maintained in the repository.

## Local preview

Serve the repository root with any static HTTP server, then open `/`, `/zh/`, `/fr/`, or `/es/`.

## Publishing and indexing

Merging to the GitHub Pages publishing branch deploys the site. After deployment, the organization owner can add the site to Google Search Console and submit `https://tech-echo-collective.github.io/sitemap.xml`; indexing remains controlled by Google.

### Google Search Console handoff

1. Add the URL-prefix property `https://tech-echo-collective.github.io/` in Google Search Console.
2. Download Google's HTML verification file and add it unchanged to the repository root.
3. Deploy the verification file, complete ownership verification, and keep the file in the repository.
4. Submit `https://tech-echo-collective.github.io/sitemap.xml` in the Sitemaps report.
5. Use URL Inspection to request indexing for `/`, `/zh/`, `/fr/`, and `/es/`.

The repository already publishes canonical URLs, reciprocal language alternates, structured data, crawl permissions, and the XML sitemap. Do not add a placeholder verification token; use the exact file or meta value issued by Search Console.
