"use client";

import React from "react";
import { HoverBorderGradient } from "@/components/aceternity/hover-border-gradient";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

export function GradientButton({
  children,
  onClick,
  className,
  type = "button",
  disabled = false,
  icon,
  asChild = false,
}: GradientButtonProps) {
  if (asChild) {
    // When asChild is true, use the child component as the "as" prop for HoverBorderGradient
    const child = React.Children.only(children) as React.ReactElement;

    // Type assertion for child props
    const childProps = child.props as Record<string, any>;

    // Merge props: child props + GradientButton props
    const mergedProps = {
      ...childProps,
      onClick: disabled ? undefined : onClick,
      className: cn(
        childProps.className,
        "bg-white text-[#2a5f84] font-medium flex items-center space-x-2",
        className
      ),
    };

    return (
      <HoverBorderGradient
        containerClassName={cn("rounded-full", disabled && "opacity-50 cursor-not-allowed")}
        as={child.type as React.ElementType}
        {...mergedProps}
      >
        {childProps.children}
      </HoverBorderGradient>
    );
  }

  // Regular button
  const buttonProps = {
    onClick: disabled ? undefined : onClick,
    type,
    className: cn(
      "bg-white text-[#2a5f84] font-medium flex items-center space-x-2",
      className
    ),
  };

  return (
    <HoverBorderGradient
      containerClassName={cn("rounded-full", disabled && "opacity-50 cursor-not-allowed")}
      as="button"
      {...buttonProps}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </HoverBorderGradient>
  );
}