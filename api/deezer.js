export default async function handler(req, res) {
    try {
        const path = req.query.path || '';
        const fullUrl = `https://api.deezer.com/${path}`;
        const response = await fetch(fullUrl);
        const data = await response.json();
        res.status(200).json(data);
    } catch (e) {
        res.status(500).json({ error: 'Deezer fetch failed', details: e.message });
    }
}