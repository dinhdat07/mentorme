import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { UserRole } from "@prisma/client";

const oauthClient = new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleRedirectUri);

export const buildGoogleAuthUrl = (role: UserRole) => {
  const state = Buffer.from(JSON.stringify({ role })).toString("base64url");

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
    redirect_uri: env.googleRedirectUri,
  });
};

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
}

export const getGoogleProfile = async (code: string): Promise<GoogleProfile> => {
  const { tokens } = await oauthClient.getToken({
    code,
    redirect_uri: env.googleRedirectUri,
  });

  const idToken = tokens.id_token;
  if (!idToken) {
    throw new Error("Missing id_token from Google");
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google profile");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    fullName: payload.name || payload.email.split("@")[0],
  };
};
