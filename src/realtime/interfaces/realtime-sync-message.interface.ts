export interface RealtimeSyncMessage<TData = Record<string, unknown>> {
  scope: 'user' | 'garden';
  reason: string;
  occurredAt: string;
  data: TData;
}
