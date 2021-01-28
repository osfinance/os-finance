import QuestionHelper from 'components/QuestionHelper'
import { AutoRow } from 'components/Row'
import React, { useRef } from 'react'
import { Settings } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { useUserTransactionTTL } from '../../state/user/hooks'
import TransactionSettings from '../TransactionSettings/FlashLoanTransactionSettings'

const StyledMenuIcon = styled(Settings)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.text2};
  }

  :hover {
    opacity: 0.7;
  }
`

const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
  }

  svg {
    margin-top: 2px;
  }
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.bg2};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  right: 0rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 18.125rem;
  `};
`

export default function SettingsTab() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()

  const [ttl, setTtl] = useUserTransactionTTL()

  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle} id="open-settings-dialog-button">
        <StyledMenuIcon />
      </StyledMenuButton>
      {open && (
        <MenuFlyout style={{ padding: '1rem' }}>
          <AutoRow gap="md" style={{ paddingBottom: '.5rem' }}>
            <Text fontWeight={600} fontSize={14}>
              Transaction Deadline
            </Text>
            <QuestionHelper text="Your transaction will revert if it is pending for more than this long." />
          </AutoRow>
          <TransactionSettings deadline={ttl} setDeadline={setTtl} />
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
