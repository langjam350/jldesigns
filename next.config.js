/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable static export temporarily to test build
    // output: 'export',
    images: {
        unoptimized: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Remove experimental features that might cause issues
    // experimental: {
    //     esmExternals: false,
    // },
}

module.exports = nextConfig
