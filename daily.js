// Local-only — talks to server.js (`npm run dev`), never deployed.
const DAILY_API = '/api/daily';

async function getDailyLogs() {
    try {
        const res = await fetch(DAILY_API);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

async function addDailyLog(fields) {
    const res = await fetch(DAILY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
    });
    return res.json();
}

async function deleteDailyLog(id) {
    await fetch(`${DAILY_API}?id=${id}`, { method: 'DELETE' });
}
