import { CSSProperties } from "react";

type Tab = {
  title: string;
  id: string;
};

export function TabBar({
  selectedTab,
  onTabChange,
  tabs,
}: {
  tabs: Tab[];
  onTabChange: (id: string) => void;
  selectedTab: string;
}) {
  return (
    <div>
      {tabs.map((tab) => {
        const selected = selectedTab === tab.id;
        const style: CSSProperties = selected
          ? {
              borderTop: "1px solid green",
              borderLeft: "1px solid gray",
              borderRight: "1px solid gray",
              padding: "4px 12px",
            }
          : {};

        return (
          <div
            style={style}
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
            }}
          >
            {tab.title}
          </div>
        );
      })}
    </div>
  );
}
