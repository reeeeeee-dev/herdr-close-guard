// Closes a tab or space, asking first (the shipped confirm dialog) when an
// agent in it is still working or waiting on the person. Opened as an unseen
// overlay that acts at once and closes itself, with props
// { kind: "tab" | "space", id }, or none ("mod.open:close-guard" in keys.json)
// for the shown tab.

import { View, div } from "gpui-kit";
import { agents, spaces, run, props, openOverlay, closeOverlay, checking } from "herdr";

const ACTIVE = { working: "working", blocked: "waiting on you" };

export default class CloseGuard extends View {
  init() {
    if (checking()) return;
    const p = props() ?? {};
    closeOverlay(p.overlay);
    const kind = p.kind ?? "tab";
    const id = p.id ?? spaces().find((s) => s.active)?.tabs.find((c) => c.active)?.id;
    if (!id) return;
    const busy = agents().filter((a) => a[kind] === id && a.status in ACTIVE);
    if (!busy.length) {
      run(`${kind}.close`, { id });
      return;
    }
    const one = busy.length === 1;
    const names = busy.map((a) => `${a.program?.name ?? a.app ?? a.address} (${ACTIVE[a.status]})`).join(", ");
    openOverlay({
      mod: "confirm",
      kind: "dialog",
      width: 420,
      height: 160,
      props: {
        title: `Close ${kind} with ${one ? "an active agent" : `${busy.length} active agents`}?`,
        detail: `${names}. Closing the ${kind} ends ${one ? "it" : "them"}.`,
        command: { name: `${kind}.close`, args: { id, confirmed: true } },
      },
    });
  }

  render() {
    return div();
  }
}
