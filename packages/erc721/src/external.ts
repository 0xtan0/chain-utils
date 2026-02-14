// ---- ABIs ----
export { erc721Abi, erc721ErrorsAbi } from "./abi/index.js";
export type { ERC721Abi, ERC721ErrorsAbi } from "./abi/index.js";

export type {
    // Client Interfaces
    IERC721Read,
    IERC721WriteClient,
    IERC721CollectionReader,
    IERC721CollectionWriter,
    IERC721MultichainClient,

    // Options Types
    ERC721ClientOptions,
    ERC721WriteClientOptions,
    ERC721CollectionReaderOptions,
    ERC721CollectionWriterOptions,
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
    CollectionOperatorApprovalQuery,
    CollectionTokenOfOwnerByIndexQuery,
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
export {
    ERC721ReadClient,
    createERC721Client,
    ERC721WriteClient,
    createERC721WriteClient,
} from "./client/index.js";
export {
    ERC721CollectionReader,
    createERC721CollectionReader,
    ERC721CollectionWriter,
    createERC721CollectionWriter,
} from "./collections/index.js";

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
