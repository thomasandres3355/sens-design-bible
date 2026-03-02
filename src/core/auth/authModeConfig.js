// Central auth mode switch — controls mock vs real OAuth
export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || "mock";
export const isRealAuth = AUTH_MODE === "real";
export const isMockAuth = AUTH_MODE === "mock";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
