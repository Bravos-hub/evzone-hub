import type { PropsWithChildren } from 'react'
import clsx from 'clsx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return <div className={clsx('card min-w-0', className)} {...props}>{children}</div>
}

