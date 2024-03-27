/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: [
        "oaidalleapiprodscus.blob.core.windows.net",
        "trysai.s3.us-west-1.amazonaws.com",
        // 添加其他需要加载图片的外部域名
      ],
    },
    // (Optional) Export as a static site
    // See https://nextjs.org/docs/pages/building-your-application/deploying/static-exports#configuration
    // output: 'export', // Feel free to modify/remove this option
  
    // Override the default webpack configuration
    webpack: (config, { isServer }) => {
        // Ignore node-specific modules when bundling for the browser
        // See https://webpack.js.org/configuration/resolve/#resolvealias
        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
            "onnxruntime-node$": false,
            // 添加其他需要忽略的模块
        }
        if (!isServer) {
          config.module.rules.push({
            test: /\.wasm$/,
            type: 'javascript/auto',
            loader: 'file-loader',
            options: {
              publicPath: '/_next/static/chunks/',
              outputPath: 'static/chunks/',
            },
          });
        }
        return config;
    },
  };
  
  export default nextConfig;