// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

// 后端服务器地址(开发环境需要在微信公众平台配置服务器域名)
const API_BASE_URL = 'http://localhost:8080/api'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    defaultAvatarUrl: defaultAvatarUrl

  
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

   /**
   * 3. 点击登录按钮 - 完整登录流程
   */
  handleLogin() {
    const { avatarUrl, nickName } = this.data.userInfo

    // 校验昵称
    if (!nickName || nickName.trim() === '') {
      wx.showToast({
        title: '请填写您的昵称~',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 显示加载提示
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    // 开始登录流程
    this.doLogin()
  },

  /**
   * 执行登录流程
   * 步骤:
   * 1. 调用wx.login()获取code
   * 2. 将code和用户信息发送到后端
   * 3. 后端验证code并返回用户信息
   * 4. 如果用户选择了新头像,上传头像到服务器
   * 5. 保存用户信息到本地缓存
   * 6. 跳转到主页
   */
  doLogin() {
    const that = this

    // 第1步: 调用微信登录获取code
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('获取到登录code:', loginRes.code)
          
          // 第2步: 调用后端登录接口
          wx.request({
            url: `${API_BASE_URL}/user/login`,
            method: 'POST',
            header: {
              'content-type': 'application/json'
            },
            data: {
              code: loginRes.code,
              nickname: that.data.userInfo.nickName,
              avatarUrl: that.data.userInfo.avatarUrl
            },
            success: (res) => {
              console.log('登录接口返回:', res.data)
              
              if (res.data.code === 200 && res.data.data) {
                const userData = res.data.data
                console.log('登录成功,用户信息:', userData)
                
                // 第3步: 如果用户选择了新头像,上传到服务器
                if (that.data.avatarTempFilePath && 
                    that.data.avatarTempFilePath !== defaultAvatarUrl) {
                  that.uploadAvatarToServer(userData.id, () => {
                    // 上传成功后完成登录
                    that.completeLogin(userData)
                  })
                } else {
                  // 没有新头像,直接完成登录
                  that.completeLogin(userData)
                }
                
              } else {
                wx.hideLoading()
                wx.showToast({
                  title: res.data.message || '登录失败',
                  icon: 'none',
                  duration: 2000
                })
              }
            },
            fail: (err) => {
              console.error('登录请求失败:', err)
              wx.hideLoading()
              wx.showToast({
                title: '网络请求失败',
                icon: 'none',
                duration: 2000
              })
            }
          })
        } else {
          console.error('获取登录code失败:', loginRes.errMsg)
          wx.hideLoading()
          wx.showToast({
            title: '微信登录失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        console.error('wx.login调用失败:', err)
        wx.hideLoading()
        wx.showToast({
          title: '微信登录失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 上传头像到服务器
   */
  uploadAvatarToServer(userId, successCallback) {
    const that = this
    
    console.log('开始上传头像,userId:', userId)
    
    wx.uploadFile({
      url: `${API_BASE_URL}/user/uploadAvatar`,
      filePath: that.data.avatarTempFilePath,
      name: 'avatar',
      formData: {
        userId: userId
      },
      success: (uploadRes) => {
        console.log('头像上传返回:', uploadRes)
        
        try {
          const data = JSON.parse(uploadRes.data)
          if (data.success) {
            console.log('头像上传成功,URL:', data.data)
            // 更新本地用户信息中的头像URL
            that.setData({
              'userInfo.avatarUrl': data.data
            })
            // 执行成功回调
            if (successCallback) successCallback()
          } else {
            console.error('头像上传失败:', data.message)
            // 即使头像上传失败,也继续完成登录流程
            if (successCallback) successCallback()
          }
        } catch (e) {
          console.error('解析上传结果失败:', e)
          if (successCallback) successCallback()
        }
      },
      fail: (err) => {
        console.error('头像上传请求失败:', err)
        // 即使上传失败,也继续登录流程
        if (successCallback) successCallback()
      }
    })
  },

  /**
   * 完成登录流程
   */
  completeLogin(userData) {
    console.log('=== 开始完成登录流程 ===')
  console.log('接收到的用户数据:', userData)
  
    // 保存用户信息到本地缓存
    wx.setStorageSync('userInfo', {
      id: userData.id,
      openid: userData.openid,
      nickname: userData.nickname,
      avatarUrl: userData.avatarUrl,
      phone: userData.phone
    })
    
    console.log('用户信息已保存到缓存')
    
    wx.hideLoading()
    
    // 显示欢迎提示
    wx.showToast({
      title: '欢迎回家吃饭',
      icon: 'success',
      duration: 1500
    })
    
    // 延迟跳转,让用户看到欢迎提示
    setTimeout(() => {
      console.log("登录")
      // 跳转到菜单页
      wx.switchTab({
        url: '/pages/menu/menu',
        fail: () => {
          // 如果menu不是tabBar页面,使用navigateTo
          wx.redirectTo({
            url: '/pages/menu/menu'
          })
        }
      })
    }, 1500)
  },

  /**
   * 页面加载时检查登录状态
   */
  onLoad() {
    // 检查本地是否已有用户信息
    const cachedUserInfo = wx.getStorageSync('userInfo')
    if (cachedUserInfo && cachedUserInfo.id) {
      console.log('发现缓存的用户信息,直接跳转')
      // 已登录,直接跳转到菜单页
      wx.switchTab({
        url: '/pages/menu/menu',
        fail: () => {
          wx.redirectTo({
            url: '/pages/menu/menu'
          })
        }
      })
    }
  }
})
