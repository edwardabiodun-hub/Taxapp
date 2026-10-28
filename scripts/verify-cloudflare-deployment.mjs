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

async function fetchSameOriginRoute(origin, route, fetcher) {
  const redirects = [];
  let url = `${origin}${route}`;

  for (let attempt = 0; attempt <= 3; attempt += 1) {
    const response = await fetcher(url, { redirect: "manual" });
    const location = response.headers.get("location");
    const isRedirect = response.status >= 300 && response.status < 400 && location;

    if (!isRedirect) {
      return {
        status: response.status,
        initialStatus: redirects.length > 0 ? redirects[0].status : response.status,
        redirects: redirects.map((redirect) => redirect.location),
        ok: response.status === 200,
      };
    }

    const redirectHistory = [...redirects.map((redirect) => redirect.location), location];
    if (attempt === 3) {
      return {
        status: response.status,
        initialStatus: redirects.length > 0 ? redirects[0].status : response.status,
        redirects: redirectHistory,
        ok: false,
      };
    }

    const nextUrl = new URL(location, url);
    if (nextUrl.origin !== origin) {
      return {
        status: response.status,
        initialStatus: redirects.length > 0 ? redirects[0].status : response.status,
        redirects: redirectHistory,
        ok: false,
      };
    }

    redirects.push({ status: response.status, location });
    url = nextUrl.href;
  }

  throw new Error("Unreachable redirect evaluation");
}

export async function verifyDeployment(baseUrl, {
  fetcher = fetch,
  unknownPath = "/__filesmart_404_probe__",
} = {}) {
  const origin = normalizeBaseUrl(baseUrl);
  const routes = [];

  for (const route of EXPECTED_ROUTES) {
    routes.push({ route, ...(await fetchSameOriginRoute(origin, route, fetcher)) });
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
