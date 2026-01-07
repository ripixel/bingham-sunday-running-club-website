import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { AuthorizationCode } from "simple-oauth2";
import express = require("express");
import randomstring = require("randomstring");
import * as logger from "firebase-functions/logger";
import { config, Provider } from "./config";

// Firebase parameterized configuration

const OAUTH_PROVIDER = defineString("OAUTH_PROVIDER", {
  default: "github",
  description: "The OAuth provider to use.",
  input: {
    select: {
      options: [
        { label: "GitHub", value: "github" },
        { label: "GitLab", value: "gitlab" },
      ],
    },
  },
});

const OAUTH_GIT_HOSTNAME = defineString("OAUTH_GIT_HOSTNAME", {
  default: undefined,
  description: "The optional OAuth Git hostname to use " +
    "(for GitHub Enterprise).",
});

const OAUTH_CLIENT_ID = defineString("OAUTH_CLIENT_ID", {
  description: "The OAuth client ID.",
});

const OAUTH_CLIENT_SECRET = defineSecret("OAUTH_CLIENT_SECRET");

const OAUTH_REDIRECT_URI = defineString("OAUTH_REDIRECT_URI", {
  description: "The OAuth redirect base URI.",
});

/**
 * Render callback body.
 * @param {Provider} provider the provider type.
 * @param {string} status the callback status.
 * @param {unknown} content the content to display.
 * @return {string} the callback body.
 */
function renderBody(
  provider: Provider,
  status: string,
  content: unknown
): string {
  return `
    <script>
      const receiveMessage = (message) => {
        window.opener.postMessage(
          'authorization:${provider}:${status}:${JSON.stringify(content)}',
          message.origin
        );

        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);

      window.opener.postMessage("authorizing:${provider}", "*");
    </script>
  `;
}

// Main express app

const oauthApp = express();

// Handle /api prefix from Firebase rewrites
const api = express.Router();
oauthApp.use("/api", api);

api.get("/auth", (req, res) => {
  const provider = OAUTH_PROVIDER.value() as Provider;
  const configuration = config(
    provider, OAUTH_CLIENT_ID.value(),
    OAUTH_CLIENT_SECRET.value(),
    OAUTH_GIT_HOSTNAME.value());

  const oauth2 = new AuthorizationCode({
    client: configuration.client,
    auth: configuration.auth,
  });

  // Dynamic redirect URI based on request, decreasing configuration burden
  const redirectUri = OAUTH_REDIRECT_URI.value() || `https://${req.hostname}/api/callback`;
  const { state } = req.query;

  const authorizationUri = oauth2.authorizeURL({
    scope: configuration.scopes,
    state: (state as string) || randomstring.generate(32),
    redirect_uri: redirectUri,
  });

  return res.redirect(authorizationUri);
});

api.get("/callback", async (req, res) => {
  const provider = OAUTH_PROVIDER.value() as Provider;

  try {
    const configuration = config(
      provider, OAUTH_CLIENT_ID.value(),
      OAUTH_CLIENT_SECRET.value(),
      OAUTH_GIT_HOSTNAME.value());
    const oauth2 = new AuthorizationCode({
      client: configuration.client,
      auth: configuration.auth,
    });

    // Dynamic redirect URI - must match the one sent in auth
    const redirectUri = OAUTH_REDIRECT_URI.value() || `https://${req.hostname}/api/callback`;

    const options: any = {
      code: req.query.code,
      redirect_uri: redirectUri,
    };

    if (provider === "gitlab") {
      options.client_id = configuration.client.id;
      options.client_secret = configuration.client.secret;
      options.grant_type = "authorization_code";
    }

    const token = await oauth2.getToken(options);

    return res.send(
      renderBody(provider, "success", {
        token: token.token.access_token,
        provider: provider
      })
    );
  } catch (error) {
    logger.error("Access Token Error", error);
    return res.send(renderBody(provider, "error", error));
  }
});

api.get("/success", (req, res) => {
  res.send("");
});

oauthApp.get("/", (req, res) => {
  res.redirect(301, "/api/auth");
});

exports.oauth = onRequest({ secrets: [OAUTH_CLIENT_SECRET.name] }, oauthApp);
