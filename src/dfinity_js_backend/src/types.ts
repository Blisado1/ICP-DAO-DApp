import {
  nat64,
  Record,
  int32,
  text,
  bool,
  Principal,
  Variant,
  Opt,
} from "azle";

export const Proposal = Record({
  id: int32,
  title: text,
  amount: nat64,
  recipient: Principal,
  votes: nat64,
  ends: nat64,
  executed: bool,
  ended: bool,
});

export const DaoData = Record({
  totalShares: nat64,
  availableFunds: nat64,
  lockedFunds: nat64,
  contributionEnds: nat64,
  nextProposalId: int32,
  quorum: nat64,
  voteTime: nat64,
});

export const InitPayload = Record({
  contributionTime: nat64,
  voteTime: nat64,
  quorum: nat64,
});

export const ProposalPayload = Record({
  title: text,
  amount: nat64,
  recipient: Principal,
});

export const AddressPayload = Record({
  address: Principal,
});

export const JoinPayload = Record({
  amount: nat64,
});

export const RedeemPayload = Record({
  amount: nat64,
});

export const TransferPayload = Record({
  amount: nat64,
  to: Principal,
});

export const QueryPayload = Record({
  proposalId: int32,
});

export const DepositStatus = Variant({
  PaymentPending: text,
  Completed: text,
});

export const DepositOrder = Record({
  id: text,
  amount: nat64,
  status: DepositStatus,
  depositer: Principal,
  paid_at_block: Opt(nat64),
  memo: nat64,
});

export const Message = Variant({
  CannotVote: text,
  NotEnough: text,
  NotFound: text,
  NotSet: text,
  InvalidPayload: text,
  PaymentFailed: text,
  PaymentCompleted: text,
  Successful: text,
  Failed: text,
});
