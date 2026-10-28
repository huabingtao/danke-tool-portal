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
  const rooms = searchParams.get('rooms') || '3室2厅2卫';
  const area = Number(searchParams.get('area') || 105);
  const orientation = searchParams.get('orientation') || '南北';
  const style = searchParams.get('style') || 'south-north-3br';
  const community = searchParams.get('community') || '上海品质住区';

  const is2Br = style === 'compact-2br' || rooms.startsWith('2室');
  const is4Br = style === 'luxury-4br' || rooms.startsWith('4室') || area >= 155;

  const masterArea = (area * 0.21).toFixed(1);
  const livingArea = (area * 0.28).toFixed(1);
  const secondBedArea = (area * 0.14).toFixed(1);
  const thirdBedArea = (area * 0.11).toFixed(1);
  const kitchenArea = (area * 0.08).toFixed(1);
  const balconyArea = (area * 0.07).toFixed(1);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 680" width="960" height="680">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e2e8f0" stroke-width="0.7" />
    </pattern>
    <pattern id="tile" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#cbd5e1" stroke-width="0.8" />
    </pattern>
    <pattern id="wood" width="40" height="10" patternUnits="userSpaceOnUse">
      <rect width="40" height="10" fill="#fef3c7" fill-opacity="0.45"/>
      <line x1="0" y1="10" x2="40" y2="10" stroke="#fde68a" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Blueprint Background -->
  <rect width="960" height="680" fill="#f8fafc" />
  <rect x="24" y="24" width="912" height="632" fill="url(#grid)" stroke="#94a3b8" stroke-width="1.5" rx="8" />

  <!-- Top Title & Compass Bar -->
  <rect x="44" y="40" width="872" height="58" rx="8" fill="#0f172a" />
  <text x="66" y="66" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700">
    ${escapeXml(community)} · ${escapeXml(rooms)} 标准建筑平面户型图
  </text>
  <text x="66" y="86" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="12">
    建筑面积约 ${area}㎡ | 朝向: ${escapeXml(orientation)} | CAD 1:100 测绘比例尺 (单位: mm)
  </text>

  <!-- Compass Rose -->
  <g transform="translate(865, 69)">
    <circle cx="0" cy="0" r="20" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
    <polygon points="0,-14 -5,4 0,0 5,4" fill="#38bdf8" />
    <text x="0" y="-15" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="9" font-weight="700">N</text>
    <text x="0" y="16" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="8">南↓</text>
  </g>

  <!-- Top Dimension Ruler -->
  <g stroke="#475569" stroke-width="1.2" fill="#334155" font-family="monospace" font-size="12">
    <line x1="120" y1="125" x2="820" y2="125" />
    <line x1="120" y1="118" x2="120" y2="132" />
    <line x1="350" y1="118" x2="350" y2="132" />
    <line x1="600" y1="118" x2="600" y2="132" />
    <line x1="820" y1="118" x2="820" y2="132" />
    <text x="235" y="119" text-anchor="middle">3600 mm</text>
    <text x="475" y="119" text-anchor="middle">4200 mm</text>
    <text x="710" y="119" text-anchor="middle">3500 mm</text>
  </g>

  <!-- Left Dimension Ruler -->
  <g stroke="#475569" stroke-width="1.2" fill="#334155" font-family="monospace" font-size="12">
    <line x1="86" y1="145" x2="86" y2="555" />
    <line x1="79" y1="145" x2="93" y2="145" />
    <line x1="79" y1="315" x2="93" y2="315" />
    <line x1="79" y1="500" x2="93" y2="500" />
    <line x1="79" y1="555" x2="93" y2="555" />
    <text x="76" y="235" text-anchor="end">3900</text>
    <text x="76" y="410" text-anchor="end">4500</text>
    <text x="76" y="532" text-anchor="end">1650</text>
  </g>

  <!-- ================= APARTMENT WALLS & ROOMS ================= -->
  <!-- Outer Load-bearing Wall -->
  <rect x="120" y="145" width="700" height="355" fill="#ffffff" stroke="#0f172a" stroke-width="8" />

  <!-- North Row: Kitchen + Dining + Bathrooms + North Study/Bedroom -->
  <!-- Kitchen (Top Left) -->
  <rect x="124" y="149" width="226" height="166" fill="url(#tile)" stroke="#1e293b" stroke-width="4" />
  <!-- Kitchen L-Counter -->
  <rect x="128" y="153" width="218" height="30" fill="#cbd5e1" stroke="#64748b" stroke-width="1" />
  <circle cx="175" cy="168" r="8" fill="none" stroke="#334155" stroke-width="1.5" />
  <circle cx="205" cy="168" r="8" fill="none" stroke="#334155" stroke-width="1.5" />
  <rect x="260" y="158" width="42" height="20" fill="#e2e8f0" stroke="#475569" stroke-width="1" />
  <text x="235" y="232" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="15" font-weight="700">U型明厨</text>
  <text x="235" y="252" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="12">约 ${kitchenArea}㎡ · 带北窗</text>

  <!-- Dining & Living Hall (Center Full North-South Through) -->
  <rect x="350" y="149" width="250" height="347" fill="#fffbeb" stroke="#1e293b" stroke-width="4" />
  <!-- Dining Table -->
  <rect x="425" y="185" width="100" height="54" rx="8" fill="#fde68a" stroke="#b45309" stroke-width="1.5" />
  <text x="475" y="216" text-anchor="middle" fill="#78350f" font-family="sans-serif" font-size="13" font-weight="700">独立餐厅</text>
  <!-- Living Room Sofa & TV -->
  <rect x="372" y="340" width="32" height="110" rx="6" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5" />
  <rect x="430" y="365" width="60" height="60" rx="4" fill="#ffedd5" stroke="#ea580c" stroke-width="1" />
  <text x="485" y="320" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="17" font-weight="700">南北通透大客厅</text>
  <text x="485" y="342" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="12">餐客一体约 ${livingArea}㎡</text>
  <text x="485" y="455" text-anchor="middle" fill="#0284c7" font-family="sans-serif" font-size="12" font-weight="600">↕ 穿堂风对流轴线</text>

  <!-- North Right: ${is2Br ? '干湿分离明卫' : '北次卧/书房 + 客卫'} -->
  <rect x="600" y="149" width="216" height="166" fill="url(#wood)" stroke="#1e293b" stroke-width="4" />
  <text x="708" y="224" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="15" font-weight="700">${
    is2Br ? '景观书房/多能间' : is4Br ? '北向套房次卧' : '北向静谧书房/三卧'
  }</text>
  <text x="708" y="245" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="12">约 ${thirdBedArea}㎡ · 明窗采光</text>

  <!-- South Left: South Secondary Bedroom -->
  <rect x="124" y="315" width="226" height="181" fill="url(#wood)" stroke="#1e293b" stroke-width="4" />
  <!-- Bed graphic -->
  <rect x="145" y="355" width="88" height="96" rx="4" fill="#ffffff" stroke="#64748b" stroke-width="1.5" />
  <rect x="152" y="362" width="32" height="18" rx="3" fill="#e2e8f0" stroke="#64748b" />
  <rect x="192" y="362" width="32" height="18" rx="3" fill="#e2e8f0" stroke="#64748b" />
  <text x="275" y="400" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="15" font-weight="700">南向次卧</text>
  <text x="275" y="422" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="12">约 ${secondBedArea}㎡</text>
  <text x="275" y="440" text-anchor="middle" fill="#0369a1" font-family="sans-serif" font-size="11">带南向全明飘窗</text>

  <!-- South Right: Master Bedroom Suite + Master Bath -->
  <rect x="600" y="315" width="216" height="181" fill="url(#wood)" stroke="#1e293b" stroke-width="4" />
  <!-- Master Bathroom inset -->
  <rect x="600" y="315" width="92" height="72" fill="url(#tile)" stroke="#334155" stroke-width="2.5" />
  <text x="646" y="355" text-anchor="middle" fill="#334155" font-family="sans-serif" font-size="11" font-weight="700">主卫干湿分离</text>
  <!-- Master Bed -->
  <rect x="708" y="355" width="92" height="102" rx="4" fill="#ffffff" stroke="#64748b" stroke-width="1.5" />
  <rect x="716" y="362" width="34" height="18" rx="3" fill="#e2e8f0" stroke="#64748b" />
  <rect x="758" y="362" width="34" height="18" rx="3" fill="#e2e8f0" stroke="#64748b" />
  <text x="665" y="430" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="16" font-weight="700">南向主卧套房</text>
  <text x="665" y="450" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="12">约 ${masterArea}㎡ · 步入衣帽间</text>

  <!-- South Balcony (Full Width under Living Room) -->
  <rect x="350" y="500" width="250" height="58" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" stroke-dasharray="6,3" />
  <text x="475" y="528" text-anchor="middle" fill="#0369a1" font-family="sans-serif" font-size="14" font-weight="700">南向宽景双联阳台 (约 ${balconyArea}㎡)</text>
  <text x="475" y="546" text-anchor="middle" fill="#0284c7" font-family="sans-serif" font-size="11">270°落地移门 · 阳光晾晒与观景茶歇区</text>

  <!-- South Bay Windows -->
  <rect x="155" y="500" width="160" height="24" fill="#bae6fd" stroke="#0284c7" stroke-width="2" />
  <text x="235" y="516" text-anchor="middle" fill="#0369a1" font-family="sans-serif" font-size="10" font-weight="600">南向赠送观景飘窗</text>

  <rect x="635" y="500" width="150" height="24" fill="#bae6fd" stroke="#0284c7" stroke-width="2" />
  <text x="710" y="516" text-anchor="middle" fill="#0369a1" font-family="sans-serif" font-size="10" font-weight="600">主卧270°转角飘窗</text>

  <!-- Bottom Legend Footer -->
  <rect x="44" y="586" width="872" height="50" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" />
  <circle cx="72" cy="611" r="6" fill="#0284c7" />
  <text x="86" y="615" fill="#1e293b" font-family="sans-serif" font-size="13" font-weight="600">户型亮点：三开间朝南 · 南北通透穿堂风 · 动静分区明确 · 明厨明卫高得房率</text>
  <text x="895" y="615" text-anchor="end" fill="#64748b" font-family="sans-serif" font-size="12">上海找房可视化系统 · 户型测绘中心</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
