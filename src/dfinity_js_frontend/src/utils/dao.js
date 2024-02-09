import { transferICP } from "./ledger";

export async function getProposals() {
  try {
    return await window.canister.dao.getProposals();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}

export async function getUserShares() {
  try {
    const address = window.auth.principal;
    return await window.canister.dao.getUserShares({ address });
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}

export async function getDaoData() {
  try {
    return await window.canister.dao.getDaoData();
  } catch (err) {
    if (err.name === "AgentHTTPResponseError") {
      const authClient = window.auth.client;
      await authClient.logout();
    }
    return [];
  }
}

export async function makeDeposit(payload) {
  const daoCanister = window.canister.dao;
  const orderResponse = await daoCanister.createDepositOrder(payload);
  if (orderResponse.Err) {
    throw new Error(orderResponse.Err);
  }
  const canisterAddress = await daoCanister.getCanisterAddress();
  const block = await transferICP(
    canisterAddress,
    orderResponse.Ok.amount,
    orderResponse.Ok.memo
  );
  const out = await daoCanister.completeDeposit(
    orderResponse.Ok.id,
    orderResponse.Ok.amount,
    block,
    orderResponse.Ok.memo
  );

  return out;
}

export async function redeemShares(payload) {
  const daoCanister = window.canister.dao;
  const out = await daoCanister.redeemShares(payload);
  return out;
}

export async function transferShares(payload) {
  const daoCanister = window.canister.dao;
  const out = await daoCanister.transferShares(payload);
  return out;
}

export async function createProposal(payload) {
  const daoCanister = window.canister.dao;
  const out = await daoCanister.createProposal(payload);
  return out;
}

export async function voteProposal(payload) {
  const daoCanister = window.canister.dao;
  const out = await daoCanister.voteProposal(payload);
  return out;
}

export async function executeProposal(payload) {
  const daoCanister = window.canister.dao;
  const out = await daoCanister.executeProposal(payload);
  return out;
}
