const EXPECTED_ROUTES = [
  "/",
  "/calculator",
  "/filing-directory",
  "/learn",
  "/privacy",
  "/terms",
  "/contact",
];

function normalizeBaseUrl(baseUrl) {
  const value = String(baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(value)) {
    throw new Error("Cloudflare verification requires an HTTPS base URL.");
  }
  return value;
}

export async function verifyDeployment(baseUrl, {
  fetcher = fetch,
  unknownPath = "/__filesmart_404_probe__",
} = {}) {
  const origin = normalizeBaseUrl(baseUrl);
  const routes = [];

  for (const route of EXPECTED_ROUTES) {
    const response = await fetcher(`${origin}${route}`, { redirect: "manual" });
    routes.push({ route, status: response.status, ok: response.status === 200 });
  }

  const unknownResponse = await fetcher(`${origin}${unknownPath}`, { redirect: "manual" });
  const unknownRoute = {
    route: unknownPath,
    status: unknownResponse.status,
    ok: unknownResponse.status === 404,
  };

  return {
    origin,
    routes,
    unknownRoute,
    pass: routes.every((route) => route.ok) && unknownRoute.ok,
  };
}

const isDirectRun = process.argv[1]?.replaceAll("\\", "/").endsWith("/verify-cloudflare-deployment.mjs");

if (isDirectRun) {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error("Usage: npm run verify:cloudflare -- https://staging.example.com");
    process.exitCode = 2;
  } else {
    try {
      const result = await verifyDeployment(baseUrl);
      console.log(JSON.stringify(result, null, 2));
      if (!result.pass) process.exitCode = 1;
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
