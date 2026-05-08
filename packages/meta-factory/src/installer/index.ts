// Installer Layer — re-export from @rules-as-tests/core/installer (Phase 7).
// Keeps meta-factory the umbrella package; core owns the implementation.

export {
  install,
  type InstallFailure,
  type InstallOptions,
  type InstallReport,
  type InstallStage,
  type RulesLock,
} from '@rules-as-tests/core/installer';
