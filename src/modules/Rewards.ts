// import {
//   log,
//   BigInt,
//   Address,
//   ethereum,
//   BigDecimal,
// } from "@graphprotocol/graph-ts";
// import {
//   getOrCreateRewardToken,
//   getOrCreatePool,
//   getOrCreateToken,
// } from "../common/initalizers";
// import * as utils from "../common/utils";
// import * as constants from "../common/constants";
// import { Rewards as PoolRewardsContract } from "../../generated/templates/PoolTemplate/Rewards";
// import { Gauge as LiquidityGaugeContract } from "../../generated/templates/LiquidityGauge/Gauge";
// import { GaugeController as GaugeControllereContract } from "../../generated/GaugeController/GaugeController";



// export function updateCrvRewardsInfo(
//   poolAddress: Address,
//   gaugeAddress: Address,
//   vaultAddress:Address,
//   block: ethereum.Block
// ): void {
//   const pool = getOrCreatePool(poolAddress,vaultAddress, block);

//   let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
//   let gaugeControllerContract = GaugeControllereContract.bind(
//     constants.Mainnet.GAUGE_CONTROLLER_ADDRESS
//   );

//   let inflationRate = utils
//     .readValue<BigInt>(
//       gaugeContract.try_inflation_rate(),
//       constants.BIGINT_ZERO
//     )
//     .toBigDecimal();

//   let gaugeRelativeWeight = utils
//     .readValue<BigInt>(
//       gaugeControllerContract.try_gauge_relative_weight(gaugeAddress),
//       constants.BIGINT_ZERO
//     )
//     .toBigDecimal();

//   let gaugeWorkingSupply = utils.readValue<BigInt>(
//     gaugeContract.try_working_supply(),
//     constants.BIGINT_ZERO
//   );

//   // rewards = inflation_rate * gauge_relative_weight * 86_400 * 0.4
//   let crvRewardEmissionsPerDay = inflationRate
//     .times(gaugeRelativeWeight.div(constants.BIGINT_TEN.pow(18).toBigDecimal()))
//     .times(BigDecimal.fromString(constants.SECONDS_PER_DAY.toString()))
//     .times(BigDecimal.fromString("0.4"));

//   updateRewardTokenEmissions(
//     constants.Mainnet.CRV_TOKEN_ADDRESS,
//     poolAddress,
//     BigInt.fromString(crvRewardEmissionsPerDay.truncate(0).toString()),
//     block
//   );
//   pool.stakedOutputTokenAmount = gaugeWorkingSupply;
//   pool.save();
// }

// export function updateRewardTokenEmissions(
//   rewardTokenAddress: Address,
//   poolAddress: Address,
//   rewardTokenPerDay: BigInt,
//   block: ethereum.Block
// ): void {
//   const pool = getOrCreateLiquidityPool(poolAddress, block);
//   const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block);

//   if (!pool.rewardTokens) {
//     pool.rewardTokens = [];
//   }

//   let rewardTokens = pool.rewardTokens!;
//   if (!rewardTokens.includes(rewardToken.id)) {
//     rewardTokens.push(rewardToken.id);
//     pool.rewardTokens = rewardTokens;
//   }

//   const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);

//   if (!pool.rewardTokenEmissionsAmount) {
//     pool.rewardTokenEmissionsAmount = [];
//   }
//   let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;

//   if (!pool.rewardTokenEmissionsUSD) {
//     pool.rewardTokenEmissionsUSD = [];
//   }
//   let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;

//   const token = getOrCreateToken(rewardTokenAddress, block.number);

//   rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
//   rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
//     .toBigDecimal()
//     .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
//     .times(token.lastPriceUSD!);

//   pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
//   pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

//   pool.save();
// }
