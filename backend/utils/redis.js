/*
  Three ways to connect to Redis:
  A - ioredis (full-featured, works with Socket.IO adapter)
  B - @upstash/redis (Upstash's own HTTP client, simpler but no adapter support)
  C - redis (official Node.js client)

  We need ioredis because @socket.io/redis-adapter requires it.
  We create two clients — pub and sub — because Redis pub/sub
  requires dedicated connections (a subscribed client can't run
  other commands on the same connection).
*/

import Redis from "ioredis"

const redisConfig = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {}, // required for Upstash (TLS connection)
}

let pubClient = null
let subClient = null

export const getRedisClients = () => {
  if (!pubClient) {
    pubClient = new Redis(process.env.UPSTASH_REDIS_URL, redisConfig)
    subClient = pubClient.duplicate()

    pubClient.on("connect", () => console.log("Redis pub connected"))
    pubClient.on("error", (err) => console.error("Redis pub error:", err.message))
    subClient.on("connect", () => console.log("Redis sub connected"))
    subClient.on("error", (err) => console.error("Redis sub error:", err.message))
  }

  return { pubClient, subClient }
}

export const setCache = async (key, value, ttlSeconds = 3600) => {
  try {
    await pubClient?.set(key, JSON.stringify(value), "EX", ttlSeconds)
  } catch (err) {
    console.error("Redis set error:", err.message)
  }
}

export const getCache = async (key) => {
  try {
    const val = await pubClient?.get(key)
    return val ? JSON.parse(val) : null
  } catch (err) {
    console.error("Redis get error:", err.message)
    return null
  }
}

export const deleteCache = async (key) => {
  try {
    await pubClient?.del(key)
  } catch (err) {
    console.error("Redis del error:", err.message)
  }
}