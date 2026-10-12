/** A response belongs to one input selection. Invalidating aborts and revokes it. */
export function createRequestState() {
  return {
    sequence: 0,
    controller: null,
    data: null,
    invalidate() {
      this.sequence++;
      this.controller?.abort();
    },
    begin() {
      this.invalidate();
      this.controller = new AbortController();
      const sequence = this.sequence;
      return {
        signal: this.controller.signal,
        isCurrent: () => this.sequence === sequence,
      };
    },
  };
}
