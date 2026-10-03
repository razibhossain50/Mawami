import type { ComponentProps } from "react";
import Link from "next/link";
import { buttonVariants, type ButtonVariants } from "@heroui/react";

type LinkButtonProps = ComponentProps<typeof Link> & ButtonVariants;

// A Next.js link styled as a HeroUI button (v3 Button has no `as` prop)
export function LinkButton({ variant, size, fullWidth, isIconOnly, className, ...props }: LinkButtonProps) {
  return <Link className={buttonVariants({ variant, size, fullWidth, isIconOnly, className })} {...props} />;
}
