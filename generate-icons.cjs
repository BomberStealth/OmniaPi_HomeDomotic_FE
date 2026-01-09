const sharp = require('sharp');

async function createIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6ad4a0"/>
          <stop offset="100%" style="stop-color:#4abb87"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
      <g transform="translate(${size * 0.15}, ${size * 0.2}) scale(${size / 100})">
        <path d="M35 25 L10 45 L10 70 L60 70 L60 45 Z" fill="white" opacity="0.95"/>
        <rect x="25" y="50" width="20" height="20" fill="#4abb87"/>
        <circle cx="35" cy="38" r="6" fill="#4abb87"/>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(`public/${filename}`);
  console.log(`Created: ${filename}`);
}

async function main() {
  await createIcon(192, 'pwa-192x192.png');
  await createIcon(512, 'pwa-512x512.png');
  await createIcon(180, 'apple-touch-icon.png');
  await createIcon(32, 'favicon-32x32.png');
  await createIcon(16, 'favicon-16x16.png');
  console.log('All icons created!');
}

main().catch(console.error);
