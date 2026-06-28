# Makefile

## HELP:
.PHONY: help
## help: Show this help message.
help:
	@echo "Usage: make [target]\n"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

## :
## RUN:

.PHONY: run
## run-dev: Run Next.js (on port 3000).
run:
	pnpm dev

## :
