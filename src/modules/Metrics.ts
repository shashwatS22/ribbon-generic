import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import {
  ActiveAccount,
  Pool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  getOrCreateAccount,
  getOrCreatePool,
  getOrCreateProtocol,
  getOrCreateFinancialDailySnapshots,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreatePoolDailySnapshots,
  getOrCreatePoolHourlySnapshots,
  getOrCreateVault,
} from "../common/initalizers";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import * as utils from "../common/utils";

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  getOrCreateAccount(from.toHexString());

  const protocol = getOrCreateProtocol();
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block);
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block);

  usageMetricsDaily.blockNumber = block.number;
  usageMetricsHourly.blockNumber = block.number;

  usageMetricsDaily.timestamp = block.timestamp;
  usageMetricsHourly.timestamp = block.timestamp;

  usageMetricsDaily.dailyTransactionCount += 1;
  usageMetricsHourly.hourlyTransactionCount += 1;

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  const dailyActiveAccountId = (
    block.timestamp.toI64() / constants.SECONDS_PER_DAY
  )
    .toString()
    .concat("-")
    .concat(from.toHexString());

  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);

  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();

    usageMetricsDaily.dailyActiveUsers += 1;
    usageMetricsHourly.hourlyActiveUsers += 1;
  }

  usageMetricsDaily.save();
  usageMetricsHourly.save();
}

export function updatePoolSnapshots(
  
  vaultAddress: Address,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const poolAddress = Address.fromString(vault.currentOption);
  const pool = LiquidityPoolStore.load(poolAddress.toHexString());
  if (!pool) return;

  const poolDailySnapshots = getOrCreatePoolDailySnapshots(
    poolAddress.toHexString(),
    vaultAddress,
    block
  );
  const poolHourlySnapshots = getOrCreatePoolHourlySnapshots(
    poolAddress.toHexString(),
    vaultAddress,
    block
  );

  poolDailySnapshots.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolHourlySnapshots.totalValueLockedUSD = pool.totalValueLockedUSD;

  poolDailySnapshots.inputTokenBalances = pool.inputTokenBalances;
  poolHourlySnapshots.inputTokenBalances = pool.inputTokenBalances;

  poolDailySnapshots.outputTokenSupply = pool.outputTokenSupply!;
  poolHourlySnapshots.outputTokenSupply = pool.outputTokenSupply!;

  poolDailySnapshots.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolHourlySnapshots.outputTokenPriceUSD = pool.outputTokenPriceUSD;

  poolDailySnapshots.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;
  poolHourlySnapshots.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;

  poolDailySnapshots.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolHourlySnapshots.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;

  poolDailySnapshots.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolHourlySnapshots.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolDailySnapshots.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolHourlySnapshots.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;

  poolDailySnapshots.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolHourlySnapshots.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;

  poolDailySnapshots.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolHourlySnapshots.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD;

  poolDailySnapshots.blockNumber = block.number;
  poolHourlySnapshots.blockNumber = block.number;

  poolDailySnapshots.timestamp = block.timestamp;
  poolHourlySnapshots.timestamp = block.timestamp;

  poolHourlySnapshots.save();
  poolDailySnapshots.save();
}

export function updateFinancials(block: ethereum.Block): void {
  const protocol = getOrCreateProtocol();
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.blockNumber = block.number;
  financialMetrics.timestamp = block.timestamp;

  financialMetrics.save();
}

export function updateProtocolRevenue(
  liquidityPoolAddress: Address,
  vaultAddress: Address,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal,
  totalRevenueUSD: BigDecimal,
  block: ethereum.Block
): void {
  const pool = getOrCreatePool(liquidityPoolAddress, block,vaultAddress);

  updateRevenueSnapshots(
    pool,
    vaultAddress,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    totalRevenueUSD,
    block
  );
}

export function updateVaultAndPoolTVL(vaultAddress:Address,block:ethereum.Block): void{
  let vault = getOrCreateVault(vaultAddress, block);
  const pool = getOrCreatePool(
    Address.fromString(vault.currentOption),
    block,
    vaultAddress,
  );
  const vaultBalanceWETH = utils.getVaultBalance(
    vaultAddress,
    BigDecimal.fromString(vault.decimals.toString())
  );

  const wEthPrice = utils.getUnderlyingTokenPriceFromOptionsPricer(
    vaultAddress,
    Address.fromString(vault.currentOption)
  );
  

  vault.totalValueLocked = vaultBalanceWETH;
  vault.totalValueLockedUSD = vaultBalanceWETH.times(wEthPrice);
  pool.totalValueLockedUSD = vaultBalanceWETH.times(wEthPrice);
  
  vault.save();
  pool.save();
}
