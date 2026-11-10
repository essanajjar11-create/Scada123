import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { iecOperatingTimeSeconds } from '../lib/engineering/protectionCurves';

const RelayProbe = () => (
  <div>
    <span>trip-time</span>
    <span>{iecOperatingTimeSeconds(800, 400, 1, 'VI')}</span>
  </div>
);

describe('toolchain smoke test (JSX + RTL)', () => {
  it('renders and computes through the shared engineering lib', () => {
    render(<RelayProbe />);
    expect(screen.getByText('trip-time')).toBeDefined();
    expect(screen.getByText('13.5')).toBeDefined();
  });
});
