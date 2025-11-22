Page({
  data: {
    orderList: [],
    showDetail: false,
    currentOrder: {}
  },

  onLoad() {
    this.generateMockOrders()
  },

  // 随机生成演示数据
  generateMockOrders() {
    const dishesPool = [
      { name: '红烧肉', price: 48, image: 'https://dummyimage.com/100x100/ff9c00/fff.png&text=Pork' },
      { name: '番茄炒蛋', price: 18, image: 'https://dummyimage.com/100x100/ff6347/fff.png&text=Egg' },
      { name: '玉米排骨汤', price: 38, image: 'https://dummyimage.com/100x100/ffdd00/fff.png&text=Soup' },
      { name: '扬州炒饭', price: 22, image: 'https://dummyimage.com/100x100/f0e68c/fff.png&text=Rice' },
      { name: '可乐', price: 3, image: 'https://dummyimage.com/100x100/000/fff.png&text=Cola' }
    ]

    const list = []
    for (let i = 0; i < 6; i++) {
      // 随机生成 2-5 个菜品
      const dishCount = Math.floor(Math.random() * 4) + 2
      const currentDishes = []
      let total = 0
      
      for(let j=0; j<dishCount; j++) {
        const randomDish = dishesPool[Math.floor(Math.random() * dishesPool.length)]
        currentDishes.push({
          ...randomDish,
          count: Math.floor(Math.random() * 2) + 1
        })
        total += randomDish.price
      }

      list.push({
        id: i,
        orderNo: 'ORDER' + Date.now() + i,
        time: this.formatTime(new Date(Date.now() - i * 86400000)), // 每天一单
        status: i === 0 ? '制作中' : '已完成', // 第一单制作中，其他已完成
        dishes: currentDishes,
        totalCount: currentDishes.length,
        totalPrice: total,
        address: '家庭厨房餐桌 A1',
        remark: i % 2 === 0 ? '不要香菜，微辣' : '' // 偶数单有备注
      })
    }

    this.setData({ orderList: list })
  },

  // 简单的日期格式化
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

  preventBubble() {}
})
