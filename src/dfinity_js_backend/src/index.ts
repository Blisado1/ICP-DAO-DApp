import {
  query,
  update,
  text,
  StableBTreeMap,
  Vec,
  None,
  Some,
  Ok,
  Err,
  ic,
  Principal,
  Opt,
  nat64,
  Duration,
  Result,
  bool,
  Canister,
  int32,
  init,
} from "azle";
import {
  Ledger,
  binaryAddressFromAddress,
  binaryAddressFromPrincipal,
  hexAddressFromPrincipal,
} from "azle/canisters/ledger";
//@ts-ignore
import { hashCode } from "hashcode";
import { v4 as uuidv4 } from "uuid";
import * as Types from "./types";

const proposalStorage = StableBTreeMap(0, int32, Types.Proposal);
const sharesStorage = StableBTreeMap(1, Principal, nat64);
const persistedDeposits = StableBTreeMap(2, Principal, Types.DepositOrder);
const pendingDeposits = StableBTreeMap(3, nat64, Types.DepositOrder);

// investor vote mapping ${Principal + proposalId}
const votesMapping = StableBTreeMap(2, text, bool);

const DEPOSIT_RESERVATION_PERIOD = 120n; // reservation period in seconds

const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));

// Dao Configuration
let totalShares: Opt<nat64> = None;
let availableFunds: Opt<nat64> = None;
let lockedFunds: Opt<nat64> = None;
let contributionEnds: Opt<nat64> = None;
let nextProposalId: Opt<int32> = None;
let quorum: Opt<nat64> = None;
let voteTime: Opt<nat64> = None;

