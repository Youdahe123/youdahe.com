import { list, put, del } from '@vercel/blob';

async function migrateLikes() {
  console.log('Listing all likes blobs...');

  let allBlobs = [];
  let cursor;
  do {
    const result = await list({ prefix: 'likes/', cursor, limit: 1000 });
    allBlobs = allBlobs.concat(result.blobs);
    cursor = result.cursor;
  } while (cursor);

  console.log(`Found ${allBlobs.length} total blobs under likes/\n`);

  // Group ALL blobs by pathname (multiple blobs can share the same pathname
  // when addRandomSuffix:true was used — uniqueness was in CDN URL, not path)
  const byPathname = new Map(); // pathname -> blob[]
  for (const blob of allBlobs) {
    const key = blob.pathname;
    if (!byPathname.has(key)) byPathname.set(key, []);
    byPathname.get(key).push(blob);
  }

  let fixed = 0;

  for (const [pathname, blobs] of byPathname) {
    // Extract postId from "likes/<postId>.json"
    const postId = pathname.replace(/^likes\//, '').replace(/\.json$/, '');

    // Read max count found across all blob versions
    let maxCount = 0;
    for (const blob of blobs) {
      try {
        const data = await fetch(blob.url).then(r => r.json());
        maxCount = Math.max(maxCount, data.count || 0);
      } catch { /* ignore unreadable blobs */ }
    }

    // True count: at minimum, the number of blobs (each write = 1 like)
    // but if some writes correctly accumulated, respect that higher number
    const trueCount = Math.max(blobs.length, maxCount);

    console.log(`Post ${postId}`);
    console.log(`  blob copies : ${blobs.length}`);
    console.log(`  max count   : ${maxCount}`);
    console.log(`  true count  : ${trueCount}`);

    if (blobs.length <= 1 && maxCount === trueCount) {
      console.log('  ok — nothing to fix\n');
      continue;
    }

    // Write correct count to canonical path, overwriting all old versions
    await put(`likes/${postId}.json`, JSON.stringify({ count: trueCount }), {
      contentType: 'application/json',
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Delete all old blob copies (the put above created the new canonical one)
    await del(blobs.map(b => b.url));
    console.log(`  fixed: wrote count=${trueCount}, deleted ${blobs.length} old copies\n`);
    fixed++;
  }

  console.log(`Done. Fixed ${fixed} post(s).`);
}

migrateLikes().catch(err => { console.error(err); process.exit(1); });
