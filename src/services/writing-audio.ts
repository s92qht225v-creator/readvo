const W = 'https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201/Writing/HSK%202.0';
/** Audio URL lookup by character. Values are Supabase Storage paths (HSK 1 flashcards bucket, SET folders). */
export const WRITING_AUDIO: Record<string, string> = {
  // SET 1
  '的': `${W}/SET%201/de.mp3`, '我': `${W}/SET%201/wo.mp3`, '你': `${W}/SET%201/ni.mp3`,
  '是': `${W}/SET%201/shi.mp3`, '了': `${W}/SET%201/le.mp3`, '不': `${W}/SET%201/bu.mp3`,
  '在': `${W}/SET%201/zai.mp3`, '他': `${W}/SET%201/ta.mp3`, '我们': `${W}/SET%201/women.mp3`,
  '好': `${W}/SET%201/hao.mp3`,
  // SET 2
  '有': `${W}/SET%202/you.mp3`, '这': `${W}/SET%202/zhe.mp3`, '就': `${W}/SET%202/jiu.mp3`,
  '会': `${W}/SET%202/hui.mp3`, '吗': `${W}/SET%202/ma.mp3`, '要': `${W}/SET%202/yao.mp3`,
  '什么': `${W}/SET%202/shenme.mp3`, '说': `${W}/SET%202/shuo.mp3`, '她': `${W}/SET%202/ta.mp3`,
  '想': `${W}/SET%202/xiang.mp3`,
  // SET 3
  '和': `${W}/SET%203/he.mp3`, '一': `${W}/SET%203/yi.mp3`, '很': `${W}/SET%203/hen.mp3`,
  '知道': `${W}/SET%203/zhidao.mp3`, '人': `${W}/SET%203/ren.mp3`, '吧': `${W}/SET%203/ba.mp3`,
  '那': `${W}/SET%203/na.mp3`, '来': `${W}/SET%203/lai.mp3`, '都': `${W}/SET%203/dou.mp3`,
  '个': `${W}/SET%203/ge.mp3`,
  // SET 4
  '能': `${W}/SET%204/neng.mp3`, '去': `${W}/SET%204/qu.mp3`, '没': `${W}/SET%204/mei.mp3`,
  '他们': `${W}/SET%204/tamen.mp3`, '到': `${W}/SET%204/dao.mp3`, '也': `${W}/SET%204/ye.mp3`,
  '对': `${W}/SET%204/dui.mp3`, '还': `${W}/SET%204/hai.mp3`, '做': `${W}/SET%204/zuo.mp3`,
  '上': `${W}/SET%204/shang.mp3`,
  // SET 5
  '给': `${W}/SET%205/gei.mp3`, '中': `${W}/SET%205/zhong.mp3`, '你们': `${W}/SET%205/nimen.mp3`,
  '过': `${W}/SET%205/guo.mp3`, '没有': `${W}/SET%205/meiyou.mp3`, '年': `${W}/SET%205/nian.mp3`,
  '看': `${W}/SET%205/kan.mp3`, '真': `${W}/SET%205/zhen.mp3`, '着': `${W}/SET%205/zhe.mp3`,
  '事': `${W}/SET%205/shi.mp3`,
  // SET 6
  '怎么': `${W}/SET%206/zenme.mp3`, '现在': `${W}/SET%206/xianzai.mp3`, '点': `${W}/SET%206/dian.mp3`,
  '呢': `${W}/SET%206/ne.mp3`, '日': `${W}/SET%206/ri.mp3`, '月': `${W}/SET%206/yue.mp3`,
  '别': `${W}/SET%206/bie.mp3`, '大': `${W}/SET%206/da.mp3`, '走': `${W}/SET%206/zou.mp3`,
  '太': `${W}/SET%206/tai.mp3`,
  // SET 7
  '等': `${W}/SET%207/deng.mp3`, '地': `${W}/SET%207/di.mp3`, '里': `${W}/SET%207/li.mp3`,
  '跟': `${W}/SET%207/gen.mp3`, '告诉': `${W}/SET%207/gaosu.mp3`, '后': `${W}/SET%207/hou.mp3`,
  '两': `${W}/SET%207/liang.mp3`, '再': `${W}/SET%207/zai.mp3`, '听': `${W}/SET%207/ting.mp3`,
  '这里': `${W}/SET%207/zheli.mp3`,
  // SET 8
  '快': `${W}/SET%208/kuai.mp3`, '谁': `${W}/SET%208/shei.mp3`, '多': `${W}/SET%208/duo.mp3`,
  '用': `${W}/SET%208/yong.mp3`, '时候': `${W}/SET%208/shihou.mp3`, '下': `${W}/SET%208/xia.mp3`,
  '从': `${W}/SET%208/cong.mp3`, '谢谢': `${W}/SET%208/xiexie.mp3`, '觉得': `${W}/SET%208/juede.mp3`,
  '天': `${W}/SET%208/tian.mp3`,
  // SET 9
  '中国': `${W}/SET%209/zhongguo.mp3`, '元': `${W}/SET%209/yuan.mp3`, '先生': `${W}/SET%209/xiansheng.mp3`,
  '找': `${W}/SET%209/zhao.mp3`, '最': `${W}/SET%209/zui.mp3`, '喜欢': `${W}/SET%209/xihuan.mp3`,
  '次': `${W}/SET%209/ci.mp3`, '出': `${W}/SET%209/chu.mp3`, '干': `${W}/SET%209/gan.mp3`,
  '们': `${W}/SET%209/men.mp3`,
  // SET 10
  '话': `${W}/SET%2010/hua.mp3`, '新': `${W}/SET%2010/xin.mp3`, '东西': `${W}/SET%2010/dongxi.mp3`,
  '孩子': `${W}/SET%2010/haizi.mp3`, '起来': `${W}/SET%2010/qilai.mp3`, '小': `${W}/SET%2010/xiao.mp3`,
  '这些': `${W}/SET%2010/zhexie.mp3`, '错': `${W}/SET%2010/cuo.mp3`, '还有': `${W}/SET%2010/haiyou.mp3`,
  '工作': `${W}/SET%2010/gongzuo.mp3`,
  // SET 11
  '叫': `${W}/SET%2011/jiao.mp3`, '前': `${W}/SET%2011/qian.mp3`, '一起': `${W}/SET%2011/yiqi.mp3`,
  '拿': `${W}/SET%2011/na.mp3`, '家': `${W}/SET%2011/jia.mp3`, '帮': `${W}/SET%2011/bang.mp3`,
  '打': `${W}/SET%2011/da.mp3`, '爱': `${W}/SET%2011/ai.mp3`, '时间': `${W}/SET%2011/shijian.mp3`,
  '请': `${W}/SET%2011/qing.mp3`,
  // SET 12
  '回': `${W}/SET%2012/hui.mp3`, '见': `${W}/SET%2012/jian.mp3`, '钱': `${W}/SET%2012/qian.mp3`,
  '一样': `${W}/SET%2012/yiyang.mp3`, '吃': `${W}/SET%2012/chi.mp3`, '本': `${W}/SET%2012/ben.mp3`,
  '开': `${W}/SET%2012/kai.mp3`, '非常': `${W}/SET%2012/feichang.mp3`, '看到': `${W}/SET%2012/kandao.mp3`,
  '那些': `${W}/SET%2012/naxie.mp3`,
};
