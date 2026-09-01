/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep these out of the bundle so Prisma's engine and pdfkit's `__dirname`
    // font lookups still resolve inside the serverless function.
    serverComponentsExternalPackages: ['pdfkit', '@prisma/client', 'bcryptjs'],

    // pdfkit loads its standard fonts with `readFileSync(__dirname + '/data/*.afm')`
    // at request time. Those reads are invisible to static tracing, so on Vercel
    // the files must be included explicitly or PDF generation fails at runtime
    // with ENOENT.
    outputFileTracingIncludes: {
      '/api/reports/estate-season-performance': ['./node_modules/pdfkit/js/data/**'],
    },
  },
};

export default nextConfig;
