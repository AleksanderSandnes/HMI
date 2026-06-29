/** Standard dashboard page header: title + subtitle with an optional right slot. */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-center md:text-left">
        <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-text-primary">
          {title}
        </h1>
        <p className="mt-1 text-[14.5px] font-medium text-text-muted">
          {subtitle}
        </p>
      </div>
      {right}
    </div>
  );
}

export default PageHeader;
