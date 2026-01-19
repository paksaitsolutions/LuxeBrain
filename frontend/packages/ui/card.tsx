import { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-lg shadow p-6', className)} {...props}>
      {children}
    </div>
  );
}
