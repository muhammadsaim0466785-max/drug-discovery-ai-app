export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#2f6fed"/>
  <circle cx="21" cy="22" r="8" fill="#ffffff"/>
  <circle cx="43" cy="42" r="8" fill="#ffffff"/>
  <path d="M27 27 L37 37" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
