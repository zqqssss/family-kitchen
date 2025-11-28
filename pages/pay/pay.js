Page({
  data: {
    amount: 0
  },

  onLoad(options) {
    this.setData({
      amount: options.amount || 0
    })
  },

  // 预览二维码（方便长按识别）
  previewImage() {
    wx.previewImage({
      urls: ['/images/pay_code.png'] // 尝试使用本地路径，如果真机不行需换成网络图片
    })
  },

  // 完成支付
  handlePaid() {
    wx.showToast({
      title: '支付确认成功',
      icon: 'success',
      duration: 2000
    })
    
    // 2秒后跳转到订单页或菜单页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/order/order', // 假设order是tabBar页面？如果不确定，用reLaunch
        fail: () => {
            // 如果不是tabBar，尝试redirectTo
            wx.redirectTo({
                url: '/pages/order/order'
            })
        }
      })
    }, 2000)
  }
})
