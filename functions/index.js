const { onRequest } = require("firebase-functions/v2/https");
const { log } = require("firebase-functions/logger");
const { AuthorizationCode } = require("simple-oauth2");

// We'll rely on environment variables or secrets for these values.
// In a real deployment, use: firebase functions:secrets:set OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET
// and access them via process.env or the secret params.
// For simplicity in this v2 function, we access them as process.env if set via secrets.

exports.oauth = onRequest(
  {
    secrets: ["OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET"],
    region: "us-central1", // Or your preferred region
  },
  async (req, res) => {
    // 1. Initialize the OAuth2 Library
    const config = {
      client: {
        id: process.env.OAUTH_CLIENT_ID,
        secret: process.env.OAUTH_CLIENT_SECRET,
      },
      auth: {
        tokenHost: "https://github.com",
        tokenPath: "/login/oauth/access_token",
        authorizePath: "/login/oauth/authorize",
      },
    };

    const client = new AuthorizationCode(config);

    // 2. Handle the 'auth' step: Redirect to GitHub
    const requestPath = req.path;
    log("Received request", { path: requestPath, query: req.query });

    if (requestPath.endsWith("/auth")) {
      const authorizationUri = client.authorizeURL({
        redirect_uri: `https://${req.hostname}/api/callback`,
        scope: "repo,user", // Request repo and user scopes
        state: "bootcamp", // Optional state
      });

      res.redirect(authorizationUri);
      return;
    }

    if (requestPath.endsWith("/callback")) {
      const { code } = req.query;
      const options = {
        code,
        redirect_uri: `https://${req.hostname}/api/callback`,
      };

      try {
        const accessToken = await client.getToken(options);
        const token = accessToken.token.access_token;

        // Return the script that posts the message back to the CMS window
        // We add delays and multiple attempts to ensure the opener receives it.
        const responseBody = `
          <script>
            (function() {
              const content = {
                token: "${token}",
                provider: "github"
              };

              // Decap CMS expects this format
              // authorization:provider:success:json_string
              const msg = 'authorization:github:success:' + JSON.stringify(content);

              console.log("Sending message to opener...", msg);

              // 1. Send immediately
              if (window.opener) {
                window.opener.postMessage(msg, '*');
              }

              // 2. Send again after short delay
              setTimeout(() => {
                if (window.opener) {
                   console.log("Sending message again...", msg);
                   window.opener.postMessage(msg, '*');
                }

                // 3. Feedback to user
                document.body.innerHTML = "<h3>Authentication successful!</h3><p>You can close this window now.</p>";

                // 4. Close after a noticeable delay
                setTimeout(() => {
                   window.close();
                }, 1500);
              }, 500);
            })();
          </script>
        `;

        res.status(200).send(responseBody);
      } catch (error) {
        log("Access Token Error", error.message);
        res.status(500).json("Authentication failed");
      }
      return;
    }

    // Default response
    res.status(404).send("Not Found");
  }
);
