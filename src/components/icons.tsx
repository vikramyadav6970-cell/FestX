import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M19 12C21.2091 12 23 10.2091 23 8C23 5.79086 21.2091 4 19 4C16.7909 4 15 5.79086 15 8C15 10.2091 16.7909 12 19 12Z"
        fill="white"
        fillOpacity="0.5"
      />
      <path
        d="M19 28C21.2091 28 23 26.2091 23 24C23 21.7909 21.2091 20 19 20C16.7909 20 15 21.7909 15 24C15 26.2091 16.7909 28 19 28Z"
        fill="white"
        fillOpacity="0.5"
      />
      <rect x="6" y="13" width="4" height="6" rx="2" fill="white" />
    </svg>
  );
}
