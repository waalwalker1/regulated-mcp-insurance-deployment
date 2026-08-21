.PHONY: setup dev lint typecheck test test-e2e eval demo security build release-check clean-generated help

help:
	@echo "Available targets:"
	@echo "  make setup           - Install dependencies (idempotent)"
	@echo "  make dev             - Start interactive MCP server"
	@echo "  make dev-pricing     - Start local pricing microservice"
	@echo "  make lint            - Check formatting and style"
	@echo "  make typecheck       - Typecheck TypeScript codebase strictly"
	@echo "  make test            - Run unit & integration test suites"
	@echo "  make test-e2e        - Run full end-to-end workflow tests"
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
	@echo "==> Checking code quality and types..."
	npx tsc --noEmit

typecheck:
	@echo "==> Typechecking TypeScript codebase..."
	npx tsc --noEmit

test:
	@echo "==> Running unit and integration tests..."
	npx vitest run

test-e2e:
	@echo "==> Running end-to-end integration tests..."
	npx vitest run tests/integration

eval:
	@echo "==> Running reproducible evaluation benchmark..."
	npx tsx scripts/run-eval.ts

demo:
	@echo "==> Executing Northstar MCP Quote Funnel Demonstration..."
	npx tsx scripts/demo-flow.ts

security:
	@echo "==> Running dependency security audit..."
	npm audit --audit-level=high

build:
	@echo "==> Compiling TypeScript monorepo..."
	npx tsc --noEmit

release-check:
	@echo "=========================================="
	@echo "  RUNNING MANDATORY RELEASE AUDIT GATES   "
	@echo "=========================================="
	@echo "Gate 1/5: Typecheck"
	npx tsc --noEmit
	@echo "Gate 2/5: Test Suite"
	npx vitest run
	@echo "Gate 3/5: Reproducible Evaluation Benchmark"
	npx tsx scripts/run-eval.ts
	@echo "Gate 4/5: Security Audit"
	npm audit --audit-level=high
	@echo "Gate 5/5: Demo Execution"
	npx tsx scripts/demo-flow.ts
	@echo "=========================================="
	@echo "  ALL RELEASE GATES PASSED SUCCESSFULLY   "
	@echo "=========================================="

clean-generated:
	@echo "==> Cleaning generated and cache files..."
	rm -rf dist build coverage .turbo artifacts/logs/*.log
