import packageJson from "../package.json";

const NAVY = "#0a1124";

/** Sun + house-with-panels mark, matching the app icon 1:1 (viewBox 0 0 100 100). */
function Mark() {
  return (
    <svg viewBox="0 0 100 100" width={120} height={120} style={{ position: "relative" }}>
      <circle cx={50} cy={17} r={7.5} fill="none" stroke={NAVY} strokeWidth={5.5} />
      <line x1={50} y1={4.5} x2={50} y2={0} stroke={NAVY} strokeWidth={3.6} strokeLinecap="round" />
      <line
        x1={56.25}
        y1={6.2}
        x2={58.5}
        y2={2.3}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <line
        x1={43.75}
        y1={6.2}
        x2={41.5}
        y2={2.3}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <line
        x1={60.8}
        y1={10.75}
        x2={64.7}
        y2={8.5}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <line
        x1={39.2}
        y1={10.75}
        x2={35.3}
        y2={8.5}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <line
        x1={62.5}
        y1={17}
        x2={67}
        y2={17}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <line
        x1={37.5}
        y1={17}
        x2={33}
        y2={17}
        stroke={NAVY}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <polyline
        points="16,62 50,34 84,62"
        fill="none"
        stroke={NAVY}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x={25} y={58} width={15} height={13} rx={3} fill={NAVY} />
      <rect x={42.5} y={58} width={15} height={13} rx={3} fill={NAVY} />
      <rect x={60} y={58} width={15} height={13} rx={3} fill={NAVY} />
      <rect x={25} y={74} width={15} height={13} rx={3} fill={NAVY} />
      <rect x={42.5} y={74} width={15} height={13} rx={3} fill={NAVY} />
      <rect x={60} y={74} width={15} height={13} rx={3} fill={NAVY} />
    </svg>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: 999,
        background: NAVY,
        animation: `hmiDotBlink 1.2s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

/**
 * Root loading UI — shown by Next.js during the initial route's suspense boundary.
 * Deliberately fixed gold + navy brand colors regardless of light/dark preference,
 * matching mobile's native splash (Design: "Splash & App Icons" 1e).
 */
export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage:
          "radial-gradient(55% 55% at 50% 0%,rgba(255,255,255,0.32) 0%,transparent 65%)," +
          "radial-gradient(70% 55% at 50% 100%,rgba(146,64,14,0.26) 0%,transparent 65%)," +
          "linear-gradient(135deg,#fde047 0%,#fbbf24 50%,#f59e0b 100%)",
      }}
    >
      <style>{`
        @keyframes hmiGlowPulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
        @keyframes hmiDotBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}
      `}</style>
      <span style={{ position: "relative", width: 120, height: 120 }}>
        <span
          style={{
            position: "absolute",
            inset: -45,
            borderRadius: 999,
            background: "radial-gradient(circle,rgba(255,255,255,0.45) 0%,rgba(255,255,255,0) 65%)",
            animation: "hmiGlowPulse 2.6s ease-in-out infinite",
          }}
        />
        <Mark />
      </span>
      <p
        style={{
          margin: "22px 0 0",
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -0.8,
          color: NAVY,
        }}
      >
        HMI
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 13, fontWeight: 600, color: "rgba(10,17,36,0.6)" }}>
        Home Management Interface
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 34 }}>
        <Dot delay={0} />
        <Dot delay={0.2} />
        <Dot delay={0.4} />
      </div>
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 26,
          textAlign: "center",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.4,
          color: "rgba(10,17,36,0.45)",
        }}
      >
        Version {packageJson.version}
      </span>
    </div>
  );
}
