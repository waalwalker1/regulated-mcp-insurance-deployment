.PHONY: setup dev dev-pricing lint format-check typecheck test test-e2e test-coverage eval demo security build release-check clean-generated help

help:
	@echo "Available targets:"
	@echo "  make setup           - Install dependencies (idempotent)"
	@echo "  make dev             - Start interactive MCP server"
	@echo "  make dev-pricing     - Start local pricing microservice"
	@echo "  make lint            - Check formatting and style (ESLint)"
	@echo "  make format-check    - Check formatting with Prettier"
	@echo "  make typecheck       - Typecheck TypeScript codebase strictly"
	@echo "  make test            - Run unit, protocol & integration test suites"
	@echo "  make test-e2e        - Run full end-to-end workflow tests"
	@echo "  make test-coverage   - Run test suite with V8 coverage thresholds"
	@echo "  make eval            - Run reproducible evaluation suite (24 scenarios)"
	@echo "  make demo            - Run automated demo scenario with console output"
	@echo "  make security        - Run dependency audit and local security checks"
	@echo "  make build           - Build TypeScript packages and applications"
	@echo "  make release-check   - Run all mandatory release quality gates"
	@echo "  make clean-generated - Clean temporary artifacts, coverage, and eval logs"

setup:
	@echo "==> Setting up dependencies..."
	npm install

dev:
	@echo "==> Starting MCP Server..."
	npx tsx apps/mcp-server/src/index.ts

dev-pricing:
	@echo "==> Starting Pricing Service..."
	npx tsx apps/pricing-service/src/index.ts

lint:
	@echo "==> Running ESLint..."
	npm run lint

format-check:
	@echo "==> Checking Prettier formatting..."
	npm run format:check

typecheck:
	@echo "==> Typechecking TypeScript codebase..."
	npm run typecheck

test:
	@echo "==> Running unit, protocol and integration tests..."
	npm run test

test-e2e:
	@echo "==> Running end-to-end protocol and integration tests..."
	npm run test:protocol && npm run test:integration

test-coverage:
	@echo "==> Running test suite with coverage thresholds..."
	npm run test:coverage

eval:
	@echo "==> Running reproducible evaluation benchmark..."
	npm run eval

demo:
	@echo "==> Executing Northstar MCP Quote Funnel Demonstration..."
	npm run demo

security:
	@echo "==> Running dependency security audit..."
	npm run security

build:
	@echo "==> Compiling TypeScript monorepo..."
	npx tsc --noEmit

release-check:
	@echo "=========================================="
	@echo "  RUNNING MANDATORY RELEASE AUDIT GATES   "
	@echo "=========================================="
	@echo "Gate 1/7: Format Check (Prettier)"
	npm run format:check
	@echo "Gate 2/7: Linter (ESLint)"
	npm run lint
	@echo "Gate 3/7: Strict Typecheck (TypeScript)"
	npm run typecheck
	@echo "Gate 4/7: Test Suite & Coverage Thresholds"
	npm run test:coverage
	@echo "Gate 5/7: Reproducible Evaluation Benchmark (24 Scenarios)"
	npm run eval
	@echo "Gate 6/7: Security Audit (npm audit)"
	npm run security
	@echo "Gate 7/7: Local Zero-Credential Demo Flow"
	npm run demo
	@echo "=========================================="
	@echo "  ALL RELEASE GATES PASSED SUCCESSFULLY   "
	@echo "=========================================="

clean-generated:
	@echo "==> Cleaning generated and cache files..."
	rm -rf dist build coverage .turbo artifacts/logs/*.log
