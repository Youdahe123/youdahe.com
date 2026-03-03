// Shared posts storage — used by admin.html, writing.html, and post.html
function getPosts() {
    const data = localStorage.getItem('youdahe_posts');
    if (!data) return [];
    return JSON.parse(data).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function addPost(title, content, preview) {
    const posts = getPosts();
    posts.push({
        id: Date.now().toString(36),
        title,
        content,
        preview: preview || content.slice(0, 200),
        date: new Date().toISOString(),
    });
    localStorage.setItem('youdahe_posts', JSON.stringify(posts));
}

function deletePost(id) {
    const posts = getPosts().filter(p => p.id !== id);
    localStorage.setItem('youdahe_posts', JSON.stringify(posts));
}

function getPost(id) {
    return getPosts().find(p => p.id === id) || null;
}
