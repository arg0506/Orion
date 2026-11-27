"""
End-to-end test: loads the built Orion extension in Chrome, onboards through the real UI,
and drives a test dapp through EVM, Solana and Stellar requests.

Needs: `npm run build`, a local EVM node on :8545 (`npx hardhat node` or `anvil`),
the test dapp served on :5173 (`python3 -m http.server 5173 -d e2e/dapp`),
Python Playwright, and a Chrome build that allows --load-extension (Chrome for Testing / Chromium).
Run: CHROME=/path/to/chrome python3 e2e/e2e.py
"""
import json, os, shutil, sys, time, urllib.request
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
EXT = os.path.join(HERE, '..', '.output', 'chrome-mv3')
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
PROFILE = os.path.join(HERE, '.profile')
SHOTS = os.path.join(HERE, 'shots')
MNEMONIC = 'test test test test test test test test test test test junk'
shutil.rmtree(PROFILE, ignore_errors=True); os.makedirs(SHOTS, exist_ok=True)
results = {}

def hh(method, params=[]):
    req = urllib.request.Request('http://127.0.0.1:8545', data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}).encode(), headers={'content-type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read())['result']

def check(name, cond, detail=''):
    results[name] = bool(cond)
    print(('PASS ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail else ''))

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(PROFILE, executable_path=CHROME, headless=True,
        args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--no-sandbox'], viewport={'width': 380, 'height': 600})
    sw = ctx.service_workers[0] if ctx.service_workers else ctx.wait_for_event('serviceworker', timeout=15000)
    ext_id = sw.url.split('/')[2]
    check('extension loaded', ext_id, ext_id)
    errors = []
    sw.on('console', lambda m: m.type == 'error' and errors.append(m.text))

    # ── Onboarding through the real UI ──
    popup = ctx.new_page(); popup.set_viewport_size({'width': 380, 'height': 600})
    popup.on('pageerror', lambda e: print('POPUP ERROR:', e))
    popup.on('console', lambda m: m.type == 'error' and print('POPUP CONSOLE:', m.text[:300]))
    popup.goto(f'chrome-extension://{ext_id}/popup.html'); popup.wait_for_timeout(1800)
    popup.screenshot(path=f'{SHOTS}/01-welcome.png')
    popup.get_by_text('I already have a recovery phrase').click(); popup.wait_for_timeout(500)
    popup.fill('textarea', MNEMONIC); popup.wait_for_timeout(300)
    popup.get_by_role('button', name='Continue').click(); popup.wait_for_timeout(500)
    pw = popup.locator('input[type=password]')
    pw.nth(0).fill('orion-dev-1'); pw.nth(1).fill('orion-dev-1')
    popup.get_by_role('button', name='Import wallet').click(); popup.wait_for_timeout(2500)
    popup.screenshot(path=f'{SHOTS}/02-home-evm.png')
    check('onboarding imports phrase and shows home', popup.get_by_text('Activity').count() > 0)

    # Switch EVM network to the local Hardhat node through the UI
    popup.get_by_role('button', name='Sepolia').first.click(); popup.wait_for_timeout(600)
    popup.screenshot(path=f'{SHOTS}/03-networks.png')
    popup.get_by_text('Local (Anvil / Hardhat)').click(); popup.wait_for_timeout(1800)
    bal = popup.locator('p.font-serif').first.inner_text()
    check('local EVM balance shows', '10,000' in bal or '9,99' in bal, bal.replace('\n', ' '))
    popup.screenshot(path=f'{SHOTS}/04-home-local.png')

    # ── Dapp: discovery ──
    dapp = ctx.new_page(); dapp.set_viewport_size({'width': 1000, 'height': 700})
    dapp.goto('http://127.0.0.1:5173/'); dapp.wait_for_timeout(800)
    info = dapp.evaluate("() => ({ eip6963: window.eip6963.map(d => d.info.name + '|' + d.info.rdns), standard: window.standardWallets.map(w => w.name + '|' + Object.keys(w.features).join(',')), stellar: !!window.orion?.stellar, ethereum: !!window.ethereum?.isOrion })")
    check('EIP-6963 announces Orion', any('Orion|app.orion.wallet' in x for x in info['eip6963']), info['eip6963'])
    check('Solana Wallet Standard registers Orion', any(x.startswith('Orion|') and 'solana:signAndSendTransaction' in x for x in info['standard']))
    check('Stellar provider at window.orion.stellar', info['stellar'])

    def approve(action, button):
        """Run a dapp call that opens the approval window, click `button`, return the dapp's result."""
        with ctx.expect_page(timeout=15000) as pinfo:
            handle = dapp.evaluate_handle(f"() => {{ window.__r = undefined; window.__e = undefined; ({action})().then(r => window.__r = r, e => window.__e = {{code: e.code, message: e.message}}); return 1 }}")
        ap = pinfo.value; ap.wait_for_load_state(); ap.wait_for_timeout(1200)
        shot = f"{SHOTS}/ap-{button.lower()}-{int(time.time()*1000)%100000}.png"; ap.set_viewport_size({'width': 400, 'height': 660}); ap.screenshot(path=shot)
        try:
            ap.get_by_role('button', name=button, exact=True).click(no_wait_after=True)
        except Exception as ex:
            if 'closed' not in str(ex): raise  # the approval window closes itself on success
        dapp.wait_for_function('() => window.__r !== undefined || window.__e !== undefined', timeout=20000)
        return dapp.evaluate('() => window.__r ?? window.__e'), shot

    # ── EVM ──
    r = dapp.evaluate("() => window.orionEvm().request({ method: 'eth_chainId' })")
    check('eth_chainId follows the active network', r == '0x7a69', r)
    r, _ = approve("() => window.orionEvm().request({ method: 'eth_requestAccounts' })", 'Connect')
    check('eth_requestAccounts via approval', r == ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'], r)
    r, _ = approve("() => window.orionEvm().request({ method: 'personal_sign', params: ['0x48656c6c6f206f72696f6e', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'] })", 'Sign')
    check('personal_sign returns a 65-byte signature', isinstance(r, str) and len(r) == 132, str(r)[:20])
    rej, _ = approve("() => window.orionEvm().request({ method: 'personal_sign', params: ['0x6869', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'] })", 'Reject')
    check('rejecting returns EIP-1193 code 4001', rej.get('code') == 4001, rej)
    before = int(hh('eth_getBalance', ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'latest']), 16)
    r, shot_tx = approve("() => window.orionEvm().request({ method: 'eth_sendTransaction', params: [{ from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', value: '0xde0b6b3a7640000' }] })", 'Send')
    rec = hh('eth_getTransactionReceipt', [r]) if isinstance(r, str) else None
    after = int(hh('eth_getBalance', ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'latest']), 16)
    check('eth_sendTransaction lands on chain', rec and rec['status'] == '0x1' and after - before == 10**18, r)

    # ── Cancel a pending dapp transaction from the popup ──
    hh('evm_setAutomine', [False])
    r, _ = approve("() => window.orionEvm().request({ method: 'eth_sendTransaction', params: [{ to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', value: '0x29a2241af62c0000' }] })", 'Send')
    pending_hash = r
    popup.bring_to_front(); popup.reload(); popup.wait_for_timeout(2500)
    popup.screenshot(path=f'{SHOTS}/05-pending.png')
    popup.get_by_role('button', name='Cancel').first.click(); popup.wait_for_timeout(1500)
    popup.screenshot(path=f'{SHOTS}/06-cancelling.png')
    bal_before_mine = int(hh('eth_getBalance', ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'latest']), 16)
    hh('evm_mine'); popup.wait_for_timeout(5000)
    bal_after_mine = int(hh('eth_getBalance', ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'latest']), 16)
    orig_receipt = hh('eth_getTransactionReceipt', [pending_hash])
    check('cancel from the popup stops the 3 ETH payment', orig_receipt is None and bal_after_mine == bal_before_mine)
    popup.screenshot(path=f'{SHOTS}/07-cancelled.png')
    txt = popup.inner_text('body')
    check('activity shows Replaced + Confirmed cancellation', 'Replaced' in txt and 'Cancellation' in txt)
    hh('evm_setAutomine', [True])

    # ── Solana (wallet standard) ──
    r, _ = approve("() => window.orionSol().features['standard:connect'].connect().then(x => x.accounts.map(a => a.address))", 'Connect')
    check('Solana standard:connect', r == ['oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96'], r)
    r, _ = approve("() => window.orionSol().features['solana:signMessage'].signMessage({ account: window.orionSol().accounts[0], message: new TextEncoder().encode('gm from the test dapp') }).then(o => o[0].signature.length)", 'Sign')
    check('Solana signMessage returns 64-byte signature', r == 64, r)

    # ── Stellar ──
    r, _ = approve("() => window.orion.stellar.getAddress()", 'Connect')
    check('Stellar getAddress via approval', isinstance(r, dict) and str(r.get('address', '')).startswith('G'), r)
    r = dapp.evaluate("() => window.orion.stellar.getNetwork()")
    check('Stellar getNetwork', r.get('networkPassphrase') == 'Test SDF Network ; September 2015', r)
    r, _ = approve("() => window.orion.stellar.signMessage('hello orion')", 'Sign')
    check('Stellar signMessage (SEP-53)', isinstance(r, dict) and len(r.get('signedMessage', '')) > 40)

    # ── Popup screens ──
    popup.bring_to_front()
    for tab, name in [('Sites', '08-sites'), ('Log', '09-log'), ('Settings', '10-settings')]:
        popup.get_by_role('button', name=tab, exact=True).click(); popup.wait_for_timeout(900)
        popup.screenshot(path=f'{SHOTS}/{name}.png')
    popup.get_by_role('button', name='Wallet', exact=True).click(); popup.wait_for_timeout(600)
    popup.get_by_role('button', name='Solana').click(); popup.wait_for_timeout(1500)
    popup.screenshot(path=f'{SHOTS}/11-solana.png')
    popup.get_by_role('button', name='Stellar').click(); popup.wait_for_timeout(1500)
    popup.screenshot(path=f'{SHOTS}/12-stellar.png')
    popup.get_by_role('button', name='Ethereum', exact=False).first.click() if popup.get_by_role('button', name='EVM').count() == 0 else popup.get_by_role('button', name='EVM').click()
    popup.wait_for_timeout(800)
    popup.get_by_role('button', name='Send', exact=True).first.click(); popup.wait_for_timeout(800)
    popup.screenshot(path=f'{SHOTS}/13-send.png')

    print('errors:', errors[:5])
    ctx.close()

print(f"\n{sum(results.values())}/{len(results)} checks passed")
sys.exit(0 if all(results.values()) else 1)
