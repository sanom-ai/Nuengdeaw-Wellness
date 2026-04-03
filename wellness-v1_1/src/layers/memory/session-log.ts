import type { AssessmentDecision, SignalSnapshot } from '../../core/contracts';

export type SessionLogRecord = {
  snapshot: SignalSnapshot;
  decision: AssessmentDecision;
};

export function createSessionLog() {
  const records: SessionLogRecord[] = [];

  return {
    push(record: SessionLogRecord) {
      records.unshift(record);
      if (records.length > 32) records.pop();
    },
    list() {
      return records;
    },
  };
}
