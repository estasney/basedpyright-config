ASSETS := src/assets
VERSION_TARGETS := version-patch version-minor version-major

.DEFAULT_GOAL := help
.PHONY: help assets schema build check-clean $(VERSION_TARGETS)

# Show this help.
help:
	@grep -E '^[a-zA-Z_$$()-]+:' $(MAKEFILE_LIST) | cut -d: -f1 | sed 's/$$(VERSION_TARGETS)/$(VERSION_TARGETS)/' | tr ' ' '\n' | sed 's/^/  /'

# Regenerate the three basedpyright data assets from the installed basedpyright.
assets:
	basedpyright --printdiagnosticrulesets | jq . > $(ASSETS)/basedpyrightRulesets.json
	basedpyright --version | head -1 | cut -d' ' -f2 | jq -R '{version: .}' > $(ASSETS)/basedpyrightVersion.json
	curl -fsSL "https://raw.githubusercontent.com/DetachHead/basedpyright/v$$(jq -r .version $(ASSETS)/basedpyrightVersion.json)/packages/vscode-pyright/schemas/pyrightconfig.schema.json" > $(ASSETS)/basedpyrightConfigSchema.json
	git add src/assets

# Regenerate the rule-groups JSON Schema from its Zod model.
schema:
	node scripts/writeRuleGroupsSchema.ts

# Type-check and build the single-file page into docs/.
build: assets schema
	npm run build
	git add docs

check-clean:
	@test -z "$$(git status --porcelain)" || { echo "Git tree is dirty."; exit 1; }

# Bump package.json + package-lock.json, commit only those two files as
# "vX.Y.Z", and create an annotated tag vX.Y.Z noting the bundled basedpyright data.
$(VERSION_TARGETS): version-%: check-clean
	@NEW_VERSION=$$(npm version $* --no-git-tag-version) && \
	git add package.json package-lock.json && \
	git commit -q -m "$$NEW_VERSION" && \
	git tag -a "$$NEW_VERSION" -m "$$NEW_VERSION" -m "basedpyright data: $$(jq -r .version $(ASSETS)/basedpyrightVersion.json)"
