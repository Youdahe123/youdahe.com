// Local-only — talks to server.js (`npm run dev`), never deployed.
const NOTES_API = '/api/notes';

async function getNotes() {
    try {
        const res = await fetch(NOTES_API);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

async function saveNote(note) {
    const res = await fetch(NOTES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
    });
    return res.json();
}

async function deleteNote(id) {
    await fetch(`${NOTES_API}?id=${id}`, { method: 'DELETE' });
}
