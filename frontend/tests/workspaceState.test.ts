import assert from 'node:assert/strict'
import test from 'node:test'

import { buildWorkspaceUrl, parseWorkspaceState } from '../src/workspaceState.ts'


test('workspace state accepts only known tabs and positive repository ids', () => {
  assert.deepEqual(parseWorkspaceState('?tab=webhooks&repo=42'), { tab: 'webhooks', repositoryId: 42 })
  assert.deepEqual(parseWorkspaceState('?tab=unknown&repo=-1'), { tab: 'overview', repositoryId: null })
})


test('workspace url persists the selected tab and repository', () => {
  assert.equal(buildWorkspaceUrl('analytics', 7), '/app?tab=analytics&repo=7')
  assert.equal(buildWorkspaceUrl('overview'), '/app?tab=overview')
})
