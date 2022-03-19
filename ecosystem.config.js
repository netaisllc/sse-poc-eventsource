module.exports = {
	apps: [ {
		name: "SSE Eventsource",
		script: "./server.js",
		max_memory_restart: '256M',
		exp_backoff_restart_delay: 100
	} ]
}