import { Skeleton, TableCell, TableRow } from "@mui/material";

type TableSkeletonProps = {
  rows?: number;
  /** Must match the table's column count. */
  colSpan: number;
};

/** Shimmer placeholder rows for content-heavy tables while loading. */
export const TableSkeleton = ({ rows = 5, colSpan }: TableSkeletonProps) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i}>
        <TableCell colSpan={colSpan}>
          <Skeleton variant="text" sx={{ fontSize: "0.875rem" }} />
        </TableCell>
      </TableRow>
    ))}
  </>
);
