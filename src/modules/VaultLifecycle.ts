import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/RibbonETHCoveredCall/RibbonThetaVaultWithSwap";
import { getOrCreatePool, getOrCreateVault } from "../common/initalizers";
import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import * as utils from "../common/utils";
export function rollToNextOption(
  vaultAddress: Address,
  block: ethereum.Block
): void {
  let vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);
  const currentOption = utils.readValue(
    vaultContract.try_currentOption(),
    constants.ADDRESS_ZERO
  );
  const currentOptionAuctionId = utils.readValue(
    vaultContract.try_optionAuctionID(),
    constants.BIGINT_ZERO
  );
  const vaultTotalValueLocked = utils.getVaultBalance(
    Address.fromString(vault.id),
    BigDecimal.fromString(vault.decimals.toString())
  );
  if (!currentOption.equals(Address.fromString(vault.currentOption))) {
    const oldOption = vault.currentOption;
    let oldPool = getOrCreatePool(
      Address.fromString(oldOption),
      block,
      Address.fromString(vault.id),
    );
    const oldRewardTokenStakedAmountUSD = oldPool.rewardTokenEmissionsUSD;
    const oldRewardTokenStakedAmount = oldPool.rewardTokenEmissionsAmount;
    const newRewardTokenStakedAmountUSD = oldRewardTokenStakedAmountUSD;
    const newRewardTokenStakedAmount = oldRewardTokenStakedAmount;

    oldPool.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
    oldPool.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];
    oldPool.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    oldPool._vault = constants.ADDRESS_ZERO.toHexString();
    oldPool.save();

    vault.currentOption = currentOption.toHexString();
    vault.currentOptionAuctionId = currentOptionAuctionId;
    vault.totalValueLocked = vaultTotalValueLocked;
    vault.totalValueLockedUSD = utils
      .getUnderlyingTokenPriceFromOptionsPricer(
        Address.fromString(vault.id),
        currentOption
      )
      .times(vaultTotalValueLocked);
    vault.save();
    let currentPool = getOrCreatePool(
      currentOption,
      block,
      Address.fromString(vault.id),
    );
    currentPool.rewardTokenEmissionsAmount = newRewardTokenStakedAmount;
    currentPool.rewardTokenEmissionsUSD = newRewardTokenStakedAmountUSD;
    currentPool.save();
  }
  if (!vault.currentOptionAuctionId.equals(currentOptionAuctionId)) {
    vault.currentOptionAuctionId = currentOptionAuctionId;
    vault.save();
  }
}
