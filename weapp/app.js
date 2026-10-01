import { getMembers, getCurrentUser } from './utils/members.js'

App({
  globalData: {
    currentUser: getCurrentUser(),
    members: getMembers(),
  },

  onLaunch() {
    this.refreshMembers()
    this.globalData.currentUser = getCurrentUser()
  },

  onShow() {
    this.refreshMembers()
  },

  refreshMembers() {
    this.globalData.members = getMembers()
  },
})
