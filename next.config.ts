import type { NextConfig } from "next";

// GitHub Pages build (see .github/workflows/pages.yml): the public pages only, exported as
// static files under /<repo>. Everything else (admin, member area, check-in) needs a server
// and is removed from the tree by the workflow before building.
const isStaticSite = process.env.NEXT_PUBLIC_STATIC_SITE === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

// Allow next/image to load coach photos from the Supabase Storage host.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = isStaticSite
  ? {
      output: "export",
      basePath,
      trailingSlash: true,
      // No image optimizer on static hosting; this loader only adds the basePath.
      images: { loader: "custom", loaderFile: "./lib/image-loader.ts" },
    }
  : {
      experimental: {
        // Photo uploads (5 MB max per file) go through Server Actions.
        serverActions: { bodySizeLimit: "6mb" },
      },
      images: {
        remotePatterns: supabaseUrl
          ? [
              {
                protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
                hostname: supabaseUrl.hostname,
                port: supabaseUrl.port,
                pathname: "/storage/v1/object/public/**",
              },
            ]
          : [],
      },
    };

export default nextConfig;
