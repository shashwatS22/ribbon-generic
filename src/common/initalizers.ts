import {
  Account,
  FinancialsDailySnapshot,
  Pool,
  PoolDailySnapshot,
  PoolHourlySnapshot,
  Protocol,
  RewardToken,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  _Auction,
  _Vault,
} from "../../generated/schema";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/RibbonstETHCoveredCall/RibbonThetaVaultWithSwap";
import { Otoken as OtokenContract } from "../../generated/RibbonrETHCoveredCall/Otoken";
import { ERC20 as ERC20Contract } from "../../generated/RibbonstETHCoveredCall/ERC20";
import {
  Address,
  ethereum,
  BigInt,
  BigDecimal,
  log,
} from "@graphprotocol/graph-ts";

import * as constants from "./constants";
import * as utils from "./utils";

export function getOrCreateToken(
  address: Address,
  block: ethereum.Block,
  vault: Address = constants.ADDRESS_ZERO,
  isOToken: bool = false
): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    if (!isOToken) {
      const contract = ERC20Contract.bind(address);

      token.name = utils.readValue<string>(contract.try_name(), "");
      token.symbol = utils.readValue<string>(contract.try_symbol(), "");
      token.decimals = utils.readValue<i32>(
        contract.try_decimals(),
        BigInt.fromI32(constants.DEFAULT_DECIMALS).toI32() as u8
      );
      token._isOtoken = false;
      token._vaultId = vault.toHexString();

      token.lastPriceUSD = utils.getUnderlyingTokenPriceFromOptionsPricer(
        vault,
        address
      );
      token.lastPriceBlockNumber = block.number;
    }
    if (isOToken) {
      const contract = OtokenContract.bind(address);
      token.name = utils.readValue<string>(contract.try_name(), "");
      token.symbol = utils.readValue<string>(contract.try_symbol(), "");
      token.decimals = utils.readValue<i32>(
        contract.try_decimals(),
        BigInt.fromI32(constants.DEFAULT_DECIMALS).toI32() as u8
      );
      token._isOtoken = true;
      token._vaultId = vault.toHexString();
      if (address.equals(constants.ETH_ADDRESS)) {
        token.name = constants.ETH_NAME;
        token.symbol = constants.ETH_SYMBOL;
        token.decimals = constants.DEFAULT_DECIMALS;
      }
      token.lastPriceUSD = utils.getOptionTokenPriceUSD(vault, address, block);
      token.lastPriceBlockNumber = block.number;
    }
    token.save();
  }

  if (
    !token.lastPriceUSD ||
    !token.lastPriceBlockNumber ||
    block.number
      .minus(token.lastPriceBlockNumber!)
      .gt(constants.ETH_AVERAGE_BLOCK_PER_HOUR)
  ) {
    if (token._vaultId) {
      if (!token._isOtoken) {
        token.lastPriceUSD = utils.getUnderlyingTokenPriceFromOptionsPricer(
          vault,
          address
        );
        token.lastPriceBlockNumber = block.number;
      }
      if (token._isOtoken) {
        token.lastPriceUSD = utils.getOptionTokenPriceUSD(
          vault,
          address,
          block
        );
        token.lastPriceBlockNumber = block.number;
      }

      token.save();
    }
  }

  return token;
}

export function getOrCreateRewardToken(
  tokenAddress: Address,
  vaultAddress: Address,
  block: ethereum.Block,
  isOToken: bool = false
): RewardToken {
  const tokenId =
    constants.RewardTokenType.DEPOSIT + tokenAddress.toHexString();
  let rewardToken = RewardToken.load(tokenId);
  if (!rewardToken) {
    rewardToken = new RewardToken(tokenId);
    rewardToken.token = getOrCreateToken(
      tokenAddress,
      block,
      vaultAddress,
      isOToken
    ).id;
    rewardToken.type = constants.RewardTokenType.BORROW;
  }
  return rewardToken;
}

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(constants.ETH_CALL_V2_CONTRACT.toHexString());
  if (!protocol) {
    protocol = new Protocol(constants.ETH_CALL_V2_CONTRACT.toHexString());

    protocol.name = constants.PROTOCOL_NAME;
    protocol.slug = constants.PROTOCOL_SLUG;
    protocol.schemaVersion = constants.PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = constants.PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = constants.PROTOCOL_METHODOLOGY_VERSION;
    protocol.network = constants.Network.MAINNET;
    protocol.type = constants.ProtocolType.GENERIC;

    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol._poolIds = [];
    protocol._vaultIds = [];
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;
    protocol.save();
  }
  return protocol;
}

export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  let id = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = constants.ETH_CALL_V2_CONTRACT.toHexString();

    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      constants.BIGDECIMAL_ZERO;

    financialMetrics.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
  }

  return financialMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  let id: string = (
    block.timestamp.toI64() / constants.SECONDS_PER_DAY
  ).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = constants.ETH_CALL_V2_CONTRACT.toHexString();

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    const protocol = getOrCreateProtocol();
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  let metricsID: string = (
    block.timestamp.toI64() / constants.SECONDS_PER_HOUR
  ).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);
    usageMetrics.protocol = constants.ETH_CALL_V2_CONTRACT.toHexString();

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

