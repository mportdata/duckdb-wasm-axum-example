import { Configuration } from '@rspack/cli';
import path from 'path';

const config: Configuration = {
  entry: './frontend/app.ts',  // Entry point for TypeScript
  output: {
    filename: 'app.js',  // Output filename
    path: path.resolve(__dirname, 'static'),  // Output directory
  },
  resolve: {
    extensions: ['.ts', '.js'],  // Resolve TypeScript and JavaScript files
  },
  module: {
    rules: [
      {
        test: /\.ts$/,  // Apply swc-loader to .ts files
        use: 'swc-loader',
        exclude: /node_modules/,
      },
    ],
  },
};

export default config;
