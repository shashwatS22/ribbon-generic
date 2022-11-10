import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {InitiateGnosisAuction, Deposit,Withdraw,InstantWithdraw, CollectVaultFees,NewOffer,OpenShort,CloseShort} from '../../generated/RibbonETHCoveredCall/RibbonThetaVaultWithSwap';
import {AuctionCleared,SettleAuctionCall as SettleAuction} from '../../generated/GnosisAuction/GnosisAuction';
import {DistributePremium} from '../../generated/RibbonTreasuryVaultPERP/RibbonTreasuryVault';
import {getOrCreateAuction} from '../constants/initalizers'
export function handleInitiateGnosisAuction(
  event: InitiateGnosisAuction
): void {
  let auctionId = event.params. auctionCounter;
  let optionToken = event.params.auctioningToken;
  let biddingToken = event.params.biddingToken;
  let auction = getOrCreateAuction(auctionId,optionToken,biddingToken);

  
}

export function handleAuctionCleared(event: AuctionCleared): void {
  let auctionID = event.params.auctionId;
  let auction = GnosisAuction.load(auctionID.toHexString());
  if (auction == null) {
    return;
  }

  let optionToken = auction.optionToken;
  let shortPosition = VaultShortPosition.load(optionToken.toHexString());
  if (shortPosition == null) {
    return;
  }

  let vault = Vault.load(shortPosition.vault);
  if (vault == null) {
    return;
  }

  let tradeID =
    optionToken.toHexString() +
    "-" +
    event.transaction.hash.toHexString() +
    "-" +
    event.transactionLogIndex.toString();

  let optionsSold = event.params.soldAuctioningTokens;
  let totalPremium = event.params.soldBiddingTokens;

  // If there are no premiums exchanging hands,
  // This means that the auction is settled without any bids
  // This is rare, but has happened before.
  if (totalPremium == BigInt.fromI32(0)) {
    return;
  }

  updateVaultPerformance(shortPosition.vault, event.block.timestamp.toI32());

  let optionTrade = new VaultOptionTrade(tradeID);
  optionTrade.vault = shortPosition.vault;

  optionTrade.sellAmount = optionsSold;
  optionTrade.premium = totalPremium;

  optionTrade.vaultShortPosition = optionToken.toHexString();
  optionTrade.timestamp = event.block.timestamp;
  optionTrade.txhash = event.transaction.hash;
  optionTrade.save();

  if (shortPosition.premiumEarned === null) {
    shortPosition.premiumEarned = totalPremium;
  } else {
    shortPosition.premiumEarned += totalPremium;
  }
  shortPosition.save();

  vault.totalPremiumEarned = vault.totalPremiumEarned.plus(totalPremium);
  vault.save();

  refreshAllAccountBalances(
    Address.fromString(shortPosition.vault),
    event.block.timestamp.toI32()
  );
}

export function handleNewOffer(event: NewOffer): void {
  let auctionID = event.params.swapId;
  let optionToken = event.params.oToken;

  let auction = new SwapOffer(auctionID.toHexString());

  auction.optionToken = optionToken;
  auction.oTokensSold = BigInt.fromI32(0);
  auction.totalPremium = BigInt.fromI32(0);

  auction.save();
}

export function handleSwap(event: Swap): void {
  let swap = SwapOffer.load(event.params.swapId.toHexString());

  if (swap == null) {
    return;
  }

  swap.oTokensSold += event.params.sellerAmount;
  swap.totalPremium += event.params.signerAmount;
  swap.save();
}

export function handleSettleOffer(event: SettleOffer): void {
  let auctionID = event.params.swapId;
  let auction = SwapOffer.load(auctionID.toHexString());
  if (auction == null) {
    return;
  }

  let optionToken = auction.optionToken;
  let shortPosition = VaultShortPosition.load(optionToken.toHexString());
  if (shortPosition == null) {
    return;
  }

  let vault = Vault.load(shortPosition.vault);
  if (vault == null) {
    return;
  }

  let tradeID =
    optionToken.toHexString() +
    "-" +
    event.transaction.hash.toHexString() +
    "-" +
    event.transactionLogIndex.toString();

  let optionsSold = auction.oTokensSold;
  let totalPremium = auction.totalPremium;

  // If there are no premiums exchanging hands,
  // This means that the auction is settled without any bids
  // This is rare, but has happened before.
  if (totalPremium == BigInt.fromI32(0)) {
    return;
  }

  updateVaultPerformance(shortPosition.vault, event.block.timestamp.toI32());

  let optionTrade = new VaultOptionTrade(tradeID);
  optionTrade.vault = shortPosition.vault;

  optionTrade.sellAmount = optionsSold;
  optionTrade.premium = totalPremium;

  optionTrade.vaultShortPosition = optionToken.toHexString();
  optionTrade.timestamp = event.block.timestamp;
  optionTrade.txhash = event.transaction.hash;
  optionTrade.save();

  if (shortPosition.premiumEarned === null) {
    shortPosition.premiumEarned = totalPremium;
  } else {
    shortPosition.premiumEarned += totalPremium;
  }

  shortPosition.save();

  vault.totalPremiumEarned = vault.totalPremiumEarned.plus(totalPremium);
  vault.save();

  refreshAllAccountBalances(
    Address.fromString(shortPosition.vault),
    event.block.timestamp.toI32()
  );
}

