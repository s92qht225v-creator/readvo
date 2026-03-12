// Minimal stub for @supabase/realtime-js — the app doesn't use Realtime features.
// Aliased via next.config.js webpack config to eliminate ~100KB from client bundle.

class RealtimeChannel {
  subscribe() { return this; }
  unsubscribe() { return this; }
  on() { return this; }
  send() { return this; }
}

class RealtimeClient {
  constructor() { this.channels = []; }
  connect() { return this; }
  disconnect() { return this; }
  channel() { return new RealtimeChannel(); }
  removeChannel() { return Promise.resolve(); }
  removeAllChannels() { return Promise.resolve(); }
  getChannels() { return []; }
  setAuth() {}
}

module.exports = { RealtimeClient, RealtimeChannel };
module.exports.RealtimeClient = RealtimeClient;
module.exports.RealtimeChannel = RealtimeChannel;
module.exports.default = { RealtimeClient, RealtimeChannel };
