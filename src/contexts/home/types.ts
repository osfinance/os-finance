export interface Home {
  name: string
  icon: React.ReactNode
  home: string
  id: string
  sort: number
  highlight: boolean
}

export interface HomeContext {
  home: Home[]
}
