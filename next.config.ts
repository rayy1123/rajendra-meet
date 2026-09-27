import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  // Direktori induk berisi package-lock.json sendiri (Supabase CLI), sehingga
  // Next salah menebak workspace root. Kunci ke folder aplikasi ini.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
