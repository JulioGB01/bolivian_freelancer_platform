#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::StellarAssetClient,
    token::TokenClient,
    Env,
};

fn setup() -> (Env, FaucetClient<'static>, TokenClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let faucet_id = env.register(Faucet, (sac.address(),));
    StellarAssetClient::new(&env, &sac.address()).mint(&faucet_id, &(DRIP_AMOUNT * 10));
    let faucet = FaucetClient::new(&env, &faucet_id);
    let token = TokenClient::new(&env, &sac.address());
    let user = Address::generate(&env);
    (env, faucet, token, user)
}

#[test]
fn drip_sends_amount() {
    let (_env, faucet, token, user) = setup();
    faucet.drip(&user);
    assert_eq!(token.balance(&user), DRIP_AMOUNT);
}

#[test]
fn second_drip_same_day_fails_then_works_next_day() {
    let (env, faucet, token, user) = setup();
    faucet.drip(&user);
    assert_eq!(faucet.try_drip(&user), Err(Ok(Error::TooSoon)));
    env.ledger().with_mut(|l| l.timestamp += COOLDOWN_SECS);
    faucet.drip(&user);
    assert_eq!(token.balance(&user), DRIP_AMOUNT * 2);
}
