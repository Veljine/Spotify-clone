export default function handler(req, res) {
    const code_verifier = crypto.randomUUID().replace(/-/g, "");
    const code_challenge = base64url(sha256(code_verifier));

    res.setHeader("Set-Cookie", `verifier=${code_verifier}; Path=/; HttpOnly; Secure; SameSite=Lax`);

    const params = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: "code",
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        code_challenge_method: "S256",
        code_challenge
    }).toString();

    res.redirect("https://accounts.spotify.com/authorize?" + params);
}
