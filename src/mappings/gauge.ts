import { RibbonThetaVaultWithSwap as RibbonThetaVault } from "../../generated/RibbonETHCoveredCall/RibbonThetaVaultWithSwap";
import {
  Deposit,
  Withdraw,
} from "../../generated/RibbonAAVECoveredCallLiquidityGauge/LiquidityGaugeV5";
import { searchLiquidityGaugePoolsVaultAddress } from "../common/utils";
import { getOrCreateVault } from "../common/initalizers";

export function handleStake(event: Deposit): void {
  let vaultAddress = searchLiquidityGaugePoolsVaultAddress(event.address);

 


}

export function handleUnstake(event: Withdraw): void {
  let vaultAddress = searchLiquidityGaugePoolsVaultAddress(event.address);

}
