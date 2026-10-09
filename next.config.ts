import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Allow the current temporary mobile preview to load dev assets through its proxy origin.
  allowedDevOrigins: ['192.168.1.100', 'common-suits-unite.loca.lt', '*.loca.lt'],
};
export default nextConfig;
