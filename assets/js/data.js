/* FFXIV 典禮系列（IL 740）裝備資料
 * 來源：_References/裝備製作材料.md
 */
(function (global) {
  'use strict';

  // 部位（顯示順序）
  var SLOTS = ['頭', '身', '手', '腿', '腳', '耳', '頸', '腕', '戒', '主手', '副手'];

  var SLOT_GROUP = {
    頭: '防具', 身: '防具', 手: '防具', 腿: '防具', 腳: '防具',
    耳: '飾品', 頸: '飾品', 腕: '飾品', 戒: '飾品',
    主手: '武器', 副手: '武器'
  };

  // 職業（依角色分組）
  var ROLES = [
    { id: 'tank', name: '坦克', jobs: ['騎士', '戰士', '暗黑騎士', '絕槍戰士'] },
    { id: 'healer', name: '治療', jobs: ['白魔法師', '學者', '占星術士', '賢者'] },
    { id: 'melee', name: '近戰', jobs: ['武僧', '龍騎士', '忍者', '武士', '奪魂者', '雙蛇劍士'] },
    { id: 'ranged', name: '遠敏', jobs: ['吟遊詩人', '機工士', '舞者'] },
    { id: 'caster', name: '魔法', jobs: ['黑魔法師', '召喚師', '赤魔法師', '繪靈法師'] }
  ];

  var TONIC = {
    耐力: '3級耐力之寶水', 剛力: '3級剛力之寶水', 巧力: '3級巧力之寶水',
    智力: '3級智力之寶水', 意力: '3級意力之寶水'
  };

  // 中間素材 → 原始素材（兩種取得途徑）
  var INTERMEDIATE = {
    銳鈦塊:     { gather: { name: '八面體隕鐵礦石', qty: 4 }, scrip: { name: '夏勞尼焦炭', qty: 2 } },
    菱錳石:     { gather: { name: '玫瑰紅紋石原石', qty: 4 }, scrip: { name: '新生王國研磨劑', qty: 2 } },
    鋒齒獸革:   { gather: { name: '夏勞尼咖啡豆', qty: 4 }, scrip: { name: '鋒齒獸的粗皮', qty: 2 } },
    不飛鳥毛布: { gather: { name: '胭脂蟲染料', qty: 4 }, scrip: { name: '不飛鳥的毛', qty: 2 } },
    破布木木材: { gather: { name: '破布木原木', qty: 4 }, scrip: { name: '滲透型防腐塗料', qty: 2 } }
  };

  // 素材分類（總計頁分組用）
  var MAT_CATEGORY = [
    { name: '製作素材', match: ['銳鈦塊', '菱錳石', '鋒齒獸革', '不飛鳥毛布', '破布木木材'] },
    { name: '一般素材', match: ['卡扎納爾錠', '卡岡圖亞革', '落雷絹', '黑星石', '克拉洛胡桃木木材', '重鎢墨水'] },
    { name: '寶水', match: ['3級耐力之寶水', '3級剛力之寶水', '3級巧力之寶水', '3級智力之寶水', '3級意力之寶水'] },
    { name: '靈砂', match: ['幻岩靈砂', '幻葉靈砂', '幻海靈砂'] }
  ];

  var T = TONIC;
  var ALL_TANK = ['騎士', '戰士', '暗黑騎士', '絕槍戰士'];
  var STR_JOBS = ['龍騎士', '奪魂者', '武僧', '武士'];
  var DRG_JOBS = ['龍騎士', '奪魂者'];
  var MNK_JOBS = ['武僧', '武士'];
  var VPR_JOBS = ['雙蛇劍士', '忍者'];
  var DEX_JOBS = ['雙蛇劍士', '忍者', '吟遊詩人', '機工士', '舞者'];
  var RNG_JOBS = ['吟遊詩人', '機工士', '舞者'];
  var INT_JOBS = ['黑魔法師', '赤魔法師', '召喚師', '繪靈法師'];
  var MND_JOBS = ['白魔法師', '學者', '占星術士', '賢者'];

  function m(name, qty) { return { name: name, qty: qty }; }

  var ITEMS = [
    /* ===== 坦職 · 典禮禦敵 ===== */
    { id: 'tk_head', name: '典禮禦敵襟翼帽', slot: '頭', series: '典禮禦敵', jobs: ALL_TANK,
      mats: [m('菱錳石', 1), m('不飛鳥毛布', 2), m('卡扎納爾錠', 1), m(T.耐力, 2), m('幻葉靈砂', 1)] },
    { id: 'tk_body', name: '典禮禦敵護甲', slot: '身', series: '典禮禦敵', jobs: ALL_TANK,
      mats: [m('銳鈦塊', 3), m('不飛鳥毛布', 2), m('卡岡圖亞革', 1), m(T.耐力, 2), m('幻岩靈砂', 1)] },
    { id: 'tk_hand', name: '典禮禦敵臂甲', slot: '手', series: '典禮禦敵', jobs: ALL_TANK,
      mats: [m('銳鈦塊', 2), m('鋒齒獸革', 1), m('落雷絹', 1), m(T.耐力, 2), m('幻岩靈砂', 1)] },
    { id: 'tk_legs', name: '典禮禦敵騎兵褲', slot: '腿', series: '典禮禦敵', jobs: ALL_TANK,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 3), m('卡岡圖亞革', 1), m(T.耐力, 2), m('幻葉靈砂', 1)] },
    { id: 'tk_feet', name: '典禮禦敵脛甲', slot: '腳', series: '典禮禦敵', jobs: ALL_TANK,
      mats: [m('菱錳石', 1), m('鋒齒獸革', 2), m('落雷絹', 1), m(T.耐力, 2), m('幻海靈砂', 1)] },
    { id: 'tk_ear', name: '典禮禦敵耳墜', slot: '耳', series: '典禮禦敵', jobs: ALL_TANK,
      mats: [m('銳鈦塊', 1), m('破布木木材', 1), m('克拉洛胡桃木木材', 1), m(T.耐力, 1), m('幻葉靈砂', 1)] },
    { id: 'tk_neck', name: '典禮禦敵項鏈', slot: '頸', series: '典禮禦敵', jobs: ALL_TANK,
      mats: [m('菱錳石', 1), m('破布木木材', 1), m('黑星石', 1), m(T.耐力, 1), m('幻岩靈砂', 1)] },
    { id: 'tk_wrist', name: '典禮禦敵手鐲', slot: '腕', series: '典禮禦敵', jobs: ALL_TANK,
      mats: [m('鋒齒獸革', 1), m('破布木木材', 1), m('卡岡圖亞革', 1), m(T.耐力, 1), m('幻岩靈砂', 1)] },
    { id: 'tk_ring', name: '典禮禦敵指環', slot: '戒', series: '典禮禦敵', jobs: ALL_TANK, note: '左右手各一，需 2 件',
      mats: [m('菱錳石', 1), m('破布木木材', 1), m('克拉洛胡桃木木材', 1), m(T.耐力, 1), m('幻海靈砂', 1)] },
    { id: 'wp_pld', name: '典禮長刀', slot: '主手', series: '武器', jobs: ['騎士'],
      mats: [m('銳鈦塊', 3), m('卡扎納爾錠', 1), m(T.耐力, 1), m('幻葉靈砂', 1)] },
    { id: 'wp_shd', name: '典禮輕盾', slot: '副手', series: '武器', jobs: ['騎士'],
      mats: [m('銳鈦塊', 1), m('菱錳石', 1), m(T.耐力, 1)] },
    { id: 'wp_war', name: '典禮巨斧', slot: '主手', series: '武器', jobs: ['戰士'],
      mats: [m('銳鈦塊', 4), m('不飛鳥毛布', 1), m('卡扎納爾錠', 1), m(T.耐力, 2), m('幻葉靈砂', 1)] },
    { id: 'wp_drk', name: '典禮大劍', slot: '主手', series: '武器', jobs: ['暗黑騎士'],
      mats: [m('銳鈦塊', 3), m('菱錳石', 2), m('卡扎納爾錠', 1), m(T.耐力, 2), m('幻葉靈砂', 1)] },
    { id: 'wp_gnb', name: '典禮槍刃', slot: '主手', series: '武器', jobs: ['絕槍戰士'],
      mats: [m('銳鈦塊', 3), m('菱錳石', 2), m('黑星石', 1), m(T.耐力, 2), m('幻葉靈砂', 1)] },

    /* ===== 龍騎 / 奪魂者 · 典禮制敵 ===== */
    { id: 'dg_head', name: '典禮制敵襟翼帽', slot: '頭', series: '典禮制敵', jobs: DRG_JOBS,
      mats: [m('菱錳石', 1), m('不飛鳥毛布', 2), m('卡扎納爾錠', 1), m(T.剛力, 2), m('幻葉靈砂', 1)] },
    { id: 'dg_body', name: '典禮制敵護甲', slot: '身', series: '典禮制敵', jobs: DRG_JOBS,
      mats: [m('銳鈦塊', 3), m('不飛鳥毛布', 2), m('卡岡圖亞革', 1), m(T.剛力, 2), m('幻岩靈砂', 1)] },
    { id: 'dg_hand', name: '典禮制敵臂甲', slot: '手', series: '典禮制敵', jobs: DRG_JOBS,
      mats: [m('銳鈦塊', 2), m('鋒齒獸革', 1), m('落雷絹', 1), m(T.剛力, 2), m('幻岩靈砂', 1)] },
    { id: 'dg_legs', name: '典禮制敵騎兵褲', slot: '腿', series: '典禮制敵', jobs: DRG_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 3), m('卡岡圖亞革', 1), m(T.剛力, 2), m('幻葉靈砂', 1)] },
    { id: 'dg_feet', name: '典禮制敵脛甲', slot: '腳', series: '典禮制敵', jobs: DRG_JOBS,
      mats: [m('菱錳石', 1), m('鋒齒獸革', 2), m('落雷絹', 1), m(T.剛力, 2), m('幻海靈砂', 1)] },

    /* ===== 武僧 / 武士 · 典禮強襲 ===== */
    { id: 'mk_head', name: '典禮強襲襟翼帽', slot: '頭', series: '典禮強襲', jobs: MNK_JOBS,
      mats: [m('鋒齒獸革', 1), m('不飛鳥毛布', 2), m('黑星石', 1), m(T.剛力, 2), m('幻葉靈砂', 1)] },
    { id: 'mk_body', name: '典禮強襲坎肩', slot: '身', series: '典禮強襲', jobs: MNK_JOBS,
      mats: [m('菱錳石', 2), m('不飛鳥毛布', 3), m('落雷絹', 1), m(T.剛力, 2), m('幻岩靈砂', 1)] },
    { id: 'mk_hand', name: '典禮強襲護臂', slot: '手', series: '典禮強襲', jobs: MNK_JOBS,
      mats: [m('銳鈦塊', 2), m('不飛鳥毛布', 1), m('卡岡圖亞革', 1), m(T.剛力, 2), m('幻岩靈砂', 1)] },
    { id: 'mk_legs', name: '典禮強襲寬鬆直筒褲', slot: '腿', series: '典禮強襲', jobs: MNK_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 3), m('黑星石', 1), m(T.剛力, 2), m('幻葉靈砂', 1)] },
    { id: 'mk_feet', name: '典禮強襲尖頭靴', slot: '腳', series: '典禮強襲', jobs: MNK_JOBS,
      mats: [m('菱錳石', 1), m('鋒齒獸革', 2), m('落雷絹', 1), m(T.剛力, 2), m('幻海靈砂', 1)] },

    /* ===== 力量系飾品 · 典禮強攻 ===== */
    { id: 'st_ear', name: '典禮強攻耳墜', slot: '耳', series: '典禮強攻', jobs: STR_JOBS,
      mats: [m('銳鈦塊', 1), m('破布木木材', 1), m('克拉洛胡桃木木材', 1), m(T.剛力, 1), m('幻葉靈砂', 1)] },
    { id: 'st_neck', name: '典禮強攻項鏈', slot: '頸', series: '典禮強攻', jobs: STR_JOBS,
      mats: [m('菱錳石', 1), m('破布木木材', 1), m('黑星石', 1), m(T.剛力, 1), m('幻岩靈砂', 1)] },
    { id: 'st_wrist', name: '典禮強攻手鐲', slot: '腕', series: '典禮強攻', jobs: STR_JOBS,
      mats: [m('鋒齒獸革', 1), m('破布木木材', 1), m('卡岡圖亞革', 1), m(T.剛力, 1), m('幻岩靈砂', 1)] },
    { id: 'st_ring', name: '典禮強攻指環', slot: '戒', series: '典禮強攻', jobs: STR_JOBS, note: '左右手各一，需 2 件',
      mats: [m('菱錳石', 1), m('破布木木材', 1), m('克拉洛胡桃木木材', 1), m(T.剛力, 1), m('幻海靈砂', 1)] },

    { id: 'wp_drg', name: '典禮長柄刀', slot: '主手', series: '武器', jobs: ['龍騎士'],
      mats: [m('銳鈦塊', 3), m('菱錳石', 2), m('卡扎納爾錠', 1), m(T.剛力, 2), m('幻岩靈砂', 1)] },
    { id: 'wp_rpr', name: '典禮戰鐮', slot: '主手', series: '武器', jobs: ['奪魂者'],
      mats: [m('銳鈦塊', 4), m('菱錳石', 1), m('卡扎納爾錠', 1), m(T.剛力, 2), m('幻海靈砂', 1)] },
    { id: 'wp_mnk', name: '典禮聖徒', slot: '主手', series: '武器', jobs: ['武僧'],
      mats: [m('銳鈦塊', 4), m('不飛鳥毛布', 1), m('黑星石', 1), m(T.剛力, 2), m('幻岩靈砂', 1)] },
    { id: 'wp_sam', name: '典禮曲刃刀', slot: '主手', series: '武器', jobs: ['武士'],
      mats: [m('銳鈦塊', 4), m('鋒齒獸革', 1), m('黑星石', 1), m(T.剛力, 2), m('幻海靈砂', 1)] },

    /* ===== 雙蛇劍士 / 忍者 · 典禮游擊 ===== */
    { id: 'vp_head', name: '典禮游擊襟翼帽', slot: '頭', series: '典禮游擊', jobs: VPR_JOBS,
      mats: [m('鋒齒獸革', 1), m('不飛鳥毛布', 2), m('黑星石', 1), m(T.巧力, 2), m('幻葉靈砂', 1)] },
    { id: 'vp_body', name: '典禮游擊坎肩', slot: '身', series: '典禮游擊', jobs: VPR_JOBS,
      mats: [m('菱錳石', 2), m('不飛鳥毛布', 3), m('落雷絹', 1), m(T.巧力, 2), m('幻岩靈砂', 1)] },
    { id: 'vp_hand', name: '典禮游擊護臂', slot: '手', series: '典禮游擊', jobs: VPR_JOBS,
      mats: [m('銳鈦塊', 2), m('不飛鳥毛布', 1), m('卡岡圖亞革', 1), m(T.巧力, 2), m('幻岩靈砂', 1)] },
    { id: 'vp_legs', name: '典禮游擊寬鬆直筒褲', slot: '腿', series: '典禮游擊', jobs: VPR_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 3), m('黑星石', 1), m(T.巧力, 2), m('幻葉靈砂', 1)] },
    { id: 'vp_feet', name: '典禮游擊尖頭靴', slot: '腳', series: '典禮游擊', jobs: VPR_JOBS,
      mats: [m('菱錳石', 1), m('鋒齒獸革', 2), m('落雷絹', 1), m(T.巧力, 2), m('幻海靈砂', 1)] },

    /* ===== 吟遊 / 機工 / 舞者 · 典禮精準（防具） ===== */
    { id: 'rn_head', name: '典禮精準襟翼帽', slot: '頭', series: '典禮精準', jobs: RNG_JOBS,
      mats: [m('鋒齒獸革', 1), m('不飛鳥毛布', 2), m('黑星石', 1), m(T.巧力, 2), m('幻葉靈砂', 1)] },
    { id: 'rn_body', name: '典禮精準坎肩', slot: '身', series: '典禮精準', jobs: RNG_JOBS,
      mats: [m('菱錳石', 2), m('不飛鳥毛布', 3), m('落雷絹', 1), m(T.巧力, 2), m('幻岩靈砂', 1)] },
    { id: 'rn_hand', name: '典禮精準護臂', slot: '手', series: '典禮精準', jobs: RNG_JOBS,
      mats: [m('銳鈦塊', 2), m('不飛鳥毛布', 1), m('卡岡圖亞革', 1), m(T.巧力, 2), m('幻岩靈砂', 1)] },
    { id: 'rn_legs', name: '典禮精準寬鬆直筒褲', slot: '腿', series: '典禮精準', jobs: RNG_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 3), m('黑星石', 1), m(T.巧力, 2), m('幻葉靈砂', 1)] },
    { id: 'rn_feet', name: '典禮精準尖頭靴', slot: '腳', series: '典禮精準', jobs: RNG_JOBS,
      mats: [m('菱錳石', 1), m('鋒齒獸革', 2), m('落雷絹', 1), m(T.巧力, 2), m('幻海靈砂', 1)] },

    /* ===== 敏捷系飾品 · 典禮精準 ===== */
    { id: 'dx_ear', name: '典禮精準耳墜', slot: '耳', series: '典禮精準', jobs: DEX_JOBS,
      mats: [m('銳鈦塊', 1), m('破布木木材', 1), m('克拉洛胡桃木木材', 1), m(T.巧力, 1), m('幻葉靈砂', 1)] },
    { id: 'dx_neck', name: '典禮精準項鏈', slot: '頸', series: '典禮精準', jobs: DEX_JOBS,
      mats: [m('菱錳石', 1), m('破布木木材', 1), m('黑星石', 1), m(T.巧力, 1), m('幻岩靈砂', 1)] },
    { id: 'dx_wrist', name: '典禮精準手鐲', slot: '腕', series: '典禮精準', jobs: DEX_JOBS,
      mats: [m('鋒齒獸革', 1), m('破布木木材', 1), m('卡岡圖亞革', 1), m(T.巧力, 1), m('幻岩靈砂', 1)] },
    { id: 'dx_ring', name: '典禮精準指環', slot: '戒', series: '典禮精準', jobs: DEX_JOBS, note: '左右手各一，需 2 件',
      mats: [m('菱錳石', 1), m('破布木木材', 1), m('克拉洛胡桃木木材', 1), m(T.巧力, 1), m('幻海靈砂', 1)] },

    { id: 'wp_vpr', name: '典禮雙軍刀', slot: '主手', series: '武器', jobs: ['雙蛇劍士'],
      mats: [m('銳鈦塊', 3), m('菱錳石', 2), m('卡扎納爾錠', 1), m(T.巧力, 2), m('幻葉靈砂', 1)] },
    { id: 'wp_nin', name: '典禮屠刀', slot: '主手', series: '武器', jobs: ['忍者'],
      mats: [m('銳鈦塊', 4), m('鋒齒獸革', 1), m('黑星石', 1), m(T.巧力, 2), m('幻葉靈砂', 1)] },
    { id: 'wp_brd', name: '典禮短弓', slot: '主手', series: '武器', jobs: ['吟遊詩人'],
      mats: [m('銳鈦塊', 3), m('菱錳石', 2), m('克拉洛胡桃木木材', 1), m(T.巧力, 2), m('幻岩靈砂', 1)] },
    { id: 'wp_mch', name: '典禮重砲', slot: '主手', series: '武器', jobs: ['機工士'],
      mats: [m('銳鈦塊', 4), m('不飛鳥毛布', 1), m('黑星石', 1), m(T.巧力, 2), m('幻海靈砂', 1)] },
    { id: 'wp_dnc', name: '典禮圓月輪', slot: '主手', series: '武器', jobs: ['舞者'],
      mats: [m('銳鈦塊', 4), m('不飛鳥毛布', 1), m('落雷絹', 1), m(T.巧力, 2), m('幻海靈砂', 1)] },

    /* ===== 魔法系 · 典禮詠咒 ===== */
    { id: 'ca_head', name: '典禮詠咒兜帽', slot: '頭', series: '典禮詠咒', jobs: INT_JOBS,
      mats: [m('菱錳石', 1), m('不飛鳥毛布', 2), m('落雷絹', 1), m(T.智力, 2), m('幻葉靈砂', 1)] },
    { id: 'ca_body', name: '典禮詠咒束腰衣', slot: '身', series: '典禮詠咒', jobs: INT_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 3), m('黑星石', 1), m(T.智力, 2), m('幻岩靈砂', 1)] },
    { id: 'ca_hand', name: '典禮詠咒手套', slot: '手', series: '典禮詠咒', jobs: INT_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 1), m('卡岡圖亞革', 1), m(T.智力, 2), m('幻岩靈砂', 1)] },
    { id: 'ca_legs', name: '典禮詠咒騎兵褲', slot: '腿', series: '典禮詠咒', jobs: INT_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 3), m('卡岡圖亞革', 1), m(T.智力, 2), m('幻葉靈砂', 1)] },
    { id: 'ca_feet', name: '典禮詠咒長靴', slot: '腳', series: '典禮詠咒', jobs: INT_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 1), m('卡岡圖亞革', 1), m(T.智力, 2), m('幻海靈砂', 1)] },
    { id: 'ca_ear', name: '典禮詠咒耳墜', slot: '耳', series: '典禮詠咒', jobs: INT_JOBS,
      mats: [m('銳鈦塊', 1), m('破布木木材', 1), m('克拉洛胡桃木木材', 1), m(T.智力, 1), m('幻葉靈砂', 1)] },
    { id: 'ca_neck', name: '典禮詠咒項鏈', slot: '頸', series: '典禮詠咒', jobs: INT_JOBS,
      mats: [m('菱錳石', 1), m('破布木木材', 1), m('黑星石', 1), m(T.智力, 1), m('幻岩靈砂', 1)] },
    { id: 'ca_wrist', name: '典禮詠咒手鐲', slot: '腕', series: '典禮詠咒', jobs: INT_JOBS,
      mats: [m('鋒齒獸革', 1), m('破布木木材', 1), m('卡岡圖亞革', 1), m(T.智力, 1), m('幻岩靈砂', 1)] },
    { id: 'ca_ring', name: '典禮詠咒指環', slot: '戒', series: '典禮詠咒', jobs: INT_JOBS, note: '左右手各一，需 2 件',
      mats: [m('菱錳石', 1), m('破布木木材', 1), m('克拉洛胡桃木木材', 1), m(T.智力, 1), m('幻海靈砂', 1)] },
    { id: 'wp_blm', name: '典禮玉杖', slot: '主手', series: '武器', jobs: ['黑魔法師'],
      mats: [m('銳鈦塊', 2), m('破布木木材', 3), m('克拉洛胡桃木木材', 1), m(T.智力, 2), m('幻葉靈砂', 1)] },
    { id: 'wp_rdm', name: '典禮小劍', slot: '主手', series: '武器', jobs: ['赤魔法師'],
      mats: [m('銳鈦塊', 3), m('菱錳石', 2), m('黑星石', 1), m(T.智力, 1), m('幻葉靈砂', 1)] },
    { id: 'wp_smn', name: '典禮魔導書', slot: '主手', series: '武器', jobs: ['召喚師'],
      mats: [m('銳鈦塊', 3), m('鋒齒獸革', 2), m('重鎢墨水', 1), m(T.智力, 2), m('幻岩靈砂', 1)] },
    { id: 'wp_pct', name: '典禮平筆', slot: '主手', series: '武器', jobs: ['繪靈法師'],
      mats: [m('銳鈦塊', 3), m('不飛鳥毛布', 2), m('重鎢墨水', 1), m(T.智力, 2), m('幻海靈砂', 1)] },

    /* ===== 治療系 · 典禮治癒 ===== */
    { id: 'he_head', name: '典禮治癒兜帽', slot: '頭', series: '典禮治癒', jobs: MND_JOBS,
      mats: [m('不飛鳥毛布', 2), m('菱錳石', 1), m('落雷絹', 1), m(T.意力, 2), m('幻葉靈砂', 1)] },
    { id: 'he_body', name: '典禮治癒束腰衣', slot: '身', series: '典禮治癒', jobs: MND_JOBS,
      mats: [m('不飛鳥毛布', 3), m('鋒齒獸革', 2), m('黑星石', 1), m(T.意力, 2), m('幻岩靈砂', 1)] },
    { id: 'he_hand', name: '典禮治癒手套', slot: '手', series: '典禮治癒', jobs: MND_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 1), m('卡岡圖亞革', 1), m(T.意力, 2), m('幻岩靈砂', 1)] },
    { id: 'he_legs', name: '典禮治癒騎兵褲', slot: '腿', series: '典禮治癒', jobs: MND_JOBS,
      mats: [m('不飛鳥毛布', 3), m('鋒齒獸革', 2), m('卡岡圖亞革', 1), m(T.意力, 2), m('幻葉靈砂', 1)] },
    { id: 'he_feet', name: '典禮治癒長靴', slot: '腳', series: '典禮治癒', jobs: MND_JOBS,
      mats: [m('鋒齒獸革', 2), m('不飛鳥毛布', 1), m('卡岡圖亞革', 1), m(T.意力, 2), m('幻海靈砂', 1)] },
    { id: 'he_ear', name: '典禮治癒耳墜', slot: '耳', series: '典禮治癒', jobs: MND_JOBS,
      mats: [m('破布木木材', 1), m('銳鈦塊', 1), m('克拉洛胡桃木木材', 1), m(T.意力, 1), m('幻葉靈砂', 1)] },
    { id: 'he_neck', name: '典禮治癒項鏈', slot: '頸', series: '典禮治癒', jobs: MND_JOBS,
      mats: [m('破布木木材', 1), m('菱錳石', 1), m('黑星石', 1), m(T.意力, 1), m('幻岩靈砂', 1)] },
    { id: 'he_wrist', name: '典禮治癒手鐲', slot: '腕', series: '典禮治癒', jobs: MND_JOBS,
      mats: [m('破布木木材', 1), m('鋒齒獸革', 1), m('卡岡圖亞革', 1), m(T.意力, 1), m('幻岩靈砂', 1)] },
    { id: 'he_ring', name: '典禮治癒指環', slot: '戒', series: '典禮治癒', jobs: MND_JOBS, note: '左右手各一，需 2 件',
      mats: [m('破布木木材', 1), m('菱錳石', 1), m('克拉洛胡桃木木材', 1), m(T.意力, 1), m('幻海靈砂', 1)] },
    { id: 'wp_whm', name: '典禮幻杖', slot: '主手', series: '武器', jobs: ['白魔法師'],
      mats: [m('菱錳石', 2), m('銳鈦塊', 3), m('克拉洛胡桃木木材', 1), m(T.意力, 2), m('幻岩靈砂', 1)] },
    { id: 'wp_sch', name: '典禮魔導典', slot: '主手', series: '武器', jobs: ['學者'],
      mats: [m('銳鈦塊', 3), m('鋒齒獸革', 2), m('重鎢墨水', 1), m(T.意力, 2), m('幻海靈砂', 1)] },
    { id: 'wp_ast', name: '典禮黃道儀', slot: '主手', series: '武器', jobs: ['占星術士'],
      mats: [m('菱錳石', 3), m('不飛鳥毛布', 2), m('落雷絹', 1), m(T.意力, 2), m('幻海靈砂', 1)] },
    { id: 'wp_sge', name: '典禮振空擺', slot: '主手', series: '武器', jobs: ['賢者'],
      mats: [m('菱錳石', 3), m('銳鈦塊', 2), m('黑星石', 1), m(T.意力, 2), m('幻岩靈砂', 1)] }
  ];

  global.FFDATA = {
    ilvl: 740,
    slots: SLOTS,
    slotGroup: SLOT_GROUP,
    roles: ROLES,
    items: ITEMS,
    intermediate: INTERMEDIATE,
    matCategory: MAT_CATEGORY
  };
})(window);
