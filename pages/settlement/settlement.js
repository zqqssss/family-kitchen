const API_BASE_URL = 'https://7song.xyz/api'

const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: { 'content-type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: reject
    })
  })
}

Page({
  data: {
    userInfo: null,
    address: null,
    cartList: [],
    totalPrice: 0,
    totalCount: 0,
    remark: '',
    diningType: 1,
    loading: false,

    // 用于界面展示的用户信息
    displayUserInfo: {
      nickname: '加载中...',
      phone: '加载中...',
      address: '加载中...',
      avatarUrl: '/images/default-avatar.png'
    }
  },

  async onLoad() {
    console.log('📱 页面加载开始')

    const cartList = wx.getStorageSync('checkedDishes') || []
    const totalPrice = wx.getStorageSync('orderTotalPrice') || 0
    const totalCount = wx.getStorageSync('orderTotalCount') || 0

    this.setData({
      cartList,
      totalPrice,
      totalCount
    })

    // 加载用户信息
    await this.loadUserInfo()

    console.log('✅ 页面加载完成，最终displayUserInfo:', this.data.displayUserInfo)
  },

  async loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')

      if (!userInfo || !userInfo.id) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/index/index' })
        }, 1500)
        return
      }

      console.log('🔍 开始请求用户信息，userId:', userInfo.id)

      // 调用后端接口
      const res = await request(`/user/${userInfo.id}`, 'GET')

      console.log('📦 后端返回完整数据:', res)
      console.log('📦 res.data:', res.data)

      if (res.code === 200 && res.data) {
        const userData = res.data

        // 🎯 核心：直接使用 setData 设置所有数据
        this.setData({
          userInfo: userData,
          displayUserInfo: {
            nickname: userData.nickname || '未设置昵称',
            phone: userData.phone || '未设置手机号',
            address: userData.address || '未设置地址',
            avatarUrl: userData.avatarUrl || '/images/default-avatar.png'
          }
        })

        console.log('✅ 用户信息映射完成:')
        console.log('  - 昵称:', this.data.displayUserInfo.nickname)
        console.log('  - 手机号:', this.data.displayUserInfo.phone)
        console.log('  - 地址:', this.data.displayUserInfo.address)

        // 自动填充收货地址
        if (userData.phone && userData.address) {
          this.setData({
            address: {
              userName: userData.nickname || '用户',
              telNumber: userData.phone,
              provinceName: '',
              cityName: '',
              countyName: '',
              detailInfo: userData.address
            }
          })
          console.log('✅ 收货地址自动填充完成')
        }

      } else {
        throw new Error(res.message || '用户信息获取失败')
      }

    } catch (err) {
      console.error('❌ 获取用户信息失败:', err)
      wx.showToast({ title: '获取用户信息失败', icon: 'none' })
    }
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 切换用餐方式
  changeDiningType(e) {
    this.setData({ diningType: e.currentTarget.dataset.type })
  },

  // 选择微信地址
  chooseWechatAddress() {
    wx.chooseAddress({
      success: (res) => {
        this.setData({
          address: {
            userName: res.userName,
            telNumber: res.telNumber,
            provinceName: res.provinceName,
            cityName: res.cityName,
            countyName: res.countyName,
            detailInfo: res.detailInfo
          }
        })

        // 更新显示信息
        this.setData({
          'displayUserInfo.phone': res.telNumber,
          'displayUserInfo.address': `${res.provinceName}${res.cityName}${res.countyName}${res.detailInfo}`
        })

        console.log('✅ 手动选择地址完成')
      },
      fail: (err) => {
        console.log('用户取消选择地址', err)
      }
    })
  },

  // 提交订单
  async submitOrder() {
    if (!this.data.address) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }

    if (!this.data.userInfo) {
      wx.showToast({ title: '用户信息异常,请重新登录', icon: 'none' })
      return
    }

    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const orderData = {
        userId: this.data.userInfo.id,
        consignee: this.data.address.userName,
        phone: this.data.address.telNumber,
        address: [
          this.data.address.provinceName,
          this.data.address.cityName,
          this.data.address.countyName,
          this.data.address.detailInfo
        ].filter(Boolean).join(''),
        amount: this.data.totalPrice,
        remark: this.data.remark,
        diningType: this.data.diningType === 1 ? 'DINE_IN' : 'TAKE_OUT',
        items: this.data.cartList.map(item => ({
          dishId: item.id,      // ✅ 对应后端的dishId
          name: item.name,
          quantity: item.count,  // ✅ 对应后端的quantity
          price: item.price
        }))
      }

      console.log('📮 提交订单数据:', orderData)

      const res = await request('/order/create', 'POST', orderData)

      if (res.code === 200) {
        wx.showToast({ title: '下单成功', icon: 'success' })

        // 清除购物车数据
        wx.removeStorageSync('cart')
        wx.removeStorageSync('checkedDishes')
        wx.removeStorageSync('orderTotalPrice')
        wx.removeStorageSync('orderTotalCount')

        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/pay/pay?amount=${this.data.totalPrice}`
          })
        }, 1000)
      } else {
        throw new Error(res.message || '下单失败')
      }

    } catch (err) {
      console.error('❌ 提交订单失败:', err)
      wx.showToast({
        title: err.message || '下单失败,请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
