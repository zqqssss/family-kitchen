const API_BASE_URL = 'http://localhost:8080/api'

Page({
  data: {
    orderList: [],
    showDetail: false,
    currentOrder: {},
    userId: null
  },

  onLoad() {
    console.log('=== 历史订单页面加载 ===')
    
    // 方法1: 从本地存储获取
    let userId = wx.getStorageSync('userId')
    console.log('本地存储的userId:', userId)
    
    // 方法2: 如果本地没有，从全局获取
    if (!userId) {
      userId = getApp().globalData.userId
      console.log('全局数据的userId:', userId)
    }
    
    // 方法3: 如果还是没有，使用测试ID（临时调试用）
    if (!userId) {
      console.warn('未找到userId，使用测试ID')
      userId = 1  // 临时测试用，确认接口正常后删除这行
    }
    
    if (!userId) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login',
              fail: () => {
                wx.showToast({
                  title: '登录页面不存在',
                  icon: 'none'
                })
              }
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }
    
    console.log('最终使用的userId:', userId)
    this.setData({ userId })
    this.loadUserOrders()
  },

  onShow() {
    // 每次显示页面时刷新订单列表
    if (this.data.userId) {
      console.log('页面显示，刷新订单')
      this.loadUserOrders()
    }
  },

  // 加载用户订单
  loadUserOrders() {
    const url = `${API_BASE_URL}/order/user/${this.data.userId}`
    console.log('请求订单URL:', url)
    
    wx.showLoading({ title: '加载中...' })
    
    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log('=== 订单响应数据 ===')
        console.log('状态码:', res.statusCode)
        console.log('响应数据:', res.data)
        
        if (res.statusCode !== 200) {
          wx.showToast({
            title: `请求失败: ${res.statusCode}`,
            icon: 'none'
          })
          return
        }
        
        if (res.data.code === 200 && res.data.data) {
          const orderList = res.data.data.map(order => ({
            id: order.id,
            orderNo: order.orderNo,
            time: this.formatTime(new Date(order.createTime)),
            status: order.statusText,
            statusCode: order.status,
            dishes: order.items.map(item => ({
              name: item.name,
              price: item.price,
              count: item.quantity,
              image: item.image || item.imageUrl  // 添加这一行
            })),
            totalCount: order.items.length,
            totalPrice: order.amount,
            address: order.address,
            consignee: order.consignee,
            phone: order.phone,
            remark: order.remark || '无备注',
            cancelReason: order.cancelReason || ''
          }))


          
          console.log('转换后的订单列表:', orderList)
          this.setData({ orderList })
          
          if (orderList.length === 0) {
            wx.showToast({
              title: '暂无订单记录',
              icon: 'none'
            })
          }
        } else {
          console.error('业务错误:', res.data)
          wx.showToast({
            title: res.data.msg || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('=== 网络请求失败 ===')
        console.error(err)
        wx.showToast({
          title: '网络错误，请检查后端是否启动',
          icon: 'none',
          duration: 3000
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 日期格式化
  formatTime(date) {
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${m}-${d} ${h}:${min}`
  },

  // 打开详情
  openDetail(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentOrder: this.data.orderList[index],
      showDetail: true
    })
  },

  // 关闭详情
  closeDetail() {
    this.setData({ showDetail: false })
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新')
    this.loadUserOrders()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  preventBubble() {}
})
