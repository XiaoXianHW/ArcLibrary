/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained `.next/standalone` server with only the
  // production node_modules it actually imports. The Docker image copies
  // this output to keep the runtime layer ~100 MB instead of dragging in
  // the full repo + dev deps. No-op for `vercel` deploys.
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
