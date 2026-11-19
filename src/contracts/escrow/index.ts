import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAF4G4ACGMDYLPYPPGMVKTL3FTHVTKOR4OTD7YE5CQWCQ5X327E3DOUO",
  }
} as const


/**
 * Global configuration, set once by `initialize`.
 */
export interface Config {
  /**
 * Can change `fee_bps`, `fee_recipient` and `arbiter` for FUTURE agreements.
 */
admin: string;
  /**
 * Resolves disputed milestones.
 */
arbiter: string;
  /**
 * Platform fee in basis points (1 bp = 0.01%). Value is decision D-03.
 */
fee_bps: u32;
  /**
 * Receives the platform fee on every release.
 */
fee_recipient: string;
  /**
 * Stellar Asset Contract address of the stablecoin used for all agreements (USDC).
 */
token: string;
}


export interface Agreement {
  /**
 * Arbiter snapshot taken from Config at creation. Later config changes
 * never swap the arbiter on an existing agreement.
 */
arbiter: string;
  client: string;
  created_at: u64;
  /**
 * Fee snapshot taken from Config at creation. Later fee changes never
 * affect an existing agreement.
 */
fee_bps: u32;
  /**
 * Fee recipient snapshot taken from Config at creation. Later config
 * changes never redirect fees on an existing agreement.
 */
fee_recipient: string;
  freelancer: string;
  id: u64;
  milestones: Array<Milestone>;
  /**
 * Seconds the client has to approve or dispute after a submission.
 * After that, the freelancer can `claim_milestone`. Value is decision D-05.
 */
review_window_secs: u64;
  title: string;
}


export interface Milestone {
  amount: i128;
  /**
 * Reason given by the client in `dispute_milestone`.
 */
dispute_reason: string;
  /**
 * Link or hash of the delivered work, set by `submit_milestone`.
 */
evidence: string;
  /**
 * Freelancer share in basis points (0..=10_000) recorded when an arbiter
 * resolves a dispute; `None` until `MilestoneStatus::Resolved`.
 */
resolved_freelancer_bps: Option<u32>;
  status: MilestoneStatus;
  /**
 * Ledger timestamp (seconds) of the last submission; 0 if never submitted.
 */
submitted_at: u64;
  title: string;
}


/**
 * What the freelancer sends to `create_agreement` for each milestone.
 */
export interface MilestoneInput {
  /**
 * Amount in the token's smallest unit (USDC on Stellar uses 7 decimals).
 */
amount: i128;
  title: string;
}

export type MilestoneStatus = {tag: "Pending", values: void} | {tag: "Funded", values: void} | {tag: "Submitted", values: void} | {tag: "Disputed", values: void} | {tag: "Released", values: void} | {tag: "Resolved", values: void} | {tag: "Refunded", values: void};

export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"AgreementNotFound"},
  4: {message:"MilestoneNotFound"},
  /**
   * The milestone is not in the status this function requires.
   */
  5: {message:"InvalidStatus"},
  /**
   * Amount must be greater than zero.
   */
  6: {message:"InvalidAmount"},
  /**
   * fee_bps or a split share is above 10_000.
   */
  7: {message:"InvalidBps"},
  /**
   * Milestone list is empty or longer than MAX_MILESTONES.
   */
  8: {message:"InvalidMilestoneCount"},
  /**
   * Freelancer and client must be different addresses.
   */
  9: {message:"SameParty"},
  /**
   * `claim_milestone` called before the review window ended.
   */
  10: {message:"ReviewWindowOpen"},
  /**
   * `dispute_milestone` called after the review window ended.
   */
  11: {message:"ReviewWindowClosed"},
  /**
   * `review_window_secs` is outside `[MIN_REVIEW_WINDOW_SECS, MAX_REVIEW_WINDOW_SECS]`.
   */
  12: {message:"InvalidReviewWindow"},
  /**
   * A text field exceeds its maximum allowed length.
   */
  13: {message:"StringTooLong"}
}









