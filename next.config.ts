import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Direktori induk berisi package-lock.json sendiri (Supabase CLI), sehingga
  // Next salah menebak workspace root. Kunci ke folder aplikasi ini.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
