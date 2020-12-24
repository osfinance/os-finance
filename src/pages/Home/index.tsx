import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import farmer from '../../assets/img/farmer.png'

import Page from '../../components/Page'
import PageHeader from '../../components/PageHeader'
import HomeProvider from '../../contexts/home'

import HomeCards from './components/HomeCards'

export default function Home() {
  const { path } = useRouteMatch()
  return (
    <Switch>
      <Page>
        <HomeProvider>
          <Route exact path={path}>
            <PageHeader
              icon={<img src={farmer} height="96" />}
              subtitle="Earn YAM tokens by providing liquidity."
              title="Select a farm."
            />
            <HomeCards />
          </Route>
        </HomeProvider>
      </Page>
    </Switch>
  )
}
