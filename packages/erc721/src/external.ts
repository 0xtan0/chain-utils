// ---- ABIs ----
export { erc721Abi, erc721ErrorsAbi } from "./abi/index.js";
export type { ERC721Abi, ERC721ErrorsAbi } from "./abi/index.js";

export type {
    // Client Interfaces
    IERC721Read,
    ERC721WriteClient,
    IERC721MultichainClient,

    // Options Types
    ERC721ClientOptions,
    ERC721WriteClientOptions,
    ERC721MultichainClientOptions,

    // Data Types
    CollectionReference,
    CollectionMetadata,
    NFTReference,
    TokenOwner,
    TokenApproval,
    OperatorApproval,
    TokenURI,
    TokenURIResult,
    OwnerQuery,
    TokenURIQuery,
    ApprovalQuery,
    BalanceQuery,
    OperatorApprovalQuery,
    InterfaceSupportQuery,
    TotalSupplyQuery,
    TokenByIndexQuery,
    TokenOfOwnerByIndexQuery,
    BatchFailure,
    BatchOwnerResult,
    BatchTokenURIResult,
    BatchApprovalResult,
    BatchBalanceResult,
    BatchOperatorApprovalResult,
    BatchInterfaceSupportResult,
    BatchTotalSupplyResult,
    BatchTokenByIndexResult,
    BatchTokenOfOwnerByIndexResult,
} from "./types/index.js";

// ---- Client Factories & Classes ----
export { ERC721ReadClient, createERC721Client } from "./client/erc721ReadClient.js";

// ---- Error Decoder ----
export { ERC721ErrorDecoder } from "./decoder/index.js";

// ---- Errors ----
export {
    // Contract Validation Errors
    InvalidAddress,
    NotERC721Contract,
    NotERC721Enumerable,

    // Revert Errors
    IncorrectOwner,
    InsufficientApproval,
    InvalidApprover,
    InvalidOperator,
    InvalidOwner,
    InvalidReceiver,
    InvalidSender,
    NonexistentToken,
} from "./errors/index.js";
