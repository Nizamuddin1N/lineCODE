/*
  Render free tier sleeps after 15 minutes of inactivity.
  Cold start takes 30 seconds — terrible UX.

  Two solutions:
  A - Ping our own server every 10 minutes (self-ping)
  B - Use a free uptime service like UptimeRobot

  We use A as built-in solution + recommend B as backup.
  Self-ping keeps the process warm without any external dependency.
*/

export const startKeepAlive = (url) => {
  if (process.env.NODE_ENV !== "production") return

  const INTERVAL = 10 * 60 * 1000 // 10 minutes

  setInterval(async () => {
    try {
      const res = await fetch(`${url}/api/health`)
      console.log(`Keep-alive ping: ${res.status}`)
    } catch (err) {
      console.error("Keep-alive failed:", err.message)
    }
  }, INTERVAL)

  console.log("Keep-alive started — pinging every 10 minutes")
}