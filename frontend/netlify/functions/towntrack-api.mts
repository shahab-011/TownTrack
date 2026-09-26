const TOWNTRACK_API_URL = "https://towntrack-gkfd.onrender.com";
const ALLOWED_ENDPOINTS = new Set(["chat", "approve"]);

export default async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const endpoint = new URL(request.url).pathname.split("/").filter(Boolean).at(-1);

  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    return Response.json({ error: "Endpoint not found" }, { status: 404 });
  }

  try {
    const upstreamResponse = await fetch(`${TOWNTRACK_API_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": upstreamResponse.headers.get("Content-Type") || "application/json",
      },
    });
  } catch {
    return Response.json(
      { error: "TownTrack API is currently unavailable" },
      { status: 502 },
    );
  }
};

export const config = {
  path: "/api/:endpoint",
};
