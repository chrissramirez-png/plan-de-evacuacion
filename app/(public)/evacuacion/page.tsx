import { Suspense } from "react";
import EvacuacionApp from "@/components/EvacuacionApp";

function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8FAFC",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
        <div
          style={{
            width: 28,
            height: 28,
            border: "3px solid #4CBF8C",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }}
        />
      </div>
    </div>
  );
}

export default function EvacuacionPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <EvacuacionApp />
    </Suspense>
  );
}
