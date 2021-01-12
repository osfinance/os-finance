import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'

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
            <PageHeader icon={'😋'} subtitle="Create Your Favorite Defi Project." title="OS Finance" />
            <HomeCards />
          </Route>
        </HomeProvider>
      </Page>
    </Switch>
  )
}
