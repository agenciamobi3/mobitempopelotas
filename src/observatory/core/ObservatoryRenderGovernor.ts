export type ObservatoryRenderTarget = {
  requestRender: () => void;
};

export class ObservatoryRenderGovernor {
  private target: ObservatoryRenderTarget | null = null;
  private scheduled = false;
  private destroyed = false;

  attach(target: ObservatoryRenderTarget) {
    if (this.destroyed) return;
    this.target = target;
  }

  request() {
    if (this.destroyed || !this.target || this.scheduled) return;
    this.scheduled = true;

    if (typeof requestAnimationFrame !== "function") {
      this.scheduled = false;
      this.target.requestRender();
      return;
    }

    requestAnimationFrame(() => {
      this.scheduled = false;
      if (!this.destroyed) this.target?.requestRender();
    });
  }

  detach() {
    this.target = null;
    this.scheduled = false;
  }

  destroy() {
    this.destroyed = true;
    this.detach();
  }
}
