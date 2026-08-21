# Enterprise Procurement FAQ

**Q1: How does the licensing model work?**  
_A:_ The Northstar deployment kit and underlying Waniwani core SDKs are licensed under the permissive **MIT License**, permitting unrestricted commercial use and private adaptation.

**Q2: Does adopting this kit require sharing proprietary pricing models with third parties?**  
_A:_ **No.** In customer VPC mode, pricing rules and customer data remain strictly within the insurer's private infrastructure.

**Q3: How does the system handle high quote concurrency?**  
_A:_ The pricing engine executes in pure compiled JavaScript/TypeScript functions taking $<5\text{ ms}$ per quote. A single lightweight container handles hundreds of concurrent calculations per second.

**Q4: Can we plug in our existing core rating engine instead of using the local rule file?**  
_A:_ **Yes.** The Pricing Service architecture is fully modular and can forward calculation requests to an internal enterprise actuarial API while preserving MCP state machine management and audit logging.
