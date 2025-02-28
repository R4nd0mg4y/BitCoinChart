import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["s2.coinmarketcap.com"], // Cho phép ảnh từ CoinMarketCap
  },
};

export default nextConfig;
