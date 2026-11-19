/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@qam/core"],
  // Word-timing files for archive reciters (apps/web/data/timings) must ship with the player function.
  outputFileTracingIncludes: { "/api/public/v1/player/surah/[chapterId]": ["./data/timings/**/*"] },
};

export default nextConfig;