//TODO
export function getOrCreatePool(
  oToken: Address,
  block: ethereum.Block,
  vault: Address = constants.ADDRESS_ZERO
): Pool {
  let pool = Pool.load(oToken.toHexString());
  if (!pool) {
    pool = new Pool(oToken.toHexString());
    pool.protocol = constants.ETH_CALL_V2_CONTRACT.toHexString();

    const oTokenContract = OtokenContract.bind(oToken);
    pool.name = utils.readValue(oTokenContract.try_name(), "");
    pool.symbol = utils.readValue(oTokenContract.try_symbol(), "");

    pool.inputTokens = [];
    pool.inputTokenBalances = [];
    pool.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    pool.outputToken = oToken.toHexString(); //current oToken

    pool.outputTokenPriceUSD = utils.getOptionTokenPriceUSD(
      vault,
      oToken,
      block
    ); //get From function
    pool.outputTokenSupply = utils.readValue(
      oTokenContract.try_totalSupply(),
      constants.BIGINT_ZERO
    ); //get from oToken Contract

    pool.stakedOutputTokenAmount = constants.BIGINT_ZERO;
    pool.rewardTokens = [
      getOrCreateRewardToken(constants.RBN_TOKEN, vault, block, false).id,
    ];
    //Reward Token RBN price from price lib
    pool.rewardTokenEmissionsAmount = [];
    pool.rewardTokenEmissionsUSD = [];

    pool.createdBlockNumber = block.number;
    pool.createdTimestamp = block.timestamp;
    pool.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    pool._vault = vault.toHexString();
    pool.save();
  }

  return pool;
}
export function getOrCreatePoolDailySnapshots(
  poolId: string,
  vaultAddress: Address,
  block: ethereum.Block
): PoolDailySnapshot {
  const id: string = poolId
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString());
  let poolSnapshots = PoolDailySnapshot.load(id);

  if (!poolSnapshots) {
    poolSnapshots = new PoolDailySnapshot(id);
    poolSnapshots.protocol = constants.ETH_CALL_V2_CONTRACT.toHexString();
    poolSnapshots.pool = poolId;

    const pool = getOrCreatePool(
      Address.fromString(poolId),
      block,
      vaultAddress
    );

    poolSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.inputTokenBalances = pool.inputTokenBalances;

    poolSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    poolSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.rewardTokenEmissionsAmount = null;
    poolSnapshots.rewardTokenEmissionsUSD = null;
    poolSnapshots.stakedOutputTokenAmount = null;

    poolSnapshots.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.blockNumber = block.number;
    poolSnapshots.timestamp = block.timestamp;

    poolSnapshots.save();
  }

  return poolSnapshots;
}

export function getOrCreatePoolHourlySnapshots(
  poolId: string,
  vaultAddress: Address,
  block: ethereum.Block
): PoolHourlySnapshot {
  const id: string = poolId
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_HOUR).toString());
  let poolSnapshots = PoolHourlySnapshot.load(id);

  if (!poolSnapshots) {
    poolSnapshots = new PoolHourlySnapshot(id);
    poolSnapshots.protocol = constants.ETH_CALL_V2_CONTRACT.toHexString();
    poolSnapshots.pool = poolId;

    poolSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    const pool = getOrCreatePool(
      Address.fromString(poolId),
      block,
      vaultAddress
    );
    const inputTokenLength = pool.inputTokens.length;

    poolSnapshots.inputTokenBalances = pool.inputTokenBalances;

    poolSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    poolSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.rewardTokenEmissionsAmount = null;
    poolSnapshots.rewardTokenEmissionsUSD = null;
    poolSnapshots.stakedOutputTokenAmount = null;

    poolSnapshots.hourlySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.hourlyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.hourlyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    poolSnapshots.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    poolSnapshots.blockNumber = block.number;
    poolSnapshots.timestamp = block.timestamp;

    poolSnapshots.save();
  }

  return poolSnapshots;
}

