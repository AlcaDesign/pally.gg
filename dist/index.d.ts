import EventEmitter from './EventEmitter';
declare namespace Payloads {
    namespace CampaignTipNotify {
        interface CampaignTip {
            id: string;
            createdAt: string;
            updatedAt: string;
            grossAmountInCents: number;
            netAmountInCents: number;
            processingFeeInCents: number;
            displayName: string;
            message: string;
        }
        interface Page {
            /**
             * The unique identifier for the page.
             */
            id: string;
            /**
             * The slug of the page.
             */
            slug: string;
            /**
             * The title of the page.
             */
            title: string;
            /**
             * The URL of the page.
             */
            url: string;
        }
        /**
         * @see https://docs.pally.gg/developers/websockets#campaigntip-notify
         */
        interface Payload {
            campaignTip: CampaignTip;
            page: Page;
        }
    }
}
/**
 * Note from the documentation:
 * > The event payload may contain additional/undocumented fields but will always contain the documented fields.
 *
 * @see https://docs.pally.gg/developers/websockets#campaigntip-notify
 */
interface CampaignTip {
    /**
     * The unique identifier for the tip.
     */
    id: string;
    /**
     * The date and time the tip was created.
     */
    createdAt: Date;
    /**
     * The date and time the tip was last updated.
     */
    updatedAt: Date;
    /**
     * The gross amount of the tip in cents.
     */
    grossAmountInCents: number;
    /**
     * The net amount of the tip in cents.
     */
    netAmountInCents: number;
    /**
     * The processing fee of the tip in cents.
     */
    processingFeeInCents: number;
    /**
     * The display name of the tipper.
     */
    displayName: string;
    /**
     * The message the tipper left with the tip.
     */
    message: string;
}
/**
 * @see https://docs.pally.gg/developers/websockets#campaigntip-notify
 */
type Page = Payloads.CampaignTipNotify.Page;
type Events = {
    connect: () => void;
    close: (e: CloseEvent) => void;
    reconnecting: () => void;
    error: (e: Event) => void;
    pong: (latency: number) => void;
    'campaigntip.notify': (campaignTip: CampaignTip, page: Page) => void;
};
type ChannelType = 'firehose' | 'activity-feed';
interface KeepaliveOpts {
    /**
     * The interval in seconds at which to send a ping to the server.
     */
    intervalSeconds?: number;
    /**
     * The number of seconds to wait for a pong response before closing the connection and reconnecting.
     */
    pingTimeoutSeconds?: number;
}
export interface Opts {
    /**
     * Your API key. Required.
     *
     * @see https://pally.gg/dashboard/settings/api-keys
     */
    auth: string;
    /**
     * The channel to connect to.
     * - `'firehose'` - The firehose feed sends all tips for all pages you own. Default.
     * - `'activity-feed'` - The activity feed sends all tips for a specific page you own or have access to.
     */
    channel?: ChannelType;
    /**
     * The specific activity feed "slug" to listen to. This is only required if the channel is set to
     * `'activity-feed'`, otherwise it is ignored.
     */
    room?: string;
    /**
     * Options for keepalive.
     */
    keepalive?: KeepaliveOpts;
}
interface Keepalive {
    /**
     * The timestamp of the last ping sent.
     */
    lastPingAt?: number;
    /**
     * The latency in milliseconds.
     */
    latencyMs?: number;
    interval?: ReturnType<typeof setInterval>;
    intervalSeconds: number;
    pingTimeout?: ReturnType<typeof setTimeout>;
    pingTimeoutSeconds: number;
}
/**
 * @see https://docs.pally.gg/developers/websockets
 */
declare class Client extends EventEmitter<Events> {
    /**
     * The WebSocket connection.
     */
    socket?: WebSocket;
    /**
     * The channel to connect to.
     */
    channel: ChannelType;
    /**
     * The specific activity feed "slug" to listen to if the channel is set to `'activity-feed'`.
     */
    room?: string;
    /**
     * Your API key.
     */
    auth: string;
    readonly keepalive: Keepalive;
    private wasCloseCalled;
    constructor(opts: Opts);
    /**
     * Connect to the server.
     */
    connect(): void;
    /**
     * Close the connection to the server.
     */
    close(): void;
    private handleOpen;
    private handleClose;
    private handleError;
    private handleMessage;
    private ping;
    private setKeepaliveInterval;
    private stopKeepaliveInterval;
    private send;
    /**
     * Ask the server to echo a test message. This is useful for testing your connection and events. The
     * 'campaigntip.notify' event will be emitted with a test payload. The payload will be the same each time. The tip
     * ID will be `'TEST'`.
     *
     * Alternatively, you can press the "Replay Alert" button in the Pally.gg activity feed.
     *
     * @see https://docs.pally.gg/developers/websockets#testing
     * @see https://docs.pally.gg/features/activity-feed#replay-tip-alerts
     */
    sendTest(): void;
}
declare const _default: {
    Client: typeof Client;
};
export default _default;
