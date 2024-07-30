import React from "react";
import { ToServer, ToClient } from "common";

type CtxState =
  | { status: "error"; error: string }
  | { status: "init" }
  | { status: "ok"; socket: WebSocket }
  | { status: "starting" };

type CtxValue = {
  state: CtxState;
  set: (state: CtxState) => void;
};

const ctx = React.createContext<CtxValue>({
  state: { status: "init" },
  set() {},
});

export const Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const P = ctx.Provider;
  const [state, set] = React.useState<CtxState>({ status: "init" });
  const value = React.useMemo(() => ({ state, set }), [state]);
  return <P value={value} children={children} />;
};

let okSocketCache: WebSocket | null = null;

export const useSendMsg = () => {
  const [q, setQ] = React.useState<Set<ToServer>>(new Set());
  const bus = React.useContext(ctx);
  const { status } = bus.state;
  const ws = "socket" in bus.state ? bus.state.socket : null;

  React.useEffect(() => {
    if (status === "init") {
      bus.set({ status: "starting" });
      okSocketCache =
        okSocketCache || new WebSocket(`ws://${window.location.host}/api`);
      const ws = okSocketCache!;
      ws.onopen = () => {
        okSocketCache = okSocketCache ?? ws;
        (window as any).ws = okSocketCache;
        bus.set({ status: "ok", socket: okSocketCache });
      };
      ws.onerror = (e) => {
        bus.set({
          status: "error",
          error: String("message" in e ? e.message : e),
        });
      };
    }
    if (status === "ok" && ws && q.size) {
      q.forEach((msg) => {
        ws.send(JSON.stringify({ type: msg.type, payload: msg.payload }));
      });
      setQ(new Set());
    }
  }, [status, ws]);

  return React.useCallback(
    (msg: ToServer) => {
      if (!ws) {
        if (q.has(msg)) return;
        setQ(new Set(q.add(msg)));
        return;
      }
      ws.send(JSON.stringify({ type: msg.type, payload: msg.payload }));
    },
    [ws],
  );
};

type ExtractVariant<Union, Id> = Extract<Union, { type: Id }>;

export const useReceiveMsg = <T extends ToClient["type"]>(
  type: T,
  cb: (payload: ExtractVariant<ToClient, T>["payload"]) => void,
) => {
  const bus = React.useContext(ctx);
  const ws = bus.state.status === "ok" ? bus.state.socket : null;
  React.useEffect(() => {
    if (!ws) {
      return;
    }
    const onmsg = (msg: MessageEvent) => {
      const { type: msgType, payload } = JSON.parse(msg.data);
      if (msgType !== type) return;
      cb(payload);
      ws.removeEventListener("message", onmsg);
    };
    ws.addEventListener("message", onmsg);
    return () => ws.removeEventListener("message", onmsg);
  }, [!!ws, cb, type]);
};

export const useReqRes = <T extends ToClient["type"]>(
  to: ToServer,
  from: T,
  opts?: { enabled?: boolean; timeoutMs?: number },
) => {
  const { enabled = true, timeoutMs = 5_000 } = opts ?? { enabled: true };
  const [state, setState] = React.useState<{
    error?: Error;
    isLoading: boolean;
    payload?: ExtractVariant<ToClient, T>["payload"];
  }>({
    isLoading: enabled,
  });

  useReceiveMsg(
    from,
    React.useCallback(
      (payload) => {
        if (!enabled) return;
        setState({ isLoading: false, payload: payload as unknown as any });
      },
      [enabled, from, setState],
    ),
  );

  const send = useSendMsg();
  React.useEffect(() => {
    if (!enabled) return;
    setState((last) => ({ ...last, isLoading: true }));
    send(to);
    timeoutMs === 0
      ? null
      : setTimeout(
          () =>
            setState((last) =>
              last.isLoading ? { ...last, error: new Error("timeout") } : last,
            ),
          timeoutMs,
        );
  }, [enabled, JSON.stringify(to), timeoutMs]);
  return state;
};
