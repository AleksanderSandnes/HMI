/** Fixed-height (or viewport-scaling) wrapper shared by the Recharts charts. */
export function Frame({
  heightClass,
  height,
  children,
}: {
  heightClass?: string;
  height: number;
  children: React.ReactNode;
}) {
  return heightClass ? (
    <div className={heightClass}>{children}</div>
  ) : (
    <div style={{ height }}>{children}</div>
  );
}

export default Frame;
