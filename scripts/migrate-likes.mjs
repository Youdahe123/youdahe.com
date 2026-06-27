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

  const canonical = new Map(); // postId -> { blob, count }
  const orphaned  = new Map(); // postId -> blob[]

  for (const blob of allBlobs) {
    // pathname example: "likes/lrtz4a2b.json" or "likes/lrtz4a2b-abc123de.json"
    const filename = blob.pathname.replace(/^likes\//, '').replace(/\.json$/, '');

    // Post IDs are pure base36 (no hyphens). Any hyphen means a Vercel-appended suffix.
    const orphanMatch   = filename.match(/^([a-z0-9]+)-[a-zA-Z0-9]+$/i);
    const canonicalMatch = filename.match(/^([a-z0-9]+)$/i);

    if (orphanMatch) {
      const postId = orphanMatch[1];
      if (!orphaned.has(postId)) orphaned.set(postId, []);
      orphaned.get(postId).push(blob);
    } else if (canonicalMatch) {
      const postId = canonicalMatch[1];
      const res  = await fetch(blob.url);
      const data = await res.json();
      canonical.set(postId, { blob, count: data.count || 0 });
    } else {
      console.log(`  Skipping unrecognized blob: ${blob.pathname}`);
    }
  }

  console.log(`Canonical blobs found:       ${canonical.size}`);
  console.log(`Posts with orphaned blobs:   ${orphaned.size}`);

  const allPostIds = new Set([...canonical.keys(), ...orphaned.keys()]);

  if (allPostIds.size === 0) {
    console.log('\nNothing to migrate.');
    return;
  }

  for (const postId of allPostIds) {
    const canonicalData  = canonical.get(postId);
    const orphanedBlobs  = orphaned.get(postId) || [];
    const currentCount   = canonicalData?.count || 0;
    const orphanedCount  = orphanedBlobs.length;
    const totalCount     = currentCount + orphanedCount;

    console.log(`\nPost ${postId}`);
    console.log(`  canonical count : ${currentCount}`);
    console.log(`  orphaned blobs  : ${orphanedCount} (each = 1 like)`);
    console.log(`  total           : ${totalCount}`);

    if (orphanedCount === 0) {
      console.log('  nothing to do');
      continue;
    }

    await put(`likes/${postId}.json`, JSON.stringify({ count: totalCount }), {
      contentType: 'application/json',
      access: 'public',
      addRandomSuffix: false,
    });
    console.log(`  wrote count=${totalCount} to likes/${postId}.json`);

    await del(orphanedBlobs.map(b => b.url));
    console.log(`  deleted ${orphanedBlobs.length} orphaned blob(s)`);
  }

  console.log('\nDone.');
}

migrateLikes().catch(err => { console.error(err); process.exit(1); });
