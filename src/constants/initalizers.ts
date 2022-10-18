import { Address, ethereum,BigInt } from "@graphprotocol/graph-ts";

import { FinancialsDailySnapshot, Protocol, Token, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot } from "../../generated/schema"
import { getUsdPricePerToken } from "../prices";
import * as constants from "./constants";
import * as utils from "./utils";

export function getOrCreateToken(
  address: Address,
  block: ethereum.Block
): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());

    const contract = ERC20Contract.bind(address);

    token.name = utils.readValue<string>(contract.try_name(), "");
    token.symbol = utils.readValue<string>(contract.try_symbol(), "");
    token.decimals = utils.readValue<i32>(
      contract.try_decimals(),
      BigInt.fromI32(constants.DEFAULT_DECIMALS).toI32() as u8
    );

    if (address.equals(constants.ETH_ADDRESS)) {
      token.name = constants.ETH_NAME;
      token.symbol = constants.ETH_SYMBOL;
      token.decimals = constants.DEFAULT_DECIMALS;
    }

    let tokenPrice = getUsdPricePerToken(address);
    token.lastPriceUSD = tokenPrice.usdPrice.div(tokenPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = block.number;
    token.save();
  }

  if (
    !token.lastPriceUSD ||
    !token.lastPriceBlockNumber ||
    block.number
      .minus(token.lastPriceBlockNumber!)
      .gt(constants.BSC_AVERAGE_BLOCK_PER_HOUR)
  ) {
    let tokenPrice = getUsdPricePerToken(address);
    token.lastPriceUSD = tokenPrice.usdPrice.div(tokenPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = block.number;

    token.save();
  }

  return token;
}

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load("");
  if (!protocol)
  {
    protocol = new Protocol("");

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
    financialMetrics.protocol = constants.REGISTRY_ADDRESS.toHexString();

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
    usageMetrics.protocol = constants.REGISTRY_ADDRESS.toHexString();

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
    usageMetrics.protocol = constants.REGISTRY_ADDRESS.toHexString();

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}