export default Canister({
  // init function
  init: init([Types.InitPayload], (payload) => {
    // require that valid params are set
    if (payload.quorum < 0 || payload.quorum > 100) {
      ic.trap("quorum must be between 0 and 100");
    }

    if (payload.contributionTime < 0 || payload.voteTime < 0) {
      ic.trap("invalid time set");
    }

    // time is passed in minutes for testing
    const minsInNanoSeconds = BigInt(60 * 1000000000);

    const daysInNanoSeconds = BigInt(24 * 60 * 60 * 1000000000);

    // initialize variables
    totalShares = Some(BigInt(0));
    availableFunds = Some(BigInt(0));
    lockedFunds = Some(BigInt(0));
    contributionEnds = Some(
      ic.time() + payload.contributionTime * daysInNanoSeconds
    );
    nextProposalId = Some(0);
    quorum = Some(payload.quorum);
    voteTime = Some(payload.voteTime * minsInNanoSeconds);
  }),

  ////////////////////////////// SETTERS ///////////////////////////////////////

  // create deposit order to either join dao or increase shares
  createDepositOrder: update(
    [Types.JoinPayload],
    Result(Types.DepositOrder, Types.Message),
    (payload) => {
      // check payload data
      if (typeof payload !== "object" || Object.keys(payload).length === 0) {
        return Err({ NotFound: "invalid payoad" });
      }

      if ("None" in contributionEnds) {
        return Err({ NotSet: "error in dao configuration" });
      }

      let orderId = uuidv4();

      // create order
      const depositOrder = {
        id: orderId,
        amount: payload.amount,
        status: { PaymentPending: "PAYMENT_PENDING" },
        depositer: ic.caller(),
        paid_at_block: None,
        memo: generateCorrelationId(orderId),
      };

      // store and return order
      pendingDeposits.insert(depositOrder.memo, depositOrder);
      discardByTimeout(depositOrder.memo, DEPOSIT_RESERVATION_PERIOD);
      return Ok(depositOrder);
    }
  ),

  // completes deposit order to finalize the initial user action
  completeDeposit: update(
    [text, nat64, nat64, nat64],
    Result(Types.DepositOrder, Types.Message),
    async (depositId, amount, block, memo) => {
      const caller = ic.caller();

      // verify payment deposit and update orderss
      const paymentVerified = await verifyPaymentInternal(
        caller,
        amount,
        block,
        memo
      );
      if (!paymentVerified) {
        return Err({
          NotFound: `cannot complete the deposit: cannot verify the payment, memo=${memo}`,
        });
      }
      const pendingOrderOpt = pendingDeposits.remove(memo);
      if ("None" in pendingOrderOpt) {
        return Err({
          NotFound: `cannot complete the deposit: there is no pending deposit with id=${depositId}`,
        });
      }
      const order = pendingOrderOpt.Some;
      const updatedOrder = {
        ...order,
        status: { Completed: "COMPLETED" },
        paid_at_block: Some(block),
      };

      // update caller shares record
      const sharesOpt = sharesStorage.get(caller);

      let updatedShares;
      if ("None" in sharesOpt) {
        updatedShares = amount;
      } else {
        updatedShares = amount + sharesOpt.Some;
      }

      // update total shares
      let updatedTotalShares;
      if ("None" in totalShares) {
        updatedTotalShares = amount;
      } else {
        updatedTotalShares = totalShares.Some + amount;
      }

      // update available funds
      let updateAvailableFunds;
      if ("None" in availableFunds) {
        updateAvailableFunds = amount;
      } else {
        updateAvailableFunds = availableFunds.Some + amount;
      }

      // update storage
      totalShares = Some(updatedTotalShares);
      availableFunds = Some(updateAvailableFunds);
      sharesStorage.insert(caller, updatedShares);
      persistedDeposits.insert(ic.caller(), updatedOrder);

      return Ok(updatedOrder);
    }
  ),

  // redeem shares from the dao
  redeemShares: update(
    [Types.RedeemPayload],
    Result(Types.Message, Types.Message),
    async (payload) => {
      // check payload data
      if (typeof payload !== "object" || Object.keys(payload).length === 0) {
        return Err({ NotFound: "invalid payoad" });
      }

      const caller = ic.caller();
      const amount = payload.amount;

      // get and check available funds and total shares
      if ("None" in availableFunds || "None" in totalShares) {
        return Err({ NotSet: "error in dao configuration" });
      }

      // check if the available funds is greatere than the amount
      if (availableFunds.Some < amount) {
        return Err({
          NotEnough: "not enough funds in dao, try again later",
        });
      }

      // get the updated shares and check for errors
      const sharesOpt = sharesStorage.get(caller);
      if ("None" in sharesOpt) {
        return Err({ NotFound: "you do not have any shares" });
      }

      if (sharesOpt.Some < amount) {
        return Err({ NotEnough: "not enough shares" });
      }
      const updatedShares = sharesOpt.Some - amount;

      // transfer funds
      const result = await makePayment(caller, amount);

      if ("Err" in result) {
        return result;
      }

      // check if user shares become 0 and remove user from dao or update the remaining amount
      if (updatedShares == BigInt(0)) {
        sharesStorage.remove(caller);
      } else {
        sharesStorage.insert(caller, updatedShares);
      }

      // update total shares and available funds
      totalShares = Some(totalShares.Some - amount);
      availableFunds = Some(availableFunds.Some - amount);

      return result;
    }
  ),

  // transfer shares to another user
  transferShares: update(
    [Types.TransferPayload],
    Result(Types.Message, Types.Message),
    (payload) => {
      // check payload data
      if (typeof payload !== "object" || Object.keys(payload).length === 0) {
        return Err({ NotFound: "invalid payoad" });
      }
      const caller = ic.caller();
      const amount = payload.amount;
      const to = payload.to;

      // get sender shares and update
      const fromSharesOpt = sharesStorage.get(caller);

      if ("None" in fromSharesOpt) {
        return Err({ NotFound: "you do not have any shares" });
      }

      if (fromSharesOpt.Some < amount) {
        return Err({ NotEnough: "not enough shares" });
      }
      const updatedFromShares = fromSharesOpt.Some - amount;

      sharesStorage.insert(caller, updatedFromShares);

      // get to shares and update
      const toSharesOpt = sharesStorage.get(to);

      let updatedToShares;
      if ("None" in toSharesOpt) {
        updatedToShares = amount;
      } else {
        updatedToShares = toSharesOpt.Some + amount;
      }

      sharesStorage.insert(to, updatedToShares);

      return Ok({ Successful: "shares transferred successfully" });
    }
  ),

  // create a proposal
  createProposal: update(
    [Types.ProposalPayload],
    Result(Types.Proposal, Types.Message),
    (payload) => {
      // check payload data
      if (typeof payload !== "object" || Object.keys(payload).length === 0) {
        return Err({ NotFound: "invalid payoad" });
      }

      const caller = ic.caller();

      // get and check available funds and total shares
      if (
        "None" in availableFunds ||
        "None" in totalShares ||
        "None" in lockedFunds ||
        "None" in voteTime ||
        "None" in nextProposalId
      ) {
        return Err({ NotSet: "error in dao configuration" });
      }

      // check if available funds is enough
      if (availableFunds.Some < payload.amount) {
        return Err({ NotEnough: "not enough available funds for proposal" });
      }

      // check if user has shares
      if ("None" in sharesStorage.get(caller)) {
        return Err({ NotFound: "you do not have any shares" });
      }
      const id = nextProposalId.Some;
      // populate proposal information
      const proposal = {
        id,
        title: payload.title,
        amount: payload.amount,
        recipient: payload.recipient,
        votes: BigInt(0),
        ends: ic.time() + voteTime.Some,
        executed: false,
        ended: false,
      };

      // add proposal to the storage
      proposalStorage.insert(id, proposal);

      // update variables
      availableFunds = Some(availableFunds.Some - payload.amount);
      lockedFunds = Some(lockedFunds.Some + payload.amount);

      // increment proposal id
      nextProposalId = Some(id + 1);

      return Ok(proposal);
    }
  ),

  // vote for a proposal
  voteProposal: update(
    [Types.QueryPayload],
    Result(Types.Message, Types.Message),
    (payload) => {
      // check payload data
      if (typeof payload !== "object" || Object.keys(payload).length === 0) {
        return Err({ NotFound: "invalid payoad" });
      }

      const caller = ic.caller();
      const proposalId = payload.proposalId;

      // get sender shares and update
      const sharesOpt = sharesStorage.get(caller);

      if ("None" in sharesOpt) {
        return Err({ NotFound: "you do not have any shares" });
      }

      let address = caller.toString();

      // create identifier with user address and proposal id
      let id = `${address + proposalId.toString()}`;

      let voteMapOpt = votesMapping.get(id);

      if ("Some" in voteMapOpt) {
        return Err({ CannotVote: "you can only vote once" });
      }

      // get proposal and vote
      let proposalOpts = proposalStorage.get(proposalId);

      if ("None" in proposalOpts) {
        return Err({
          NotFound: `proposal with id ${proposalId} not found`,
        });
      }

      const proposal = proposalOpts.Some;

      if (ic.time() > proposal.ends) {
        return Err({
          CannotVote: `voting for proposal with id ${proposalId} has ended`,
        });
      }

      const votes = proposal.votes + sharesOpt.Some;
      const updatedProposal = {
        ...proposal,
        votes,
      };

      proposalStorage.insert(proposalId, updatedProposal);
      votesMapping.insert(id, true);

      return Ok({ Successful: "voted successfully" });
    }
  ),

  // execute proposal
  executeProposal: update(
    [Types.QueryPayload],
    Result(Types.Message, Types.Message),
    async (payload) => {
      // check payload data
      if (typeof payload !== "object" || Object.keys(payload).length === 0) {
        return Err({ NotFound: "invalid payoad" });
      }

      const caller = ic.caller();
      const proposalId = payload.proposalId;

      // check if user has shares, only dao members can effect change
      if ("None" in sharesStorage.get(caller)) {
        return Err({ NotFound: "you do not have any shares" });
      }

      // check total shares
      if (
        "None" in totalShares ||
        "None" in quorum ||
        "None" in availableFunds ||
        "None" in lockedFunds
      ) {
        return Err({ NotSet: "error in dao configuration" });
      }

      // get proposal and execute
      let proposalOpts = proposalStorage.get(proposalId);

      if ("None" in proposalOpts) {
        return Err({
          NotFound: `proposal with id ${proposalId} not found`,
        });
      }

      const proposal = proposalOpts.Some;

      if (ic.time() < proposal.ends) {
        return Err({ Failed: "cannot execute proposal before end date" });
      }

      if (proposal.ended) {
        Err({ Failed: "cannot execute proposal already ended" });
      }

      // check if votes meet quorum
      let executed = false;

      if ((proposal.votes * 100n) / totalShares.Some >= quorum.Some) {
        const result = await makePayment(proposal.recipient, proposal.amount);
        if ("Err" in result) {
          return result;
        }
        executed = true;
      } else {
        // release funds back to available funds
        availableFunds = Some(availableFunds.Some + proposal.amount);
      }

      // unlock the funds
      lockedFunds = Some(lockedFunds.Some - proposal.amount);

      // update proposal record
      const updatedProposal = {
        ...proposal,
        ended: true,
        executed,
      };

      // store in storage
      proposalStorage.insert(proposalId, updatedProposal);

      if (executed) {
        return Ok({
          Successful: `Proposal with id ${proposalId} executed successfully`,
        });
      } else {
        return Err({
          Failed: `Proposal with id ${proposalId} did not meet quorum`,
        });
      }
    }
  ),

  //////////////////////////////  GETTERS ///////////////////////////////////////

  // return user shares
  getUserShares: query([Types.AddressPayload], nat64, (payload) => {
    // check payload data
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
      return Err({ NotFound: "invalid payoad" });
    }
    // update caller shares record
    const sharesOpt = sharesStorage.get(payload.address);

    if ("None" in sharesOpt) {
      return 0;
    } else {
      return sharesOpt.Some;
    }
  }),

  // returns dao configuration data
  getDaoData: query([], Result(Types.DaoData, Types.Message), () => {
    // check if all dao states have not been set
    if (
      "None" in totalShares ||
      "None" in availableFunds ||
      "None" in lockedFunds ||
      "None" in contributionEnds ||
      "None" in nextProposalId ||
      "None" in quorum ||
      "None" in voteTime
    ) {
      return Err({ NotSet: "error in dao configuration" });
    }

    return Ok({
      totalShares: totalShares.Some,
      availableFunds: availableFunds.Some,
      lockedFunds: lockedFunds.Some,
      contributionEnds: contributionEnds.Some,
      nextProposalId: nextProposalId.Some,
      quorum: quorum.Some,
      voteTime: voteTime.Some,
    });
  }),

  // get proposal
  getProposals: query([], Vec(Types.Proposal), () => {
    return proposalStorage.values();
  }),

  // a helper function to get canister address from the principal
  getCanisterAddress: query([], text, () => {
    let canisterPrincipal = ic.id();
    return hexAddressFromPrincipal(canisterPrincipal, 0);
  }),

  // a helper function to get address from the principal
  getAddressFromPrincipal: query([Principal], text, (principal) => {
    return hexAddressFromPrincipal(principal, 0);
  }),
});

