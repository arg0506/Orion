import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Code, Cpu, Database, Activity, RefreshCw, Play, CheckCircle2, 
  AlertTriangle, ExternalLink, Sliders, FileText, Check, Plus, Pause, 
  Trash2, Shield, Lock, Layers, Zap, Info, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Define templates for both Stellar/Soroban (Rust) and Ethereum (Solidity)
interface CodeTemplate {
  name: string;
  language: 'rust' | 'solidity';
  description: string;
  code: string;
}

const templates: CodeTemplate[] = [
  {
    name: 'Soroban: AMM Liquidity Pool',
    language: 'rust',
    description: 'Rust-based Stellar Soroban contract implementing constant-product automated market making formulas, state persistence, and event emission.',
    code: `//! constant-product automated market maker
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Address, Var};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    TokenA,
    TokenB,
    ReserveA,
    ReserveB,
    ShareToken,
}

#[contract]
pub struct LiquidityPoolContract;

#[contractimpl]
impl LiquidityPoolContract {
    pub fn initialize(env: Env, token_a: Address, token_b: Address, share_token: Address) {
        if env.storage().instance().has(&DataKey::TokenA) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::TokenA, &token_a);
        env.storage().instance().set(&DataKey::TokenB, &token_b);
        env.storage().instance().set(&DataKey::ReserveA, &0u128);
        env.storage().instance().set(&DataKey::ReserveB, &0u128);
        env.storage().instance().set(&DataKey::ShareToken, &share_token);
        
        // Emit Initialization Event for indexers
        env.events().publish(
            (symbol_short!("init"), token_a, token_b),
            symbol_short!("success")
        );
    }

    pub fn swap(env: Env, sender: Address, buy_token: Address, amount_in: u128) -> u128 {
        sender.require_auth();
        
        let token_a: Address = env.storage().instance().get(&DataKey::TokenA).unwrap();
        let token_b: Address = env.storage().instance().get(&DataKey::TokenB).unwrap();
        
        let mut r_a: u128 = env.storage().instance().get(&DataKey::ReserveA).unwrap();
        let mut r_b: u128 = env.storage().instance().get(&DataKey::ReserveB).unwrap();
        
        let mut amount_out = 0u128;
        if buy_token == token_b {
            // Constant product formula: k = r_a * r_b
            // amount_out = r_b * amount_in / (r_a + amount_in)
            amount_out = (r_b * amount_in) / (r_a + amount_in);
            r_a += amount_in;
            r_b -= amount_out;
        } else if buy_token == token_a {
            amount_out = (r_a * amount_in) / (r_b + amount_in);
            r_b += amount_in;
            r_a -= amount_out;
        } else {
            panic!("Invalid buy token");
        }
        
        env.storage().instance().set(&DataKey::ReserveA, &r_a);
        env.storage().instance().set(&DataKey::ReserveB, &r_b);
        
        // Emit swap event for event streaming
        env.events().publish(
            (symbol_short!("swap"), sender, buy_token),
            amount_out
        );
        
        amount_out
    }
}`
  },
  {
    name: 'Soroban: Cross-Contract Oracle Client',
    language: 'rust',
    description: 'Soroban contract demonstrating inter-contract communication by making external calls to a price oracle and returning secure feeds.',
    code: `//! Inter-contract communication demo
#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, Symbol, symbol_short};

// Import Interface of external Price Oracle contract
#[contract]
pub struct OracleClient;

#[contractimpl]
impl OracleClient {
    pub fn get_asset_price(env: Env, oracle_id: Address, asset: Symbol) -> u128 {
        // Inter-contract invocation
        // env.invoke_contract acts as the router to execute foreign logic securely
        let price: u128 = env.invoke_contract(
            &oracle_id,
            &Symbol::new(&env, "fetch_price"),
            soroban_sdk::vec![&env, asset.into_val(&env)]
        );
        
        // Emit real-time price fetch event
        env.events().publish(
            (symbol_short!("price"), asset),
            price
        );
        
        price
    }
}`
  },
  {
    name: 'Solidity: Dynamic AMM Swap',
    language: 'solidity',
    description: 'Production-ready Ethereum AMM contract incorporating ERC-20 interactions, constant-product swap checks, and custom events.',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint amount) external returns (bool);
    function transfer(address to, uint amount) external returns (bool);
    function balanceOf(address account) external view returns (uint);
}

contract ConstantProductAMM {
    address public immutable tokenA;
    address public immutable tokenB;
    
    uint public reserveA;
    uint public reserveB;
    
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        uint amountIn,
        uint amountOut,
        uint timestamp
    );
    
    constructor(address _tokenA, address _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }
    
    function swap(address tokenIn, uint amountIn) external returns (uint amountOut) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid input token");
        require(amountIn > 0, "Amount must be positive");
        
        bool isTokenA = tokenIn == tokenA;
        (address tIn, address tOut, uint rIn, uint rOut) = isTokenA
            ? (tokenA, tokenB, reserveA, reserveB)
            : (tokenB, tokenA, reserveB, reserveA);
            
        IERC20(tIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Fee calculation (0.3% pool fee)
        uint amountInWithFee = (amountIn * 997) / 1000;
        amountOut = (rOut * amountInWithFee) / (rIn + amountInWithFee);
        
        if (isTokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
        
        IERC20(tOut).transfer(msg.sender, amountOut);
        
        emit Swap(msg.sender, tokenIn, amountIn, amountOut, block.timestamp);
    }
}`
  },
  {
    name: 'Solidity: Cross-Contract Vault',
    language: 'solidity',
    description: 'Solidity contract utilizing secure inter-contract calls, Custom Modifiers, and Reentrancy Guards to govern multi-token vaults.',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint amount) external returns (bool);
    function transfer(address to, uint amount) external returns (bool);
    function balanceOf(address account) external view returns (uint);
}

contract ReentrancyGuard {
    uint8 private _unlocked = 1;
    modifier nonReentrant() {
        require(_unlocked == 1, "REENTRANCY_GUARD_TRIGGERED");
        _unlocked = 0;
        _;
        _unlocked = 1;
    }
}

contract VaultController is ReentrancyGuard {
    IERC20 public immutable depositToken;
    mapping(address => uint) public balances;
    uint public totalPoolShares;
    
    event Deposit(address indexed user, uint amount, uint sharesEmit);
    event Withdrawal(address indexed user, uint amount, uint sharesBurn);
    
    constructor(address _depositToken) {
        depositToken = _depositToken;
    }
    
    function deposit(uint amount) external nonReentrant returns (uint shares) {
        require(amount > 0, "Cannot deposit 0");
        uint initialBalance = depositToken.balanceOf(address(this));
        
        // Secure Cross-Contract Call to retrieve tokens
        bool success = depositToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");
        
        if (totalPoolShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalPoolShares) / initialBalance;
        }
        
        balances[msg.sender] += shares;
        totalPoolShares += shares;
        
        emit Deposit(msg.sender, amount, shares);
    }
}`
  }
];

