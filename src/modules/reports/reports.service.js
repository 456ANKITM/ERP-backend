import Sale from "@/models/Sale.model.js";
import Product from "@/models/Product.model.js";
import Store from "@/models/Store.model.js";
import User, { USER_ROLES} from "@/models/User.model.js";

import ApiError from "@/utils/ApiError.js";

import { REPORT_MESSAGES } from "./reports.constants.js";
import {
  validateSalesSummaryQuery,
  validateInventoryValuationQuery,
  validateProfitLossQuery,
  validateTopProductsQuery,
  validateStoreComparisonQuery,
  validateStaffPerformanceQuery,
} from "./reports.validator.js";

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const safeDivide = (numerator, denominator) =>
  denominator > 0 ? round2(numerator / denominator) : 0;

// Owner may view a single store (?storeId=) or all stores (omit it);
// Store Manager is always pinned to their own, ignoring any storeId
// they might send.
const resolveOptionalStoreId = async ({ user, queryStoreId }) => {
  if (user.role === USER_ROLES.STORE_MANAGER) {
    return user.storeId;
  }

  if (!queryStoreId) return null; // null = every store in the business

  const store = await Store.findOne({
    _id: queryStoreId,
    businessId: user.businessId,
    deletedAt: null,
  });

  if (!store) {
    throw new ApiError(404, REPORT_MESSAGES.STORE_NOT_FOUND);
  }

  return store._id;
};

const getStoreLabelMap = async (businessId) => {
  const stores = await Store.find({ businessId, deletedAt: null })
    .select("name code")
    .lean();

  return new Map(stores.map((s) => [String(s._id), { name: s.name, code: s.code }]));
};

const formatPeriodLabel = (date, groupBy) => {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return groupBy === "month" ? `${y}-${m}` : `${y}-${m}-${day}`;
};


// Sales Summary

export const getSalesSummary = async ({ user, query }) => {
  const { startDate, endDate, storeId: queryStoreId, groupBy } =
    validateSalesSummaryQuery(query);

  const storeId = await resolveOptionalStoreId({ user, queryStoreId });

  const match = {
    businessId: user.businessId,
    createdAt: { $gte: startDate, $lte: endDate },
    ...(storeId ? { storeId } : {}),
  };

  const [breakdownRaw, paymentMethodRaw] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateTrunc: { date: "$createdAt", unit: groupBy } },
          orders: { $sum: 1 },
          revenue: { $sum: { $toDouble: "$totalAmount" } },
          refunded: { $sum: { $toDouble: "$amountRefunded" } },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          orders: { $sum: 1 },
          revenue: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]),
  ]);

  const breakdown = breakdownRaw.map((b) => ({
    period: formatPeriodLabel(b._id, groupBy),
    orders: b.orders,
    revenue: round2(b.revenue),
    refunded: round2(b.refunded),
    netRevenue: round2(b.revenue - b.refunded),
  }));

  const totalOrders = breakdown.reduce((sum, b) => sum + b.orders, 0);
  const totalRevenue = round2(breakdown.reduce((sum, b) => sum + b.revenue, 0));
  const totalRefunded = round2(breakdown.reduce((sum, b) => sum + b.refunded, 0));

  const paymentMethodBreakdown = paymentMethodRaw.map((p) => ({
    paymentMethod: p._id,
    orders: p.orders,
    revenue: round2(p.revenue),
  }));

  return {
    range: { startDate, endDate, groupBy },
    storeId,
    summary: {
      totalOrders,
      totalRevenue,
      totalRefunded,
      netRevenue: round2(totalRevenue - totalRefunded),
      avgOrderValue: safeDivide(totalRevenue, totalOrders),
    },
    breakdown,
    paymentMethodBreakdown,
  };
};


// Inventory Valuation

