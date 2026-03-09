export interface AutomationPoint {
  time: number;
  value: number;
  curve: 'linear' | 'exponential';
}

export interface AutomationTrack {
  param: 'volume' | 'hpf' | 'reverb';
  points: AutomationPoint[];
}

export interface WorkerMessage {
  type: 'SYNC' | 'GET_SCHEDULE';
  currentTime?: number;
  lookahead?: number; // In seconds
  automations?: AutomationTrack[];
}

export interface ScheduleEvent {
  param: 'volume' | 'hpf' | 'reverb';
  time: number;
  value: number;
  curve: 'linear' | 'exponential';
}

let activeAutomations: AutomationTrack[] = [];
let lastScheduledTime = 0;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, currentTime, lookahead, automations } = e.data;

  if (type === 'SYNC' && automations) {
    activeAutomations = automations;
    // Reset scheduling on new sync (e.g., track load or new points drawn)
    if (currentTime !== undefined) {
      lastScheduledTime = currentTime;
    } else {
      lastScheduledTime = 0;
    }
  }

  if (type === 'GET_SCHEDULE' && currentTime !== undefined && lookahead !== undefined) {
    const scheduleWindowEnd = currentTime + lookahead;
    const events: ScheduleEvent[] = [];

    // Find all points that need to be scheduled between lastScheduledTime and scheduleWindowEnd
    activeAutomations.forEach((track) => {
      // Points to schedule in this window
      const pointsToSchedule = track.points.filter(
        p => p.time > lastScheduledTime && p.time <= scheduleWindowEnd
      );

      pointsToSchedule.forEach(p => {
        events.push({
          param: track.param,
          time: p.time,
          value: p.value,
          curve: p.curve
        });
      });
    });

    if (events.length > 0) {
      self.postMessage({ type: 'SCHEDULE_EVENTS', events });
    }

    lastScheduledTime = scheduleWindowEnd;
  }
};
