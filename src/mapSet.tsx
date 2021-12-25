import { useCallback, useEffect, useState } from "react";

export function mapSet<T, U>(
  set: Set<T>,
  cb: (value: T, index: number) => U
): Array<U> {
  const result = [];
  let i = 0;
  for (const item of set) {
    result.push(cb(item, i++));
  }
  return result;
}

interface Linkable<T> {
  __stateChangeHandlers: Set<StateChangeHandler<T>>;
  __getLinkedValue(): T;
  __setLinkedValue(v: T): void;
}

type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;
type StateChangeHandler<S> = (value: S) => void;

export function useLinkedState<S>(
  linkedState: Linkable<S>
): [S, StateDispath<S>] {
  const [state, setState] = useState<S>(() => linkedState.__getLinkedValue());

  useEffect(() => {
    const handler = (newVal: S) => setState(() => newVal);
    linkedState.__stateChangeHandlers.add(handler);
    return () => {
      linkedState.__stateChangeHandlers.delete(handler);
    };
  }, [linkedState]);

  const apiState = linkedState.__getLinkedValue();
  useEffect(() => {
    // console.log("API => React", apiState);
    setState(() => apiState);
  }, [apiState]);

  const setter = useCallback(
    function (newVal) {
      // newVal instanceof Function
      if (newVal instanceof Function) {
        linkedState.__setLinkedValue(newVal(linkedState.__getLinkedValue()));
      } else {
        linkedState.__setLinkedValue(newVal);
      }
    },
    [linkedState]
  );

  return [state, setter];
}
