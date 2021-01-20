import { useAllLists } from 'state/lists/hooks'
import { UNSUPPORTED_LIST_URLS } from './../../constants/lists'
import { getVersionUpgrade, minVersionBump, VersionUpgrade } from '@uniswap/token-lists'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useFetchListCallback } from '../../hooks/useFetchListCallback'
import useInterval from '../../hooks/useInterval'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { AppDispatch } from '../index'
import { acceptListUpdate, PathNameType } from './actions'
import { useActiveListUrls } from './hooks'
import { useAllInactiveTokens } from 'hooks/Tokens'

export default function Updater({ pathName }: { pathName: PathNameType }): null {
  const { library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const isWindowVisible = useIsWindowVisible()

  // get all loaded lists, and the active urls
  const lists = useAllLists(pathName)
  const activeListUrls = useActiveListUrls(pathName)

  // initiate loading
  useAllInactiveTokens(pathName)

  const fetchList = useFetchListCallback(pathName)
  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) return
    Object.keys(lists).forEach(url =>
      fetchList(url).catch(error => console.debug('interval list fetching error', error))
    )
  }, [fetchList, isWindowVisible, lists])

  // fetch all lists every 10 minutes, but only after we initialize library
  useInterval(fetchAllListsCallback, library ? 1000 * 60 * 10 : null)

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(lists).forEach(listUrl => {
      const list = lists[listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl).catch(error => console.debug('list added fetching error', error))
      }
    })
  }, [dispatch, fetchList, library, lists])

  // automatically update lists if versions are minor/patch
  useEffect(() => {
    Object.keys(lists).forEach(listUrl => {
      const list = lists[listUrl]
      if (list.current && list.pendingUpdate) {
        const bump = getVersionUpgrade(list.current.version, list.pendingUpdate.version)
        switch (bump) {
          case VersionUpgrade.NONE:
            throw new Error('unexpected no version bump')
          case VersionUpgrade.PATCH:
          case VersionUpgrade.MINOR:
            const min = minVersionBump(list.current.tokens, list.pendingUpdate.tokens)
            // automatically update minor/patch as long as bump matches the min update
            if (bump >= min) {
              dispatch(acceptListUpdate({ url: listUrl, pathName }))
            } else {
              console.error(
                `List at url ${listUrl} could not automatically update because the version bump was only PATCH/MINOR while the update had breaking changes and should have been MAJOR`
              )
            }
            break

          case VersionUpgrade.MAJOR:
            // accept update if list is active or list in background
            if (activeListUrls?.includes(listUrl) || UNSUPPORTED_LIST_URLS[pathName].includes(listUrl)) {
              dispatch(acceptListUpdate({ url: listUrl, pathName }))
            }
        }
      }
    })
  }, [dispatch, lists, activeListUrls, pathName])

  return null
}
