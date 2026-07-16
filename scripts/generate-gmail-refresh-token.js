require("dotenv").config();

const readline = require("readline");
const https = require("https");
const { URLSearchParams } = require("url");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const SCOPE = "https://mail.google.com/";

function ask(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

function postToken(body) {
    return new Promise((resolve, reject) => {
        const payload = new URLSearchParams(body).toString();

        const req = https.request(
            {
                hostname: "oauth2.googleapis.com",
                path: "/token",
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(payload),
                },
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    try {
                        resolve({ status: res.statusCode, body: JSON.parse(data) });
                    } catch {
                        reject(new Error(`Unexpected response: ${data}`));
                    }
                });
            }
        );

        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

async function main() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error("Missing CLIENT_ID or CLIENT_SECRET in .env");
        process.exit(1);
    }

    console.log("\nGmail OAuth refresh token generator\n");
    console.log("Before continuing, confirm in Google Cloud Console:");
    console.log("1. Gmail API is enabled for your project");
    console.log("2. OAuth client type is Web application");
    console.log(`3. Authorized redirect URI includes: ${REDIRECT_URI}`);
    console.log("4. OAuth consent screen is configured\n");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPE);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    console.log("Step 1: Open this URL in your browser and sign in:\n");
    console.log(authUrl.toString());
    console.log("\nStep 2: After approving, copy the authorization code from OAuth Playground.\n");

    const code = await ask("Paste the authorization code here: ");

    if (!code) {
        console.error("No code provided.");
        process.exit(1);
    }

    const { status, body } = await postToken({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
    });

    if (status !== 200 || !body.refresh_token) {
        console.error("\nFailed to get refresh token.");
        console.error(JSON.stringify(body, null, 2));
        process.exit(1);
    }

    console.log("\nSuccess. Update your .env with:\n");
    console.log(`REFRESH_TOKEN=${body.refresh_token}`);
    console.log("\nThen restart the server: npm run dev\n");
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
