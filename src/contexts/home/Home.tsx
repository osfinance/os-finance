import React, { useCallback, useEffect, useState } from 'react'

import Context from './context'
import { Home as HOME_DEX } from './types'

const NAME_FOR_DEX: { [key: string]: string } = {
  YAM_DEX: 'Yam Farm',
  UNISWAP_DEX: 'Uniswap'
}

const ICON_FOR_DEX: { [key: string]: string } = {
  YAM_DEX: '👨‍🌾',
  UNISWAP_DEX: '🦄'
}

const HOME_FOR_DEX: { [key: string]: string } = {
  YAM_DEX: '/farms',
  UNISWAP_DEX: '/swap'
}

const SORT_FOR_DEX: { [key: string]: number } = {
  YAM_DEX: 0,
  UNISWAP_DEX: 1
}

const HIGHLIGHT_FOR_DEX: { [key: string]: boolean } = {
  YAM_DEX: false,
  UNISWAP_DEX: true
}

// eslint-disable-next-line react/prop-types
const Home: React.FC = ({ children }) => {
  const [home, setHome] = useState<HOME_DEX[]>([])

  const fetchDexList = useCallback(() => {
    const homeArr: HOME_DEX[] = []
    const dexKeys = Object.keys(NAME_FOR_DEX)

    for (let i = 0; i < dexKeys.length; i++) {
      const dexKey = dexKeys[i]
      const tokenKey = dexKey.replace('_DEX', '').toLowerCase()

      try {
        homeArr.push({
          name: NAME_FOR_DEX[dexKey],
          icon: ICON_FOR_DEX[dexKey],
          home: HOME_FOR_DEX[dexKey],
          id: tokenKey,
          sort: SORT_FOR_DEX[dexKey],
          highlight: HIGHLIGHT_FOR_DEX[dexKey]
        })
      } catch (e) {
        console.log(e)
      }
    }
    homeArr.sort((a, b) => (a.sort < b.sort ? 1 : -1))
    setHome(homeArr)
  }, [setHome])

  useEffect(() => {
    fetchDexList()
  }, [fetchDexList])
  return (
    <Context.Provider
      value={{
        home
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default Home
