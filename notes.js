const NOTES_API = '/api/notes';

async function getNotes(password) {
    try {
        const res = await fetch(NOTES_API, {
            headers: { 'x-admin-password': password },
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

async function saveNote(note, password) {
    const res = await fetch(NOTES_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password,
        },
        body: JSON.stringify(note),
    });
    return res.json();
}

async function deleteNote(id, password) {
    await fetch(`${NOTES_API}?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
    });
}
