interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onRowClick?: (row: T) => void;
  selectedId?: string;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  selectedId,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="h-12 bg-cf-bg-white dark:bg-cf-dark-surface border-b border-cf-border dark:border-cf-dark-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  px-4 text-sm font-bold text-cf-text-primary dark:text-cf-dark-text
                  ${col.align === "right" ? "text-right" : "text-left"}
                `}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const rowKey = String(row[keyField]);
            const isSelected = selectedId === rowKey;
            return (
              <tr
                key={rowKey}
                onClick={() => onRowClick?.(row)}
                className={`
                  h-[52px] border-b border-cf-border dark:border-cf-dark-border
                  transition-colors
                  ${onRowClick ? "cursor-pointer" : ""}
                  ${
                    isSelected
                      ? "bg-cf-blue-light dark:bg-cf-blue/20"
                      : "hover:bg-cf-bg-hover dark:hover:bg-cf-dark-border"
                  }
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      px-4 text-sm font-medium text-cf-text-secondary dark:text-cf-dark-text
                      ${col.align === "right" ? "text-right" : "text-left"}
                    `}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-cf-text-secondary dark:text-cf-dark-text-secondary"
              >
                Sin datos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