export const getInventoryValuation = async ({ user, query }) => {
  const { storeId: queryStoreId } = validateInventoryValuationQuery(query);
  const storeId = await resolveOptionalStoreId({ user, queryStoreId });

  const match = {
    businessId: user.businessId,
    deletedAt: null,
    status: Product.STATUS.ACTIVE,
    ...(storeId ? { storeId } : {}),
  };

  const pipeline = [
    { $match: match },
    {
      $project: {
        storeId: 1,
        quantityInStock: 1,
        recorderLevel: 1,
        costValue: { $multiply: ["$quantityInStock", { $toDouble: "$costPrice" }] },
        sellingValue: { $multiply: ["$quantityInStock", { $toDouble: "$sellingPrice" }] },
      },
    },
  ];

  const [overallAgg, byStoreAgg, lowStockCount, outOfStockCount] = await Promise.all([
    Product.aggregate([
      ...pipeline,
      {
        $group: {
          _id: null,
          totalSkus: { $sum: 1 },
          totalUnits: { $sum: "$quantityInStock" },
          totalCostValue: { $sum: "$costValue" },
          totalSellingValue: { $sum: "$sellingValue" },
        },
      },
    ]),

    storeId
      ? Promise.resolve([])
      : Product.aggregate([
          ...pipeline,
          {
            $group: {
              _id: "$storeId",
              totalSkus: { $sum: 1 },
              totalUnits: { $sum: "$quantityInStock" },
              totalCostValue: { $sum: "$costValue" },
              totalSellingValue: { $sum: "$sellingValue" },
            },
          },
        ]),

    Product.countDocuments({
      ...match,
      $expr: { $and: [{ $gt: ["$quantityInStock", 0] }, { $lte: ["$quantityInStock", "$recorderLevel"] }] },
    }),

    Product.countDocuments({ ...match, quantityInStock: 0 }),
  ]);

  const buildSummary = (agg) => {
    const totalCostValue = round2(agg?.totalCostValue || 0);
    const totalSellingValue = round2(agg?.totalSellingValue || 0);
    return {
      totalSkus: agg?.totalSkus || 0,
      totalUnits: agg?.totalUnits || 0,
      totalCostValue,
      totalSellingValue,
      potentialProfit: round2(totalSellingValue - totalCostValue),
      potentialMarginPercent: safeDivide(totalSellingValue - totalCostValue, totalSellingValue),
    };
  };

  let byStore = null;
  if (!storeId) {
    const storeLabels = await getStoreLabelMap(user.businessId);
    byStore = byStoreAgg.map((s) => ({
      storeId: s._id,
      storeName: storeLabels.get(String(s._id))?.name || "Unknown store",
      storeCode: storeLabels.get(String(s._id))?.code || null,
      ...buildSummary(s),
    }));
  }

  return {
    asOf: new Date(),
    storeId,
    summary: {
      ...buildSummary(overallAgg[0]),
      lowStockCount,
      outOfStockCount,
    },
    byStore,
  };
};


// Shared helper: revenue + approximate COGS per store, for a
// business (or a filtered set of stores) within a date range.
//
// COGS uses each product's CURRENT costPrice, not the cost at the
// time of the actual sale — your schema has no historical cost
// basis on sale line items. Treat this as an estimate, not audited
// accounting. If a sold product has since been hard-deleted, its
// cost contribution is treated as 0 (flagged, not silently wrong —
// see the caveat in the response's `note` field).


const computeRevenueAndCogsByStore = async ({ businessId, storeIds, startDate, endDate }) => {
  const match = {
    businessId,
    storeId: { $in: storeIds },
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const [revenueRaw, cogsRaw] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$storeId",
          orders: { $sum: 1 },
          revenue: { $sum: { $toDouble: "$totalAmount" } },
          refunded: { $sum: { $toDouble: "$amountRefunded" } },
        },
      },
    ]),

    Sale.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          storeId: 1,
          lineCogs: {
            $multiply: [
              { $subtract: ["$items.quantity", "$items.refundedQuantity"] },
              { $ifNull: [{ $toDouble: "$product.costPrice" }, 0] },
            ],
          },
        },
      },
      { $group: { _id: "$storeId", cogs: { $sum: "$lineCogs" } } },
    ]),
  ]);

  const revenueMap = new Map(revenueRaw.map((r) => [String(r._id), r]));
  const cogsMap = new Map(cogsRaw.map((c) => [String(c._id), c.cogs]));

  return storeIds.map((id) => {
    const rev = revenueMap.get(String(id)) || { orders: 0, revenue: 0, refunded: 0 };
    const cogs = cogsMap.get(String(id)) || 0;
    const netRevenue = rev.revenue - rev.refunded;
    const grossProfit = netRevenue - cogs;

    return {
      storeId: id,
      orders: rev.orders,
      revenue: round2(rev.revenue),
      refunded: round2(rev.refunded),
      netRevenue: round2(netRevenue),
      cogs: round2(cogs),
      grossProfit: round2(grossProfit),
      grossMarginPercent: safeDivide(grossProfit, netRevenue),
    };
  });
};


