import { describe, test, expect } from 'bun:test';
import {
  createHeartbeat,
  getDefaultHeartbeat,
  heartbeatToSeconds,
  heartbeatToMinutes,
  secondsToHeartbeat,
  minutesToHeartbeat,
  type HeartbeatDuration,
} from '../../config/heartbeat';

describe('config/heartbeat', () => {
  test('createHeartbeat should return the duration as-is', () => {
    const duration = 5000;
    const heartbeat = createHeartbeat(duration);
    expect(heartbeat).toBe(duration);
  });

  test('getDefaultHeartbeat should return 60000ms (1 minute)', () => {
    const heartbeat = getDefaultHeartbeat();
    expect(heartbeat).toBe(60000);
  });

  test('heartbeatToSeconds should convert milliseconds to seconds', () => {
    const heartbeat: HeartbeatDuration = 60000;
    const seconds = heartbeatToSeconds(heartbeat);
    expect(seconds).toBe(60);
  });

  test('heartbeatToMinutes should convert milliseconds to minutes', () => {
    const heartbeat: HeartbeatDuration = 120000;
    const minutes = heartbeatToMinutes(heartbeat);
    expect(minutes).toBe(2);
  });

  test('secondsToHeartbeat should convert seconds to milliseconds', () => {
    const heartbeat = secondsToHeartbeat(60);
    expect(heartbeat).toBe(60000);
  });

  test('minutesToHeartbeat should convert minutes to milliseconds', () => {
    const heartbeat = minutesToHeartbeat(5);
    expect(heartbeat).toBe(300000);
  });

  test('conversion functions should be reversible', () => {
    const original: HeartbeatDuration = 120000;

    const seconds = heartbeatToSeconds(original);
    const backFromSeconds = secondsToHeartbeat(seconds);
    expect(backFromSeconds).toBe(original);

    const minutes = heartbeatToMinutes(original);
    const backFromMinutes = minutesToHeartbeat(minutes);
    expect(backFromMinutes).toBe(original);
  });
});