interface LogEvent {
  id: string;
  timestamp: string;
  type: 'swap' | 'liquidity' | 'oracle' | 'system';
  message: string;
  badge: string;
}

export default function DeveloperHub() {
  const [activeTab, setActiveTab] = useState<'compile' | 'interconnect' | 'events' | 'pipeline' | 'tests' | 'bestpractices'>('compile');
  
  // Compiler States
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate>(templates[0]);
  const [editorCode, setEditorCode] = useState(templates[0].code);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [compileSuccess, setCompileSuccess] = useState<boolean | null>(null);
  
  // Interconnect Simulation States
  const [interconnectLogs, setInterconnectLogs] = useState<string[]>([]);
  const [isInterconnecting, setIsInterconnecting] = useState(false);
  const [interconnectStep, setInterconnectStep] = useState(0);

  // Live Event Stream States
  const [isStreaming, setIsStreaming] = useState(true);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<'all' | 'swap' | 'liquidity' | 'oracle'>('all');
  const [customEventName, setCustomEventName] = useState('SwapEvent');
  const [customEventArgs, setCustomEventArgs] = useState('swapped 100.00 XLM for 11.20 USDC');
  const streamEndRef = useRef<HTMLDivElement | null>(null);

  // Pipeline states
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [pipelineStepLogs, setPipelineStepLogs] = useState<{[key: string]: string[]}>({
    lint: [],
    test: [],
    build: [],
    deploy: []
  });
  const [activePipelineStep, setActivePipelineStep] = useState<string | null>(null);

  // Testing states
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{passed: number; failed: number; coverage: string} | null>(null);

  // Sync editor when template selection changes
  const handleTemplateChange = (tmpl: CodeTemplate) => {
    setSelectedTemplate(tmpl);
    setEditorCode(tmpl.code);
    setCompileSuccess(null);
    setCompileLogs([]);
  };

  // Compile Contract execution simulation
  const handleCompile = () => {
    setIsCompiling(true);
    setCompileSuccess(null);
    setCompileLogs([]);
    let logs: string[] = [];

    const isRust = selectedTemplate.language === 'rust';
    
    const steps = isRust ? [
      '[cargo-soroban] Initializing cargo Soroban release target compiler...',
      '[cargo-soroban] Parsing Rust structs & cargo attributes...',
      '[cargo-soroban] Running contract-spec-gen macros on LiquidityPoolContract...',
      '[cargo-soroban] Compiling webassembly binary target wasm32-unknown-unknown...',
      '[cargo-soroban] Optimizing WebAssembly bytecode with soroban-optimizer v21.0...',
      '[cargo-soroban] Bytecode compressed from 182KB to 44.5KB successfully.',
      '[cargo-soroban] Generating metadata specification bindings...',
      '[cargo-soroban] Verifying WASM cryptographic footprint...',
      '[cargo-soroban] Compile SUCCESS! Hash: sha256:d849fae21f98bc1982cf031a098c21ea7f12e'
    ] : [
      '[solc] Invoking Solidity compiler v0.8.24+commit.e11b9ed9...',
      '[solc] Resolving external imports and interface references...',
      '[solc] Enabling EVM optimizer with 200 run iterations...',
      '[solc] Compiling contract source AST tree...',
      '[solc] Assembling bytecode and compiling functions into EVM OPCODES...',
      '[solc] Generating Application Binary Interface (ABI) file...',
      '[solc] Complete: 0 warnings, 0 compile errors detected.',
      '[solc] Compile SUCCESS! Bytecode size: 1,482 bytes'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        logs.push(steps[currentStep]);
        setCompileLogs([...logs]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsCompiling(false);
        setCompileSuccess(true);
        toast.success(`${selectedTemplate.name} compiled successfully!`);
      }
    }, 400);
  };

  // Interconnect Call simulation
  const handleSimulateInterconnect = () => {
    setIsInterconnecting(true);
    setInterconnectStep(1);
    setInterconnectLogs([]);
    
    const steps = [
      '⚡ [ROUTER] Initiating transaction request from client router... Calling AMMController.swap()',
      '🔍 [VALIDATION] Verifying cryptographic credentials & user signature approval...',
      '📈 [DEX CONTRACT] Execution begins: AMMController requests current asset price feed.',
      '📡 [CROSS-CONTRACT] AMMController invokes external Price Oracle contract at address GB88...9A',
      '🔮 [ORACLE CONTRACT] Price Oracle accepts query (QueryID: 412). Extracting live feeds for XLM/USD.',
      '💾 [ORACLE CONTRACT] Fetching current consensus state. Rate resolved: 0.1124 USD/XLM.',
      '↩️ [CALLBACK] Price Oracle emits event "OracleResolve" and returns rate u128: 1124 to caller.',
      '🧮 [DEX CONTRACT] Swap controller calculates Constant Product: x * y = k. Amount Out: 8,892 USDC.',
      '🔐 [SECURITY] Invoking Token vault contract: transferring 8,892 USDC to caller...',
      '🎉 [COMPLETED] Cross-contract cascade finished with 0 errors. Total Gas/CPU spent: 12,842 units.'
    ];

    let currentIdx = 0;
    let currentLogs: string[] = [];
    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        currentLogs.push(steps[currentIdx]);
        setInterconnectLogs([...currentLogs]);
        setInterconnectStep(currentIdx + 1);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsInterconnecting(false);
        toast.success('Cross-contract communication simulation completed!');
      }
    }, 700);
  };

  // Event stream generation simulator
  useEffect(() => {
    if (!isStreaming) return;

    const phrases = [
      { type: 'swap', message: 'Trader GB77...2F swapped 1,240.00 XLM for 139.20 USDC', badge: 'SWAP' },
      { type: 'swap', message: 'Trader 0x8a91...f3 swapped 0.25 ETH for 800.00 DAI', badge: 'SWAP' },
      { type: 'liquidity', message: 'Liquidity injection: GDX5...4A added 5,000.00 XLM / 560.00 USDC', badge: 'LIQUIDITY' },
      { type: 'oracle', message: 'Oracle Node GB88...9A emitted price feed update: XLM = 0.1128 USD', badge: 'ORACLE' },
      { type: 'oracle', message: 'Oracle Node 0x39a3...91 updated price feed: ETH = 3,214.50 USD', badge: 'ORACLE' },
      { type: 'system', message: 'Ledger validators achieved consensus for block sequence #48,192,201', badge: 'LEDGER' }
    ];

    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * phrases.length);
      const chosen = phrases[idx];
      const newEv: LogEvent = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: chosen.type as any,
        message: chosen.message,
        badge: chosen.badge
      };

      setEvents(prev => [newEv, ...prev].slice(0, 50));
    }, 2800);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Inject a custom event
  const handleInjectEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEventArgs.trim()) return;

    const newEv: LogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: 'swap',
      message: `[INJECTED] ${customEventName}: ${customEventArgs}`,
      badge: 'CUSTOM'
    };

    setEvents(prev => [newEv, ...prev]);
    toast.success('Custom event injected into stream!');
  };

  // DevOps Pipeline trigger simulator
  const handleTriggerPipeline = () => {
    setPipelineState('running');
    setActivePipelineStep('lint');
    
    // Clear logs
    setPipelineStepLogs({
      lint: [],
      test: [],
      build: [],
      deploy: []
    });

    const steps = [
      {
        key: 'lint',
        logs: [
          '🚀 Starting Code Quality & Static Analysis Runner...',
          '[Linter] Running ESLint on frontend types and layouts...',
          '[Linter] Running cargo clippy on Soroban smart contracts...',
          '✓ [Linter] cargo clippy found 0 warnings, 0 style violations.',
          '✓ [Linter] ESLint validation succeeded with green checkmark.',
          'Static analysis step COMPLETE.'
        ]
      },
      {
        key: 'test',
        logs: [
          '🚀 Executing Comprehensive Test Runner...',
          '[Hardhat-Test] Launching local EVM test node...',
          '[Hardhat-Test] ✓ should authorize cross-contract vault deposits (12ms)',
          '[Cargo-Test] Running cargo test on Soroban targets...',
          '[Cargo-Test] ✓ test_initialize_already_initialized_panics ... ok',
          '[Cargo-Test] ✓ test_amm_constant_product_calculation_valid ... ok',
          '✓ All unit tests passed perfectly! Coverage: 98.4%'
        ]
      },
      {
        key: 'build',
        logs: [
          '🚀 Compiling release-optimized production artifacts...',
          '[Compiler] Optimizing Solidity contract bytecode via Solc optimizer...',
          '[Compiler] Building WASM binary targets with Soroban SDK optimizer...',
          '✓ [Compiler] Solidty compiled bundle: 1,482 bytes.',
          '✓ [Compiler] Rust Soroban optimized target wasm size: 44.5 KB.',
          'Compilation of all smart contracts finished.'
        ]
      },
      {
        key: 'deploy',
        logs: [
          '🚀 Starting automated contract deployment workflow...',
          '[Deployer] Uploading Soroban WASM bytecode to Stellar Testnet...',
          '[Deployer] Invoking install and create_contract transactions...',
          '[Deployer] Soroban Contract ID: CC3A48A9DFBC12A2990B01AC67E12E990',
          '[Deployer] Deploying Solidity ConstantProductAMM to Sepolia Testnet...',
          '[Deployer] Ethereun Contract address: 0x8a9202FfbC12A2990B01aC67E12e9903958bcA1',
          '✓ [Deployer] Verification successful on Stellar Expert & Etherscan.',
          '🎉 Pipeline deployment workflow SUCCESS!'
        ]
      }
    ];

    let currentStepIdx = 0;
    
    const executeStep = () => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setActivePipelineStep(step.key);
        
        let logLineIdx = 0;
        const logLines: string[] = [];
        
        const lineInterval = setInterval(() => {
          if (logLineIdx < step.logs.length) {
            logLines.push(step.logs[logLineIdx]);
            setPipelineStepLogs(prev => ({
              ...prev,
              [step.key]: [...logLines]
            }));
            logLineIdx++;
          } else {
            clearInterval(lineInterval);
            currentStepIdx++;
            setTimeout(executeStep, 600);
          }
        }, 300);
      } else {
        setPipelineState('success');
        setActivePipelineStep(null);
        toast.success('CI/CD Pipeline workflow executed successfully!');
      }
    };

    executeStep();
  };

  // Run Test Suite simulation
  const handleRunTests = () => {
    setIsTesting(true);
    setTestResult(null);
    setTestLogs([]);
    
    const testCases = [
      '⚙️ Initializing testing environment with mock provider integrations...',
      '[Test Node] Mocking Stellar Horizon API / EVM Sepolia Provider...',
      '🏃 Running Soroban AMM unit tests...',
      '  ✓ test_amm_initialize (8ms)',
      '  ✓ test_amm_swap_constant_product_formula (12ms)',
      '  ✓ test_amm_swap_rejection_negative_value (4ms)',
      '  ✓ test_amm_liquidity_provisioning_shares (15ms)',
      '🏃 Running Solidity VaultController unit tests...',
      '  ✓ should deploy token and vault successfully (18ms)',
      '  ✓ should allow user deposits and mint correct shares (11ms)',
      '  ✓ should reject deposits with zero value (4ms)',
      '  ✓ should enforce ReentrancyGuard limits during withdrawal callbacks (25ms)',
      '🏃 Running Frontend interface responsive and event handler tests...',
      '  ✓ should handle Freighter wallet authorization decline (10ms)',
      '  ✓ should format XLM decimal balances correctly (5ms)',
      '  ✓ should handle network node transition flags (8ms)',
      '📊 Generating code coverage metrics...'
    ];

    let currentIdx = 0;
    let currentLogs: string[] = [];
    const interval = setInterval(() => {
      if (currentIdx < testCases.length) {
        currentLogs.push(testCases[currentIdx]);
        setTestLogs([...currentLogs]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsTesting(false);
        setTestResult({
          passed: 12,
          failed: 0,
          coverage: '98.6%'
        });
        toast.success('Smart Contract test suite passed perfectly!');
      }
    }, 250);
  };

  const filteredEvents = events.filter(ev => {
    if (eventFilter === 'all') return true;
    return ev.type === eventFilter;
  });

  return (
    <div className="space-y-8 font-sans text-xs text-zinc-300">
      
      {/* Page Hero with High Contrast Monolithic Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 sm:p-10 rounded-[28px] border border-zinc-800 bg-zinc-950/40 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-32 h-32 rounded-full bg-white/[0.03] blur-2xl pointer-events-none"></div>
        <div className="z-10 font-sans">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">Developer Framework Portal</span>
          <h2 className="font-display font-extrabold text-2xl tracking-tight text-white uppercase">
            Smart Contract Developer Hub
          </h2>
          <p className="text-zinc-400 text-xs mt-2 leading-relaxed max-w-3xl font-sans font-light">
            An advanced terminal playground to design, compile, test, deploy, and stream events for Stellar Soroban (Rust) and Ethereum (Solidity) smart contracts in a responsive, secure environment.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 z-10 font-mono text-[9px] font-bold">
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-zinc-850 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
            CI/CD: <span className="text-white">PASSING</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-zinc-850 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            COMPILERS: <span className="text-white">SOLC / CARGO-SOROBAN</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-zinc-900 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'compile', label: '1. Compilation', icon: Code },
          { id: 'interconnect', label: '2. Inter-Contract Call', icon: Layers },
          { id: 'events', label: '3. Event Stream', icon: Activity },
          { id: 'pipeline', label: '4. CI/CD Pipeline', icon: Sliders },
          { id: 'tests', label: '5. Unit Testing', icon: Terminal },
          { id: 'bestpractices', label: '6. Best Practices', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 font-bold uppercase tracking-widest border-b-2 text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-white text-white bg-white/5'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Viewports */}
      <div className="min-h-[500px]">
        
        {/* COMPRESSION & COMPILATION TAB */}
        {activeTab === 'compile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left side: Code Template & Editor */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 relative overflow-hidden flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Code size={14} />
                      Interactive Source Code Sandbox
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">
                      Select custom templates to check syntax structure
                    </p>
                  </div>
                  <select
                    value={selectedTemplate.name}
                    onChange={(e) => {
                      const matched = templates.find(t => t.name === e.target.value);
                      if (matched) handleTemplateChange(matched);
                    }}
                    className="bg-black border border-white/10 text-[10px] font-bold font-mono px-3 py-2 rounded text-white focus:border-white focus:outline-none cursor-pointer"
                  >
                    {templates.map(t => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded mb-4">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">CONTRACT METRICS</span>
                  <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
                    {selectedTemplate.description}
                  </p>
                </div>

                {/* Simulated Editor */}
                <div className="relative border border-white/10 rounded overflow-hidden">
                  <div className="bg-black/80 px-4 py-2 border-b border-white/5 text-[9px] text-gray-500 uppercase flex justify-between items-center">
                    <span>
                      Language: <strong className="text-white uppercase">{selectedTemplate.language}</strong>
                    </span>
                    <span>READ-WRITE SIMULATED IDE</span>
                  </div>
                  <textarea
                    value={editorCode}
                    onChange={(e) => setEditorCode(e.target.value)}
                    className="w-full h-96 bg-black/40 text-[11px] font-mono p-4 text-gray-300 focus:outline-none leading-relaxed resize-none font-medium text-left"
                    spellCheck="false"
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleCompile}
                    disabled={isCompiling}
                    className="flex-1 py-3.5 bg-white text-black hover:bg-gray-200 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCompiling ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        COMPILING TARGET...
                      </>
                    ) : (
                      <>
                        <Play size={12} />
                        COMPILE CONTRACT
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditorCode(selectedTemplate.code);
                      setCompileSuccess(null);
                      setCompileLogs([]);
                      toast.success('Reset source code to default template.');
                    }}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    RESET
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Compiler Terminal Output */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Compiler Logs */}
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 relative flex flex-col h-112 justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={14} />
                        Compiler Logs
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase">
                        Outputs of the wasm/solc compilation run
                      </p>
                    </div>
                    {compileSuccess && (
                      <span className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-widest">
                        SUCCESS
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[10px] bg-black/60 p-4 rounded border border-white/5 h-64 text-left">
                    {compileLogs.length === 0 ? (
                      <div className="text-gray-600 flex flex-col items-center justify-center h-full space-y-2">
                        <Cpu className="w-8 h-8 animate-pulse text-gray-700" />
                        <span className="uppercase text-[9px] tracking-widest">Compiler idle. Click 'Compile Contract' to test target.</span>
                      </div>
                    ) : (
                      compileLogs.map((log, i) => (
                        <div key={i} className={`py-0.5 leading-relaxed ${
                          log.includes('SUCCESS') ? 'text-white font-bold' :
                          log.includes('error') ? 'text-rose-400' :
                          'text-gray-400'
                        }`}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {compileSuccess && (
                  <div className="p-4 rounded border border-white/10 bg-white/[0.02] space-y-3 font-mono">
                    <span className="text-[9px] text-gray-500 uppercase block font-bold tracking-widest">COMPILER BINARY OUTPUT</span>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="text-gray-500 block uppercase text-[8px] tracking-wider">Artifact Format:</span>
                        <span className="text-white font-bold">{selectedTemplate.language === 'rust' ? 'WASM Binary' : 'ABI JSON'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block uppercase text-[8px] tracking-wider">File Size:</span>
                        <span className="text-white font-bold">{selectedTemplate.language === 'rust' ? '44.5 KB' : '1.4 KB'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.success('Smart Contract artifacts downloaded to workspace!')}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      DOWNLOAD COMPILED SPECS
                    </button>
                  </div>
                )}
              </div>

              {/* Architectural Insight */}
              <div className="p-6 rounded-lg bg-white/[0.02] border border-white/10 font-mono text-left">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Info size={13} className="text-white" />
                  Stellar Soroban vs. EVM Solidity
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Soroban relies on a WebAssembly (WASM) runtime environment executing optimized Rust binaries, guaranteeing low compute footprints and deterministic storage scaling. Solidity contracts run directly on the Ethereum Virtual Machine (EVM) interpreting compiled OPCODES via storage slots. Both use unique gas structures.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* INTER-CONTRACT COMMUNICATION TAB */}
        {activeTab === 'interconnect' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Visualizer and Simulator */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 flex flex-col relative text-left">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} />
                    Inter-Contract Invocation Visualizer
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono mb-6">
                    Analyze recursive cross-contract call flows and callback data passing mechanics
                  </p>
                </div>

                {/* Animated Diagram */}
                <div className="bg-black/60 border border-white/10 rounded p-6 h-64 flex flex-col justify-center relative overflow-hidden">
                  
                  {/* Grid Lines background */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

                  <div className="flex justify-between items-center max-w-lg mx-auto w-full relative z-10">
                    
                    {/* Node 1: Router */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`p-3 rounded border font-bold text-[10px] tracking-wider transition-all uppercase ${
                        interconnectStep === 1 || interconnectStep === 2
                          ? 'bg-white text-black border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'bg-black/40 border-white/10 text-gray-500'
                      }`}>
                        Client App
                      </div>
                      <span className="text-[8px] text-gray-600 font-mono">DEX_ROUTER</span>
                    </div>

                    {/* Connector 1 */}
                    <div className="flex-1 h-0.5 bg-white/10 relative mx-4">
                      {isInterconnecting && (interconnectStep >= 1) && (
                        <div className="absolute top-0 left-0 h-full bg-white animate-pulse-width" style={{
                          animation: 'pulse 1s infinite',
                          width: interconnectStep > 2 ? '100%' : '50%'
                        }}></div>
                      )}
                    </div>

                    {/* Node 2: DEX Contract */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`p-3 rounded border font-bold text-[10px] tracking-wider transition-all uppercase ${
                        interconnectStep === 3 || interconnectStep === 4 || interconnectStep === 8
                          ? 'bg-white text-black border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'bg-black/40 border-white/10 text-gray-500'
                      }`}>
                        DEX Contract
                      </div>
                      <span className="text-[8px] text-gray-600 font-mono">CC_INVOKER</span>
                    </div>

                    {/* Connector 2 */}
                    <div className="flex-1 h-0.5 bg-white/10 relative mx-4">
                      {isInterconnecting && (interconnectStep >= 3) && (
                        <div className="absolute top-0 left-0 h-full bg-white animate-pulse-width" style={{
                          animation: 'pulse 1s infinite',
                          width: interconnectStep > 5 ? '100%' : '50%'
                        }}></div>
                      )}
                    </div>

                    {/* Node 3: Oracle */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`p-3 rounded border font-bold text-[10px] tracking-wider transition-all uppercase ${
                        interconnectStep === 5 || interconnectStep === 6 || interconnectStep === 7
                          ? 'bg-white text-black border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'bg-black/40 border-white/10 text-gray-500'
                      }`}>
                        Price Oracle
                      </div>
                      <span className="text-[8px] text-gray-600 font-mono">CC_RESOLVER</span>
                    </div>

                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-[10px] text-white font-mono uppercase tracking-widest font-bold">
                      {isInterconnecting ? (
                        <span className="animate-pulse flex items-center justify-center gap-2">
                          <Zap size={11} className="text-white" />
                          Cascade Execution in Progress: Step {interconnectStep}/10
                        </span>
                      ) : interconnectStep > 0 ? (
                        'Cascade complete - values resolved via callbacks successfully'
                      ) : (
                        'Simulator idle. Trigger transaction payload to trace inter-contract calls.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSimulateInterconnect}
                    disabled={isInterconnecting}
                    className="flex-1 py-3.5 bg-white text-black hover:bg-gray-200 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isInterconnecting ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        INVOKING FOREIGN CONTRACTS...
                      </>
                    ) : (
                      <>
                        <Zap size={12} />
                        Simulate Cross-Contract Call
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setInterconnectStep(0);
                      setInterconnectLogs([]);
                    }}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    RESET
                  </button>
                </div>
              </div>

              {/* Source Code Snippets explaining Cross-Contract Calls */}
              <div className="p-6 rounded-lg bg-white/[0.02] border border-white/10 text-left space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Code size={13} />
                  Soroban Cross-Contract client binding invocation pattern
                </h4>
                <div className="bg-black/80 rounded p-4 font-mono text-[10px] text-gray-400 overflow-x-auto border border-white/5 leading-relaxed">
                  <pre>{`// Caller Rust Contract
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct CallerContract;

#[contractimpl]
impl CallerContract {
    pub fn fetch_price_and_execute(env: Env, oracle_address: Address) -> u128 {
        // 1. Establish the client instance dynamically
        let oracle_client = PriceOracleClient::new(&env, &oracle_address);
        
        // 2. Perform direct cross-contract invocation (SDK parses spec under-the-hood)
        let rate = oracle_client.fetch_price(&Symbol::new(&env, "XLM"));
        
        rate
    }
}`}</pre>
                </div>
              </div>

            </div>

            {/* Simulated Live Logs terminal */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 flex flex-col h-112 justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
                    <Terminal size={14} />
                    Cascade Call Stack Logs
                  </h4>

                  <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[10px] bg-black/60 p-4 rounded border border-white/5 h-64">
                    {interconnectLogs.length === 0 ? (
                      <div className="text-gray-600 flex flex-col items-center justify-center h-full space-y-2">
                        <Terminal className="w-8 h-8 animate-pulse text-gray-700" />
                        <span className="uppercase text-[9px] tracking-widest text-center">Invoker stack idle. Initiate simulation above.</span>
                      </div>
                    ) : (
                      interconnectLogs.map((log, i) => (
                        <div key={i} className={`py-1.5 leading-relaxed border-b border-white/5 last:border-0 ${
                          log.includes('ROUTER') ? 'text-white' :
                          log.includes('CROSS-CONTRACT') ? 'text-gray-300 font-bold' :
                          log.includes('CALLBACK') ? 'text-emerald-400 font-semibold' :
                          log.includes('COMPLETED') ? 'text-white font-bold underline' :
                          'text-gray-400'
                        }`}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {interconnectStep > 0 && (
                  <div className="p-4 rounded border border-white/10 bg-white/[0.02] space-y-2.5">
                    <span className="text-[9px] text-gray-500 uppercase block font-bold tracking-widest">TRANSACTION METADATA</span>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="text-gray-500 block uppercase text-[8px] tracking-wider">Gas Incurred:</span>
                        <span className="text-white font-bold">12,842 CPU</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block uppercase text-[8px] tracking-wider">Call Depth:</span>
                        <span className="text-white font-bold">3 contracts</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Architectural Warning Card */}
              <div className="p-6 rounded-lg bg-white/[0.02] border border-white/10 flex items-start gap-3">
                <AlertTriangle className="text-white shrink-0 mt-0.5 animate-pulse" size={16} />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Reentrancy Risk Warning</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Always invoke state-writing updates BEFORE making cross-contract transfers. External callbacks to untrusted recipient addresses open contract workflows to malicious reentrant loops, risking vault depletion.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* EVENT STREAMING & REAL-TIME UPDATES */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            
            {/* Live event stream logs */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} className="text-white animate-pulse" />
                      Live Ledger Event Streamer
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">
                      Subscribed to local sandbox nodes. Double click events to copy arguments.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsStreaming(!isStreaming)}
                      className={`p-2 rounded border text-[10px] font-bold transition-all uppercase flex items-center gap-1.5 cursor-pointer ${
                        isStreaming
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white text-black border-white'
                      }`}
                    >
                      {isStreaming ? (
                        <>
                          <Pause size={10} />
                          PAUSE STREAM
                        </>
                      ) : (
                        <>
                          <Play size={10} />
                          RESUME STREAM
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEvents([])}
                      className="p-2 rounded border border-white/10 hover:border-white/20 bg-black/40 text-gray-400 hover:text-white transition-all cursor-pointer"
                      title="Clear Event Stream Log"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Filter Sub-menu */}
                <div className="flex flex-wrap gap-1.5 mb-4 border-b border-white/5 pb-3">
                  {[
                    { id: 'all', label: 'ALL EVENTS' },
                    { id: 'swap', label: 'SWAPS' },
                    { id: 'liquidity', label: 'LIQUIDITY' },
                    { id: 'oracle', label: 'ORACLE UPDATES' }
                  ].map(filt => (
                    <button
                      key={filt.id}
                      onClick={() => setEventFilter(filt.id as any)}
                      className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                        eventFilter === filt.id
                          ? 'bg-white text-black border border-white font-extrabold'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400'
                      }`}
                    >
                      {filt.label}
                    </button>
                  ))}
                </div>

                {/* Event Logs display */}
                <div className="bg-black/80 rounded border border-white/10 h-96 overflow-y-auto p-4 space-y-2 font-mono text-[10px]">
                  <AnimatePresence initial={false}>
                    {filteredEvents.length === 0 ? (
                      <div className="text-gray-600 flex flex-col items-center justify-center h-full space-y-2 uppercase">
                        <Activity className="w-8 h-8 animate-pulse text-gray-700" />
                        <span>No ledger events streamed. Start generator above or emit custom event.</span>
                      </div>
                    ) : (
                      filteredEvents.map((ev) => (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, x: -10, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="py-2.5 px-3 rounded border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex justify-between items-start gap-4 hover:border-white/10"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bold text-[8px]">{ev.timestamp}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold font-mono tracking-widest ${
                                ev.badge === 'SWAP' ? 'bg-white/10 text-white' :
                                ev.badge === 'LIQUIDITY' ? 'bg-white/10 text-white' :
                                ev.badge === 'ORACLE' ? 'bg-white/10 text-white animate-pulse' :
                                ev.badge === 'CUSTOM' ? 'bg-white text-black' :
                                'bg-white/5 text-gray-400'
                              }`}>
                                {ev.badge}
                              </span>
                              <span className="text-[8px] text-gray-600 font-mono">TX_REF: {ev.id}</span>
                            </div>
                            <p className="text-gray-300 select-all font-medium leading-relaxed">
                              {ev.message}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                  <div ref={streamEndRef} />
                </div>
              </div>
            </div>

            {/* Custom event injector form */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
                  <Plus size={14} />
                  Inject Custom Event
                </h4>

                <form onSubmit={handleInjectEvent} className="space-y-4 font-mono text-[10px]">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                      Event Identifier / Name
                    </label>
                    <select
                      value={customEventName}
                      onChange={(e) => setCustomEventName(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white font-mono cursor-pointer"
                    >
                      <option value="SwapEvent">SwapEvent</option>
                      <option value="LiquidityAdded">LiquidityAdded</option>
                      <option value="OracleCallback">OracleCallback</option>
                      <option value="ContractDeployed">ContractDeployed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                      Event Arguments / Payload
                    </label>
                    <textarea
                      required
                      value={customEventArgs}
                      onChange={(e) => setCustomEventArgs(e.target.value)}
                      placeholder="Enter details..."
                      rows={4}
                      className="w-full bg-black border border-white/10 rounded px-3 py-2.5 text-white focus:outline-none focus:border-white font-mono text-[11px] leading-normal resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest transition-all cursor-pointer font-mono"
                  >
                    EMIT SIMULATED EVENT
                  </button>
                </form>
              </div>

              {/* Dev Note */}
              <div className="p-6 rounded-lg bg-white/[0.02] border border-white/10 font-mono">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1 mb-2">
                  <Sparkles size={11} />
                  Event-Driven DApp Architecture
                </h4>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Smart contract event emissions are optimal interfaces for server microservices. Indexers (such as Subgraph/The Graph or Stellar Mercury) capture block event logs asynchronously, indexing relational datasets to populate frontend states in real-time, completely bypassing slow on-chain queries.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* CI/CD DevOps Pipeline TAB */}
        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            
            {/* Left Column: Visual Pipeline Stages */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Sliders size={14} />
                      Automated CI/CD Workflow Runner
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">
                      Simulate a full Github Actions commit push deploy cycle
                    </p>
                  </div>
                  
                  <button
                    onClick={handleTriggerPipeline}
                    disabled={pipelineState === 'running'}
                    className="px-4 py-2.5 bg-white text-black hover:bg-gray-200 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                  >
                    {pipelineState === 'running' ? 'EXECUTING PIPELINE...' : 'TRIGGER DEVOPS PIPELINE'}
                  </button>
                </div>

                {/* Vertical pipeline progress track */}
                <div className="space-y-6">
                  
                  {/* Stage 1: Lint */}
                  <div className="p-4 rounded border border-white/10 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded border font-mono font-bold text-[9px] tracking-widest ${
                        activePipelineStep === 'lint' ? 'bg-white text-black border-white animate-pulse' :
                        pipelineStepLogs.lint.length > 0 ? 'bg-white/10 text-white border-white/20' :
                        'bg-black/40 text-gray-600 border-white/5'
                      }`}>
                        STEP_01
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">Static Analysis & Linter checks</h4>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">ESLint (TypeScript) & Cargo Clippy (Rust)</p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-96 bg-black p-3 rounded font-mono text-[9px] text-gray-400 border border-white/5 max-h-24 overflow-y-auto">
                      {pipelineStepLogs.lint.length === 0 ? (
                        <span className="text-gray-700 uppercase">Awaiting pipeline trigger...</span>
                      ) : (
                        pipelineStepLogs.lint.map((line, idx) => (
                          <div key={idx} className={line.includes('✓') ? 'text-emerald-400' : 'text-gray-400'}>{line}</div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Stage 2: Tests */}
                  <div className="p-4 rounded border border-white/10 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded border font-mono font-bold text-[9px] tracking-widest ${
                        activePipelineStep === 'test' ? 'bg-white text-black border-white animate-pulse' :
                        pipelineStepLogs.test.length > 0 ? 'bg-white/10 text-white border-white/20' :
                        'bg-black/40 text-gray-600 border-white/5'
                      }`}>
                        STEP_02
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">On-Chain Unit Testing</h4>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">Solidity (Hardhat) & Soroban (Cargo Test)</p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-96 bg-black p-3 rounded font-mono text-[9px] text-gray-400 border border-white/5 max-h-24 overflow-y-auto">
                      {pipelineStepLogs.test.length === 0 ? (
                        <span className="text-gray-700 uppercase">Awaiting pipeline trigger...</span>
                      ) : (
                        pipelineStepLogs.test.map((line, idx) => (
                          <div key={idx} className={line.includes('✓') ? 'text-emerald-400' : 'text-gray-400'}>{line}</div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Stage 3: Build */}
                  <div className="p-4 rounded border border-white/10 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded border font-mono font-bold text-[9px] tracking-widest ${
                        activePipelineStep === 'build' ? 'bg-white text-black border-white animate-pulse' :
                        pipelineStepLogs.build.length > 0 ? 'bg-white/10 text-white border-white/20' :
                        'bg-black/40 text-gray-600 border-white/5'
                      }`}>
                        STEP_03
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">Optimized Compile Target</h4>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">Size limits check, optimizer enablement</p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-96 bg-black p-3 rounded font-mono text-[9px] text-gray-400 border border-white/5 max-h-24 overflow-y-auto">
                      {pipelineStepLogs.build.length === 0 ? (
                        <span className="text-gray-700 uppercase">Awaiting pipeline trigger...</span>
                      ) : (
                        pipelineStepLogs.build.map((line, idx) => (
                          <div key={idx} className={line.includes('✓') ? 'text-emerald-400' : 'text-gray-400'}>{line}</div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Stage 4: Deploy */}
                  <div className="p-4 rounded border border-white/10 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded border font-mono font-bold text-[9px] tracking-widest ${
                        activePipelineStep === 'deploy' ? 'bg-white text-black border-white animate-pulse' :
                        pipelineStepLogs.deploy.length > 0 ? 'bg-white/10 text-white border-white/20' :
                        'bg-black/40 text-gray-600 border-white/5'
                      }`}>
                        STEP_04
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">Testnet Deploy & Verify</h4>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">Broadcasting to Sepolia & Stellar Testnet</p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-96 bg-black p-3 rounded font-mono text-[9px] text-gray-400 border border-white/5 max-h-24 overflow-y-auto">
                      {pipelineStepLogs.deploy.length === 0 ? (
                        <span className="text-gray-700 uppercase">Awaiting pipeline trigger...</span>
                      ) : (
                        pipelineStepLogs.deploy.map((line, idx) => (
                          <div key={idx} className={line.includes('✓') ? 'text-emerald-400' : 'text-gray-400'}>{line}</div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Column: DevOps Configurations */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Copy-Paste Pipeline Configuration sample */}
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                    <FileText size={13} />
                    GitHub Actions: Deploy YAML
                  </h4>
                  <p className="text-[9px] text-gray-500 mt-0.5 uppercase">Production-ready template</p>
                </div>

                <div className="bg-black/80 p-3 rounded font-mono text-[9px] text-gray-400 border border-white/5 max-h-64 overflow-y-auto leading-relaxed">
                  <pre>{`name: Smart Contract Deploy
on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node & Rust
      uses: actions/setup-node@v3
    - name: Run Linter
      run: npm run lint
    - name: Run Contract Tests
      run: cargo test && npx hardhat test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Stellar Testnet
      env:
        SOROBAN_SECRET_KEY: \${{ secrets.SOROBAN_SECRET }}
      run: |
        soroban contract deploy \\
          --wasm target/optimized.wasm \\
          --network testnet \\
          --source admin`}</pre>
                </div>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`name: Smart Contract Deploy...`);
                    toast.success('CI/CD YAML configuration copied!');
                  }}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  COPY CONFIG
                </button>
              </div>

            </div>
          </div>
        )}

        {/* UNIT TESTING TAB */}
        {activeTab === 'tests' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            
            {/* Interactive Test Suite execution terminal */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Terminal size={14} />
                      Interactive Unit Test Engine
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono">
                      Run automated mock testing framework for contracts
                    </p>
                  </div>
                  
                  <button
                    onClick={handleRunTests}
                    disabled={isTesting}
                    className="px-4 py-2.5 bg-white text-black hover:bg-gray-200 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        RUNNING TESTS...
                      </>
                    ) : (
                      'EXECUTE TEST SUITE'
                    )}
                  </button>
                </div>

                {/* Simulated terminal */}
                <div className="bg-black/90 p-4 rounded border border-white/10 h-80 overflow-y-auto font-mono text-[10px] leading-relaxed">
                  {testLogs.length === 0 ? (
                    <div className="text-gray-600 flex flex-col items-center justify-center h-full space-y-2 uppercase">
                      <Terminal className="w-8 h-8 animate-pulse text-gray-700" />
                      <span>Test runner idle. Execute test suite above.</span>
                    </div>
                  ) : (
                    testLogs.map((log, i) => (
                      <div key={i} className={`py-0.5 ${
                        log.includes('✓') ? 'text-emerald-400 font-semibold' :
                        log.includes('Failed') ? 'text-rose-400 font-bold' :
                        'text-gray-400'
                      }`}>
                        {log}
                      </div>
                    ))
                  )}
                </div>

                {testResult && (
                  <div className="mt-4 p-4 rounded border border-white/10 bg-white/[0.01] grid grid-cols-3 gap-4 text-center font-mono text-[11px]">
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-widest mb-1">TESTS PASSED</span>
                      <span className="text-white font-extrabold text-sm">{testResult.passed} / {testResult.passed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-widest mb-1">FAILED</span>
                      <span className="text-rose-400 font-extrabold text-sm">{testResult.failed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase tracking-widest mb-1">CODE COVERAGE</span>
                      <span className="text-emerald-400 font-extrabold text-sm">{testResult.coverage}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Test script explainers */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="p-6 rounded-lg bg-white/[0.02] border border-white/10">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 mb-3">
                  <CheckCircle2 size={13} />
                  Writing Robust Tests
                </h4>
                <div className="space-y-3 font-mono text-[10px] text-gray-400 leading-relaxed">
                  <p>
                    Effective smart contract test suites are built around complete state isolation:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li>
                      <strong>Fuzz Testing:</strong> Push extreme bounds, negative integer parameter tests, overflow edge states.
                    </li>
                    <li>
                      <strong>Edge Exception Assertions:</strong> Verify contracts PANIC with predictable, secure exit codes.
                    </li>
                    <li>
                      <strong>Interface Mocking:</strong> Stub external token transfers to inspect reentrancy vulnerabilities.
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PRODUCTION BEST PRACTICES TAB */}
        {activeTab === 'bestpractices' && (
          <div className="space-y-6 text-left">
            
            {/* Grid of best practices cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Security & Guard Checks */}
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white border-b border-white/5 pb-3">
                  <Shield size={14} />
                  <h4 className="font-bold uppercase tracking-widest text-[11px]">Security & Guard checks</h4>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Always use standard multipliers for state validation. Integrate vetted open-source modifiers like OpenZeppelin's ReentrancyGuard, ensure strict access control boundaries with Ownable pattern, and provide emergency circuit breaker pause capabilities.
                </p>
              </div>

              {/* Card 2: Gas & Storage Optimization */}
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white border-b border-white/5 pb-3">
                  <Database size={14} />
                  <h4 className="font-bold uppercase tracking-widest text-[11px]">Gas & Storage Optimization</h4>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  On-chain storage is highly expensive. Pack adjacent storage variables inside Solidity structs (uint128 side-by-side with uint128 fits 1 slot), minimize external contract calls where caching works, and prioritize Soroban's Temporary vs Instance storage models based on TTL requirements.
                </p>
              </div>

              {/* Card 3: Error and Timeout Management */}
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white border-b border-white/5 pb-3">
                  <AlertTriangle size={14} />
                  <h4 className="font-bold uppercase tracking-widest text-[11px]">Error & Timeout States</h4>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Transactions broadcast into high volatility environments. Implement clean fallback state handlers in your frontend, process transaction rejection gracefully, configure customized polling deadlines with custom sequence states, and parse contract revert logs to present readable error strings.
                </p>
              </div>

              {/* Card 4: Mobile Responsive Guidelines */}
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white border-b border-white/5 pb-3">
                  <Sliders size={14} />
                  <h4 className="font-bold uppercase tracking-widest text-[11px]">Mobile Responsive UI</h4>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Ensure seamless cross-device operations. UI targets must exceed 44px to accommodate touch devices comfortably. Employ adaptive layouts wrapping complex balance grids, and optimize layout spacing to preserve high-density data legibility on smaller mobile displays.
                </p>
              </div>

              {/* Card 5: Architecture & Decoupled State */}
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white border-b border-white/5 pb-3">
                  <Layers size={14} />
                  <h4 className="font-bold uppercase tracking-widest text-[11px]">Production Architecture</h4>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Decouple complex state machines from view layouts. Wrap core wallet operations and chain configurations in centralized React Context hooks. Cache transactions locally to prevent sudden UI flickering, and implement retry logic with exponential backoff on server nodes.
                </p>
              </div>

              {/* Card 6: CI/CD Delivery pipelines */}
              <div className="p-6 rounded-lg glass-panel-monochrome border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white border-b border-white/5 pb-3">
                  <Zap size={14} />
                  <h4 className="font-bold uppercase tracking-widest text-[11px]">CI/CD automated flows</h4>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Automate deployment safeguards. Trigger static linter checks and mock test runs on every pull request. Require successful verification on target testnets (Etherscan, Stellar Expert) and compile optimized builds inside container sandboxes prior to release execution.
                </p>
              </div>

            </div>

            {/* Comprehensive Documentation Presentation */}
            <div className="p-6 sm:p-8 rounded-lg bg-white/[0.02] border border-white/10 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <FileText className="text-white" size={18} />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  Comprehensive Project Reference Documentation
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-[11px]">
                <div className="space-y-4">
                  <h5 className="font-bold text-white uppercase tracking-widest">1. Smart Contract Lifecycle</h5>
                  <p className="text-gray-400">
                    Smart contract execution must follow strict linear phases to preserve decentralization guarantees. In Soroban, this requires deploying target WASM bytecodes to register on-chain instance addresses, then invoking initialization methods directly. Developers are encouraged to structure workflows utilizing localized test sandboxes prior to mainnet execution.
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="font-bold text-white uppercase tracking-widest">2. Error Handling & Loading Feedback</h5>
                  <p className="text-gray-400">
                    Broadcasting signed transactions exposes frontend workflows to network latencies. Loading state machines should follow distinct transition stages (e.g., preparing envelope, signing, broadcasting, confirming), reporting granular visual logs to prevent user anxiety. Handlers should intercept contract revert exceptions, mapping low-level exit codes to clean error banners.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
