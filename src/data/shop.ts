/* 面包多自动收款配置(改动只动这一个文件)
 * 填入对应测试款的面包多商品页地址后,解锁页自动出现「面包多自动解锁」入口;
 * 留空 = 该款暂不上架,入口隐藏,买家继续走兑换码通道。
 * 配套:Vercel 环境变量 MBD_DEVELOPER_KEY + MBD_PRODUCTS(JSON:urlkey→系列),
 * 核验接口 /api/mbd 按「一单一设备一款」放行。 */
export const MBD_SHOP: Partial<Record<'hid' | 'cf' | 'rl' | 'da', string>> = {
  hid: '',
  cf: '',
  rl: '',
  da: '',
}
