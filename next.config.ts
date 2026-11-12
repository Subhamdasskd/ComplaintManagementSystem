import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's query engine must stay outside the bundler; bcryptjs is pure JS but is
  // only ever used in server code, so externalising it keeps the client bundle clean.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
