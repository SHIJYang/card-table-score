// Vercel Serverless Function
// 代理外部图片，解决 Three.js WebGL 纹理的 CORS 限制
// 对应开发环境的 Vite plugin `image-proxy`

export default async function handler(req, res) {
  // 从 query 参数获取 URL（Vercel rewrite 传入 :path*）
  let rawUrl = req.query.url || '';

  // 如果没有 query 参数，从路径提取
  if (!rawUrl) {
    const path = req.url.replace('/api/proxy-img/', '').replace(/\?.*$/, '');
    rawUrl = path.replace(/^\/?/, '');
  }

  // Vercel rewrites 传递时可能保持编码，也可能部分解码
  // 安全做法：先尝试解码一次
  let originalUrl = rawUrl;
  try {
    originalUrl = decodeURIComponent(rawUrl);
  } catch {
    // 已经是解码状态
  }

  // 如果多次编码，继续解码直到不再变化
  while (originalUrl !== rawUrl) {
    rawUrl = originalUrl;
    try {
      originalUrl = decodeURIComponent(rawUrl);
    } catch {
      break;
    }
  }

  if (!originalUrl || (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://'))) {
    res.status(400).json({ error: 'Invalid URL', received: rawUrl });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(originalUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://picui.cn/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      res.status(resp.status).send(`Upstream error: ${resp.status}`);
      return;
    }

    const ct = resp.headers.get('content-type') || 'application/octet-stream';
    const buf = await resp.arrayBuffer();

    res.setHeader('Content-Type', ct);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(Buffer.from(buf));
  } catch (err) {
    console.error('[proxy-img] Error:', err.message);
    res.status(502).send('Proxy error: ' + err.message);
  }
}
