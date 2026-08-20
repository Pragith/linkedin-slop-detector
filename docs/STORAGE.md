# Storage Schema & Migrations

## Schema Version 1

Persisted state in WebExtension local storage is strictly versioned under the key `linkedin_slop_detector_state`:

```ts
export interface StoredStateV1 {
  schemaVersion: 1;
  settings: ExtensionSettings;
  ruleOverrides: Record<string, RuleOverride>;
  customRules: SlopRule[];
  lastUpdated: string;
}
```

---

## Migration Framework

The migration pipeline in `src/storage/migrations.ts` runs automatically upon initialization:

1. **Missing or Corrupted State**: Reconstructs a valid state with bounded settings and persists the repair.
2. **Schema Upgrades**: Validates built-in overrides and custom rules while merging newly added default setting keys.
3. **Import Safety**: Rejects future schemas, oversized payloads, invalid rules, reserved IDs, unsafe regular expressions, and excess custom rules.
4. **Reactive Storage Listener**: Changes made in the Options page immediately propagate to active LinkedIn content scripts through the cross-browser storage change API.
