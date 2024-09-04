# :shield::sparkles: pally.gg

Access a direct feed of your tips with WebSockets.

Unofficial package for [Pally.gg][pally-gg]. | [Pally.gg's Developer Documentation][dev-docs]

> :warning: The WebSockets feed is currently in Beta and subject to change.

# Install

## Node or Browser

```bash
npm install pally.gg
```

## Browser

Available as `Pally` on the global object.
```
<script src="https://unpkg.com/pally.gg/dist/pally.js"></script>
```
or
```js
import Pally from 'https://unpkg.com/pally.gg';
const client = new Pally.Client({ auth: 'YOUR_API_KEY' });
```

# Usage

## API Key

You will need an API key with the `events:read` scope (default) to access the Pally.gg API.

Get your [API key][api-key].

## Example

```js
import Pally from 'pally.gg';
const client = new Pally.Client({ auth: 'YOUR_API_KEY' });

client.connect();

client.on('connect', () => {
	setTimeout(() => client.sendTest(), 500);
});

client.on('campaigntip.notify', (campaignTip, page) => {
	const { grossAmountInCents, displayName, message } = campaignTip;
	const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
		.format(grossAmountInCents / 100);
	console.log(`New tip! ${amount} from ${displayName}: ${message}`);
});
```

# Docs

## Client

Enables connecting to the Pally.gg WebSockets feed.

The `Client` extends a basic, typed `EventEmitter`.

### Constructor `new Client(options: ClientOptions)`

### Properties

#### `auth`: `string`
- Required

Your API key. Get your [API key][api-key].

#### `channel`?: `'firehose' | 'activity-feed'`
- Default: `'firehose'`

The type of channel to connect to from the options.
- `'firehose'` is the default and is used for general tips.
- `'activity-feed'` is used for tips on a specific page.

#### `room`?: `string`
- Required: When `channel` is `'activity-feed'`

The room to connect to from the options. This is the slug of the page you want to receive tips for.

### Methods

#### `connect()`: `void`

Connect to the WebSockets feed.

#### `close()`: `void`

Disconnect from the WebSockets feed.

#### `sendTest()`: `void`

Ask the server to [echo a test message][ws-testing]. This is useful for testing your connection and events. The
`'campaigntip.notify'` event will be emitted with a test payload. The payload will be the same each time. The tip ID
will be `'TEST'`.

Alternatively, you can [press the "Replay Alert" button][replay-alert] in the Pally.gg activity feed.

### Events

Used with `client.on(eventName, (/* ... */) => void)` to listen for events.

#### `on('connect', () => void)`

Emitted when the client has successfully connected to the WebSockets feed.

#### `on('close', (event: CloseError) => void)`

Emitted when the connection has been closed.

#### `on('reconnecting', () => void)`

Emitted when the client is about to attempt to reconnect.

#### `on('error', (event: Error) => void)`

Emitted when a socket error occurred.

#### `on('pong', (latencyMs: number) => void)`

Emitted when a pong is received from the server. The `latencyMs` is the time in milliseconds it took to receive the pong
from the server.

#### `on('campaigntip.notify', (campaignTip: CampaignTip, page: Page) => void)`

Emitted when a new tip has been received. The `campaignTip` includes details about the tip, and the `page` includes
details about the page the tip was received on.

## Types

### interface ClientOptions

#### `auth`: `string`

Your API key. Required.

#### `channel`?: `'firehose' | 'activity-feed'`

The channel to connect to.
- `'firehose'` - The firehose feed sends all tips for all pages you own. Default.
- `'activity-feed'` - The activity feed sends all tips for a specific page you own or have access to.

#### `room`?: `string`

The specific activity feed "slug" to listen to. This is only required if the channel is set to `'activity-feed', otherwise it is ignored.

#### `keepalive`?: `KeepaliveOptions`

Options for keepalive.

### interface KeepaliveOptions

#### `intervalSeconds`?: `number`

The interval in seconds at which to send a ping to the server.

#### `pingTimeoutSeconds`?: `number`

The number of seconds to wait for a pong response before closing the connection and reconnecting.

### interface CampaignTip

#### `id`: `string`

The unique identifier for the tip.

#### `createdAt`: `Date`

The date and time the tip was created.

#### `updatedAt`: `Date`

The date and time the tip was last updated.

#### `grossAmountInCents`: `number`

The gross amount of the tip in cents.

#### `netAmountInCents`: `number`

The net amount of the tip in cents.

#### `processingFeeInCents`: `number`

The processing fee of the tip in cents.

#### `displayName`: `string`

The name of the tipper.

#### `message`: `string`

The message attached to the tip.

### interface Page

#### `id`: `string`

The unique identifier for the page.

#### `slug`: `string`

The slug of the page.

#### `title`: `string`

The title of the page.

#### `url`: `string`

The URL of the page.

[pally-gg]: https://pally.gg
[dev-docs]: https://docs.pally.gg/developers/websockets
[api-key]: https://pally.gg/dashboard/settings/api-keys
[ws-testing]: https://docs.pally.gg/developers/websockets#testing
[replay-alert]: https://docs.pally.gg/features/activity-feed#replay-tip-alerts