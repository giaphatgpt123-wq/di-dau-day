# R-002 B12 Driving Simulation

B12 adds an executable Node.js simulation for the B5-B11 driving stack.

Covered scenarios:

1. Stationary GPS does not assume forward direction.
2. Moving north filters a POI behind the vehicle and excludes gpsRankEligible=false POIs.
3. Proximity alert transitions 30 km -> 20 km -> 10 km without repeating the same POI/level.
4. Service-gap alert fires once, clears when a fuel/rest service returns, and can fire again after a new gap.
5. Driver-rest tracking counts moving time only. Stops shorter than 15 minutes do not increase driving elapsed time.
6. The 2-hour reminder fires once per driving session.
7. A continuous 15-minute stop resets the driving session.

Run locally with:

```bash
node tests/b12-simulation.test.js
```

This simulation is now part of the PWA, Android debug APK, and signed-release validation gates.
