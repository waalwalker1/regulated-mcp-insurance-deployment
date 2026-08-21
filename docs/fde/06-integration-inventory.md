# Integration Inventory & Boundary Map

| Component / Interface | Direction | Protocol / Format | Authentication | Invariant / Failure Mode |
|---|---|---|---|---|
| **MCP Client (Assistant)** | Inbound | MCP Protocol (JSON-RPC over Stdio / SSE) | Client-managed session | Tool schema validation; malicious prompt injections blocked. |
| **Pricing Microservice** | Internal / RPC | HTTP REST (`POST /api/v1/quote/calculate`) | Internal VPC / mTLS in production | Fails closed: pricing rejections return structured 4xx errors; zero fallback to LLM guessing. |
| **Session Persistence** | Internal | Memory Map / PostgreSQL Wire Protocol | Database user / password credentials | Session TTL expiration; expired sessions cannot be resumed. |
| **Audit Event Store** | Internal | Append-only event sink | Internal process authority | Hash chain mismatch triggers alert and integrity failure. |
| **Waniwani Hosted Platform (Optional)** | Outbound | HTTPS REST (`POST /v1/events`) | Bearer API Key (`WANIWANI_API_KEY`) | Completely bypassed when API key is unset; zero local blocking. |
