export type AgentTimeoutDuration = number; // in milliseconds

let currentAgentTimeout: AgentTimeoutDuration = 15 * 60 * 1000; // 15 minutes default

export const createAgentTimeout = (duration: AgentTimeoutDuration): AgentTimeoutDuration => {
  return duration;
};

export const getDefaultAgentTimeout = (): AgentTimeoutDuration => {
  return currentAgentTimeout;
};

export const setAgentTimeout = (duration: AgentTimeoutDuration): void => {
  currentAgentTimeout = duration;
};

export const timeoutToSeconds = (timeout: AgentTimeoutDuration): number => {
  return timeout / 1000;
};

export const timeoutToMinutes = (timeout: AgentTimeoutDuration): number => {
  return timeout / 60000;
};

export const secondsToTimeout = (seconds: number): AgentTimeoutDuration => {
  return seconds * 1000;
};

export const minutesToTimeout = (minutes: number): AgentTimeoutDuration => {
  return minutes * 60000;
};
