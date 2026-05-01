export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ALTFaze";

export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN 
  ? `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}`
  : "https://altfaze.in";

export const APP_HOSTNAMES = new Set([
    process.env.NEXT_PUBLIC_APP_DOMAIN || "altfaze.in",
    `www.${process.env.NEXT_PUBLIC_APP_DOMAIN || "altfaze.in"}`,
]);
