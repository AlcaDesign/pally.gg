// src/EventEmitter.ts
var EventEmitter = class {
  constructor() {
    this.events = /* @__PURE__ */ new Map();
  }
  emit(event, ...args) {
    const listeners = this.events.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }
  on(event, listener) {
    const listeners = this.events.get(event) ?? [];
    listeners.push(listener);
    this.events.set(event, listeners);
  }
};

// src/index.ts
var BASE_SOCKET_URL = "wss://events.pally.gg";
var Client = class extends EventEmitter {
  constructor(opts) {
    super();
    this.wasCloseCalled = false;
    this.keepalive = {
      lastPingAt: void 0,
      latencyMs: void 0,
      interval: void 0,
      intervalSeconds: opts.keepalive?.intervalSeconds ?? 60,
      pingTimeout: void 0,
      pingTimeoutSeconds: opts.keepalive?.pingTimeoutSeconds ?? 10
    };
    this.channel = opts.channel ?? "firehose";
    this.room = this.channel === "activity-feed" ? opts.room : void 0;
    this.auth = opts.auth;
  }
  /**
   * Connect to the server.
   */
  connect() {
    if (this.socket) {
      throw new Error("Socket already connected");
    }
    const qs = new URLSearchParams({
      auth: this.auth,
      channel: this.channel
    });
    if (this.channel === "activity-feed") {
      if (!this.room) {
        throw new Error('The "room" option is required when the channel is set to "activity-feed".');
      }
      qs.append("room", this.room);
    }
    const socket = new WebSocket(`${BASE_SOCKET_URL}?${qs}`);
    this.socket = socket;
    socket.addEventListener("open", (e) => this.handleOpen(e));
    socket.addEventListener("close", (e) => this.handleClose(e));
    socket.addEventListener("error", (e) => this.handleError(e));
    socket.addEventListener("message", (e) => this.handleMessage(e));
  }
  /**
   * Close the connection to the server.
   */
  close() {
    this.wasCloseCalled = true;
    this.socket?.close();
  }
  handleOpen(e) {
    this.ping();
    this.setKeepaliveInterval();
    this.emit("connect");
  }
  handleClose(e) {
    this.stopKeepaliveInterval();
    this.keepalive.lastPingAt = void 0;
    this.keepalive.latencyMs = void 0;
    this.socket = void 0;
    this.emit("close", e);
    if (this.wasCloseCalled) {
      return;
    }
    const ms = 1e3;
    setTimeout(() => {
      this.emit("reconnecting");
      this.connect();
    }, ms);
  }
  handleError(e) {
    this.emit("error", e);
  }
  handleMessage(e) {
    const now = Date.now();
    const dataString = e.data.toString();
    if (dataString === "pong") {
      clearTimeout(this.keepalive.pingTimeout);
      this.keepalive.latencyMs = now - this.keepalive.lastPingAt;
      this.emit("pong", this.keepalive.latencyMs);
      return;
    }
    try {
      const data = JSON.parse(dataString);
      switch (data.type) {
        case "campaigntip.notify": {
          const payload = data.payload;
          const campaignTip = {
            ...payload.campaignTip,
            createdAt: new Date(payload.campaignTip.createdAt),
            updatedAt: new Date(payload.campaignTip.updatedAt)
          };
          this.emit("campaigntip.notify", campaignTip, payload.page);
          break;
        }
      }
    } catch (err) {
      console.error("Error parsing message", err, dataString);
    }
  }
  ping() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Socket not connected");
    }
    this.socket.send("ping");
    this.keepalive.lastPingAt = Date.now();
    this.keepalive.pingTimeout = setTimeout(() => {
      if (!this.socket) {
        return;
      }
      this.socket.close();
    }, this.keepalive.pingTimeoutSeconds * 1e3);
  }
  setKeepaliveInterval() {
    if (this.keepalive.interval) {
      clearInterval(this.keepalive.interval);
    }
    const ms = this.keepalive.intervalSeconds * 1e3;
    this.keepalive.interval = setInterval(() => this.ping(), ms);
  }
  stopKeepaliveInterval() {
    clearInterval(this.keepalive.interval);
    clearTimeout(this.keepalive.pingTimeout);
  }
  send(data) {
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
    const type = "campaigntip.notify";
    const payload = {
      campaignTip: {
        id: "TEST",
        createdAt: "2024-03-13T18:02:33.743Z",
        updatedAt: "2024-03-13T18:02:33.743Z",
        grossAmountInCents: 500,
        netAmountInCents: 500,
        processingFeeInCents: 0,
        displayName: "Someone",
        message: ""
      },
      page: {
        id: "1627451579049x550722173620715500",
        slug: "pally",
        title: "Pally.gg's Team Page",
        url: "https://pally.gg/p/pally"
      }
    };
    this.send({ type: "echo", payload: { type, payload } });
  }
};
var src_default = {
  Client
};
export {
  src_default as default
};
//# sourceMappingURL=pally.node.mjs.map
