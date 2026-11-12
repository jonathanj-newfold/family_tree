/** @type {import('next').NextConfig} */
const nextConfig = {
  // Private archive: never let search engines index it.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};
export default nextConfig;
