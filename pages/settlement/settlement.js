// 引入之前封装好的 request 工具 (假设你在 utils/request.js)
//const api = require('../../../utils/request')

Page({
  data: {
    address: null,    // 收货地址
    cartList: [],     // 菜品列表
    totalPrice: 0,    // 总价
    totalCount: 0,    // 总数量
    remark: '',       // 备注
    diningType: 1,    // 1:堂食 2:打包
    loading: false
  },

  onLoad() {
    // 1. 获取菜单页传过来的数据
    const cartList = wx.getStorageSync('checkedDishes') || []
    const totalPrice = wx.getStorageSync('orderTotalPrice') || 0
    const totalCount = wx.getStorageSync('orderTotalCount') || 0
    
    // 2. 尝试获取之前的默认地址（可选优化）
    const lastAddress = wx.getStorageSync('lastAddress')
    
    this.setData({
      cartList,
      totalPrice,
      totalCount,
      address: lastAddress || null
    })
  },

  // 选择地址 (调用微信原生收货地址)
  chooseAddress() {
    wx.chooseAddress({
      success: (res) => {
        this.setData({ address: res })
        wx.setStorageSync('lastAddress', res) // 记住上次用的地址
      },
      fail: (err) => {
        console.log('用户拒绝或取消选择地址', err)
      }
    })
  },

  // 切换用餐方式
  changeType(e) {
    this.setData({ diningType: e.currentTarget.dataset.type })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 提交订单
  async submitOrder() {
    // 1. 基础校验
    if (!this.data.address) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
    
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      // 2. 构造传给 Java 后端的参数 (DTO)
      // 注意：这里的字段名要跟你 Java 后端的 OrderDTO 对应
      const orderData = {
        // 地址信息
        address: `${this.data.address.provinceName}${this.data.address.cityName}${this.data.address.countyName}${this.data.address.detailInfo}`,
        consignee: this.data.address.userName,
        phone: this.data.address.telNumber,
        
        // 订单基本信息
        amount: this.data.totalPrice,
        remark: this.data.remark,
        diningType: this.data.diningType === 1 ? 'DINE_IN' : 'TAKE_OUT',
        
        // 菜品明细
        items: this.data.cartList.map(item => ({
          dishId: item.id,
          name: item.name,
          quantity: item.count,
          price: item.price
        }))
      }

      console.log('提交给后端的数据:', orderData)

      // 3. 发送请求
      // 假设你的后端接口是 POST /order/create
      const res = await api.post('/order/create', orderData)

      // 4. 下单成功处理
      wx.showToast({ title: '下单成功', icon: 'success' })
      
      // 清空购物车缓存
      wx.removeStorageSync('cart') // 清空原始购物车
      wx.removeStorageSync('checkedDishes')
      
      // 延迟跳转到订单列表页
      setTimeout(() => {
        // 假设订单页是 TabBar
        // wx.switchTab({ url: '/pages/order/list' }) 
        // 或者直接返回首页
        wx.reLaunch({ url: '/pages/menu/menu' })
      }, 1500)

    } catch (err) {
      console.error(err)
      // 错误提示通常在 request.js 里处理了，这里可以额外提示
      // wx.showToast({ title: '下单失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
