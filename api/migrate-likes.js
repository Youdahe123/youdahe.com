import { list, put, del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.query.secret !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const results = [];
  let allBlobs = [];
  let cursor;

  do {
    const result = await list({ prefix: 'likes/', cursor, limit: 1000 });
    allBlobs = allBlobs.concat(result.blobs);
    cursor = result.cursor;
  } while (cursor);

  const canonical = new Map();
  const orphaned  = new Map();

  for (const blob of allBlobs) {
    const filename = blob.pathname.replace(/^likes\//, '').replace(/\.json$/, '');
    const orphanMatch    = filename.match(/^([a-z0-9]+)-[a-zA-Z0-9]+$/i);
    const canonicalMatch = filename.match(/^([a-z0-9]+)$/i);

    if (orphanMatch) {
      const postId = orphanMatch[1];
      if (!orphaned.has(postId)) orphaned.set(postId, []);
      orphaned.get(postId).push(blob);
    } else if (canonicalMatch) {
      const postId = canonicalMatch[1];
      const data = await fetch(blob.url).then(r => r.json());
      canonical.set(postId, { count: data.count || 0 });
    }
  }

  const allPostIds = new Set([...canonical.keys(), ...orphaned.keys()]);

  for (const postId of allPostIds) {
    const currentCount  = canonical.get(postId)?.count || 0;
    const orphanedBlobs = orphaned.get(postId) || [];
    const totalCount    = currentCount + orphanedBlobs.length;

    if (orphanedBlobs.length === 0) continue;

    await put(`likes/${postId}.json`, JSON.stringify({ count: totalCount }), {
      contentType: 'application/json',
      access: 'public',
      addRandomSuffix: false,
    });

    await del(orphanedBlobs.map(b => b.url));

    results.push({ postId, before: currentCount, orphaned: orphanedBlobs.length, total: totalCount });
  }

  return res.status(200).json({ migrated: results.length, results });
}
