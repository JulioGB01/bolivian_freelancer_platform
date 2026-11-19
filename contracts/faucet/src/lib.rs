//! Test-USDC faucet (TESTNET ONLY).
//!
//! Holds a stock of the test USDC token and gives 1,000 of it to any account that asks,
//! at most once every 24 hours per account. The caller signs with their own wallet, so the
//! web app needs no server-side secret key.
#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

/// 1,000 USDC with 7 decimals.
pub const DRIP_AMOUNT: i128 = 10_000_000_000;
/// Minimum time between two drips to the same account.
pub const COOLDOWN_SECS: u64 = 86_400;
/// ~30 days of ledgers at ~5s/ledger (re-extend below ~10 days).
const INSTANCE_TTL_THRESHOLD: u32 = 172_800;
const INSTANCE_TTL_EXTEND_TO: u32 = 518_400;
/// ~24 hours of ledgers at ~5s/ledger for per-address cooldown entries.
const COOLDOWN_TTL_LEDGERS: u32 = 17_280;

#[contracttype]
enum DataKey {
    Token,
    LastDrip(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    TooSoon = 1,
}

#[contract]
pub struct Faucet;

#[contractimpl]
impl Faucet {
    pub fn __constructor(env: Env, token: Address) {
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
    }

    /// Sends DRIP_AMOUNT of the token to `to`. Requires `to` to sign.
    pub fn drip(env: Env, to: Address) -> Result<(), Error> {
        to.require_auth();
        let now = env.ledger().timestamp();
        let key = DataKey::LastDrip(to.clone());
        if let Some(last) = env.storage().temporary().get::<_, u64>(&key) {
            if now < last.saturating_add(COOLDOWN_SECS) {
                return Err(Error::TooSoon);
            }
        }
        env.storage().temporary().set(&key, &now);
        env.storage()
            .temporary()
            .extend_ttl(&key, COOLDOWN_TTL_LEDGERS, COOLDOWN_TTL_LEDGERS);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &to,
            &DRIP_AMOUNT,
        );
        Ok(())
    }

    pub fn token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }
}

#[cfg(test)]
mod test;