export function getOrCreateVault(
  vaultAddress: Address,
  block: ethereum.Block
): _Vault {
  let vault = _Vault.load(vaultAddress.toHexString());
  let decimals = 0;
  if (!vault) {
    vault = new _Vault(vaultAddress.toHexString());

    const vaultContract = VaultContract.bind(vaultAddress);

    vault.name = utils.readValue(vaultContract.try_name(), "");
    vault.symbol = utils.readValue(vaultContract.try_symbol(), "");
    decimals = utils.readValue(vaultContract.try_decimals(), 0);
    vault.decimals = decimals;
    const vaultBalance = utils.getVaultBalance(
      vaultAddress,
      BigDecimal.fromString(decimals.toString())
    );
    vault.totalValueLocked = vaultBalance;
    const currentOption = utils.readValue(
      vaultContract.try_currentOption(),
      constants.ADDRESS_ZERO
    );

    vault.totalValueLockedUSD = utils
      .getUnderlyingTokenPriceFromOptionsPricer(
        Address.fromString(vault.id),
        currentOption
      )
      .times(vaultBalance);
    vault.currentOption = getOrCreatePool(
      currentOption,
      block,
      vaultAddress
    ).id;
    vault.isPut = false;
    vault.currentOptionAuctionId = utils.readValue(
      vaultContract.try_optionAuctionID(),
      constants.BIGINT_ZERO
    );
    vault.liquidityGauge = utils
      .readValue(vaultContract.try_liquidityGauge(), constants.ADDRESS_ZERO)
      .toHexString();

    vault.managementFeesCollected = constants.BIGDECIMAL_ZERO;
    vault.performanceFeeCollected = constants.BIGDECIMAL_ZERO;
    vault.totalFeeCollected = constants.BIGDECIMAL_ZERO;

    vault.optionsPremiumPricer = utils
      .readValue(
        vaultContract.try_optionsPremiumPricer(),
        constants.ADDRESS_ZERO
      )
      .toHexString();
    vault.options = [currentOption.toHexString()];
    vault.oTokenFactory = utils
      .readValue(vaultContract.try_OTOKEN_FACTORY(), constants.ADDRESS_ZERO)
      .toHexString();
    vault.marginPool = utils
      .readValue(vaultContract.try_MARGIN_POOL(), constants.ADDRESS_ZERO)
      .toHexString();
    vault.gammaController = utils
      .readValue(vaultContract.try_GAMMA_CONTROLLER(), constants.ADDRESS_ZERO)
      .toHexString();
    vault.save();
  }

  // if (Address.fromString(vault.id) != constants.ADDRESS_ZERO) {
  //   const vaultContract = VaultContract.bind(Address.fromString(vault.id));

  //   const currentOption = utils.readValue(
  //     vaultContract.try_currentOption(),
  //     constants.ADDRESS_ZERO
  //   );
  //   const currentOptionAuctionId = utils.readValue(
  //     vaultContract.try_optionAuctionID(),
  //     constants.BIGINT_ZERO
  //   );
  //   const vaultTotalValueLocked = utils.getVaultBalance(
  //     Address.fromString(vault.id),
  //     BigDecimal.fromString(vault.decimals.toString())
  //   );
  //   if (!currentOption.equals(Address.fromString(vault.currentOption))) {
  //     const oldOption = vault.currentOption;
  //     let oldPool = getOrCreatePool(
  //       Address.fromString(oldOption),
  //       Address.fromString(vault.id),
  //       block
  //       );
  //     const oldRewardTokenStakedAmountUSD = oldPool.rewardTokenEmissionsUSD;
  //     const oldRewardTokenStakedAmount = oldPool.rewardTokenEmissionsAmount;
  //     const newRewardTokenStakedAmountUSD = oldRewardTokenStakedAmountUSD;
  //     const newRewardTokenStakedAmount = oldRewardTokenStakedAmount;
  //     oldPool.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
  //     oldPool.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];

  //     oldPool.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  //     oldPool._vault = constants.ADDRESS_ZERO.toHexString();
  //     oldPool.save();

  //     vault.currentOption = currentOption.toHexString();
  //     vault.currentOptionAuctionId = currentOptionAuctionId;
  //     vault.totalValueLocked = vaultTotalValueLocked;
  //     vault.totalValueLockedUSD = utils
  //       .getUnderlyingTokenPriceFromOptionsPricer(
  //         Address.fromString(vault.id),
  //         currentOption
  //       )
  //       .times(vaultTotalValueLocked);
  //     vault.save();
  //     let currentPool = getOrCreatePool(
  //       currentOption,
  //       Address.fromString(vault.id),
  //       block
  //     );
  //     currentPool.rewardTokenEmissionsAmount = newRewardTokenStakedAmount;
  //     currentPool.rewardTokenEmissionsUSD = newRewardTokenStakedAmountUSD;
  //     currentPool.save();
  //   }
  //   if (!vault.currentOptionAuctionId.equals(currentOptionAuctionId)) {
  //     vault.currentOptionAuctionId = currentOptionAuctionId;
  //     vault.save();
  //   }
  // }
  return vault;
}

export function getOrCreateAuction(
  auctionId: BigInt,
  vaultAddress: Address = constants.ADDRESS_ZERO,
  optionToken: Address = constants.ADDRESS_ZERO,
  biddingToken: Address = constants.ADDRESS_ZERO
): _Auction {
  let auction = _Auction.load(auctionId.toString());
  if (!auction) {
    auction = new _Auction(auctionId.toString());
    auction.optionToken = optionToken.toHexString();
    auction.biddingToken = biddingToken.toHexString();
    auction.vault = vaultAddress.toHexString();
    auction.save();
  }
  return auction;
}
export function getOrCreateAccount(id: string): Account {
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.save();

    const protocol = getOrCreateProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  return account;
}
