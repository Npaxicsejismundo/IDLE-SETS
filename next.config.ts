import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set questions are read from content/sets/*.csv at request time, so make
  // sure those files are deployed with the member pages.
  outputFileTracingIncludes: {
    "/members/**": ["./content/sets/**/*"],
  },
};

export default nextConfig;
