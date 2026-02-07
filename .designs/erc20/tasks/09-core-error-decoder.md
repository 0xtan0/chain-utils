# 09 - Core Error Decoder

## Description

Implement the `ErrorDecoder` interface and the `CompositeErrorDecoder` class in `packages/core/src/decoder/`. The composite chains multiple decoders together using a chain-of-responsibility pattern.

## Testable Outcome

- `ErrorDecoder` interface defines `decode(rawData: Hex): ChainUtilsFault | null`
- `CompositeErrorDecoder` tries each decoder in order, returns first non-null result
- Falls back to `ContractReverted` when all decoders return null
- Empty decoder list produces a `ContractReverted` fallback

## Prompt

> Implement `ErrorDecoder` interface in `packages/core/src/decoder/errorDecoder.ts` and `CompositeErrorDecoder` class in `packages/core/src/decoder/compositeDecoder.ts` as defined in the tech design section 3.4. `CompositeErrorDecoder` implements `ErrorDecoder`, accepts a `ReadonlyArray<ErrorDecoder>` in its constructor, and iterates decoders returning the first non-null result. If all return null, it creates a `ContractReverted` with the raw data. Export both from `external.ts`. Write tests with mock decoders verifying: single decoder match, first-match-wins, fallback behavior.
