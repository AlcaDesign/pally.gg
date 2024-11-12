import EventEmitter from './EventEmitter';

/**
 * @see https://docs.pally.gg/developers/websockets
 */
const BASE_SOCKET_URL = 'wss://events.pally.gg';

namespace Payloads {
	export namespace CampaignTipNotify {
		export interface CampaignTip {
			id: string;
			createdAt: string;
			updatedAt: string;
			grossAmountInCents: number;
			netAmountInCents: number;
			processingFeeInCents: number;
			displayName: string;
			message: string;
		}

		export interface Page {
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
		export interface Payload {
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
export interface CampaignTip {
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
export type Page = Payloads.CampaignTipNotify.Page;

type Events = {
	connect: () => void;
	close: (e: CloseEvent) => void;
	reconnecting: () => void;
	error: (e: Event) => void;
	pong: (latency: number) => void;
	'campaigntip.notify': (campaignTip: CampaignTip, page: Page) => void;
};

type ChannelType = 'firehose' | 'activity-feed';

interface KeepaliveOptions {
	/**
	 * The interval in seconds at which to send a ping to the server.
	 */
	intervalSeconds?: number;
	/**
	 * The number of seconds to wait for a pong response before closing the connection and reconnecting.
	 */
	pingTimeoutSeconds?: number;
}

export interface ClientOptions {
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
	keepalive?: KeepaliveOptions;
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
class Client extends EventEmitter<Events> {
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
	private wasCloseCalled: boolean = false;
	constructor(opts: ClientOptions) {
		super();
		this.keepalive = {
			lastPingAt: undefined,
			latencyMs: undefined,
			interval: undefined,
			intervalSeconds: opts.keepalive?.intervalSeconds ?? 60,
			pingTimeout: undefined,
			pingTimeoutSeconds: opts.keepalive?.pingTimeoutSeconds ?? 10,
		};
		this.channel = opts.channel ?? 'firehose';
		this.room = this.channel === 'activity-feed' ? opts.room : undefined;
		this.auth = opts.auth;
	}
	/**
	 * Connect to the server.
	 */
	connect() {
		if(this.socket) {
			throw new Error('Socket already connected');
		}
		const qs = new URLSearchParams({
			auth: this.auth,
			channel: this.channel,
		});
		if(this.channel === 'activity-feed') {
			if(!this.room) {
				throw new Error('The "room" option is required when the channel is set to "activity-feed".');
			}
			qs.append('room', this.room!);
		}
		const socket = new WebSocket(`${BASE_SOCKET_URL}?${qs}`);
		this.socket = socket;
		socket.addEventListener('open', e => this.handleOpen(e));
		socket.addEventListener('close', e => this.handleClose(e));
		socket.addEventListener('error', e => this.handleError(e));
		socket.addEventListener('message', e => this.handleMessage(e));
	}
	/**
	 * Close the connection to the server.
	 */
	close() {
		this.wasCloseCalled = true;
		this.socket?.close();
	}
	private handleOpen(e: Event) {
		this.ping();
		this.setKeepaliveInterval();
		this.emit('connect');
	}
	private handleClose(e: CloseEvent) {
		this.stopKeepaliveInterval();
		this.keepalive.lastPingAt = undefined;
		this.keepalive.latencyMs = undefined;
		this.socket = undefined;
		this.emit('close', e);
		if(this.wasCloseCalled) {
			return;
		}
		// TODO: Implement exponential backoff
		const ms = 1000;
		setTimeout(() => {
			this.emit('reconnecting');
			this.connect();
		}, ms);
	}
	private handleError(e: Event) {
		this.emit('error', e);
	}
	private handleMessage(e: MessageEvent) {
		const now = Date.now();
		const dataString = e.data.toString();
		if(dataString === 'pong') {
			clearTimeout(this.keepalive.pingTimeout);
			this.keepalive.latencyMs = now - this.keepalive.lastPingAt!;
			this.emit('pong', this.keepalive.latencyMs);
			return;
		}
		try {
			const data: { type: string; payload: any; } = JSON.parse(dataString);
			switch(data.type) {
				case 'campaigntip.notify': {
					const payload: Payloads.CampaignTipNotify.Payload = data.payload;
					const campaignTip: CampaignTip = {
						...payload.campaignTip,
						createdAt: new Date(payload.campaignTip.createdAt),
						updatedAt: new Date(payload.campaignTip.updatedAt),
					};
					this.emit('campaigntip.notify', campaignTip, payload.page);
					break;
				}
			}
		} catch(err) {
			console.error('Error parsing message', err, dataString);
		}
	}
	private ping() {
		if(!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			throw new Error('Socket not connected');
		}
		this.socket.send('ping');
		this.keepalive.lastPingAt = Date.now();
		this.keepalive.pingTimeout = setTimeout(() => {
			if(!this.socket) {
				return;
			}
			this.socket.close();
		}, this.keepalive.pingTimeoutSeconds * 1000);
	}
	private setKeepaliveInterval() {
		if(this.keepalive.interval) {
			clearInterval(this.keepalive.interval);
		}
		const ms = this.keepalive.intervalSeconds * 1000;
		this.keepalive.interval = setInterval(() => this.ping(), ms);
	}
	private stopKeepaliveInterval() {
		clearInterval(this.keepalive.interval);
		clearTimeout(this.keepalive.pingTimeout);
	}
	private send(data: any) {
		this.socket?.send(JSON.stringify(data));
	}
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
	sendTest() {
		const type = 'campaigntip.notify';
		const payload: Payloads.CampaignTipNotify.Payload = {
			campaignTip: {
				id: 'TEST',
				createdAt: '2024-03-13T18:02:33.743Z',
				updatedAt: '2024-03-13T18:02:33.743Z',
				grossAmountInCents: 500,
				netAmountInCents: 500,
				processingFeeInCents: 0,
				displayName: 'Someone',
				message: '',
			},
			page: {
				id: '1627451579049x550722173620715500',
				slug: 'pally',
				title: 'Pally.gg\'s Team Page',
				url: 'https://pally.gg/p/pally'
			}
		};
		this.send({ type: 'echo', payload: { type, payload } });
	}
}

export default {
	Client,
};
