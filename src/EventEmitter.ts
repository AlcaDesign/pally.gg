type EventBase = {
	[key: string]: (...args: any[]) => void;
};

export default class EventEmitter<Events extends EventBase> {
	private events: Map<keyof Events, Events[keyof Events][]> = new Map();
	emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>) {
		const listeners = this.events.get(event);
		if(listeners) {
			for(const listener of listeners) {
				listener(...args);
			}
		}
	}
	on<K extends keyof Events>(event: K, listener: Events[K]) {
		const listeners = this.events.get(event) ?? [];
		listeners.push(listener);
		this.events.set(event, listeners);
	}
}