// Profit & Loss (Owner only)


export const getProfitLoss = async ({ user, query }) => {
  const { startDate, endDate, storeId: queryStoreId } = validateProfitLossQuery(query);

  let storeIds;
  if (queryStoreId) {
    const store = await Store.findOne({
      _id: queryStoreId,
      businessId: user.businessId,
      deletedAt: null,
    });
    if (!store) throw new ApiError(404, REPORT_MESSAGES.STORE_NOT_FOUND);
    storeIds = [store._id];
  } else {
    const stores = await Store.find({ businessId: user.businessId, deletedAt: null }).select("_id");
    storeIds = stores.map((s) => s._id);
  }

  const perStore = await computeRevenueAndCogsByStore({
    businessId: user.businessId,
    storeIds,
    startDate,
    endDate,
  });

  const consolidated = perStore.reduce(
    (acc, s) => ({
      orders: acc.orders + s.orders,
      revenue: round2(acc.revenue + s.revenue),
      refunded: round2(acc.refunded + s.refunded),
      netRevenue: round2(acc.netRevenue + s.netRevenue),
      cogs: round2(acc.cogs + s.cogs),
      grossProfit: round2(acc.grossProfit + s.grossProfit),
    }),
    { orders: 0, revenue: 0, refunded: 0, netRevenue: 0, cogs: 0, grossProfit: 0 },
  );
  consolidated.grossMarginPercent = safeDivide(consolidated.grossProfit, consolidated.netRevenue);

  let byStore = null;
  if (!queryStoreId) {
    const storeLabels = await getStoreLabelMap(user.businessId);
    byStore = perStore.map((s) => ({
      storeName: storeLabels.get(String(s.storeId))?.name || "Unknown store",
      storeCode: storeLabels.get(String(s.storeId))?.code || null,
      ...s,
    }));
  }

  return {
    range: { startDate, endDate },
    storeId: queryStoreId || null,
    consolidated,
    byStore,
    note: "COGS is estimated using each product's current cost price, not the historical cost at the time of sale. This report has no operating-expense layer — figures reflect gross profit only.",
  };
};


// Top Products


export const getTopProducts = async ({ user, query }) => {
  const { startDate, endDate, storeId: queryStoreId, sortBy, limit } =
    validateTopProductsQuery(query);

  const storeId = await resolveOptionalStoreId({ user, queryStoreId });

  const match = {
    businessId: user.businessId,
    createdAt: { $gte: startDate, $lte: endDate },
    ...(storeId ? { storeId } : {}),
  };

  const sortField = sortBy === "quantity" ? "quantitySold" : "revenue";

  const products = await Sale.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        productName: { $first: "$items.productName" },
        sku: { $first: "$items.sku" },
        quantitySold: { $sum: { $subtract: ["$items.quantity", "$items.refundedQuantity"] } },
        revenue: {
          $sum: {
            $multiply: [
              { $subtract: ["$items.quantity", "$items.refundedQuantity"] },
              { $toDouble: "$items.sellingPrice" },
            ],
          },
        },
        timesSold: { $sum: 1 },
      },
    },
    { $sort: { [sortField]: -1 } },
    { $limit: limit },
  ]);

  return {
    range: { startDate, endDate },
    storeId,
    sortBy,
    products: products.map((p) => ({
      productId: p._id,
      productName: p.productName,
      sku: p.sku,
      quantitySold: p.quantitySold,
      revenue: round2(p.revenue),
      timesSold: p.timesSold,
    })),
  };
};


// Store Comparison (Owner only)

