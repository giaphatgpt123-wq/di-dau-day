# Recommendation V1
A1 recommendation flow: GPS -> verified nearby POIs -> category/radius filter -> multi-factor ranking -> explanation -> place card -> external navigation handoff. Distance is straight-line proximity; it must not be presented as road distance. Navigation is delegated through standard map intents/URLs, avoiding a paid routing dependency in this layer.
