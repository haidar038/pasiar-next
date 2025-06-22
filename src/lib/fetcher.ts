// lib/fetcher.ts
export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
    const res = await fetch(input, {
        ...init,
        credentials: "include", // kirim cookie ke server
        headers: { "Content-Type": "application/json" },
    });
    return res.json();
}
