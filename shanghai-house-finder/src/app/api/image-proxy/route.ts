import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.redirect(new URL('/api/house-photo?scene=living', request.url));
  }

  // 若本身是内部相对地址，直接重定向
  if (targetUrl.startsWith('/')) {
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  try {
    const cacheDir = path.join(process.cwd(), 'data', 'image-cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const hash = crypto.createHash('sha256').update(targetUrl).digest('hex');
    const cachedFile = path.join(cacheDir, `${hash}.bin`);
    const cachedMeta = path.join(cacheDir, `${hash}.json`);

    if (fs.existsSync(cachedFile) && fs.existsSync(cachedMeta)) {
      const meta = JSON.parse(fs.readFileSync(cachedMeta, 'utf-8'));
      const buffer = fs.readFileSync(cachedFile);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': meta.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Referer: 'https://sh.ke.com/',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL('/api/house-photo?scene=living', request.url));
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(cachedFile, buffer);
    fs.writeFileSync(cachedMeta, JSON.stringify({ contentType, targetUrl }));

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.redirect(new URL('/api/house-photo?scene=living', request.url));
  }
}
