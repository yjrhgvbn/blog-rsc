/** @type {import('next').NextConfig} */
module.exports = {
  output: "export",
  reactStrictMode: true,
  transpilePackages: ["@repo/ui"],
  // experimental: { optimizeCss: true },
};
