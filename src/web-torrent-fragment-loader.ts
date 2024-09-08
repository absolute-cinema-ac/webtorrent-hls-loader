import { HlsConfig, Loader, LoaderCallbacks, LoaderConfiguration, LoaderContext, LoaderStats } from 'hls.js'
import { WebTorrentLoadStats, WebTorrentHlsManager } from './web-torrent-hls-manager';

export class WebTorrentFragmentLoader implements Loader<LoaderContext> {
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
        console.log("[WebTorrentFragmentLoader]: destroy");
        this.webTorrentManager.destroy();
        this.hlsLoader.destroy()
    }
    abort(): void {
        console.log("[WebTorrentFragmentLoader]: abort");
        this.webTorrentManager.destroy();
        this.hlsLoader.abort();
    }
    load(context: LoaderContext, config: LoaderConfiguration, callbacks: LoaderCallbacks<LoaderContext>): void {
        console.log("[WebTorrentFragmentLoader]: load");
        const fragmentLoader = this;
        const fragmentFilename = context.url.replace("magnet:", "").split("/").at(-1);

        this.webTorrentManager.loadTorrent(
            context.url,
            fragmentFilename ?? "web-torrent-stream-data.ts",
            function(torrent: any, file: any) {
                // TODO: do the things we need to do with playlist...
                file.getBlob(function(err: any, blob: any) {
                    if (err) {
                        console.error("Error loading fragment: ", err);
                    }
                    var fileReader = new FileReader();
                    fileReader.onload = function(e) {
                        console.log("Result: ", this.result)
                        console.log("Reader event: ", e)
                        // self.stats.loading.end = performance.now();
                        callbacks.onSuccess(
                            {
                                url: context.url,
                                data: this.result ?? undefined,
                            }, 
                            fragmentLoader.stats,
                            context,
                            fragmentLoader.webTorrentManager
                        );
                    };
                    fileReader.readAsArrayBuffer(blob);
                })

            }
        )
    }

    // TODO: Implement this loader functions...
    // getCacheAge?: (() => number | null) | undefined;
    // getResponseHeader?: ((name: string) => string | null) | undefined;
}