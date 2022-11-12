import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { Pool, Token, _Vault } from "../../generated/schema";
import {
  getOrCreateProtocol,
  getOrCreateToken,
  getOrCreateVault,
} from "./initalizers";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/RibbonstETHCoveredCall/RibbonThetaVaultWithSwap";
import { Otoken as OTokenContract } from "../../generated/RibbonrETHCoveredCall/Otoken";

import {
  OptionsPremiumPricer as OptionsPremiumPricerContract,
} from "../../generated/RibbonrETHCoveredCall/OptionsPremiumPricer";
import { ERC20 as ERC20Contract } from "../../generated/RibbonrETHCoveredCall/ERC20";
import * as constants from "./constants";
export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getVaultBalance(
  vaultAddress: Address,
  decimals: BigDecimal
): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);

  const vaultBalance = readValue<BigInt>(
    vaultContract.try_totalBalance(),
    constants.BIGINT_ZERO
  ).divDecimal(decimals);
  return vaultBalance;
}

export function updateProtocolAfterNewPool(poolAddress: Address): void {
  const protocol = getOrCreateProtocol();
  let poolIds = protocol._poolIds;
  poolIds!.push(poolAddress.toHexString());
  protocol._poolIds = poolIds;
  protocol.totalPoolCount += 1;
  protocol.save();
}
export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateProtocol();
  let vaultIds = protocol._vaultIds;
  vaultIds!.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;
  protocol.save();
}

export function checkIfPoolExists(poolAddress: Address): boolean {
  let pool = Pool.load(poolAddress.toHexString());
  if (!pool) {
    return false;
  }
  return true;
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateProtocol();

  const vaultIds = protocol._vaultIds!;
  let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  for (let vaultIdx = 0; vaultIdx < vaultIds.length; vaultIdx++) {
    const vault = _Vault.load(vaultIds[vaultIdx]);

    if (!vault) continue;
    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function getTokenDecimals(tokenAddr: Address): BigDecimal {
  const token = ERC20Contract.bind(tokenAddr);

  let decimals = readValue<number>(
    token.try_decimals(),
    constants.DEFAULT_DECIMALS
  );

  return constants.BIGINT_TEN.pow(decimals as u8).toBigDecimal();
}

export function getOptionTokenPriceUSD(
  vaultAddress: Address,
  optionToken: Address,
): BigDecimal {

  const vault = getOrCreateVault(vaultAddress);
  const vaultContract = VaultContract.bind(vaultAddress);
  
  const vaultPricePerShare = readValue(
    vaultContract.try_pricePerShare(),
    constants.BIGINT_ZERO
  ).divDecimal(BigDecimal.fromString(vault.decimals.toString()));
  
  const underlyingTokenPriceUSD = getUnderlyingTokenPriceFromOptionsPricer(vaultAddress, optionToken);

  let optionsTokenPriceUSD = underlyingTokenPriceUSD.times(vaultPricePerShare);

  return optionsTokenPriceUSD;
}


export function getUnderlyingTokenPriceFromOptionsPricer(vaultAddress:Address,optionToken:Address): BigDecimal{
  const vaultContract = VaultContract.bind(vaultAddress);
  const currentOption = optionToken;

  const optionsPremiumPricer = readValue(
    vaultContract.try_optionsPremiumPricer(),
    constants.ADDRESS_ZERO
  );

  let optionContract = OTokenContract.bind(currentOption);
  const optionsPremiumPricerContract = OptionsPremiumPricerContract.bind(
    optionsPremiumPricer
  );
  const currentOptionDecimals = BigDecimal.fromString(
    readValue(optionContract.try_decimals(), 8).toString()
  );

  const underlyingTokenPriceUSD = readValue(
    optionsPremiumPricerContract.try_getUnderlyingPrice(),
    constants.BIGINT_ZERO
  ).divDecimal(currentOptionDecimals);

  return underlyingTokenPriceUSD;
}