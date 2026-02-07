# 08 - Core Revert Error (ContractReverted)

## Description

Implement the `ContractReverted` error class in `packages/core/src/errors/revert.ts`. This is the base class for all on-chain revert errors and can carry raw revert data and/or a decoded message.

## Testable Outcome

- `ContractReverted` extends `ChainUtilsFault`
- Stores `rawData` (Hex) and `decodedMessage` (string)
- Both fields are optional
- ERC20 revert errors will later extend this class

## Prompt

> Implement `ContractReverted` in `packages/core/src/errors/revert.ts` as defined in the tech design section 7.3. It extends `ChainUtilsFault` with `name = "ContractReverted"`, optional `rawData: Hex`, and optional `decodedMessage: string`. Constructor accepts an options object with `rawData`, `decodedMessage`, and `cause`. Export from `external.ts`. Write tests verifying construction with various combinations of optional fields.
