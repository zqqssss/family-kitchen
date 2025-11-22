// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    defaultAvatarUrl: defaultAvatarUrl
    // motto 已删除，不需要了
  },

  // 1. 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      "userInfo.avatarUrl": avatarUrl
    })
    console.log("头像已选择:", avatarUrl)
  },

  // 2. 输入昵称
  onInputChange(e) {
    const nickName = e.detail.value
    this.setData({
      "userInfo.nickName": nickName
    })
    console.log("昵称已输入:", nickName)
  },

  // 3. 点击登录按钮 (这是你原本想替换 hello world 的功能)
  handleLogin() {
    const { avatarUrl, nickName } = this.data.userInfo

    // 简单校验
    if (!nickName) {
      wx.showToast({
        title: '请填写您的昵称~',
        icon: 'none'
      })
      return
    }

    // 这里调用我们在上一轮对话中写的 "登录逻辑"
    // 比如：调用 uploadAvatar 上传头像，然后调用后端 /auth/login
    console.log('准备登录...', this.data.userInfo)
    
    wx.showLoading({ title: '进入厨房中...' })
    
    
    setTimeout(() => {
      wx.hideLoading()
      // 保存用户信息到本地缓存，供菜单页使用
      wx.setStorageSync('userInfo', this.data.userInfo)
      
      wx.switchTab({
        url: '/pages/menu/menu',
        success: () => {
          wx.showToast({ title: '欢迎回家吃飯', icon: 'success' })
        },
        fail: () => {
          // 如果 menu 不是 tabBar 页面，会失败，此时尝试 navigateTo
          wx.navigateTo({ url: '/pages/menu/menu' })
        }
      })
    }, 1000)
  }
})
