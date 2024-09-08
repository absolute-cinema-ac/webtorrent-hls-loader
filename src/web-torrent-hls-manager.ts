// import { URL } from 'node:url';
import { HlsPerformanceTiming, HlsProgressivePerformanceTiming, Loader, LoaderCallbacks, LoaderConfiguration, LoaderContext, LoaderStats } from 'hls.js'

export class WebTorrentLoadStats implements LoaderStats {
    aborted: boolean = false;
    loaded: number = 0;
    retry: number = 0; // Not relevant for torrents...
    total: number = 0;
    chunkCount: number = 0; // Might also add pieceCount...
    bwEstimate: number = 0;
    loading: HlsProgressivePerformanceTiming = { start: 0, first: 0, end: 0 };
    parsing: HlsPerformanceTiming = { start: 0, end: 0 };
    buffering: HlsProgressivePerformanceTiming = { start: 0, first: 0, end: 0 };
}

export class WebTorrentHlsManager {
    private static instance: WebTorrentHlsManager | null = null;
    public webTorrentClient: any
    public activeTorrent: any | null = null;

    constructor(webTorrentClient: any) {
        this.webTorrentClient = webTorrentClient;
    }

    public static initiateManager(webTorrentClient: any) {
        console.log("[WebTorrentHlsManager]: initiateManager");
        if (this.instance == null) {
            this.instance = new WebTorrentHlsManager(webTorrentClient)
        }
        return this.instance;
    }

    public static getInstance(): WebTorrentHlsManager | null {
        console.log("[WebTorrentHlsManager]: getInstance");
        if (this.instance == null) {
            console.error("WebTorrentHlsManager is not initiated");
            throw Error("WebTorrentHlsManager is not initiated")
        }
        return this.instance
    }

    public destroy() {
        console.log("[WebTorrentHlsManager]: destroy");
        // TODO: Figure out what to do on destroy
    }

    public abort() {
        console.log("[WebTorrentHlsManager]: abort");
        // TODO: Figure out what to do on abort
    }

    private findFileInTorrent(torrent: any, fileName: string, onTorrent: (torrent: any, file: any) => void) {
        if (torrent.files.length == 1) {
            // There's only 1 file in this torrent...
            onTorrent(torrent, torrent.files.at(0));
            return;
        } else {
            const magnetURL = new URL(torrent.magnetURI);

            const selectOnlyParameter = magnetURL.searchParams.get("so"); // Assuming we are getting the first "so" parameter

            if (selectOnlyParameter) {
                const selectedIndex = Number(selectOnlyParameter);

                if (isNaN(selectedIndex)) {
                    console.error("selectOnly parameter is not a number...")
                    // TODO: OnError...
                } else {
                    const file = torrent.files.at(selectedIndex);
                    if (file) {
                        onTorrent(torrent, file);
                    } else {
                        console.error("Couldn't find file index specified by 'so' parameter")
                        // TODO: OnError... 
                    }
                }
            } else {
                
                const file = torrent.files.find(function (file: any) {
                    return file.name.endsWith(fileName)
                })

                if (file) {
                    onTorrent(torrent, file);
                } else {
                    console.error("Failed to find file named: ", fileName);
                }
                // TODO: we should find master.m3u8
            }

        }
    }

    public loadTorrent(torrentURI: string, defaultFileName: string, onTorrent: (torrent: any, file: any) => void) {
        console.log("[WebTorrentHlsManager]: addTorrent");
        if (torrentURI.startsWith("magnet:?xt=urn:btih:")) {
            const existingTorrent = this.webTorrentClient.get(torrentURI);
            if (existingTorrent) {
                if (existingTorrent.infoHash != this.activeTorrent.infoHash) {
                    // TODO: Consider removing the active torrent from webTorrentClient...
                    this.activeTorrent = existingTorrent
                }

                this.findFileInTorrent(
                    existingTorrent,
                    defaultFileName,
                    onTorrent
                )
            }

            const self = this;
            this.webTorrentClient.add(torrentURI, function (torrent: any) {
                self.findFileInTorrent(
                    torrent, 
                    defaultFileName, 
                    onTorrent
                );
            });
        } else {
            const fileName = torrentURI.replace("magnet:", "");
            // We will assume we should find the file in the activeTorrent...
            // TODO: fileIndex...
            if (this.activeTorrent) {
                const file = this.activeTorrent.files.find((f: any) => {
                    return f.name.endsWith(fileName)
                })
                if (file) {
                    onTorrent(this.activeTorrent, file);
                } else {
                    // We might be able to find this file in active Torrent...
                    this.findFileInTorrent(
                        this.activeTorrent,
                        fileName,
                        onTorrent
                    )
                }
            } else {
                console.error("[WebTorrentHlsManager]: No active torrents")
                // TODO: onError "No active torrent"
            }
            
        }
    }
}

