// the Uniswap Default token list lives here
export const DEFAULT_TOKEN_LIST_URL = {
  uniswap: 'tokens.uniswap.eth',
  sushiswap: 'https://raw.githubusercontent.com/sushiswapclassic/token-list/master/sushiswap.tokenlist.json'
}

// used to mark unsupported tokens, these are hosted lists of unsupported tokens
/**
 * @TODO add list from blockchain association
 */
export const UNSUPPORTED_LIST_URLS: { uniswap: string[]; sushiswap: string[] } = { uniswap: [], sushiswap: [] }

const COMPOUND_LIST = 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json'
const UMA_LIST = 'https://umaproject.org/uma.tokenlist.json'
const AAVE_LIST = 'tokenlist.aave.eth'
const SYNTHETIX_LIST = 'synths.snx.eth'
const WRAPPED_LIST = 'wrapped.tokensoft.eth'
const SET_LIST = 'https://raw.githubusercontent.com/SetProtocol/uniswap-tokenlist/main/set.tokenlist.json'
const OPYN_LIST = 'https://raw.githubusercontent.com/opynfinance/opyn-tokenlist/master/opyn-v1.tokenlist.json'
const ROLL_LIST = 'https://app.tryroll.com/tokens.json'
const COINGECKO_LIST = 'https://tokens.coingecko.com/uniswap/all.json'
const CMC_ALL_LIST = 'defi.cmc.eth'
const CMC_STABLECOIN = 'stablecoin.cmc.eth'
const KLEROS_LIST = 't2crtokens.eth'

// lower index == higher priority for token import
export const DEFAULT_LIST_OF_LISTS = {
  uniswap: [
    COMPOUND_LIST,
    AAVE_LIST,
    SYNTHETIX_LIST,
    UMA_LIST,
    WRAPPED_LIST,
    SET_LIST,
    OPYN_LIST,
    ROLL_LIST,
    COINGECKO_LIST,
    CMC_ALL_LIST,
    CMC_STABLECOIN,
    KLEROS_LIST,
    ...UNSUPPORTED_LIST_URLS['uniswap'] // need to load unsupported tokens as well
  ],
  sushiswap: [
    DEFAULT_TOKEN_LIST_URL['sushiswap'],
    'tokens.1inch.eth', // 1inch
    'https://www.coingecko.com/tokens_list/uniswap/defi_100/v_0_0_0.json',
    'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
    ...UNSUPPORTED_LIST_URLS['sushiswap']
  ]
}

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS = {
  uniswap: [DEFAULT_TOKEN_LIST_URL['uniswap']],
  sushiswap: [DEFAULT_TOKEN_LIST_URL['sushiswap']]
}
