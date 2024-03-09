/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    env: {
        NEXT_PUBLIC_USER_EMAIL: process.env.NEXT_PUBLIC_USER_EMAIL,
        // Add other environment variables as needed
    },
}

module.exports = nextConfig
