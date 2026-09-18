# R-002 B14 · GPS recovery hysteresis

B14 stabilizes GPS-dependent driving behavior after transient faults.

- Safety first: NO_GPS, STALE and POOR_ACCURACY block driving recommendations immediately.
- Recovery from an unusable GPS state requires 3 distinct good GPS samples. Re-reading the same sample does not advance recovery.
- A heading jump greater than 100 degrees within 4 seconds locks directional filtering immediately.
- Directional filtering is restored only after 3 distinct stable heading samples.
- `speed=null` remains unknown; it is never converted into a false 0 km/h standstill.
- B12, B13 and B14 simulations run together in PWA, Android debug and signed-release validation gates.

The purpose is to prevent UI and alert oscillation when GPS quality fluctuates while ensuring bad samples are never trusted for active driving guidance.
