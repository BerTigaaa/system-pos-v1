const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
const CF_ACCOUNT_HASH = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;

export function isConfigured() {
  return !!(CF_ACCOUNT_ID && CF_API_TOKEN && CF_ACCOUNT_HASH);
}

export function getImageUrl(imageId: string): string | null {
  if (!CF_ACCOUNT_HASH) return null;
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${imageId}/public`;
}

export async function createUploadUrl() {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    return { success: false as const, error: new Error("Cloudflare Images not configured") };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requireSignedURLs: false }),
        signal: AbortSignal.timeout(10000),
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { success: false as const, error: new Error(msg) };
  }

  if (!res.ok) {
    return { success: false as const, error: new Error(`Cloudflare API responded ${res.status}`) };
  }

  let json: { success: boolean; result?: { uploadURL: string; id: string }; errors?: { message: string }[] };
  try {
    json = await res.json();
  } catch {
    return { success: false as const, error: new Error("Invalid response from Cloudflare") };
  }

  if (!json.success) {
    return { success: false as const, error: new Error(json.errors?.[0]?.message ?? "Upload URL creation failed") };
  }

  if (!json.result?.uploadURL || !json.result?.id) {
    return { success: false as const, error: new Error("Missing upload URL in response") };
  }

  return {
    success: true as const,
    data: {
      uploadUrl: json.result.uploadURL,
      imageId: json.result.id,
    },
  };
}
