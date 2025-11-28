const API_BASE_URL = 'https://7song.xyz/api' // 替换成你的后端地址

Page({
  data: {
    userInfo: {
      id: '',
      nickName: '',
      avatarUrl: '',
      phone: ''
    },
    phone: '',
    address: '',
    remark: '',
    // 预设口味标签
    tasteTags: [
      { name: '微辣', selected: false },
      { name: '免辣', selected: false },
      { name: '少盐', selected: false },
      { name: '不要香菜', selected: false },
      { name: '多葱花', selected: false }
    ]
  },

  onLoad() {
    console.log('=== modify 页面加载 ===')
    this.loadUserInfo()
    this.loadOrderInfo()
  },

  /**
   * 从缓存加载用户信息
   */
  loadUserInfo() {
    try {
      const cachedUserInfo = wx.getStorageSync('userInfo')

      if (cachedUserInfo && cachedUserInfo.id) {
        console.log('✅ 成功读取用户信息:', cachedUserInfo)

        this.setData({
          userInfo: {
            id: cachedUserInfo.id,
            nickName: cachedUserInfo.nickname || '',
            avatarUrl: cachedUserInfo.avatarUrl || '',
            phone: cachedUserInfo.phone || ''
          },
          // 如果用户信息里有手机号，填充到输入框
          phone: cachedUserInfo.phone || ''
        })
      } else {
        console.warn('⚠️ 未找到用户信息')
        wx.showModal({
          title: '提示',
          content: '请先登录',
          showCancel: false,
          success: () => {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }
        })
      }
    } catch (e) {
      console.error('❌ 读取用户信息失败:', e)
    }
  },

  /**
   * 加载之前的订单信息
   */
  loadOrderInfo() {
    const info = wx.getStorageSync('lastOrderInfo') || {}

    // 恢复标签选中状态
    const tags = this.data.tasteTags.map(tag => {
      if (info.remark && info.remark.includes(tag.name)) {
        tag.selected = true
      }
      return tag
    })

    this.setData({
      phone: info.phone || this.data.phone, // 优先使用缓存的订单信息
      address: info.address || '',
      remark: info.remark || '',
      tasteTags: tags
    })
  },

  // 输入监听
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onAddressInput(e) {
    this.setData({ address: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 切换标签
  toggleTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = this.data.tasteTags
    tags[index].selected = !tags[index].selected

    // 自动把标签追加到备注输入框里
    let remark = this.data.remark
    const tagName = tags[index].name

    if (tags[index].selected) {
      // 选中：追加文字
      if (!remark.includes(tagName)) {
        remark = remark ? remark + '，' + tagName : tagName
      }
    } else {
      // 取消：移除文字
      remark = remark.replace(new RegExp(`，?${tagName}`, 'g'), '')
      if (remark.startsWith('，')) remark = remark.substring(1)
    }

    this.setData({ tasteTags: tags, remark })
  },

  /**
   * 保存信息（同步到数据库）
   */
  saveInfo() {
    const { phone, address, remark, userInfo } = this.data

    // ✅ 1. 校验数据
    if (!phone || phone.length !== 11 || !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }

    if (!address || address.trim() === '') {
      wx.showToast({
        title: '请填写收货地址',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    // ✅ 2. 调用后端接口更新用户信息
    wx.request({
      url: `${API_BASE_URL}/user/update`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        id: userInfo.id,
        phone: phone,
        address: address,
        remark: remark
      },
      success: (res) => {
        console.log('✅ 更新用户信息返回:', res.data)

        if (res.data.code === 200) {
          // ✅ 3. 更新本地缓存（用户信息）
          const updatedUserInfo = {
            ...wx.getStorageSync('userInfo'),
            phone: phone,
            address: address,
            remark: remark
          }
          wx.setStorageSync('userInfo', updatedUserInfo)

          // ✅ 4. 更新本地缓存（订单信息）
          const orderInfo = wx.getStorageSync('lastOrderInfo') || {}
          wx.setStorageSync('lastOrderInfo', {
            ...orderInfo,
            phone: phone,
            address: address,
            remark: remark
          })

          wx.hideLoading()
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          })

          // ✅ 5. 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)

        } else {
          wx.hideLoading()
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('❌ 保存失败:', err)
        wx.hideLoading()
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      }
    })
  }
})
