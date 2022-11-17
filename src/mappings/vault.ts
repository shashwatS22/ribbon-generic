import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {
  InitiateGnosisAuction,
  Deposit,
  Withdraw,
  InstantWithdraw,
  CollectVaultFees,
  NewOffer,
  OpenShort,
  CloseShort,
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
} from "../constants/initalizers";

export function handleInitiateGnosisAuction(
  event: InitiateGnosisAuction
): void {
  let auctionId = event.params.auctionCounter;
  let optionToken = event.params.auctioningToken;
  let biddingToken = event.params.biddingToken;
  let vaultAddress = event.address;
  getOrCreateToken(biddingToken, vaultAddress, false, event.block);
  getOrCreateToken(optionToken, vaultAddress, true, event.block);
  getOrCreateAuction(auctionId, vaultAddress, optionToken, biddingToken);
  getOrCreateVault(vaultAddress, event.block);
  
}



export function handleDeposit(event: Deposit): void {
  //get and update total value locked
  // update userMetrics

  let vaultAddress = event.address.toHexString();

  // Dont handle any deposit into AVAX / sAVAX vaults if less than 0.001 AVAX
  if (
    (vaultAddress == "0x98d03125c62dae2328d9d3cb32b7b969e6a87787" ||
      vaultAddress == "0x6bf686d99a4ce17798c45d09c21181fac29a9fb3") &&
    event.params.amount <= BigInt.fromString("100000000000000000")
  ) {
    log.error("Ignoring deposit {}", [event.transaction.hash.toHexString()]);
    return;
  }

}

export function handleWithdraw(event: Withdraw): void {
  //get and update total value locked
  // update userMetrics

  let vaultAddress = event.address.toHexString();

  

}

export function handleInstantWithdraw(event: InstantWithdraw): void {
  //get and update total value locked
  // update userMetrics

}

export function handleCollectVaultFees(event: CollectVaultFees): void {
  //get and update total value locked
  // update userMetrics
  // update revenue metrics
}

export function handleDistributePremium(event: DistributePremium): void {
}
