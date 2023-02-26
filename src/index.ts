type Listener = (payload: unknown) => unknown;
type EventName = PropertyKey;
type Options = {
	debug?: boolean;
};

/**
 * @description: This function checks if eventName is of type string, symbol or number and throws an error if not.
 * @param {unknown} eventName
 * @return {*}
 */
function assertEventName(eventName: unknown): asserts eventName is EventName {
	if (typeof eventName !== "string" && typeof eventName !== "symbol" && typeof eventName !== "number") {
		throw new TypeError("`eventName` must be a string, symbol, or number");
	}
}

/**
 * @description: This function checks if listener is a valid Listener type.
 * @param {unknown} listener
 * @return {*}
 */
function assertListener(listener: unknown): asserts listener is Function {
	if (typeof listener !== "function") {
		throw new TypeError("listener must be a function");
	}
}

/**
 * @description: Parses the payload data using JSON.parse. If data is not of type string, it will return the original data.
 * @param {unknown} data
 * @return {*}
 */
function getParseData(data: unknown): unknown {
	try {
		return JSON.parse(data as string);
	} catch (error) {
		return data;
	}
}

/**
 * @description: Constructor for the Emitter class used for managing event emitters and listeners.
 * @return {*}
 */
export default class Emitter {
	private eventsMap: Map<EventName, Set<ReturnType<typeof this.listenerWithLog>>>;
	private listenersMap: WeakMap<Listener, ReturnType<typeof this.listenerWithLog>>;
	debug: boolean;

	constructor(options?: Options) {
		this.eventsMap = new Map();
		this.listenersMap = new WeakMap();
		this.debug = options?.debug ?? true;
	}

	/**
	 * @description: Helper method used to retrieve subscribers by the given eventName of type EventName.
	 * @param {EventName} eventName
	 * @return {*}
	 */
	private getSubscribers(eventName: EventName): Set<ReturnType<typeof this.listenerWithLog>> | undefined {
		if (!this.eventsMap.has(eventName)) {
			return;
		}

		return this.eventsMap.get(eventName);
	}

	/**
	 * @description: Logs information about an emitted event, which includes the time of emission, event name and payload.
	 * @param {string} eventType
	 * @param {EventName} eventName
	 * @param {unknown} eventData
	 * @return {*}
	 */
	private log(eventType: string, eventName: EventName, eventData?: unknown) {
		if (typeof eventName === "symbol" || typeof eventName === "number") {
			eventName = eventName.toString();
		}

		const currentTime = new Date();
		const logTime = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`;
		eventData = getParseData(eventData);

		console.groupCollapsed(`[${logTime}][eventType: ${eventType}][eventName: ${eventName}]`);
		console.dir("payload: ", eventData ?? "");
		console.groupEnd();
	}

	/**
	 * @description: A wrapper around subscribed Listener functions which allows for logging of the individual functions callbacks
	 * @param {EventName} eventName
	 * @param {Listener} listener
	 * @return {*}
	 */
	private listenerWithLog(eventName: EventName, listener: Listener): (payload: Record<EventName, unknown>) => unknown {
		return (payload: Record<EventName, unknown>) => {
			const res = listener(payload);
			this.log("call-listener", eventName, res);
			return res;
		};
	}

	/**
	 * @description: Method for subscribing listeners to events
	 * @param {EventName} eventName
	 * @param {Listener} listener
	 * @return {*}
	 */
	on(eventName: EventName, listener: Listener) {
		assertListener(listener);

		let subscribers = this.getSubscribers(eventName);
		if (!subscribers) {
			subscribers = new Set();
			this.eventsMap.set(eventName, subscribers);
		}
		const newListener = this.listenerWithLog(eventName, listener);
		this.listenersMap.set(listener, newListener);
		subscribers.add(newListener);
		this.log("subscribe", eventName);

		const emitter = {
			onReady: (): Promise<void> => {
				return new Promise(resolve => {
					resolve();
				});
			},
			off: (): boolean => {
				if (this.hasListener(eventName, listener)) {
					subscribers!.delete(newListener);
					this.listenersMap.delete(listener);
					this.log("unsubscribe", eventName);
					return true;
				}
				return false;
			},
		};

		return emitter;
	}

	/**
	 * @description: This method emits an event with a given eventName and payload.
	 * @param {EventName} eventName
	 * @param {Record} payload
	 * @param {*} unknown
	 * @return {*}
	 */
	emit(eventName: EventName, payload: Record<EventName, unknown>) {
		assertEventName(eventName);

		this.log("emit", eventName, payload);
		const listeners = this.getSubscribers(eventName) ?? new Set();
		const staticListeners = [...listeners];
		staticListeners.forEach(listener => {
			listener(payload);
		});
	}

	/**
	 * @description: This method removes a listener from the specified eventName.
	 * @param {EventName} eventName
	 * @param {Listener} listener
	 * @return {*}
	 */
	off(eventName: EventName, listener: Listener): boolean {
		assertListener(listener);
		assertEventName(eventName);

		if (!this.eventsMap.has(eventName)) {
			throw new Error(`this event has not been subscribed`);
		}

		if (!this.listenersMap.has(listener)) {
			throw new Error(`this listener has not been listened`);
		}

		const listeners = this.getSubscribers(eventName);
		const wrappedListener = this.listenersMap.get(listener)!;
		if (listeners) {
			this.listenersMap.delete(listener);
			listeners.delete(wrappedListener);
			if (listeners.size === 0) {
				this.eventsMap.delete(eventName);
			}
		}

		this.log("unsubscribe", eventName);
		return true;
	}

	// todo
	// once(eventName: EventName, listener: Listener) {
	// }

	/**
	 * @description: This method checks if the specified listener is associated with the given eventName.
	 * @param {EventName} eventName
	 * @param {Listener} listener
	 * @return {*}
	 */
	hasListener(eventName: EventName, listener: Listener): boolean {
		assertListener(listener);
		assertEventName(eventName);

		if (this.listenersMap.has(listener)) {
			return true;
		}
		return false;
	}
}
