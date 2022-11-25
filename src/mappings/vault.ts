import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import {
  InitiateGnosisAuction,
  Deposit,
  Withdraw,
  InstantWithdraw,
  CollectVaultFees,
  NewOffer,
  OpenShort,
  CloseShort,
  RollToNextOptionCall as RollToNextOption,
} from "../../generated/RibbonETHCoveredCall/RibbonThetaVaultWithSwap";
import {
  AuctionCleared,
  SettleAuctionCall as SettleAuction,
} from "../../generated/GnosisAuction/GnosisAuction";
import { DistributePremium } from "../../generated/RibbonTreasuryVaultPERP/RibbonTreasuryVault";
import {
  getOrCreateAuction,
  getOrCreatePool,
  getOrCreateToken,
  getOrCreateVault,
} from "../common/initalizers";
import { rollToNextOption } from "../modules/VaultLifecycle";
import * as utils from "../common/utils";
import {
  updateFinancials,
  updatePoolSnapshots,
  updateProtocolRevenue,
  updateUsageMetrics,
  updateVaultAndPoolTVL,
} from "../modules/Metrics";

export function handleInitiateGnosisAuction(
  event: InitiateGnosisAuction
): void {
  let auctionId = event.params.auctionCounter;
  let optionToken = event.params.auctioningToken;
  let biddingToken = event.params.biddingToken;
  let vaultAddress = event.address;
  getOrCreateToken(biddingToken, event.block, vaultAddress, false);
  getOrCreateToken(optionToken, event.block, vaultAddress, true);
  getOrCreateAuction(auctionId, vaultAddress, optionToken, biddingToken);
  getOrCreateVault(vaultAddress, event.block);
}

export function handleDeposit(event: Deposit): void {
  const vaultAddress = event.address;
  const block = event.block;

  // Dont handle any deposit into AVAX / sAVAX vaults if less than 0.001 AVAX
  if (
    (vaultAddress.toHexString() ==
      "0x98d03125c62dae2328d9d3cb32b7b969e6a87787" ||
      vaultAddress.toHexString() ==
        "0x6bf686d99a4ce17798c45d09c21181fac29a9fb3") &&
    event.params.amount <= BigInt.fromString("100000000000000000")
  ) {
    log.error("Ignoring deposit {}", [event.transaction.hash.toHexString()]);
    return;
  }
  getOrCreateVault(vaultAddress, event.block);
  updateVaultAndPoolTVL(vaultAddress, block);
  utils.updateProtocolTotalValueLockedUSD();
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updatePoolSnapshots(vaultAddress, block);
}

export function handleWithdraw(event: Withdraw): void {
  const vaultAddress = event.address;
  const block = event.block;

  getOrCreateVault(vaultAddress, event.block);
  updateVaultAndPoolTVL(vaultAddress, block);
  utils.updateProtocolTotalValueLockedUSD();
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updatePoolSnapshots(vaultAddress, block);
}

export function handleInstantWithdraw(event: InstantWithdraw): void {
  const vaultAddress = event.address;
  const block = event.block;

  getOrCreateVault(vaultAddress, event.block);
  updateVaultAndPoolTVL(vaultAddress, block);
  utils.updateProtocolTotalValueLockedUSD();
  updateUsageMetrics(event.block, event.params.account);
  updateFinancials(block);
  updatePoolSnapshots(vaultAddress, block);
}

export function handleCollectVaultFees(event: CollectVaultFees): void {
  // gives protocol side revenue
  // update pool and vault revenue
  // update protocol side revenue
  // update revenue metrics
  const totalFee = event.params.vaultFee;
  const performanceFee = event.params.performanceFee;
  const managementFee = totalFee.minus(performanceFee);
  const vaultAddress = event.address;
  const block = event.block;
  const vault = getOrCreateVault(vaultAddress, block);

  const pool = getOrCreatePool(
    Address.fromString(vault.currentOption),
    block,
    vaultAddress
  );
  updateVaultAndPoolTVL(vaultAddress, block);

  const wEthPrice = utils.getUnderlyingTokenPriceFromOptionsPricer(
    vaultAddress,
    Address.fromString(vault.currentOption)
  );

  const totalFeeUSD = totalFee
    .divDecimal(BigDecimal.fromString(vault.decimals.toString()))
    .times(wEthPrice);
  const performanceFeeUSD = performanceFee
    .divDecimal(BigDecimal.fromString(vault.decimals.toString()))
    .times(wEthPrice);
  const managementFeeUSD = managementFee
    .divDecimal(BigDecimal.fromString(vault.decimals.toString()))
    .times(wEthPrice);

  pool.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD.plus(
    totalFeeUSD
  );

  vault.managementFeesCollected = vault.managementFeesCollected.plus(
    managementFeeUSD
  );
  vault.performanceFeeCollected = vault.performanceFeeCollected.plus(
    performanceFeeUSD
  );
  vault.totalFeeCollected = vault.totalFeeCollected.plus(totalFeeUSD);
  vault.save();
  pool.save();
}

export function handleDistributePremium(event: DistributePremium): void {
  //gives supply side revenue
}

export function handleRollToNextOption(call: RollToNextOption): void {
  const vaultAddress = call.to;
  const block = call.block;
  rollToNextOption(vaultAddress, block);
}
export function handleAuctionCleared(event: AuctionCleared): void {
  //gives supply side revenue
  const auctionId = event.params.auctionId;
  const tokensSold = event.params.soldAuctioningTokens;
  const soldAmountETH = event.params.soldBiddingTokens;
}
export function handleOpenShort(event: OpenShort): void {}
export function handleCloseShort(event: CloseShort): void {}
export function handleNewOffer(event: NewOffer): void {}
