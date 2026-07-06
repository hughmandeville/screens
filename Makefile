# Makefile

## HELP:
.PHONY: help
## help: Show this help message.
help:
	@echo "Usage: make [target]\n"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

## :
## DATA:

.PHONY: get-news
## get-news: Get news and save it to the public/data/news.json.
get-news:
	pnpm tsx scripts/get-news.ts | jq . > public/data/news.json

## :
## BUILD:

.PHONY: build
## build: Build the static site to out/ for GitHub Pages (served under /screens).
build:
	NEXT_PUBLIC_BASE_PATH=/screens pnpm build
	touch out/.nojekyll

## :
## RUN:

.PHONY: run
## run: Run Next.js (on port 3000).
run: usage
	pnpm dev

.PHONY: usage
## usage: Show usage information.
usage:
	@echo "PAGES"
	@echo "  Artists   http://localhost:3000/artists"
	@echo "  Home      http://localhost:3000"
	@echo "  News      http://localhost:3000/news"
	@echo "  Social    http://localhost:3000/social"
	@echo "  Stats     http://localhost:3000/stats"
	@echo

## :
## LINT:

.PHONY: lint
## lint: Run ESLint.
lint:
	pnpm lint

## :
