// https://stackoverflow.com/a/65156200

import resolveConfig from 'tailwindcss/resolveConfig';
import { ScreensConfig } from 'tailwindcss/types/config';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);

export const getBreakpointValue = (value: string): number =>
  +((fullConfig?.theme?.screens as any)[value].slice(
    0,
    (fullConfig?.theme?.screens as any)[value].indexOf('px')
  ) as number);

export const getCurrentBreakpoint = (): string => {
  let currentBreakpoint = "";
  let biggestBreakpointValue = 0;
  for (const breakpoint of Object.keys(fullConfig?.theme?.screens as ScreensConfig)) {
    const breakpointValue = getBreakpointValue(breakpoint);
    if (
      breakpointValue > biggestBreakpointValue &&
      window.innerWidth >= breakpointValue
    ) {
      biggestBreakpointValue = breakpointValue;
      currentBreakpoint = breakpoint;
    }
  }
  return currentBreakpoint;
};

export const isGreaterThanBreakpoint = (value: string): boolean =>
  window.innerWidth >= getBreakpointValue(value);
