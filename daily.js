const DAILY_API = '/api/daily';

async function getDailyLogs(password) {
    try {
        const res = await fetch(DAILY_API, {
            headers: { 'x-admin-password': password },
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

async function addDailyLog(fields, password) {
    const res = await fetch(DAILY_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password,
        },
        body: JSON.stringify(fields),
    });
    return res.json();
}

async function deleteDailyLog(id, password) {
    await fetch(`${DAILY_API}?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
    });
}
