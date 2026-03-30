// Shared posts API client — used by admin.html, writing.html, and post.html
const POSTS_API = '/api/posts';

async function getPosts() {
    try {
        const res = await fetch(POSTS_API);
        return await res.json();
    } catch {
        return [];
    }
}

async function addPost(title, content, preview, password) {
    const res = await fetch(POSTS_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password,
        },
        body: JSON.stringify({ title, content, preview }),
    });
    return res.json();
}

async function deletePost(id, password) {
    await fetch(`${POSTS_API}?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
    });
}

async function getPost(id) {
    const posts = await getPosts();
    return posts.find(p => p.id === id) || null;
}
