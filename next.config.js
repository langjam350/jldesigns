/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    serverExternalPackages: ['firebase', 'firebase-admin'],
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                stream: false,
                url: false,
                zlib: false,
                http: false,
                https: false,
                assert: false,
                os: false,
                path: false,
            }
        }
        
        // Exclude problematic modules
        config.externals = config.externals || []
        config.externals.push({
            'undici': 'commonjs undici',
            'firebase-admin': 'commonjs firebase-admin'
        })
        
        return config
    }
}

module.exports = nextConfig