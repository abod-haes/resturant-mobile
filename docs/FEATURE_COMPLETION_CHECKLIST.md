# Feature completion gate — modular, customizable, reusable, maintainable

**MANDATORY for every AI agent after finishing EACH feature, bugfix, refactor, or API integration.** Never say "done" before evaluating every applicable criterion. Use the checklist in the final report and identify failed/unrun checks.

## Design before coding
- [ ] Find the correct feature/module owner and read its public API, contracts, existing reusable components and design tokens.
- [ ] Split by responsibility: route/screen only composes; feature UI renders; hook/application coordinates; domain contains business rules; repository/adapter handles external I/O.
- [ ] Do not create huge multi-purpose files or speculative generic abstractions. Split when independent responsibilities or change reasons emerge; prefer composition over inheritance.
- [ ] Identify what must be **customizable** (labels/i18n, theme tokens, variants, permissions, validation, branch config) without scattering hardcoded conditions.
- [ ] Identify what is genuinely **reusable** across two or more use cases. Keep business-specific widgets inside their feature; promote to shared only with stable generic API and no feature dependencies.

## Implementation quality
- [ ] Component props are typed, cohesive, stable and documented when non-obvious; support appropriate variants, disabled/loading/error, keyboard/accessibility and RTL.
- [ ] All visual primitives use design tokens; no duplicate buttons/dialogs/selects/tables or copy-pasted styling. Reuse existing custom components rather than introducing parallel UI libraries.
- [ ] Feature can be modified without touching unrelated features; one source of truth for rules/constants; no hardcoded strings, roles, URLs, colors, currencies or business thresholds.
- [ ] No direct HTTP/DB access in view; no cross-feature private imports, circular dependencies or app-to-app imports. All cross-boundary dependencies use explicit public interfaces.
- [ ] Clear separation of domain/DTO/view model; runtime input validation; strict TS; explicit error handling; no unsafe `any`, suppressed errors or silent catch.
- [ ] Minimize coupling: no global mutable state for feature data; use query cache for server state and local state for transient UI. Mock/live adapters conform to same contracts.
- [ ] Handle success/loading/empty/error/offline/unauthorized/expired states. Mobile safe area and notification permissions where relevant.
- [ ] Business rules are tested at their owning layer; permissions and tenant/branch scoping are server enforced.
- [ ] No unrelated changes, dead code, placeholder success paths or unapproved features.

## Required post-feature self-review (run in this order)
1. Review diff and check each file belongs to the correct feature; remove duplicate/dead code and unrelated edits.
2. Search for existing custom/reusable components and duplicate implementations; refactor safely when warranted.
3. Verify customization via props/config/theme/i18n rather than editing component internals for routine changes.
4. Check architectural imports and circular dependencies with `npm run check:architecture`.
5. Run available typecheck, lint, unit/integration/contract tests and production build; do not skip failures or fake results.
6. Manually verify main user flow plus failure/empty/loading states; check RTL, responsiveness, accessibility and permission boundaries.
7. Update feature documentation, contract changelog and tests when behavior/contract changed.
8. Report **PASS / FAIL / NOT RUN / NOT APPLICABLE** for architecture, reuse, customization, types, lint, tests, build, security, accessibility and regressions.
9. If any required gate fails, feature is **NOT COMPLETE**. Fix it or explicitly report blocker and remaining work. Never claim a check passed without running it.

## Definition of done
A feature is done only when acceptance criteria are satisfied, code is modular and maintainable, reusable primitives are reused, customization works without duplication, contracts and authorization are preserved, tests and build pass, and no regression is introduced. Exceptions require a documented rationale and explicit review; the agent must not self-approve bypassing checks.

## AI agent final report template
- Feature and scope:
- Files changed:
- Modularity and reuse review:
- Customization review:
- Architecture check: PASS/FAIL/NOT RUN
- Typecheck / lint / tests / build: each PASS/FAIL/NOT RUN
- User flow and error states:
- Security / RBAC:
- Remaining issues or blockers:
- Completion: COMPLETE or NOT COMPLETE
