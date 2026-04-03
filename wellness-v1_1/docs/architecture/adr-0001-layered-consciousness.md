# ADR-0001: Adopt Layered Consciousness Architecture

## Status
Accepted

## Decision
Nuengdeaw Wellness v1.1 organizes runtime responsibilities into five layers:

1. Sensory
2. Perception
3. Cognition
4. Expression
5. Memory

## Rationale
The previous architecture grouped UI orchestration and domain logic too closely. The new layered model aligns the codebase with the product identity and makes explainability, visualization, and future WASM extraction cleaner.

## Consequences
- Better maintainability and naming clarity
- Easier pluginization of device adapters
- Clearer separation between signal ingestion, reasoning, and rendering
