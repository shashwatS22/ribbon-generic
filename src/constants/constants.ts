import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Ribbon Finance";
export const PROTOCOL_SLUG = "ribbon-finance";
export const PROTOCOL_SCHEMA_VERSION = "1.3.0";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace VaultFeeType {
  export const MANAGEMENT_FEE = "MANAGEMENT_FEE";
  export const PERFORMANCE_FEE = "PERFORMANCE_FEE";
  export const DEPOSIT_FEE = "DEPOSIT_FEE";
  export const WITHDRAWAL_FEE = "WITHDRAWAL_FEE";
}

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_LP_FEE = "FIXED_LP_FEE";
  export const DYNAMIC_LP_FEE = "DYNAMIC_LP_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED_TERM = "FIXED_TERM";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ADDRESS_ZERO = Address.fromString(ZERO_ADDRESS);
export const ETH_ADDRESS = Address.fromString(
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
);

export const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

export const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const USDC_WETH_PAIR = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"; // created 10008355
export const DAI_WETH_PAIR = "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11"; // created block 10042267
export const USDT_WETH_PAIR = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"; // created block 10093341

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;
export const DEFAULT_DECIMALS_BIG_DECIMAL = BigDecimal.fromString("18");

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_NEG_ONE = BigInt.fromI32(-1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);
//@ts-ignore
export const INT_NEGATIVE_ONE = -1 as i32; //@ts-ignore
export const INT_ZERO = 0 as i32; //@ts-ignore
export const INT_ONE = 1 as i32; //@ts-ignore
export const INT_TWO = 2 as i32; //@ts-ignore
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_ONE_HUNDRED = new BigDecimal(BIGINT_HUNDRED);
export const BIG_DECIMAL_1E18 = new BigDecimal(BIGINT_TEN_TO_EIGHTEENTH);
export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);
export const SNAPSHOT_SECONDS = SECONDS_PER_DAY;

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = "ETH";
export const ETH_NAME = "ETH";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const FEE_DENOMINATOR_DECIMALS = 10;

export const PANCAKE_FACTORY_ADDRESS = Address.fromString(
  "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
);
export const WBNB_ADDRESS = Address.fromString(
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
);
export const BUSD_ADDRESS = Address.fromString(
  "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
);
export const USDC_ADDRESS = Address.fromString(
  "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
);
export const BBTC_ADDRESS = Address.fromString(
  "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
);
export const EPS_ADDRESS = Address.fromString(
  "0xA7f552078dcC247C2684336020c03648500C6d9F"
);
export const EPX_ADDRESS = Address.fromString(
  "0xaf41054c1487b0e5e2b9250c0332ecbce6ce9d71"
);


export const TRICRYPTO_LP_TOKEN = Address.fromString(
  "0xaF4dE8E872131AE328Ce21D909C74705d3Aaf452"
);




export const RIBBON_PLATFORM_ID = "ribbon";

export const POOL_FEE = BigDecimal.fromString("0.0004");
export const ADMIN_FEE = BigDecimal.fromString("0.5");

export namespace PoolType {
  export const LENDING = "LENDING";
  export const PLAIN = "PLAIN";
  export const METAPOOL = "METAPOOL";
  export const BASEPOOL = "BASEPOOL";
}


export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
}
export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}
export const ETH_AVERAGE_BLOCK_PER_HOUR = BigInt.fromString("92000");

export const BIGINT_TEN = BigInt.fromI32(10);

export const BIGINT_NEGATIVE_ONE = BigInt.fromString("-1");

export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_NEGATIVE_ONE = BigDecimal.fromString("-1");
export const BIG_DECIMAL_SECONDS_PER_DAY = BigDecimal.fromString("86400");

export const FEE_DENOMINATOR_BIGINT = BIGINT_TEN.pow(10);
export const FEE_DENOMINATOR = BigDecimal.fromString("10000000000");

export const DEFAULT_POOL_FEE = BigInt.fromString("4000000");
export const DEFAULT_ADMIN_FEE = BigInt.fromString("5000000000");

export const MARGIN_POOL = Address.fromString(
  "0x5934807cC0654d46755eBd2848840b616256C6Ef"
);
export const ETH_CALL_V2_CONTRACT = Address.fromString("0x25751853Eab4D0eB3652B5eB6ecB102A2789644B");
