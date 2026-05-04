export const REALTIME_PATH = '/socket';

export const REALTIME_EVENTS = {
  connected: 'realtime.connected',
  authExpired: 'realtime.auth-expired',
  gardenSubscribe: 'realtime.garden.subscribe',
  gardenUnsubscribe: 'realtime.garden.unsubscribe',
  gardenSubscribed: 'realtime.garden.subscribed',
  userSync: 'realtime.sync.user',
  gardenSync: 'realtime.sync.garden'
} as const;

export function getUserRoom(userId: string) {
  return `user:${userId}`;
}

export function getGardenRoom(userId: string, gardenId: string) {
  return `garden:${userId}:${gardenId}`;
}
