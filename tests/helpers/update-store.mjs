// Test-only atomic store. Never used by the application runtime.
export class TestUpdateStore {
  states = new Map();
  async claim(id) {
    const state = this.states.get(id);
    if (state === "delivered") return { status: "delivered" };
    if (state === "dispatching") return { status: "uncertain" };
    if (state) return { status: "busy" };
    const owner = Symbol();
    this.states.set(id, owner);
    return { status: "claimed", owner };
  }
  async beginDispatch(id, owner) {
    if (this.states.get(id) !== owner) return false;
    this.states.set(id, "dispatching");
    return true;
  }
  async delivered(id) {
    this.states.set(id, "delivered");
  }
}