export interface Client {
  /**
   * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_config: (options?: MethodOptions) => Promise<AssembledTransaction<Result<Config>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * One-time setup. Requires admin auth. Fails with AlreadyInitialized on a
   * second call and InvalidBps when `fee_bps` is above 10_000.
   */
  initialize: ({admin, arbiter, token, fee_bps, fee_recipient}: {admin: string, arbiter: string, token: string, fee_bps: u32, fee_recipient: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_next_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Next agreement id to be assigned (equals total agreements created so far).
   * Allows clients/indexers to paginate `0..get_next_id()` without stopping on archived gaps.
   */
  get_next_id: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_agreement transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_agreement: ({agreement_id}: {agreement_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Agreement>>>

  /**
   * Construct and simulate a update_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin changes fee, fee recipient and arbiter for FUTURE agreements only.
   * Existing agreements keep their snapshotted fee_bps, fee_recipient and arbiter.
   */
  update_config: ({fee_bps, fee_recipient, arbiter}: {fee_bps: u32, fee_recipient: string, arbiter: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a fund_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Client locks the milestone amount in the contract. Requires client auth.
   * Pending -> Funded. Token moves client -> contract.
   */
  fund_milestone: ({agreement_id, index}: {agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claim_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Freelancer collects after the review window ended with no approval and no
   * dispute. Requires freelancer auth. Submitted -> Released (same payout).
   */
  claim_milestone: ({agreement_id, index}: {agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Arbiter splits a disputed milestone. Requires the agreement's snapshotted
   * arbiter auth. Disputed -> Resolved. `freelancer_bps` of the amount goes to
   * the freelancer side (fee taken from that side only), the rest back to the client.
   */
  resolve_dispute: ({agreement_id, index, freelancer_bps}: {agreement_id: u64, index: u32, freelancer_bps: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_agreement transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Freelancer creates the agreement and its milestones. Requires freelancer
   * auth. All milestones start Pending. Snapshots Config.fee_bps,
   * Config.fee_recipient and Config.arbiter into the agreement and indexes
   * the id under both parties.
   */
  create_agreement: ({freelancer, client, title, milestones, review_window_secs}: {freelancer: string, client: string, title: string, milestones: Array<MilestoneInput>, review_window_secs: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a refund_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Freelancer voluntarily returns the full amount to the client. Requires
   * freelancer auth. Funded or Submitted -> Refunded. No fee.
   */
  refund_milestone: ({agreement_id, index}: {agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a submit_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Freelancer delivers. Requires freelancer auth. Funded -> Submitted.
   */
  submit_milestone: ({agreement_id, index, evidence}: {agreement_id: u64, index: u32, evidence: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a approve_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Client approves a submission. Requires client auth.
   * Submitted -> Released. Pays amount - fee to freelancer, fee to recipient.
   */
  approve_milestone: ({agreement_id, index}: {agreement_id: u64, index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a dispute_milestone transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Client disputes a milestone. Requires client auth.
   * - `Funded -> Disputed`: allowed at any time (protects client if freelancer
   * ghosts or refuses to deliver/refund).
   * - `Submitted -> Disputed`: allowed while inside the review window.
   */
  dispute_milestone: ({agreement_id, index, reason}: {agreement_id: u64, index: u32, reason: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a agreements_of_client transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Ids where `address` is the client. Empty Vec if none.
   */
  agreements_of_client: ({address}: {address: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a agreements_of_freelancer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Ids where `address` is the freelancer. Empty Vec if none.
   */
  agreements_of_freelancer: ({address}: {address: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAPpAAAH0AAAAAZDb25maWcAAAAAAAM=",
        "AAAAAAAAAIJPbmUtdGltZSBzZXR1cC4gUmVxdWlyZXMgYWRtaW4gYXV0aC4gRmFpbHMgd2l0aCBBbHJlYWR5SW5pdGlhbGl6ZWQgb24gYQpzZWNvbmQgY2FsbCBhbmQgSW52YWxpZEJwcyB3aGVuIGBmZWVfYnBzYCBpcyBhYm92ZSAxMF8wMDAuAAAAAAAKaW5pdGlhbGl6ZQAAAAAABQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAdhcmJpdGVyAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAHZmVlX2JwcwAAAAAEAAAAAAAAAA1mZWVfcmVjaXBpZW50AAAAAAAAEwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAKROZXh0IGFncmVlbWVudCBpZCB0byBiZSBhc3NpZ25lZCAoZXF1YWxzIHRvdGFsIGFncmVlbWVudHMgY3JlYXRlZCBzbyBmYXIpLgpBbGxvd3MgY2xpZW50cy9pbmRleGVycyB0byBwYWdpbmF0ZSBgMC4uZ2V0X25leHRfaWQoKWAgd2l0aG91dCBzdG9wcGluZyBvbiBhcmNoaXZlZCBnYXBzLgAAAAtnZXRfbmV4dF9pZAAAAAAAAAAAAQAAAAY=",
        "AAAAAAAAAAAAAAANZ2V0X2FncmVlbWVudAAAAAAAAAEAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAD6QAAB9AAAAAJQWdyZWVtZW50AAAAAAAAAw==",
        "AAAAAAAAAJdBZG1pbiBjaGFuZ2VzIGZlZSwgZmVlIHJlY2lwaWVudCBhbmQgYXJiaXRlciBmb3IgRlVUVVJFIGFncmVlbWVudHMgb25seS4KRXhpc3RpbmcgYWdyZWVtZW50cyBrZWVwIHRoZWlyIHNuYXBzaG90dGVkIGZlZV9icHMsIGZlZV9yZWNpcGllbnQgYW5kIGFyYml0ZXIuAAAAAA11cGRhdGVfY29uZmlnAAAAAAAAAwAAAAAAAAAHZmVlX2JwcwAAAAAEAAAAAAAAAA1mZWVfcmVjaXBpZW50AAAAAAAAEwAAAAAAAAAHYXJiaXRlcgAAAAATAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAHtDbGllbnQgbG9ja3MgdGhlIG1pbGVzdG9uZSBhbW91bnQgaW4gdGhlIGNvbnRyYWN0LiBSZXF1aXJlcyBjbGllbnQgYXV0aC4KUGVuZGluZyAtPiBGdW5kZWQuIFRva2VuIG1vdmVzIGNsaWVudCAtPiBjb250cmFjdC4AAAAADmZ1bmRfbWlsZXN0b25lAAAAAAACAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAJFGcmVlbGFuY2VyIGNvbGxlY3RzIGFmdGVyIHRoZSByZXZpZXcgd2luZG93IGVuZGVkIHdpdGggbm8gYXBwcm92YWwgYW5kIG5vCmRpc3B1dGUuIFJlcXVpcmVzIGZyZWVsYW5jZXIgYXV0aC4gU3VibWl0dGVkIC0+IFJlbGVhc2VkIChzYW1lIHBheW91dCkuAAAAAAAAD2NsYWltX21pbGVzdG9uZQAAAAACAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAOZBcmJpdGVyIHNwbGl0cyBhIGRpc3B1dGVkIG1pbGVzdG9uZS4gUmVxdWlyZXMgdGhlIGFncmVlbWVudCdzIHNuYXBzaG90dGVkCmFyYml0ZXIgYXV0aC4gRGlzcHV0ZWQgLT4gUmVzb2x2ZWQuIGBmcmVlbGFuY2VyX2Jwc2Agb2YgdGhlIGFtb3VudCBnb2VzIHRvCnRoZSBmcmVlbGFuY2VyIHNpZGUgKGZlZSB0YWtlbiBmcm9tIHRoYXQgc2lkZSBvbmx5KSwgdGhlIHJlc3QgYmFjayB0byB0aGUgY2xpZW50LgAAAAAAD3Jlc29sdmVfZGlzcHV0ZQAAAAADAAAAAAAAAAxhZ3JlZW1lbnRfaWQAAAAGAAAAAAAAAAVpbmRleAAAAAAAAAQAAAAAAAAADmZyZWVsYW5jZXJfYnBzAAAAAAAEAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAOhGcmVlbGFuY2VyIGNyZWF0ZXMgdGhlIGFncmVlbWVudCBhbmQgaXRzIG1pbGVzdG9uZXMuIFJlcXVpcmVzIGZyZWVsYW5jZXIKYXV0aC4gQWxsIG1pbGVzdG9uZXMgc3RhcnQgUGVuZGluZy4gU25hcHNob3RzIENvbmZpZy5mZWVfYnBzLApDb25maWcuZmVlX3JlY2lwaWVudCBhbmQgQ29uZmlnLmFyYml0ZXIgaW50byB0aGUgYWdyZWVtZW50IGFuZCBpbmRleGVzCnRoZSBpZCB1bmRlciBib3RoIHBhcnRpZXMuAAAAEGNyZWF0ZV9hZ3JlZW1lbnQAAAAFAAAAAAAAAApmcmVlbGFuY2VyAAAAAAATAAAAAAAAAAZjbGllbnQAAAAAABMAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAAAAAAKbWlsZXN0b25lcwAAAAAD6gAAB9AAAAAOTWlsZXN0b25lSW5wdXQAAAAAAAAAAAAScmV2aWV3X3dpbmRvd19zZWNzAAAAAAAGAAAAAQAAA+kAAAAGAAAAAw==",
        "AAAAAAAAAIBGcmVlbGFuY2VyIHZvbHVudGFyaWx5IHJldHVybnMgdGhlIGZ1bGwgYW1vdW50IHRvIHRoZSBjbGllbnQuIFJlcXVpcmVzCmZyZWVsYW5jZXIgYXV0aC4gRnVuZGVkIG9yIFN1Ym1pdHRlZCAtPiBSZWZ1bmRlZC4gTm8gZmVlLgAAABByZWZ1bmRfbWlsZXN0b25lAAAAAgAAAAAAAAAMYWdyZWVtZW50X2lkAAAABgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAENGcmVlbGFuY2VyIGRlbGl2ZXJzLiBSZXF1aXJlcyBmcmVlbGFuY2VyIGF1dGguIEZ1bmRlZCAtPiBTdWJtaXR0ZWQuAAAAABBzdWJtaXRfbWlsZXN0b25lAAAAAwAAAAAAAAAMYWdyZWVtZW50X2lkAAAABgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAAhldmlkZW5jZQAAABAAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAH1DbGllbnQgYXBwcm92ZXMgYSBzdWJtaXNzaW9uLiBSZXF1aXJlcyBjbGllbnQgYXV0aC4KU3VibWl0dGVkIC0+IFJlbGVhc2VkLiBQYXlzIGFtb3VudCAtIGZlZSB0byBmcmVlbGFuY2VyLCBmZWUgdG8gcmVjaXBpZW50LgAAAAAAABFhcHByb3ZlX21pbGVzdG9uZQAAAAAAAAIAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAAAAAAABWluZGV4AAAAAAAABAAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAOZDbGllbnQgZGlzcHV0ZXMgYSBtaWxlc3RvbmUuIFJlcXVpcmVzIGNsaWVudCBhdXRoLgotIGBGdW5kZWQgLT4gRGlzcHV0ZWRgOiBhbGxvd2VkIGF0IGFueSB0aW1lIChwcm90ZWN0cyBjbGllbnQgaWYgZnJlZWxhbmNlcgpnaG9zdHMgb3IgcmVmdXNlcyB0byBkZWxpdmVyL3JlZnVuZCkuCi0gYFN1Ym1pdHRlZCAtPiBEaXNwdXRlZGA6IGFsbG93ZWQgd2hpbGUgaW5zaWRlIHRoZSByZXZpZXcgd2luZG93LgAAAAAAEWRpc3B1dGVfbWlsZXN0b25lAAAAAAAAAwAAAAAAAAAMYWdyZWVtZW50X2lkAAAABgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAAZyZWFzb24AAAAAABAAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAADVJZHMgd2hlcmUgYGFkZHJlc3NgIGlzIHRoZSBjbGllbnQuIEVtcHR5IFZlYyBpZiBub25lLgAAAAAAABRhZ3JlZW1lbnRzX29mX2NsaWVudAAAAAEAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAEAAAPqAAAABg==",
        "AAAAAAAAADlJZHMgd2hlcmUgYGFkZHJlc3NgIGlzIHRoZSBmcmVlbGFuY2VyLiBFbXB0eSBWZWMgaWYgbm9uZS4AAAAAAAAYYWdyZWVtZW50c19vZl9mcmVlbGFuY2VyAAAAAQAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAQAAA+oAAAAG",
        "AAAAAQAAAC9HbG9iYWwgY29uZmlndXJhdGlvbiwgc2V0IG9uY2UgYnkgYGluaXRpYWxpemVgLgAAAAAAAAAABkNvbmZpZwAAAAAABQAAAEpDYW4gY2hhbmdlIGBmZWVfYnBzYCwgYGZlZV9yZWNpcGllbnRgIGFuZCBgYXJiaXRlcmAgZm9yIEZVVFVSRSBhZ3JlZW1lbnRzLgAAAAAABWFkbWluAAAAAAAAEwAAAB1SZXNvbHZlcyBkaXNwdXRlZCBtaWxlc3RvbmVzLgAAAAAAAAdhcmJpdGVyAAAAABMAAABEUGxhdGZvcm0gZmVlIGluIGJhc2lzIHBvaW50cyAoMSBicCA9IDAuMDElKS4gVmFsdWUgaXMgZGVjaXNpb24gRC0wMy4AAAAHZmVlX2JwcwAAAAAEAAAAK1JlY2VpdmVzIHRoZSBwbGF0Zm9ybSBmZWUgb24gZXZlcnkgcmVsZWFzZS4AAAAADWZlZV9yZWNpcGllbnQAAAAAAAATAAAAUFN0ZWxsYXIgQXNzZXQgQ29udHJhY3QgYWRkcmVzcyBvZiB0aGUgc3RhYmxlY29pbiB1c2VkIGZvciBhbGwgYWdyZWVtZW50cyAoVVNEQykuAAAABXRva2VuAAAAAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAACUFncmVlbWVudAAAAAAAAAoAAAB1QXJiaXRlciBzbmFwc2hvdCB0YWtlbiBmcm9tIENvbmZpZyBhdCBjcmVhdGlvbi4gTGF0ZXIgY29uZmlnIGNoYW5nZXMKbmV2ZXIgc3dhcCB0aGUgYXJiaXRlciBvbiBhbiBleGlzdGluZyBhZ3JlZW1lbnQuAAAAAAAAB2FyYml0ZXIAAAAAEwAAAAAAAAAGY2xpZW50AAAAAAATAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAYUZlZSBzbmFwc2hvdCB0YWtlbiBmcm9tIENvbmZpZyBhdCBjcmVhdGlvbi4gTGF0ZXIgZmVlIGNoYW5nZXMgbmV2ZXIKYWZmZWN0IGFuIGV4aXN0aW5nIGFncmVlbWVudC4AAAAAAAAHZmVlX2JwcwAAAAAEAAAAeEZlZSByZWNpcGllbnQgc25hcHNob3QgdGFrZW4gZnJvbSBDb25maWcgYXQgY3JlYXRpb24uIExhdGVyIGNvbmZpZwpjaGFuZ2VzIG5ldmVyIHJlZGlyZWN0IGZlZXMgb24gYW4gZXhpc3RpbmcgYWdyZWVtZW50LgAAAA1mZWVfcmVjaXBpZW50AAAAAAAAEwAAAAAAAAAKZnJlZWxhbmNlcgAAAAAAEwAAAAAAAAACaWQAAAAAAAYAAAAAAAAACm1pbGVzdG9uZXMAAAAAA+oAAAfQAAAACU1pbGVzdG9uZQAAAAAAAIpTZWNvbmRzIHRoZSBjbGllbnQgaGFzIHRvIGFwcHJvdmUgb3IgZGlzcHV0ZSBhZnRlciBhIHN1Ym1pc3Npb24uCkFmdGVyIHRoYXQsIHRoZSBmcmVlbGFuY2VyIGNhbiBgY2xhaW1fbWlsZXN0b25lYC4gVmFsdWUgaXMgZGVjaXNpb24gRC0wNS4AAAAAABJyZXZpZXdfd2luZG93X3NlY3MAAAAAAAYAAAAAAAAABXRpdGxlAAAAAAAAEA==",
        "AAAAAQAAAAAAAAAAAAAACU1pbGVzdG9uZQAAAAAAAAcAAAAAAAAABmFtb3VudAAAAAAACwAAADJSZWFzb24gZ2l2ZW4gYnkgdGhlIGNsaWVudCBpbiBgZGlzcHV0ZV9taWxlc3RvbmVgLgAAAAAADmRpc3B1dGVfcmVhc29uAAAAAAAQAAAAPkxpbmsgb3IgaGFzaCBvZiB0aGUgZGVsaXZlcmVkIHdvcmssIHNldCBieSBgc3VibWl0X21pbGVzdG9uZWAuAAAAAAAIZXZpZGVuY2UAAAAQAAAAhEZyZWVsYW5jZXIgc2hhcmUgaW4gYmFzaXMgcG9pbnRzICgwLi49MTBfMDAwKSByZWNvcmRlZCB3aGVuIGFuIGFyYml0ZXIKcmVzb2x2ZXMgYSBkaXNwdXRlOyBgTm9uZWAgdW50aWwgYE1pbGVzdG9uZVN0YXR1czo6UmVzb2x2ZWRgLgAAABdyZXNvbHZlZF9mcmVlbGFuY2VyX2JwcwAAAAPoAAAABAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAD01pbGVzdG9uZVN0YXR1cwAAAABITGVkZ2VyIHRpbWVzdGFtcCAoc2Vjb25kcykgb2YgdGhlIGxhc3Qgc3VibWlzc2lvbjsgMCBpZiBuZXZlciBzdWJtaXR0ZWQuAAAADHN1Ym1pdHRlZF9hdAAAAAYAAAAAAAAABXRpdGxlAAAAAAAAEA==",
        "AAAAAQAAAENXaGF0IHRoZSBmcmVlbGFuY2VyIHNlbmRzIHRvIGBjcmVhdGVfYWdyZWVtZW50YCBmb3IgZWFjaCBtaWxlc3RvbmUuAAAAAAAAAAAOTWlsZXN0b25lSW5wdXQAAAAAAAIAAABGQW1vdW50IGluIHRoZSB0b2tlbidzIHNtYWxsZXN0IHVuaXQgKFVTREMgb24gU3RlbGxhciB1c2VzIDcgZGVjaW1hbHMpLgAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAFdGl0bGUAAAAAAAAQ",
        "AAAAAgAAAAAAAAAAAAAAD01pbGVzdG9uZVN0YXR1cwAAAAAHAAAAAAAAAB1DcmVhdGVkLCBubyBtb25leSBsb2NrZWQgeWV0LgAAAAAAAAdQZW5kaW5nAAAAAAAAAAAnQ2xpZW50IGxvY2tlZCBgYW1vdW50YCBpbiB0aGUgY29udHJhY3QuAAAAAAZGdW5kZWQAAAAAAAAAAAAvRnJlZWxhbmNlciBkZWxpdmVyZWQ7IHJldmlldyB3aW5kb3cgaXMgcnVubmluZy4AAAAACVN1Ym1pdHRlZAAAAAAAAAAAAABwQ2xpZW50IG9wZW5lZCBhIGRpc3B1dGUgKGVpdGhlciB3aGlsZSBGdW5kZWQgaWYgZnJlZWxhbmNlciBnaG9zdHMsIG9yCmR1cmluZyB0aGUgcmV2aWV3IHdpbmRvdyBhZnRlciBTdWJtaXR0ZWQpLgAAAAhEaXNwdXRlZAAAAAAAAAAwTW9uZXkgcGFpZCB0byB0aGUgZnJlZWxhbmNlciAobWludXMgZmVlKS4gRmluYWwuAAAACFJlbGVhc2VkAAAAAAAAAB9BcmJpdGVyIHNwbGl0IHRoZSBtb25leS4gRmluYWwuAAAAAAhSZXNvbHZlZAAAAAAAAAA2TW9uZXkgcmV0dXJuZWQgdG8gdGhlIGNsaWVudCBieSB0aGUgZnJlZWxhbmNlci4gRmluYWwuAAAAAAAIUmVmdW5kZWQ=",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAARQWdyZWVtZW50Tm90Rm91bmQAAAAAAAADAAAAAAAAABFNaWxlc3RvbmVOb3RGb3VuZAAAAAAAAAQAAAA6VGhlIG1pbGVzdG9uZSBpcyBub3QgaW4gdGhlIHN0YXR1cyB0aGlzIGZ1bmN0aW9uIHJlcXVpcmVzLgAAAAAADUludmFsaWRTdGF0dXMAAAAAAAAFAAAAIUFtb3VudCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvLgAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAABgAAAClmZWVfYnBzIG9yIGEgc3BsaXQgc2hhcmUgaXMgYWJvdmUgMTBfMDAwLgAAAAAAAApJbnZhbGlkQnBzAAAAAAAHAAAANk1pbGVzdG9uZSBsaXN0IGlzIGVtcHR5IG9yIGxvbmdlciB0aGFuIE1BWF9NSUxFU1RPTkVTLgAAAAAAFUludmFsaWRNaWxlc3RvbmVDb3VudAAAAAAAAAgAAAAyRnJlZWxhbmNlciBhbmQgY2xpZW50IG11c3QgYmUgZGlmZmVyZW50IGFkZHJlc3Nlcy4AAAAAAAlTYW1lUGFydHkAAAAAAAAJAAAAOGBjbGFpbV9taWxlc3RvbmVgIGNhbGxlZCBiZWZvcmUgdGhlIHJldmlldyB3aW5kb3cgZW5kZWQuAAAAEFJldmlld1dpbmRvd09wZW4AAAAKAAAAOWBkaXNwdXRlX21pbGVzdG9uZWAgY2FsbGVkIGFmdGVyIHRoZSByZXZpZXcgd2luZG93IGVuZGVkLgAAAAAAABJSZXZpZXdXaW5kb3dDbG9zZWQAAAAAAAsAAABTYHJldmlld193aW5kb3dfc2Vjc2AgaXMgb3V0c2lkZSBgW01JTl9SRVZJRVdfV0lORE9XX1NFQ1MsIE1BWF9SRVZJRVdfV0lORE9XX1NFQ1NdYC4AAAAAE0ludmFsaWRSZXZpZXdXaW5kb3cAAAAADAAAADBBIHRleHQgZmllbGQgZXhjZWVkcyBpdHMgbWF4aW11bSBhbGxvd2VkIGxlbmd0aC4AAAANU3RyaW5nVG9vTG9uZwAAAAAAAA0=",
        "AAAABQAAAAAAAAAAAAAABkZ1bmRlZAAAAAAAAQAAAAZmdW5kZWQAAAAAAAIAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAB0NsYWltZWQAAAAAAQAAAAdjbGFpbWVkAAAAAAIAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAB0NyZWF0ZWQAAAAAAQAAAAdjcmVhdGVkAAAAAAIAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAAAAAAAA9taWxlc3RvbmVfY291bnQAAAAABAAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAACEFwcHJvdmVkAAAAAQAAAAhhcHByb3ZlZAAAAAIAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAAAg==",
        "AAAABQAAAAAAAAAAAAAACERpc3B1dGVkAAAAAQAAAAhkaXNwdXRlZAAAAAIAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAAAg==",
        "AAAABQAAAAAAAAAAAAAACFJlZnVuZGVkAAAAAQAAAAhyZWZ1bmRlZAAAAAIAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAAAg==",
        "AAAABQAAAAAAAAAAAAAACFJlc29sdmVkAAAAAQAAAAhyZXNvbHZlZAAAAAMAAAAAAAAADGFncmVlbWVudF9pZAAAAAYAAAABAAAAAAAAAAVpbmRleAAAAAAAAAQAAAABAAAAAAAAAA5mcmVlbGFuY2VyX2JwcwAAAAAABAAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAACVN1Ym1pdHRlZAAAAAAAAAEAAAAJc3VibWl0dGVkAAAAAAAAAgAAAAAAAAAMYWdyZWVtZW50X2lkAAAABgAAAAEAAAAAAAAABWluZGV4AAAAAAAABAAAAAEAAAAC" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_config: this.txFromJSON<Result<Config>>,
        initialize: this.txFromJSON<Result<void>>,
        get_next_id: this.txFromJSON<u64>,
        get_agreement: this.txFromJSON<Result<Agreement>>,
        update_config: this.txFromJSON<Result<void>>,
        fund_milestone: this.txFromJSON<Result<void>>,
        claim_milestone: this.txFromJSON<Result<void>>,
        resolve_dispute: this.txFromJSON<Result<void>>,
        create_agreement: this.txFromJSON<Result<u64>>,
        refund_milestone: this.txFromJSON<Result<void>>,
        submit_milestone: this.txFromJSON<Result<void>>,
        approve_milestone: this.txFromJSON<Result<void>>,
        dispute_milestone: this.txFromJSON<Result<void>>,
        agreements_of_client: this.txFromJSON<Array<u64>>,
        agreements_of_freelancer: this.txFromJSON<Array<u64>>
  }
}