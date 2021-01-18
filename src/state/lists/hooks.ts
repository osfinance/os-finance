import { UNSUPPORTED_LIST_URLS } from './../../constants/lists'
import DEFAULT_TOKEN_LIST from 'constants/tokenLists/uniswap-default.tokenlist.json'
import { ChainId, Token } from '@uniswap/sdk'
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../index'
import sortByListPriority from 'utils/listSort'
import UNSUPPORTED_TOKEN_LIST from '../../constants/tokenLists/uniswap-v2-unsupported.tokenlist.json'
import { PathNameType } from './actions'
import { useLocation } from 'react-router-dom'

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}

/**
 * Token instances created from token info.
 */
export class WrappedTokenInfo extends Token {
  public readonly tokenInfo: TokenInfo
  public readonly tags: TagInfo[]
  constructor(tokenInfo: TokenInfo, tags: TagInfo[]) {
    super(tokenInfo.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)
    this.tokenInfo = tokenInfo
    this.tags = tags
  }
  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI
  }
}

export type TokenAddressMap = Readonly<
  { [chainId in ChainId]: Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList } }> }
>

/**
 * An empty result, useful as a default.
 */
const EMPTY_LIST: TokenAddressMap = {
  [ChainId.KOVAN]: {},
  [ChainId.RINKEBY]: {},
  [ChainId.ROPSTEN]: {},
  [ChainId.GÖRLI]: {},
  [ChainId.MAINNET]: {}
}

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, TokenAddressMap>() : null

export function listToTokenMap(list: TokenList): TokenAddressMap {
  const result = listCache?.get(list)
  if (result) return result

  const map = list.tokens.reduce<TokenAddressMap>(
    (tokenMap, tokenInfo) => {
      const tags: TagInfo[] =
        tokenInfo.tags
          ?.map(tagId => {
            if (!list.tags?.[tagId]) return undefined
            return { ...list.tags[tagId], id: tagId }
          })
          ?.filter((x): x is TagInfo => Boolean(x)) ?? []
      const token = new WrappedTokenInfo(tokenInfo, tags)
      if (tokenMap[token.chainId][token.address] !== undefined) throw Error('Duplicate tokens.')
      return {
        ...tokenMap,
        [token.chainId]: {
          ...tokenMap[token.chainId],
          [token.address]: {
            token,
            list: list
          }
        }
      }
    },
    { ...EMPTY_LIST }
  )
  listCache?.set(list, map)
  return map
}

export function useAllLists(
  pathName: string
): {
  readonly [url: string]: {
    readonly current: TokenList | null
    readonly pendingUpdate: TokenList | null
    readonly loadingRequestId: string | null
    readonly error: string | null
  }
} {
  const lists = useSelector<AppState, AppState['lists']['byOsUrl']>(state => state.lists.byOsUrl)
  return lists[pathName]
}

function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  return {
    1: { ...map1[1], ...map2[1] },
    3: { ...map1[3], ...map2[3] },
    4: { ...map1[4], ...map2[4] },
    5: { ...map1[5], ...map2[5] },
    42: { ...map1[42], ...map2[42] }
  }
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined, pathName: PathNameType): TokenAddressMap {
  const lists = useAllLists(pathName)

  return useMemo(() => {
    if (!urls) return EMPTY_LIST

    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .sort(sortByListPriority(pathName))
        .reduce((allTokens, currentUrl) => {
          const current = lists[currentUrl]?.current
          if (!current) return allTokens
          try {
            const newTokens = Object.assign(listToTokenMap(current))
            return combineMaps(allTokens, newTokens)
          } catch (error) {
            console.error('Could not show token list due to error', error)
            return allTokens
          }
        }, EMPTY_LIST)
    )
  }, [lists, pathName, urls])
}

// filter out unsupported lists
export function useActiveListUrls(pathName: PathNameType): string[] | undefined {
  const activeListUrls = useSelector<AppState, AppState['lists']['activeOsListUrls']>(
    state => state.lists.activeOsListUrls
  )
  return activeListUrls?.[pathName]?.filter(url => !UNSUPPORTED_LIST_URLS[pathName].includes(url))
}

export function useInactiveListUrls(pathName: PathNameType): string[] {
  const lists = useAllLists(pathName)
  const allActiveListUrls = useActiveListUrls(pathName)
  return Object.keys(lists).filter(
    url => !allActiveListUrls?.includes(url) && !UNSUPPORTED_LIST_URLS[pathName].includes(url)
  )
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(pathName: PathNameType): TokenAddressMap {
  const activeListUrls = useActiveListUrls(pathName)
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls, pathName)
  const defaultTokenMap = listToTokenMap(DEFAULT_TOKEN_LIST)
  return combineMaps(activeTokens, defaultTokenMap)
}

// all tokens from inactive lists
export function useCombinedInactiveList(pathName: PathNameType): TokenAddressMap {
  const allInactiveListUrls: string[] = useInactiveListUrls(pathName)
  return useCombinedTokenMapFromUrls(allInactiveListUrls, pathName)
}

// used to hide warnings on import for default tokens
export function useDefaultTokenList(): TokenAddressMap {
  return listToTokenMap(DEFAULT_TOKEN_LIST)
}

// list of tokens not supported on interface, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(pathName: PathNameType): TokenAddressMap {
  // get hard coded unsupported tokens
  const localUnsupportedListMap = listToTokenMap(UNSUPPORTED_TOKEN_LIST)

  // get any loaded unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS[pathName], pathName)

  // format into one token address map
  return combineMaps(localUnsupportedListMap, loadedUnsupportedListMap)
}

export function useIsListActive(url: string, pathName: PathNameType): boolean {
  const activeListUrls = useActiveListUrls(pathName)
  return Boolean(activeListUrls?.includes(url))
}

export function usePathName() {
  const location = useLocation()
  const router = location.pathname.split('/')[1]
  const pathName = router === 'uniswap' || router === 'sushiswap' ? router : 'uniswap'
  return pathName
}
