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
    <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
      <div className="text-center md:text-left">
        <h1 className="text-[1.375rem] font-extrabold tracking-[-0.8px] text-text-primary md:text-[1.875rem]">
          {title}
        </h1>
        <p className="mt-0.5 text-[0.8125rem] font-medium text-text-muted md:mt-1 md:text-[0.90625rem]">
          {subtitle}
        </p>
      </div>
      {right}
    </div>
  );
}

export default PageHeader;