export const getStoreComparison = async ({ user, query }) => {
  const { startDate, endDate } = validateStoreComparisonQuery(query);

  const stores = await Store.find({ businessId: user.businessId, deletedAt: null })
    .select("name code")
    .lean();

  const storeIds = stores.map((s) => s._id);

  const [perStoreFinancials, inventoryAgg, lowStockCounts] = await Promise.all([
    computeRevenueAndCogsByStore({ businessId: user.businessId, storeIds, startDate, endDate }),

    Product.aggregate([
      {
        $match: {
          businessId: user.businessId,
          storeId: { $in: storeIds },
          deletedAt: null,
          status: Product.STATUS.ACTIVE,
        },
      },
      {
        $group: {
          _id: "$storeId",
          costValue: { $sum: { $multiply: ["$quantityInStock", { $toDouble: "$costPrice" }] } },
          sellingValue: { $sum: { $multiply: ["$quantityInStock", { $toDouble: "$sellingPrice" }] } },
        },
      },
    ]),

    Promise.all(
      storeIds.map((id) =>
        Product.countDocuments({
          businessId: user.businessId,
          storeId: id,
          deletedAt: null,
          status: Product.STATUS.ACTIVE,
          $expr: { $and: [{ $gt: ["$quantityInStock", 0] }, { $lte: ["$quantityInStock", "$recorderLevel"] }] },
        }),
      ),
    ),
  ]);

  const financialsMap = new Map(perStoreFinancials.map((f) => [String(f.storeId), f]));
  const inventoryMap = new Map(inventoryAgg.map((i) => [String(i._id), i]));

  const compared = stores.map((store, index) => {
    const financials = financialsMap.get(String(store._id)) || {};
    const inventory = inventoryMap.get(String(store._id)) || { costValue: 0, sellingValue: 0 };

    return {
      storeId: store._id,
      storeName: store.name,
      storeCode: store.code,
      orders: financials.orders || 0,
      revenue: financials.revenue || 0,
      refunded: financials.refunded || 0,
      netRevenue: financials.netRevenue || 0,
      cogs: financials.cogs || 0,
      grossProfit: financials.grossProfit || 0,
      grossMarginPercent: financials.grossMarginPercent || 0,
      inventoryCostValue: round2(inventory.costValue),
      inventorySellingValue: round2(inventory.sellingValue),
      lowStockCount: lowStockCounts[index],
    };
  });

  compared.sort((a, b) => b.netRevenue - a.netRevenue);
  compared.forEach((s, i) => (s.rank = i + 1));

  return {
    range: { startDate, endDate },
    stores: compared,
  };
};


// Staff Performance (Owner only)


export const getStaffPerformance = async ({ user, query }) => {
  const { startDate, endDate, storeId: queryStoreId } = validateStaffPerformanceQuery(query);

  if (queryStoreId) {
    const store = await Store.findOne({
      _id: queryStoreId,
      businessId: user.businessId,
      deletedAt: null,
    });
    if (!store) throw new ApiError(404, REPORT_MESSAGES.STORE_NOT_FOUND);
  }

  const managerFilter = {
    businessId: user.businessId,
    role: USER_ROLES.STORE_MANAGER,
    deletedAt: null,
    ...(queryStoreId ? { storeId: queryStoreId } : {}),
  };

  const [managers, salesByManager] = await Promise.all([
    User.find(managerFilter).select("name email storeId status").populate({ path: "storeId", select: "name code" }).lean(),

    Sale.aggregate([
      {
        $match: {
          businessId: user.businessId,
          createdAt: { $gte: startDate, $lte: endDate },
          ...(queryStoreId ? { storeId: queryStoreId } : {}),
        },
      },
      {
        $group: {
          _id: "$soldBy",
          orders: { $sum: 1 },
          revenue: { $sum: { $toDouble: "$totalAmount" } },
          refunded: { $sum: { $toDouble: "$amountRefunded" } },
        },
      },
    ]),
  ]);

  const salesMap = new Map(salesByManager.map((s) => [String(s._id), s]));

  const staff = managers.map((manager) => {
    const sales = salesMap.get(String(manager._id)) || { orders: 0, revenue: 0, refunded: 0 };
    const netRevenue = round2(sales.revenue - sales.refunded);

    return {
      userId: manager._id,
      name: manager.name,
      email: manager.email,
      status: manager.status,
      storeId: manager.storeId?._id || null,
      storeName: manager.storeId?.name || null,
      orders: sales.orders,
      revenue: round2(sales.revenue),
      refunded: round2(sales.refunded),
      netRevenue,
      avgOrderValue: safeDivide(sales.revenue, sales.orders),
    };
  });

  staff.sort((a, b) => b.netRevenue - a.netRevenue);
  staff.forEach((s, i) => (s.rank = i + 1));

  return {
    range: { startDate, endDate },
    storeId: queryStoreId || null,
    staff,
    note: "Only sales recorded under a Store Manager's own account are counted here — sales an Owner personally processed are excluded from this ranking.",
  };
};