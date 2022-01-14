import { useEffect, useState, useCallback } from "react";

type StateDispath<S> = (value: S | ((prevState: S) => S)) => void;
type StateChangeHandler<S> = (value: S) => void;

abstract class Linkable<T> {
  protected __stateChangeHandlers: Set<StateChangeHandler<T>> = new Set();
  abstract __getLinkedValue(): T;
  abstract __setLinkedValue(v: T): void;
  // Executes these handlers on change
  __addStateChangeHandler(cb: StateChangeHandler<T>): () => void {
    this.__stateChangeHandlers.add(cb);
    return () => {
      this.__stateChangeHandlers.delete(cb);
    };
  }
}

export class LinkedState<S> extends Linkable<S> {
  protected val: S;
  constructor(initialValue: S) {
    super();
    this.val = initialValue;
  }

  static of<T>(val: T) {
    return new this<T>(val);
  }

  override __setLinkedValue(val: S): void {
    this.val = val;
    this.__stateChangeHandlers.forEach((cb) => {
      cb(val);
    });
  }
  override __getLinkedValue(): S {
    return this.val;
  }
}

export function useLinkedState<S>(
  linkedState: Linkable<S>
): [S, StateDispath<S>] {
  const [state, setState] = useState<S>(() => linkedState.__getLinkedValue());

  useEffect(() => {
    return linkedState.__addStateChangeHandler((newVal) =>
      setState(() => newVal)
    );
  }, [linkedState]);

  const currState = linkedState.__getLinkedValue();
  useEffect(
    function () {
      setState(() => currState);
    },
    [currState]
  );

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

// variant state: only if kind changes it's a state update, everything else
// acts like a ref.
type Foo = { state: "a" } | { state: "b"; x: number };

export class VariantState<T extends { state: string }> extends Linkable<T> {
  private val: T;
  constructor(initial: T) {
    super();
    this.val = initial;
  }

  static of<S extends { state: string }>(val: S) {
    return new this<S>(val);
  }

  override __setLinkedValue(val: T): void {
    this.val = val;
    if (this.val.state === val.state) {
      return;
    }
    this.__stateChangeHandlers.forEach((cb) => {
      cb(val);
    });
  }

  override __getLinkedValue(): T {
    return this.val;
  }
}
