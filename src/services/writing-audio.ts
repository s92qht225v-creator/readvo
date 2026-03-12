const W = 'https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201%20flashcards/HSK%201';
/** Audio URL lookup by character. Values are Supabase Storage paths (HSK 1 flashcards bucket, SET folders). */
export const WRITING_AUDIO: Record<string, string> = {
  // SET 1
  '的': `${W}/SET%201/1_de.mp3`, '我': `${W}/SET%201/2_wo.mp3`, '你': `${W}/SET%201/3_ni.mp3`,
  '是': `${W}/SET%201/4_shi.mp3`, '了': `${W}/SET%201/5_le.mp3`, '不': `${W}/SET%201/6_bu.mp3`,
  '在': `${W}/SET%201/7_zai.mp3`, '他': `${W}/SET%201/8_ta.mp3`, '我们': `${W}/SET%201/9_women.mp3`,
  '好': `${W}/SET%201/10_hao.mp3`,
  // SET 2
  '有': `${W}/SET%202/11_you.mp3`, '这': `${W}/SET%202/12_zhe.mp3`, '就': `${W}/SET%202/13_jiu.mp3`,
  '会': `${W}/SET%202/14_hui.mp3`, '吗': `${W}/SET%202/15_ma.mp3`, '要': `${W}/SET%202/16_yao.mp3`,
  '什么': `${W}/SET%202/17_shenme.mp3`, '说': `${W}/SET%202/18_shuo.mp3`, '她': `${W}/SET%202/19_ta.mp3`,
  '想': `${W}/SET%202/20_xiang.mp3`,
  // SET 3
  '和': `${W}/SET%203/21_he.mp3`, '一': `${W}/SET%203/22_yi.mp3`, '很': `${W}/SET%203/23_hen.mp3`,
  '知道': `${W}/SET%203/24_zhidao.mp3`, '人': `${W}/SET%203/25_ren.mp3`, '吧': `${W}/SET%203/26_ba.mp3`,
  '那': `${W}/SET%203/27_na.mp3`, '来': `${W}/SET%203/28_lai.mp3`, '都': `${W}/SET%203/29_dou.mp3`,
  '个': `${W}/SET%203/30_ge.mp3`,
  // SET 4
  '能': `${W}/SET%204/31_neng.mp3`, '去': `${W}/SET%204/32_qu.mp3`, '没': `${W}/SET%204/33_mei.mp3`,
  '他们': `${W}/SET%204/34_tamen.mp3`, '到': `${W}/SET%204/35_dao.mp3`, '也': `${W}/SET%204/36_ye.mp3`,
  '对': `${W}/SET%204/37_dui.mp3`, '还': `${W}/SET%204/38_hai.mp3`, '做': `${W}/SET%204/39_zuo.mp3`,
  '上': `${W}/SET%204/40_shang.mp3`,
  // SET 5
  '给': `${W}/SET%205/41_gei.mp3`, '中': `${W}/SET%205/42_zhong.mp3`, '你们': `${W}/SET%205/43_nimen.mp3`,
  '过': `${W}/SET%205/44_guo.mp3`, '没有': `${W}/SET%205/45_meiyou.mp3`, '年': `${W}/SET%205/46_nian.mp3`,
  '看': `${W}/SET%205/47_kan.mp3`, '真': `${W}/SET%205/48_zhen.mp3`, '着': `${W}/SET%205/49_zhe.mp3`,
  '事': `${W}/SET%205/50_shi.mp3`,
  // SET 6
  '怎么': `${W}/SET%206/51_zenme.mp3`, '现在': `${W}/SET%206/52_xianzai.mp3`, '点': `${W}/SET%206/53_dian.mp3`,
  '呢': `${W}/SET%206/54_ne.mp3`, '日': `${W}/SET%206/55_ri.mp3`, '月': `${W}/SET%206/56_yue.mp3`,
  '别': `${W}/SET%206/57_bie.mp3`, '大': `${W}/SET%206/58_da.mp3`, '走': `${W}/SET%206/59_zou.mp3`,
  '太': `${W}/SET%206/60_tai.mp3`,
  // SET 7
  '等': `${W}/SET%207/61_deng.mp3`, '地': `${W}/SET%207/62_di.mp3`, '里': `${W}/SET%207/63_li.mp3`,
  '跟': `${W}/SET%207/64_gen.mp3`, '告诉': `${W}/SET%207/65_gaosu.mp3`, '后': `${W}/SET%207/66_hou.mp3`,
  '两': `${W}/SET%207/67_liang.mp3`, '再': `${W}/SET%207/68_zai.mp3`, '听': `${W}/SET%207/69_ting.mp3`,
  '这里': `${W}/SET%207/70_zheli.mp3`,
  // SET 8
  '快': `${W}/SET%208/71_kuai.mp3`, '谁': `${W}/SET%208/72_shei.mp3`, '多': `${W}/SET%208/73_duo.mp3`,
  '用': `${W}/SET%208/74_yong.mp3`, '时候': `${W}/SET%208/75_shihou.mp3`, '下': `${W}/SET%208/76_xia.mp3`,
  '从': `${W}/SET%208/77_cong.mp3`, '谢谢': `${W}/SET%208/78_xiexie.mp3`, '觉得': `${W}/SET%208/79_juede.mp3`,
  '天': `${W}/SET%208/80_tian.mp3`,
  // SET 9
  '中国': `${W}/SET%209/81_zhongguo.mp3`, '元': `${W}/SET%209/82_yuan.mp3`, '先生': `${W}/SET%209/83_xiansheng.mp3`,
  '找': `${W}/SET%209/84_zhao.mp3`, '最': `${W}/SET%209/85_zui.mp3`, '喜欢': `${W}/SET%209/86_xihuan.mp3`,
  '次': `${W}/SET%209/87_ci.mp3`, '出': `${W}/SET%209/88_chu.mp3`, '干': `${W}/SET%209/89_gan.mp3`,
  '们': `${W}/SET%209/90_men.mp3`,
  // SET 10
  '话': `${W}/SET%2010/91_hua.mp3`, '新': `${W}/SET%2010/92_xin.mp3`, '东西': `${W}/SET%2010/93_dongxi.mp3`,
  '孩子': `${W}/SET%2010/94_haizi.mp3`, '起来': `${W}/SET%2010/95_qilai.mp3`, '小': `${W}/SET%2010/96_xiao.mp3`,
  '这些': `${W}/SET%2010/97_zhexie.mp3`, '错': `${W}/SET%2010/98_cuo.mp3`, '还有': `${W}/SET%2010/99_haiyou.mp3`,
  '工作': `${W}/SET%2010/100_gongzuo.mp3`,
  // SET 11
  '叫': `${W}/SET%2011/101_jiao.mp3`, '前': `${W}/SET%2011/102_qian.mp3`, '一起': `${W}/SET%2011/103_yiqi.mp3`,
  '拿': `${W}/SET%2011/104_na.mp3`, '家': `${W}/SET%2011/105_jia.mp3`, '帮': `${W}/SET%2011/106_bang.mp3`,
  '打': `${W}/SET%2011/107_da.mp3`, '爱': `${W}/SET%2011/108_ai.mp3`, '时间': `${W}/SET%2011/109_shijian.mp3`,
  '请': `${W}/SET%2011/110_qing.mp3`,
  // SET 12
  '回': `${W}/SET%2012/111_hui.mp3`, '见': `${W}/SET%2012/112_jian.mp3`, '钱': `${W}/SET%2012/113_qian.mp3`,
  '一样': `${W}/SET%2012/114_yiyang.mp3`, '吃': `${W}/SET%2012/115_chi.mp3`, '本': `${W}/SET%2012/116_ben.mp3`,
  '开': `${W}/SET%2012/117_kai.mp3`, '非常': `${W}/SET%2012/118_feichang.mp3`, '看到': `${W}/SET%2012/119_kandao.mp3`,
  '那些': `${W}/SET%2012/120_naxie.mp3`,
};
