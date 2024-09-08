// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import polyfillNode from 'rollup-plugin-polyfill-node';

export default {
	input: 'src/main.ts',
	output: {
        file: 'dist/web-torrent-hls-loader.js',
		name: 'WebTorrentHlsLoader',
		format: 'iife'
	},
	plugins: [
		resolve(),
		alias({
			entries: {
				url: "native-url"
			}
		}),
		typescript(),
		polyfillNode()
	]
};