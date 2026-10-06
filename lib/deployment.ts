export function appOrigin(request: Request) {
  const configured = process.env.APP_URL;
  if (configured) {
    const url = new URL(configured);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("APP_URL must use HTTPS in production");
    }
    return url.origin;
  }
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL is required");
  return new URL(request.url).origin;
}
