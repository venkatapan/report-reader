import crypto from "crypto";

export interface AuditEvent {
  event: string;
  route: string;
  method: string;
  status: number;
  success: boolean;
  source?: string;  
  requestId?: string;
}

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function audit(event: AuditEvent): void {
  const safeEvent = {
    timestamp: new Date().toISOString(),
    requestId:
      event.requestId ?? createRequestId(),
    event: event.event,
    route: event.route,
    method: event.method,
    status: event.status,
    success: event.success,
    ...(event.source
      ? { source: event.source }
      : {}),
  };

  console.log(
    "[AUDIT]",
    JSON.stringify(safeEvent)
  );
}
