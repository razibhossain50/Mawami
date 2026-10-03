"use client";
import { Pagination } from "@heroui/react";
import { cn } from "@/services/utils";
import { getPageItems } from "@/services/pagination";

interface PageNavProps {
  total: number;
  page: number;
  onChange: (page: number) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PageNav({ total, page, onChange, className, size }: PageNavProps) {
  return (
    <Pagination className={cn("w-full justify-center", className)} size={size} aria-label="Pagination">
      <Pagination.Content className="justify-center">
        <Pagination.Item>
          <Pagination.Previous isDisabled={page <= 1} onPress={() => onChange(page - 1)}>
            <Pagination.PreviousIcon />
          </Pagination.Previous>
        </Pagination.Item>
        {getPageItems(page, total).map((item, i) =>
          item === "ellipsis" ? (
            <Pagination.Item key={`ellipsis-${i}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={item}>
              <Pagination.Link isActive={item === page} onPress={() => onChange(item)} aria-label={`Page ${item}`}>
                {item}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}
        <Pagination.Item>
          <Pagination.Next isDisabled={page >= total} onPress={() => onChange(page + 1)}>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
