export default async function handler(req, res) {
    const { path = [] } = req.query;
    const deezerPath = path.join("/");

    const url = `https://api.deezer.com/${deezerPath}${req.url.split('?')[1] ? '?' + req.url.split('?')[1] : ''}`;

    try {
        const dzRes = await fetch(url);
        const text = await dzRes.text();

        try {
            const json = JSON.parse(text);
            return res.status(200).json(json);
        } catch (e) {
            return res.status(200).send(text);
        }

    } catch (err) {
        return res.status(500).json({
            error: "Deezer proxy error",
            detail: err.toString()
        });
    }
}
