import Emitter from "./index";
import { describe, beforeEach, vi, it, expect } from "vitest";

describe("Emitter", () => {
	let emitter: Emitter;
	const event1 = "event1";
	const event2 = "event2";

	beforeEach(() => {
		emitter = new Emitter();
	});

	describe("on()", () => {
		it("should add a listener and return an emitter object", () => {
			const listener = vi.fn();
			const emitterObj = emitter.on(event1, listener);

			expect(emitterObj).toBeDefined();
			expect(emitterObj.onReady).toBeInstanceOf(Function);
			expect(emitterObj.off).toBeInstanceOf(Function);

			emitter.emit(event1, {});
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it("should throw an error when `listener` is not a function", () => {
			const listener = "not a function";

			expect(() => {
				// @ts-ignore
				emitter.on(event1, listener);
			}).toThrow("listener must be a function");
		});

		it("should return the resolved promise when calling onReady", async () => {
			const listener = vi.fn();
			const emitterObj = emitter.on(event1, listener);

			await expect(emitterObj.onReady()).resolves.toBe(undefined);
		});

		it("should unsubscribe the listener when calling the emitter.off()", () => {
			const listener = vi.fn();
			const emitterObj = emitter.on(event1, listener);

			const result = emitterObj.off();
			expect(result).toBe(true);

			emitter.emit(event1, {});
			expect(listener).not.toHaveBeenCalled();
		});

		it("should do nothing when the listener has been unsubscribe", () => {
			const listener = vi.fn();
			const emitterObj = emitter.on(event1, listener);

			emitterObj.off();
			const result = emitterObj.off();
			expect(result).toBe(false);
		});
	});

	describe("off()", () => {
		it("should remove a listener and return true", () => {
			const listener = vi.fn();
			emitter.on(event1, listener);

			const result = emitter.off(event1, listener);
			expect(result).toBe(true);

			emitter.emit(event1, {});
			expect(listener).not.toHaveBeenCalled();
		});

		it("should throw an error when `eventName` is not valid", () => {
			const listener = vi.fn();

			expect(() => {
				// @ts-ignore
				emitter.off({}, listener);
			}).toThrow("`eventName` must be a string, symbol, or number");
		});

		it("should throw an error when the event has not been subscribed", () => {
			const listener = vi.fn();

			expect(() => {
				emitter.off(event1, listener);
			}).toThrow("this event has not been subscribed");
		});

		it("should throw an error when the listener has not been listened", () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();
			emitter.on(event1, listener1);

			expect(() => {
				emitter.off(event1, listener2);
			}).toThrow("this listener has not been listened");
		});
	});

	describe("emit()", () => {
		it("should call all listeners for the event", () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();
			emitter.on(event1, listener1);
			emitter.on(event1, listener2);

			emitter.emit(event1, {});
			expect(listener1).toHaveBeenCalledTimes(1);
			expect(listener2).toHaveBeenCalledTimes(1);
		});

		it("should not call listeners for other events", () => {
			const listener = vi.fn();
			emitter.on(event1, listener);

			emitter.emit(event2, {});
			expect(listener).not.toHaveBeenCalled();
		});

		it("should throw an error when `eventName` is not valid", () => {
			expect(() => {
				// @ts-ignore
				emitter.emit({}, {});
			}).toThrow("`eventName` must be a string, symbol, or number");
		});
	});

	describe("hasListener", () => {
		it("should throw a TypeError when eventName is not of type string, symbol, or number", () => {
			// @ts-ignore
			expect(() => emitter.hasListener({}, () => {})).toThrow(TypeError);
		});

		it("should throw a TypeError when listener is not a function", () => {
			// @ts-ignore
			expect(() => emitter.hasListener("eventName", {})).toThrow(TypeError);
		});

		it("should return false if listener is not subscribed to eventName", () => {
			const listener = () => {};
			expect(emitter.hasListener("eventName", listener)).toBe(false);
		});

		it("should return true if listener is subscribed to eventName", () => {
			const eventName = "eventName";
			const listener = () => {};
			emitter.on(eventName, listener);
			expect(emitter.hasListener(eventName, listener)).toBe(true);
		});
	});
});
