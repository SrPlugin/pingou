import { redis } from "bun";

export const CacheService = {
	async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		const serializedValue = JSON.stringify(value);
		await redis.set(key, serializedValue);
		if (ttlSeconds) {
			await redis.expire(key, ttlSeconds);
		}
	},

	async get<T>(key: string): Promise<T | null> {
		const value = await redis.get(key);
		if (!value) return null;
		try {
			return JSON.parse(value) as T;
		} catch {
			return value as unknown as T;
		}
	},

	async delete(key: string): Promise<void> {
		await redis.del(key);
	},
};
