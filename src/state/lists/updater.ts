import { getVersionUpgrade, minVersionBump, VersionUpgrade } from '@uniswap/token-lists'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useFetchListCallback } from '../../hooks/useFetchListCallback'
import useInterval from '../../hooks/useInterval'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { addPopup } from '../application/actions'
import { AppDispatch, AppState } from '../index'
import { acceptListUpdate, PathNameType } from './actions'

export default function Updater({ pathName }: { pathName: PathNameType }): null {
  const { library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const lists = useSelector<AppState, AppState['lists']['byOsUrl']>(state => state.lists.byOsUrl)
  const selectedListUrl = useSelector<AppState, AppState['lists']['selectedOsListUrl']>(
    state => state.lists.selectedOsListUrl
  )
  const isWindowVisible = useIsWindowVisible()
  const fetchList = useFetchListCallback(pathName)
  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) return
    Object.keys(lists[pathName]).forEach(url =>
      fetchList(url).catch(error => console.debug('interval list fetching error', error))
    )
  }, [fetchList, isWindowVisible, lists, pathName])
  // fetch all lists every 10 minutes, but only after we initialize library
  useInterval(fetchAllListsCallback, library ? 1000 * 60 * 10 : null)
  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(lists[pathName]).forEach(listUrl => {
      const list = lists[pathName][listUrl]
      if (!list.current && !list.loadingRequestId && !list.error) {
        fetchList(listUrl).catch(error => console.debug('list added fetching error', error))
      }
    })
  }, [dispatch, fetchList, library, lists, pathName])
  // automatically update lists if versions are minor/patch
  useEffect(() => {
    Object.keys(lists[pathName]).forEach(listUrl => {
      const list = lists[pathName][listUrl]
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
              if (listUrl === selectedListUrl?.[pathName]) {
                dispatch(
                  addPopup({
                    key: listUrl,
                    content: {
                      listUpdate: {
                        listUrl,
                        pathName,
                        oldList: list.current,
                        newList: list.pendingUpdate,
                        auto: true
                      }
                    }
                  })
                )
              }
            } else {
              console.error(
                `List at url ${listUrl} could not automatically update because the version bump was only PATCH/MINOR while the update had breaking changes and should have been MAJOR`
              )
            }
            break
          case VersionUpgrade.MAJOR:
            if (listUrl === selectedListUrl?.[pathName]) {
              dispatch(
                addPopup({
                  key: listUrl,
                  content: {
                    listUpdate: {
                      listUrl,
                      pathName,
                      auto: false,
                      oldList: list.current,
                      newList: list.pendingUpdate
                    }
                  },
                  removeAfterMs: null
                })
              )
            }
        }
      }
    })
  }, [dispatch, lists, pathName, selectedListUrl])
  return null
}