/*
    a hash function that is used to generate correlation ids for orders.
    also, we use that in the verifyPayment function where we check if the used has actually paid the order
*/
function hash(input: any): nat64 {
  return BigInt(Math.abs(hashCode().value(input)));
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

function generateCorrelationId(productId: text): nat64 {
  const correlationId = `${productId}_${ic.caller().toText()}_${ic.time()}`;
  return hash(correlationId);
}

/*
    after the order is created, we give the `delay` amount of minutes to pay for the order.
    if it's not paid during this timeframe, the order is automatically removed from the pending orders.
*/
function discardByTimeout(memo: nat64, delay: Duration) {
  ic.setTimer(delay, () => {
    const order = pendingDeposits.remove(memo);
    console.log(`Order discarded ${order}`);
  });
}

async function verifyPaymentInternal(
  caller: Principal,
  amount: nat64,
  block: nat64,
  memo: nat64
): Promise<bool> {
  const blockData = await ic.call(icpCanister.query_blocks, {
    args: [{ start: block, length: 1n }],
  });
  const tx = blockData.blocks.find((block) => {
    if ("None" in block.transaction.operation) {
      return false;
    }
    const operation = block.transaction.operation.Some;
    const senderAddress = binaryAddressFromPrincipal(caller, 0);
    const receiverAddress = binaryAddressFromPrincipal(ic.id(), 0);
    return (
      block.transaction.memo === memo &&
      hash(senderAddress) === hash(operation.Transfer?.from) &&
      hash(receiverAddress) === hash(operation.Transfer?.to) &&
      amount === operation.Transfer?.amount.e8s
    );
  });
  return tx ? true : false;
}

// make payment from canister to user
async function makePayment(recipient: Principal, amount: nat64) {
  const toAddress = hexAddressFromPrincipal(recipient, 0);
  const transferFeeResponse = await ic.call(icpCanister.transfer_fee, {
    args: [{}],
  });
  const transferResult = ic.call(icpCanister.transfer, {
    args: [
      {
        memo: 0n,
        amount: {
          e8s: amount - transferFeeResponse.transfer_fee.e8s,
        },
        fee: {
          e8s: transferFeeResponse.transfer_fee.e8s,
        },
        from_subaccount: None,
        to: binaryAddressFromAddress(toAddress),
        created_at_time: None,
      },
    ],
  });
  if ("Err" in transferResult) {
    return Err({ PaymentFailed: `payment failed, err=${transferResult.Err}` });
  }
  return Ok({ PaymentCompleted: "payment completed" });
}
