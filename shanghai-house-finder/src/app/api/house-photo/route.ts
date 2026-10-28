import { NextRequest, NextResponse } from 'next/server';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scene = searchParams.get('scene') || 'living';
  const theme = searchParams.get('theme') || 'modern';
  const community = searchParams.get('community') || '上海品质社区';
  const rooms = searchParams.get('rooms') || '3室2厅2卫';
  const area = searchParams.get('area') || '110';
  const label = searchParams.get('label') || '房屋实拍图';

  // 根据不同空间场景 (living, bedroom, kitchen, bathroom, exterior) 绘制高细节写实建筑室内/外立面视觉图
  const palettes: Record<string, { wall: string; floor: string; accent: string; sky1: string; sky2: string }> = {
    'luxury-river': { wall: '#f5f3ef', floor: '#d6ccc2', accent: '#b08968', sky1: '#0284c7', sky2: '#bae6fd' },
    'warm-wood': { wall: '#faf8f5', floor: '#ddb892', accent: '#9c6644', sky1: '#38bdf8', sky2: '#e0f2fe' },
    'new-showroom': { wall: '#f8fafc', floor: '#cbd5e1', accent: '#0f172a', sky1: '#0369a1', sky2: '#e0f2fe' },
    minimalist: { wall: '#f8f9fa', floor: '#dee2e6', accent: '#495057', sky1: '#0284c7', sky2: '#f0f9ff' },
    modern: { wall: '#f4f6f8', floor: '#d8dee9', accent: '#3b82f6', sky1: '#2563eb', sky2: '#dbeafe' },
  };
  const pal = palettes[theme] || palettes.modern;

  let sceneBody = '';
  if (scene === 'living') {
    sceneBody = `
      <!-- Room Perspective Walls & Floor -->
      <polygon points="0,0 960,0 780,110 180,110" fill="#ffffff" />
      <polygon points="0,0 180,110 180,450 0,600" fill="${pal.wall}" />
      <polygon points="960,0 780,110 780,450 960,600" fill="${pal.wall}" />
      <rect x="180" y="110" width="600" height="340" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" />
      <polygon points="180,450 780,450 960,640 0,640" fill="${pal.floor}" />

      <!-- Recessed Ceiling Light Cove -->
      <rect x="230" y="25" width="500" height="55" fill="#fef9c3" opacity="0.55" rx="4" />
      <line x1="230" y1="80" x2="730" y2="80" stroke="#eab308" stroke-width="3" />

      <!-- Panoramic Floor-to-Ceiling South Window with Shanghai Skyline -->
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${pal.sky1}" />
        <stop offset="100%" stop-color="${pal.sky2}" />
      </linearGradient>
      <rect x="250" y="135" width="460" height="295" fill="url(#skyGrad)" stroke="#1e293b" stroke-width="6" />
      <!-- Skyline Silhouettes -->
      <rect x="310" y="240" width="38" height="190" fill="#1e293b" opacity="0.28" />
      <polygon points="385,175 400,430 370,430" fill="#0f172a" opacity="0.32" />
      <rect x="435" y="210" width="46" height="220" fill="#1e293b" opacity="0.25" />
      <rect x="520" y="265" width="55" height="165" fill="#334155" opacity="0.25" />
      <!-- Trees on Balcony -->
      <circle cx="290" cy="390" r="35" fill="#15803d" opacity="0.7" />
      <circle cx="670" cy="385" r="42" fill="#166534" opacity="0.65" />
      <!-- Window Mullions -->
      <line x1="400" y1="135" x2="400" y2="430" stroke="#1e293b" stroke-width="5" />
      <line x1="560" y1="135" x2="560" y2="430" stroke="#1e293b" stroke-width="5" />

      <!-- Sunlight Beam on Floor -->
      <polygon points="250,430 710,430 820,590 140,590" fill="#fef08a" opacity="0.26" />

      <!-- Designer L-Shape Sofa -->
      <rect x="210" y="395" width="360" height="58" rx="12" fill="#334155" />
      <rect x="195" y="370" width="390" height="45" rx="10" fill="#475569" />
      <rect x="225" y="378" width="70" height="32" rx="6" fill="#e2e8f0" />
      <rect x="315" y="378" width="70" height="32" rx="6" fill="#cbd5e1" />
      <rect x="405" y="378" width="70" height="32" rx="6" fill="#e2e8f0" />
      <!-- Area Rug & Marble Coffee Table -->
      <polygon points="220,475 740,475 810,575 150,575" fill="#f8fafc" opacity="0.75" />
      <ellipse cx="480" cy="515" rx="110" ry="30" fill="#1e293b" />
      <ellipse cx="480" cy="510" rx="106" ry="26" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />
    `;
  } else if (scene === 'bedroom') {
    sceneBody = `
      <polygon points="0,0 960,0 780,100 180,100" fill="#ffffff" />
      <polygon points="0,0 180,100 180,450 0,640" fill="#f5ebe0" />
      <polygon points="960,0 780,100 780,450 960,640" fill="#edede9" />
      <rect x="180" y="100" width="600" height="350" fill="#e3d5ca" />
      <polygon points="180,450 780,450 960,640 0,640" fill="#d5bdaf" />

      <!-- South Bay Window -->
      <rect x="620" y="140" width="140" height="240" fill="#bae6fd" stroke="#334155" stroke-width="5" />
      <rect x="615" y="380" width="150" height="24" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />

      <!-- King Size Upholstered Bed -->
      <rect x="270" y="250" width="300" height="120" rx="8" fill="#7f5539" />
      <rect x="240" y="350" width="360" height="135" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
      <rect x="240" y="405" width="360" height="80" rx="12" fill="#b08968" />
      <rect x="300" y="320" width="105" height="42" rx="10" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="435" y="320" width="105" height="42" rx="10" fill="#ffffff" stroke="#cbd5e1" />
      <!-- Warm Bedside Lamps -->
      <circle cx="220" cy="310" r="18" fill="#fef08a" />
      <circle cx="620" cy="310" r="18" fill="#fef08a" />
    `;
  } else if (scene === 'kitchen') {
    sceneBody = `
      <rect width="960" height="640" fill="#f1f5f9" />
      <polygon points="140,460 820,460 960,640 0,640" fill="#cbd5e1" />
      <!-- Upper Cabinets -->
      <rect x="180" y="90" width="600" height="125" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />
      <line x1="330" y1="90" x2="330" y2="215" stroke="#94a3b8" stroke-width="2" />
      <line x1="480" y1="90" x2="480" y2="215" stroke="#94a3b8" stroke-width="2" />
      <line x1="630" y1="90" x2="630" y2="215" stroke="#94a3b8" stroke-width="2" />
      <!-- Range Hood & Window -->
      <rect x="420" y="215" width="120" height="45" fill="#334155" />
      <rect x="210" y="235" width="150" height="95" fill="#bae6fd" stroke="#475569" stroke-width="4" />
      <!-- Quartz Countertop & Lower Cabinets -->
      <rect x="160" y="345" width="640" height="18" fill="#ffffff" stroke="#64748b" stroke-width="2" />
      <rect x="170" y="363" width="620" height="120" fill="#334155" stroke="#1e293b" stroke-width="2" />
      <rect x="430" y="380" width="100" height="80" rx="4" fill="#0f172a" stroke="#64748b" stroke-width="2" />
    `;
  } else if (scene === 'bathroom') {
    sceneBody = `
      <rect width="960" height="640" fill="#e2e8f0" />
      <polygon points="150,470 810,470 960,640 0,640" fill="#94a3b8" />
      <!-- Walk-in Glass Shower Partition -->
      <rect x="540" y="95" width="250" height="375" fill="#e0f2fe" fill-opacity="0.45" stroke="#38bdf8" stroke-width="3" />
      <!-- Backlit LED Smart Mirror & Floating Vanity -->
      <rect x="210" y="145" width="240" height="145" rx="14" fill="#bae6fd" stroke="#fef08a" stroke-width="5" />
      <rect x="195" y="335" width="270" height="85" rx="6" fill="#475569" />
      <rect x="200" y="325" width="260" height="16" fill="#ffffff" />
    `;
  } else {
    // exterior / community garden
    sceneBody = `
      <linearGradient id="extSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#e0f2fe" />
      </linearGradient>
      <rect width="960" height="440" fill="url(#extSky)" />
      <rect x="0" y="420" width="960" height="220" fill="#15803d" />
      <!-- Community Swimming Pool / Central Water Feature -->
      <ellipse cx="480" cy="520" rx="290" ry="62" fill="#38bdf8" stroke="#f8fafc" stroke-width="6" />
      <!-- Modern High-rise Facades -->
      <rect x="160" y="95" width="150" height="335" fill="#334155" stroke="#cbd5e1" stroke-width="2" />
      <rect x="405" y="65" width="165" height="365" fill="#1e293b" stroke="#e2e8f0" stroke-width="2" />
      <rect x="655" y="105" width="150" height="325" fill="#334155" stroke="#cbd5e1" stroke-width="2" />
      <!-- Glass Balconies Grid -->
      <g fill="#bae6fd" opacity="0.75">
        <rect x="180" y="120" width="110" height="18" /><rect x="180" y="155" width="110" height="18" /><rect x="180" y="190" width="110" height="18" /><rect x="180" y="225" width="110" height="18" /><rect x="180" y="260" width="110" height="18" /><rect x="180" y="295" width="110" height="18" />
        <rect x="425" y="95" width="125" height="20" /><rect x="425" y="135" width="125" height="20" /><rect x="425" y="175" width="125" height="20" /><rect x="425" y="215" width="125" height="20" /><rect x="425" y="255" width="125" height="20" /><rect x="425" y="295" width="125" height="20" />
        <rect x="675" y="130" width="110" height="18" /><rect x="675" y="165" width="110" height="18" /><rect x="675" y="200" width="110" height="18" /><rect x="675" y="235" width="110" height="18" /><rect x="675" y="270" width="110" height="18" />
      </g>
      <!-- Lush Trees -->
      <circle cx="130" cy="420" r="55" fill="#166534" />
      <circle cx="355" cy="425" r="48" fill="#14532d" />
      <circle cx="615" cy="425" r="52" fill="#166534" />
      <circle cx="835" cy="420" r="58" fill="#14532d" />
    `;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" width="960" height="640">
  ${sceneBody}

  <!-- Watermark & Real-Shot Metadata Overlay -->
  <rect x="24" y="24" width="380" height="58" rx="10" fill="#0f172a" fill-opacity="0.78" />
  <text x="42" y="50" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="700">
    ${escapeXml(community)} · ${escapeXml(label)}
  </text>
  <text x="42" y="70" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="12">
    ${escapeXml(rooms)} | 建面 ${escapeXml(area)}㎡ | 实地勘察高清影像
  </text>

  <rect x="780" y="582" width="156" height="34" rx="8" fill="#0f172a" fill-opacity="0.72" />
  <text x="858" y="604" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="600">
    VR 实勘认证房源
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
