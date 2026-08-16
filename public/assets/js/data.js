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

  // 製作素材 → 子素材。gather（限時採集材料）與 scrip（神典石材料）**兩種都要**，不是二選一。
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

  // XIVAPI v2 Item.Icon.path_hr1（典禮系列 IL 740）。
  // 圖片由 XIVAPI 的 asset endpoint 提供，名稱與素材計算仍維持本站的繁中資料。
  var ITEM_ICON_PATHS = {
    tk_head: 'ui/icon/056000/056825_hr1.tex', tk_body: 'ui/icon/057000/057217_hr1.tex', tk_hand: 'ui/icon/056000/056332_hr1.tex', tk_legs: 'ui/icon/057000/057742_hr1.tex', tk_feet: 'ui/icon/057000/057834_hr1.tex',
    tk_ear: 'ui/icon/055000/055549_hr1.tex', tk_neck: 'ui/icon/055000/055100_hr1.tex', tk_wrist: 'ui/icon/055000/055898_hr1.tex', tk_ring: 'ui/icon/054000/054750_hr1.tex',
    wp_pld: 'ui/icon/030000/030690_hr1.tex', wp_shd: 'ui/icon/030000/030279_hr1.tex', wp_war: 'ui/icon/031000/031264_hr1.tex', wp_drk: 'ui/icon/034000/034019_hr1.tex', wp_gnb: 'ui/icon/036000/036110_hr1.tex',
    dg_head: 'ui/icon/056000/056826_hr1.tex', dg_body: 'ui/icon/057000/057218_hr1.tex', dg_hand: 'ui/icon/056000/056333_hr1.tex', dg_legs: 'ui/icon/057000/057745_hr1.tex', dg_feet: 'ui/icon/057000/057835_hr1.tex',
    st_ear: 'ui/icon/055000/055549_hr1.tex', st_neck: 'ui/icon/055000/055100_hr1.tex', st_wrist: 'ui/icon/055000/055898_hr1.tex', st_ring: 'ui/icon/054000/054750_hr1.tex',
    wp_drg: 'ui/icon/031000/031666_hr1.tex', wp_rpr: 'ui/icon/037000/037280_hr1.tex', wp_mnk: 'ui/icon/030000/030854_hr1.tex', wp_sam: 'ui/icon/036000/036568_hr1.tex',
    mk_head: 'ui/icon/056000/056830_hr1.tex', mk_body: 'ui/icon/057000/057221_hr1.tex', mk_hand: 'ui/icon/056000/056336_hr1.tex', mk_legs: 'ui/icon/057000/057746_hr1.tex', mk_feet: 'ui/icon/057000/057838_hr1.tex',
    vp_head: 'ui/icon/056000/056831_hr1.tex', vp_body: 'ui/icon/057000/057223_hr1.tex', vp_hand: 'ui/icon/056000/056338_hr1.tex', vp_legs: 'ui/icon/057000/057748_hr1.tex', vp_feet: 'ui/icon/057000/057840_hr1.tex',
    rn_head: 'ui/icon/056000/056827_hr1.tex', rn_body: 'ui/icon/057000/057222_hr1.tex', rn_hand: 'ui/icon/056000/056337_hr1.tex', rn_legs: 'ui/icon/057000/057747_hr1.tex', rn_feet: 'ui/icon/057000/057839_hr1.tex',
    dx_ear: 'ui/icon/055000/055549_hr1.tex', dx_neck: 'ui/icon/055000/055100_hr1.tex', dx_wrist: 'ui/icon/055000/055898_hr1.tex', dx_ring: 'ui/icon/054000/054750_hr1.tex',
    wp_vpr: 'ui/icon/037000/037443_hr1.tex', wp_nin: 'ui/icon/033000/033640_hr1.tex', wp_brd: 'ui/icon/032000/032054_hr1.tex', wp_mch: 'ui/icon/034000/034513_hr1.tex', wp_dnc: 'ui/icon/036000/036309_hr1.tex',
    ca_head: 'ui/icon/056000/056829_hr1.tex', ca_body: 'ui/icon/057000/057220_hr1.tex', ca_hand: 'ui/icon/056000/056335_hr1.tex', ca_legs: 'ui/icon/057000/057743_hr1.tex', ca_feet: 'ui/icon/057000/057837_hr1.tex',
    ca_ear: 'ui/icon/055000/055549_hr1.tex', ca_neck: 'ui/icon/055000/055100_hr1.tex', ca_wrist: 'ui/icon/055000/055898_hr1.tex', ca_ring: 'ui/icon/054000/054750_hr1.tex',
    wp_blm: 'ui/icon/032000/032900_hr1.tex', wp_rdm: 'ui/icon/036000/036867_hr1.tex', wp_smn: 'ui/icon/037000/037830_hr1.tex', wp_pct: 'ui/icon/037000/037653_hr1.tex',
    he_head: 'ui/icon/056000/056828_hr1.tex', he_body: 'ui/icon/057000/057219_hr1.tex', he_hand: 'ui/icon/056000/056334_hr1.tex', he_legs: 'ui/icon/057000/057744_hr1.tex', he_feet: 'ui/icon/057000/057836_hr1.tex',
    he_ear: 'ui/icon/055000/055549_hr1.tex', he_neck: 'ui/icon/055000/055100_hr1.tex', he_wrist: 'ui/icon/055000/055898_hr1.tex', he_ring: 'ui/icon/054000/054750_hr1.tex',
    wp_whm: 'ui/icon/032000/032485_hr1.tex', wp_sch: 'ui/icon/037000/037831_hr1.tex', wp_ast: 'ui/icon/034000/034712_hr1.tex', wp_sge: 'ui/icon/037000/037076_hr1.tex'
  };

  var MATERIAL_ICON_PATHS = {
    '銳鈦塊': 'ui/icon/020000/020808_hr1.tex', '菱錳石': 'ui/icon/021000/021284_hr1.tex', '鋒齒獸革': 'ui/icon/022000/022008_hr1.tex', '不飛鳥毛布': 'ui/icon/021000/021680_hr1.tex', '破布木木材': 'ui/icon/022000/022466_hr1.tex',
    '八面體隕鐵礦石': 'ui/icon/021000/021203_hr1.tex', '夏勞尼焦炭': 'ui/icon/021000/021462_hr1.tex', '玫瑰紅紋石原石': 'ui/icon/021000/021471_hr1.tex', '新生王國研磨劑': 'ui/icon/021000/021479_hr1.tex',
    '夏勞尼咖啡豆': 'ui/icon/027000/027501_hr1.tex', '鋒齒獸的粗皮': 'ui/icon/021000/021820_hr1.tex', '胭脂蟲染料': 'ui/icon/025000/025011_hr1.tex', '不飛鳥的毛': 'ui/icon/021000/021616_hr1.tex',
    '破布木原木': 'ui/icon/022000/022414_hr1.tex', '滲透型防腐塗料': 'ui/icon/020000/020661_hr1.tex',
    '卡扎納爾錠': 'ui/icon/021000/021020_hr1.tex', '卡岡圖亞革': 'ui/icon/022000/022007_hr1.tex', '落雷絹': 'ui/icon/021000/021622_hr1.tex', '黑星石': 'ui/icon/021000/021338_hr1.tex', '克拉洛胡桃木木材': 'ui/icon/022000/022464_hr1.tex', '重鎢墨水': 'ui/icon/026000/026651_hr1.tex',
    '3級耐力之寶水': 'ui/icon/022000/022680_hr1.tex', '3級剛力之寶水': 'ui/icon/022000/022683_hr1.tex', '3級巧力之寶水': 'ui/icon/022000/022682_hr1.tex', '3級智力之寶水': 'ui/icon/022000/022679_hr1.tex', '3級意力之寶水': 'ui/icon/022000/022681_hr1.tex',
    '幻岩靈砂': 'ui/icon/021000/021234_hr1.tex', '幻葉靈砂': 'ui/icon/021000/021236_hr1.tex', '幻海靈砂': 'ui/icon/021000/021229_hr1.tex'
  };

  ITEMS.forEach(function (item) { item.iconPath = ITEM_ICON_PATHS[item.id] || null; });

  global.FFDATA = {
    ilvl: 740,
    slots: SLOTS,
    slotGroup: SLOT_GROUP,
    roles: ROLES,
    items: ITEMS,
    intermediate: INTERMEDIATE,
    matCategory: MAT_CATEGORY,
    materialIconPaths: MATERIAL_ICON_PATHS
  };
})(window);
