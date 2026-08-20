# Rules Architecture & Override Model

## Rule Data Model

Every rule in the system is structured as an immutable TypeScript object:

```ts
export interface SlopRule {
  id: string;
  name: string;
  description: string;
  category: SlopCategory;

  pattern: string;
  flags: string;

  examples: string[];
  counterExamples?: string[];

  severity: 1 | 2 | 3 | 4 | 5;
  weight: number;

  enabledByDefault: boolean;
  source: 'builtin' | 'custom';

  isDensityRule?: boolean;
  densityThreshold?: number;

  versionAdded?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## The Built-in Override Model

Built-in rules shipped with the extension are version-controlled application constants. When users customize, edit, or disable a built-in rule, the extension **never mutates the shipped code file**.

Instead, it persists a `RuleOverride`:

```text
  Built-in Rule Definition (Code)
               +
  User Override (WebExtension local storage)
               =
  Effective Rule (Runtime)
```

### Supported User Operations:

- **Enable / Disable**: Updates `enabled` flag in override.
- **Edit Severity / Weight / Regex**: Stores field-level overrides.
- **Delete Built-in Rule**: Sets `deletedTombstone: true`. The rule disappears from active detection but remains restorable.
- **Restore Default**: Removes the override record, returning the rule to its factory state.
- **Duplicate Rule**: Clones the rule into a new `custom` rule with a unique ID.
- **Custom Rules**: Normal Create, Read, Update, and Delete.
