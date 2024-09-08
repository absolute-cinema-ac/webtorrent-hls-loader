import { HlsConfig, Loader, LoaderCallbacks, LoaderConfiguration, LoaderContext, LoaderStats } from 'hls.js'
import { WebTorrentLoadStats, WebTorrentHlsManager } from './web-torrent-hls-manager';

export class WebTorrentPlaylistLoader implements Loader<LoaderContext> {
    public context: LoaderContext | null = null;
    public stats: LoaderStats;
    private webTorrentManager: WebTorrentHlsManager;
    private hlsLoader: Loader<LoaderContext>;

    constructor(config: HlsConfig) {
        this.stats = new WebTorrentLoadStats();
        this.hlsLoader = new config.loader(config);

        const webTorrentManager = WebTorrentHlsManager.getInstance()
        if (webTorrentManager) {
            this.webTorrentManager = webTorrentManager;
        } else {
            throw Error('WebTorrentManager is not initiated')
        }
    }

    destroy(): void {
        console.log("[WebTorrentPlaylistLoader]: destroy");
        this.webTorrentManager.destroy();
        this.hlsLoader.destroy()
    }
    abort(): void {
        console.log("[WebTorrentPlaylistLoader]: abort");
        this.webTorrentManager.destroy();
        this.hlsLoader.abort();
    }
    load(context: LoaderContext, config: LoaderConfiguration, callbacks: LoaderCallbacks<LoaderContext>): void {
        console.log("[WebTorrentPlaylistLoader]: load");
        const playlistLoader = this;

        const playlistFilename = context.url.replace("magnet:", "").split("/").at(-1) ?? "master.m3u8";

        this.webTorrentManager.loadTorrent(
            context.url,
            context.url.startsWith("magnet:?xt=urn:btih:") ? "master.m3u8" : playlistFilename,
            function(torrent: any, file: any) {
                console.log("[WebTorrentPlaylistLoader] onTorrent: ", file);
                // TODO: do the things we need to do with playlist...
                file.getBuffer(function (err: any, buffer: any) {
                    console.log("[WebTorrentPlaylistLoader] getBuffer");
                    if (err) {
                        console.error(`[WebTorrentPlaylistLoader] Error loading ${context.url}`, err);
                        // TODO: User onError
                        callbacks.onError(
                            {code: 2000, text: "Failed to load playlist file"},
                            context,
                            playlistLoader.webTorrentManager,
                            playlistLoader.stats
                        )
                    }
                    const manifest = buffer.toString("utf-8")
                    console.log("[WebTorrentPlaylistLoader] manifest: ", manifest);
                    playlistLoader.stats.loading.end = performance.now();
                    callbacks.onSuccess(
                        {
                            url: context.url,
                            data: manifest,
                        }, 
                        playlistLoader.stats,
                        context,
                        playlistLoader.webTorrentManager
                    );
                })

            }
        )
    }

    // TODO: Implement this loader functions...
    // getCacheAge?: (() => number | null) | undefined;
    // getResponseHeader?: ((name: string) => string | null) | undefined;
}