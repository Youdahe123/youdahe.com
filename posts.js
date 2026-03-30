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

async function addPost(title, content, preview, password, date) {
    const res = await fetch(POSTS_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password,
        },
        body: JSON.stringify({ title, content, preview, date }),
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

async function uploadImage(file, password) {
    const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            'Content-Type': file.type,
            'x-filename': file.name,
            'x-admin-password': password,
        },
        body: file,
    });
    const data = await res.json();
    return data.url;
}

async function getComments(postId) {
    try {
        const res = await fetch(`/api/comments?postId=${postId}`);
        return await res.json();
    } catch {
        return [];
    }
}

async function addComment(postId, name, text) {
    const res = await fetch(`/api/comments?postId=${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text }),
    });
    return res.json();
}

async function getLikes(postId) {
    try {
        const res = await fetch(`/api/likes?postId=${postId}`);
        const data = await res.json();
        return data.count || 0;
    } catch {
        return 0;
    }
}

async function likePost(postId) {
    const res = await fetch(`/api/likes?postId=${postId}`, { method: 'POST' });
    const data = await res.json();
    return data.count || 0;
}

function renderPostContent(content) {
    return content.split('\n').filter(l => l.trim()).map(line => {
        const imgMatch = line.trim().match(/^\{\{img:(.+?)\}\}$/);
        if (imgMatch) {
            return `<img src="${imgMatch[1]}" alt="Post image" class="post-image">`;
        }
        return `<p>${line}</p>`;
    }).join('');
}
