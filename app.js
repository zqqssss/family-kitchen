App({
  onLaunch() {
    console.log('=== 应用启动 ===')
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 从本地存储恢复userId
    const userId = wx.getStorageSync('userId')
    if (userId) {
      this.globalData.userId = userId
      console.log('恢复userId:', userId)
    }

    // 登录
    wx.login({
      success: res => {
        console.log('wx.login code:', res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  
  globalData: {
    userInfo: null,
    userId: null  // 添加userId
  }
})
