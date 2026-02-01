export type HeartbeatDuration = number; // in milliseconds

let currentHeartbeat: HeartbeatDuration = 60000; // 1 minute default

export const createHeartbeat = (duration: HeartbeatDuration): HeartbeatDuration => {
  return duration;
};

export const getDefaultHeartbeat = (): HeartbeatDuration => {
  return currentHeartbeat;
};

export const setHeartbeat = (duration: HeartbeatDuration): void => {
  currentHeartbeat = duration;
};

export const heartbeatToSeconds = (heartbeat: HeartbeatDuration): number => {
  return heartbeat / 1000;
};

export const heartbeatToMinutes = (heartbeat: HeartbeatDuration): number => {
  return heartbeat / 60000;
};

export const secondsToHeartbeat = (seconds: number): HeartbeatDuration => {
  return seconds * 1000;
};

export const minutesToHeartbeat = (minutes: number): HeartbeatDuration => {
  return minutes * 60000;
};