export function handleDeposit(event: Deposit): void {
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

  let vault = Vault.load(vaultAddress);

  if (vault == null) {
    vault = newVault(vaultAddress, event.block.timestamp.toI32());
    vault.save();
  }

  vault.totalNominalVolume = vault.totalNominalVolume + event.params.amount;
  vault.save();

  let vaultAccount = createVaultAccount(event.address, event.params.account);
  vaultAccount.totalDeposits = vaultAccount.totalDeposits + event.params.amount;
  vaultAccount.depositInRound = vault.round;
  vaultAccount.save();

  let txid =
    vaultAddress +
    "-" +
    event.transaction.hash.toHexString() +
    "-" +
    event.transactionLogIndex.toString();

  newTransaction(
    txid,
    "deposit",
    vaultAddress,
    event.params.account,
    event.transaction.hash,
    event.block.timestamp,
    event.params.amount,
    event.params.amount
  );

  triggerBalanceUpdate(
    event.address,
    event.params.account,
    event.block.timestamp.toI32(),
    false,
    false
  );
}


export function handleWithdraw(event: Withdraw): void {
  let vaultAddress = event.address.toHexString();
  let vault = Vault.load(vaultAddress);

  if (vault == null) {
    vault = newVault(vaultAddress, event.block.timestamp.toI32());
    vault.save();
  }

  let vaultAccount = createVaultAccount(event.address, event.params.account);
  vaultAccount.totalDeposits = vaultAccount.totalDeposits - event.params.amount;
  vaultAccount.save();

  let txid =
    vaultAddress +
    "-" +
    event.transaction.hash.toHexString() +
    "-" +
    event.transactionLogIndex.toString();

  newTransaction(
    txid,
    "withdraw",
    vaultAddress,
    event.params.account,
    event.transaction.hash,
    event.block.timestamp,
    event.params.amount,
    event.params.amount
  );

  triggerBalanceUpdate(
    event.address,
    event.params.account,
    event.block.timestamp.toI32(),
    false,
    true
  );
}

export function handleInstantWithdraw(event: InstantWithdraw): void {
  // The vault & vaultAccount must already exist before an instantwithdraw is triggered
  // This is because we create them on deposit
  let vaultAddress = event.address.toHexString();

  let txid =
    vaultAddress +
    "-" +
    event.transaction.hash.toHexString() +
    "-" +
    event.transactionLogIndex.toString();

  let vaultAccount = createVaultAccount(event.address, event.params.account);

  vaultAccount.totalDeposits = vaultAccount.totalDeposits - event.params.amount;
  vaultAccount.save();

  newTransaction(
    txid,
    "instantWithdraw",
    vaultAddress,
    event.params.account,
    event.transaction.hash,
    event.block.timestamp,
    event.params.amount,
    event.params.amount
  );

  triggerBalanceUpdate(
    event.address,
    event.params.account,
    event.block.timestamp.toI32(),
    false,
    true
  );
}




export function handleCollectVaultFees(event: CollectVaultFees): void {
  let vaultAddress = event.address.toHexString();
  let vault = getOrCreateVault(vaultAddress, event.block.timestamp.toI32());

  let performanceFee = event.params.performanceFee;
  let totalFee = event.params.vaultFee;
  let managementFee = totalFee - performanceFee;

  vault.performanceFeeCollected =
    vault.performanceFeeCollected + performanceFee;
  vault.managementFeeCollected = vault.managementFeeCollected + managementFee;
  vault.totalFeeCollected = vault.totalFeeCollected + totalFee;
  vault.save();
}

export function handleDistributePremium(event: DistributePremium): void {
  let vaultAddress = event.address.toHexString();
  let vault = Vault.load(vaultAddress);

  if (vault == null) {
    vault = newVault(vaultAddress, event.block.timestamp.toI32());
    vault.save();
  }

  let recipients = event.params.recipients;
  let amounts = event.params.amounts;

  for (let i = 0; i < event.params.recipients.length; i++) {
    let txid =
      vaultAddress +
      "-" +
      event.transaction.hash.toHexString() +
      "-" +
      i.toString();

    newTransaction(
      txid,
      "distribute",
      vaultAddress,
      recipients[i],
      event.transaction.hash,
      event.block.timestamp,
      amounts[i],
      amounts[i]
    );
  }
}