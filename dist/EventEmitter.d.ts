type EventBase = {
    [key: string]: (...args: any[]) => void;
};
export default class EventEmitter<Events extends EventBase> {
    private events;
    emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void;
    on<K extends keyof Events>(event: K, listener: Events[K]): void;
}
export {};
