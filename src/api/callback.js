export default async function handler(req, res) {
    const code = req.query.code;
    const verifier = req.cookies.verifier;

    const params = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        code_verifier: verifier
    });

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const token = await tokenRes.json();
    res.json(token);
}
