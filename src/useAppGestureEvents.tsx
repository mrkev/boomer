import { useEffect } from "react";

export function useAppGestureEvents() {
  useEffect(() => {
    const onScroll = () => {
      console.log("SCROLL");
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  });
}
