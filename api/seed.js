/**
 * POST /api/seed  (requires x-admin-password header)
 *
 * One-time seed of the 154 original products.
 * Idempotent: skips if the products table is non-empty.
 * Call once after setting up the Supabase database.
 */
const { getSupabase, checkAdminPassword, ok, fail, setCors } = require('./_lib');

const SEED_PRODUCTS = [
  // POTTERY — মাটির পণ্য (32)
  {id:'1',  name:'Clay Pot 1',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_1.jpg',  price:450,  badge:'hot'},
  {id:'2',  name:'Clay Pot 2',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_2.jpg',  price:380,  badge:''},
  {id:'3',  name:'Clay Pot 3',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_3.jpg',  price:520,  badge:'new'},
  {id:'4',  name:'Clay Pot 4',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_4.jpg',  price:400,  badge:''},
  {id:'5',  name:'Clay Pot 5',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_5.jpg',  price:480,  badge:''},
  {id:'6',  name:'Clay Pot 6',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_6.jpg',  price:350,  badge:'hot'},
  {id:'7',  name:'Clay Pot 7',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_7.jpg',  price:600,  badge:''},
  {id:'8',  name:'Clay Pot 8',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_8.jpg',  price:420,  badge:''},
  {id:'9',  name:'Clay Pot 9',  name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_9.jpg',  price:550,  badge:'new'},
  {id:'10', name:'Clay Pot 10', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_10.jpg', price:390,  badge:''},
  {id:'11', name:'Clay Pot 11', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_11.jpg', price:500,  badge:''},
  {id:'12', name:'Clay Pot 12', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_12.jpg', price:460,  badge:'hot'},
  {id:'13', name:'Clay Pot 13', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_13.jpg', price:430,  badge:''},
  {id:'14', name:'Clay Pot 14', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_14.jpg', price:510,  badge:''},
  {id:'15', name:'Clay Pot 15', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_15.jpg', price:370,  badge:'new'},
  {id:'16', name:'Clay Pot 16', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_16.jpg', price:490,  badge:''},
  {id:'17', name:'Clay Pot 17', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_17.jpg', price:440,  badge:''},
  {id:'18', name:'Clay Pot 18', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_18.jpg', price:580,  badge:''},
  {id:'19', name:'Clay Pot 19', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_19.jpg', price:360,  badge:'hot'},
  {id:'20', name:'Clay Pot 20', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_20.jpg', price:420,  badge:''},
  {id:'21', name:'Clay Pot 21', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_21.jpg', price:530,  badge:''},
  {id:'22', name:'Clay Pot 22', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_22.jpg', price:410,  badge:'new'},
  {id:'23', name:'Clay Pot 23', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_23.jpg', price:470,  badge:''},
  {id:'24', name:'Clay Pot 24', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_24.jpg', price:395,  badge:''},
  {id:'25', name:'Clay Pot 25', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_25.jpg', price:560,  badge:''},
  {id:'26', name:'Clay Pot 26', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_26.jpg', price:340,  badge:'hot'},
  {id:'27', name:'Clay Pot 27', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_27.jpg', price:480,  badge:''},
  {id:'28', name:'Clay Pot 28', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_28.jpg', price:520,  badge:''},
  {id:'29', name:'Clay Pot 29', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_29.jpg', price:445,  badge:'new'},
  {id:'30', name:'Clay Pot 30', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_30.jpg', price:390,  badge:''},
  {id:'31', name:'Clay Pot 31', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_31.jpg', price:500,  badge:''},
  {id:'32', name:'Clay Pot 32', name_bn:'মাটির পাত্র', category:'Pottery',       image_url:'images/pottery/pottery_32.jpg', price:460,  badge:''},
  // STEEL PRODUCTS — রডের আইটেম (23)
  {id:'33', name:'Steel Item 1',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_1.jpg',  price:850,  badge:'hot'},
  {id:'34', name:'Steel Item 2',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_2.jpg',  price:1200, badge:''},
  {id:'35', name:'Steel Item 3',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_3.jpg',  price:950,  badge:'new'},
  {id:'36', name:'Steel Item 4',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_4.jpg',  price:780,  badge:''},
  {id:'37', name:'Steel Item 5',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_5.jpg',  price:1100, badge:''},
  {id:'38', name:'Steel Item 6',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_6.jpg',  price:650,  badge:'hot'},
  {id:'39', name:'Steel Item 7',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_7.jpg',  price:1350, badge:''},
  {id:'40', name:'Steel Item 8',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_8.jpg',  price:900,  badge:''},
  {id:'41', name:'Steel Item 9',  name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_9.jpg',  price:1050, badge:'new'},
  {id:'42', name:'Steel Item 10', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_10.jpg', price:820,  badge:''},
  {id:'43', name:'Steel Item 11', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_11.jpg', price:1400, badge:'hot'},
  {id:'44', name:'Steel Item 12', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_12.jpg', price:980,  badge:''},
  {id:'45', name:'Steel Item 13', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_13.jpg', price:750,  badge:''},
  {id:'46', name:'Steel Item 14', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_14.jpg', price:1150, badge:'new'},
  {id:'47', name:'Steel Item 15', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_15.jpg', price:880,  badge:''},
  {id:'48', name:'Steel Item 16', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_16.jpg', price:1280, badge:''},
  {id:'49', name:'Steel Item 17', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_17.jpg', price:720,  badge:'hot'},
  {id:'50', name:'Steel Item 18', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_18.jpg', price:1000, badge:''},
  {id:'51', name:'Steel Item 19', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_19.jpg', price:930,  badge:''},
  {id:'52', name:'Steel Item 20', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_20.jpg', price:1180, badge:'new'},
  {id:'53', name:'Steel Item 21', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_21.jpg', price:860,  badge:''},
  {id:'54', name:'Steel Item 22', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_22.jpg', price:1320, badge:''},
  {id:'55', name:'Steel Item 23', name_bn:'রডের আইটেম', category:'Steel Products', image_url:'images/steel/steel_23.jpg', price:970,  badge:'hot'},
  // WOOD CRAFT — কাঠের পণ্য (19)
  {id:'56', name:'Wood Craft 1',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_1.jpg',    price:1100, badge:''},
  {id:'57', name:'Wood Craft 2',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_2.jpg',    price:850,  badge:'hot'},
  {id:'58', name:'Wood Craft 3',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_3.jpg',    price:1400, badge:'new'},
  {id:'59', name:'Wood Craft 4',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_4.jpg',    price:950,  badge:''},
  {id:'60', name:'Wood Craft 5',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_5.jpg',    price:1250, badge:''},
  {id:'61', name:'Wood Craft 6',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_6.jpg',    price:780,  badge:'hot'},
  {id:'62', name:'Wood Craft 7',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_7.jpg',    price:1600, badge:''},
  {id:'63', name:'Wood Craft 8',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_8.jpg',    price:1050, badge:''},
  {id:'64', name:'Wood Craft 9',  name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_9.jpg',    price:920,  badge:'new'},
  {id:'65', name:'Wood Craft 10', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_10.jpg',   price:1300, badge:''},
  {id:'66', name:'Wood Craft 11', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_11.jpg',   price:880,  badge:''},
  {id:'67', name:'Wood Craft 12', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_12.jpg',   price:1450, badge:'hot'},
  {id:'68', name:'Wood Craft 13', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_13.jpg',   price:1000, badge:''},
  {id:'69', name:'Wood Craft 14', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_14.jpg',   price:1150, badge:'new'},
  {id:'70', name:'Wood Craft 15', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_15.jpg',   price:830,  badge:''},
  {id:'71', name:'Wood Craft 16', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_16.jpg',   price:1350, badge:''},
  {id:'72', name:'Wood Craft 17', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_17.jpg',   price:960,  badge:'hot'},
  {id:'73', name:'Wood Craft 18', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_18.jpg',   price:1200, badge:''},
  {id:'74', name:'Wood Craft 19', name_bn:'কাঠের শিল্প', category:'Wood Craft',    image_url:'images/wood/wood_19.jpg',   price:1080, badge:'new'},
  // JUTE GOODS — পাটের পণ্য (35)
  {id:'75',  name:'Jute Item 1',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_1.jpg',    price:480,  badge:'hot'},
  {id:'76',  name:'Jute Item 2',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_2.jpg',    price:350,  badge:''},
  {id:'77',  name:'Jute Item 3',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_3.jpg',    price:620,  badge:'new'},
  {id:'78',  name:'Jute Item 4',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_4.jpg',    price:400,  badge:''},
  {id:'79',  name:'Jute Item 5',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_5.jpg',    price:520,  badge:''},
  {id:'80',  name:'Jute Item 6',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_6.jpg',    price:380,  badge:'hot'},
  {id:'81',  name:'Jute Item 7',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_7.jpg',    price:680,  badge:''},
  {id:'82',  name:'Jute Item 8',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_8.jpg',    price:440,  badge:''},
  {id:'83',  name:'Jute Item 9',  name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_9.jpg',    price:580,  badge:'new'},
  {id:'84',  name:'Jute Item 10', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_10.jpg',   price:320,  badge:''},
  {id:'85',  name:'Jute Item 11', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_11.jpg',   price:560,  badge:'hot'},
  {id:'86',  name:'Jute Item 12', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_12.jpg',   price:420,  badge:''},
  {id:'87',  name:'Jute Item 13', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_13.jpg',   price:650,  badge:''},
  {id:'88',  name:'Jute Item 14', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_14.jpg',   price:370,  badge:'new'},
  {id:'89',  name:'Jute Item 15', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_15.jpg',   price:500,  badge:''},
  {id:'90',  name:'Jute Item 16', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_16.jpg',   price:460,  badge:''},
  {id:'91',  name:'Jute Item 17', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_17.jpg',   price:720,  badge:'hot'},
  {id:'92',  name:'Jute Item 18', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_18.jpg',   price:395,  badge:''},
  {id:'93',  name:'Jute Item 19', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_19.jpg',   price:540,  badge:'new'},
  {id:'94',  name:'Jute Item 20', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_20.jpg',   price:410,  badge:''},
  {id:'95',  name:'Jute Item 21', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_21.jpg',   price:600,  badge:''},
  {id:'96',  name:'Jute Item 22', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_22.jpg',   price:355,  badge:'hot'},
  {id:'97',  name:'Jute Item 23', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_23.jpg',   price:480,  badge:''},
  {id:'98',  name:'Jute Item 24', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_24.jpg',   price:630,  badge:'new'},
  {id:'99',  name:'Jute Item 25', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_25.jpg',   price:385,  badge:''},
  {id:'100', name:'Jute Item 26', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_26.jpg',   price:510,  badge:''},
  {id:'101', name:'Jute Item 27', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_27.jpg',   price:440,  badge:'hot'},
  {id:'102', name:'Jute Item 28', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_28.jpg',   price:690,  badge:''},
  {id:'103', name:'Jute Item 29', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_29.jpg',   price:360,  badge:'new'},
  {id:'104', name:'Jute Item 30', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_30.jpg',   price:575,  badge:''},
  {id:'105', name:'Jute Item 31', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_31.jpg',   price:420,  badge:''},
  {id:'106', name:'Jute Item 32', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_32.jpg',   price:490,  badge:'hot'},
  {id:'107', name:'Jute Item 33', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_33.jpg',   price:340,  badge:''},
  {id:'108', name:'Jute Item 34', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_34.jpg',   price:620,  badge:'new'},
  {id:'109', name:'Jute Item 35', name_bn:'পাটের পণ্য', category:'Jute Goods',    image_url:'images/jute/jute_35.jpg',   price:455,  badge:''},
  // BAMBOO CRAFT — বাঁশের শিল্প (25)
  {id:'110', name:'Bamboo Craft 1',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_1.jpg',  price:380,  badge:'hot'},
  {id:'111', name:'Bamboo Craft 2',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_2.jpg',  price:520,  badge:''},
  {id:'112', name:'Bamboo Craft 3',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_3.jpg',  price:450,  badge:'new'},
  {id:'113', name:'Bamboo Craft 4',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_4.jpg',  price:680,  badge:''},
  {id:'114', name:'Bamboo Craft 5',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_5.jpg',  price:320,  badge:''},
  {id:'115', name:'Bamboo Craft 6',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_6.jpg',  price:580,  badge:'hot'},
  {id:'116', name:'Bamboo Craft 7',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_7.jpg',  price:410,  badge:''},
  {id:'117', name:'Bamboo Craft 8',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_8.jpg',  price:750,  badge:'new'},
  {id:'118', name:'Bamboo Craft 9',  name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_9.jpg',  price:490,  badge:''},
  {id:'119', name:'Bamboo Craft 10', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_10.jpg', price:360,  badge:''},
  {id:'120', name:'Bamboo Craft 11', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_11.jpg', price:620,  badge:'hot'},
  {id:'121', name:'Bamboo Craft 12', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_12.jpg', price:440,  badge:''},
  {id:'122', name:'Bamboo Craft 13', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_13.jpg', price:550,  badge:'new'},
  {id:'123', name:'Bamboo Craft 14', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_14.jpg', price:390,  badge:''},
  {id:'124', name:'Bamboo Craft 15', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_15.jpg', price:700,  badge:''},
  {id:'125', name:'Bamboo Craft 16', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_16.jpg', price:470,  badge:'hot'},
  {id:'126', name:'Bamboo Craft 17', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_17.jpg', price:340,  badge:''},
  {id:'127', name:'Bamboo Craft 18', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_18.jpg', price:590,  badge:'new'},
  {id:'128', name:'Bamboo Craft 19', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_19.jpg', price:430,  badge:''},
  {id:'129', name:'Bamboo Craft 20', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_20.jpg', price:660,  badge:''},
  {id:'130', name:'Bamboo Craft 21', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_21.jpg', price:375,  badge:'hot'},
  {id:'131', name:'Bamboo Craft 22', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_22.jpg', price:510,  badge:''},
  {id:'132', name:'Bamboo Craft 23', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_23.jpg', price:460,  badge:'new'},
  {id:'133', name:'Bamboo Craft 24', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_24.jpg', price:720,  badge:''},
  {id:'134', name:'Bamboo Craft 25', name_bn:'বাঁশের শিল্প', category:'Bamboo Craft', image_url:'images/bamboo/bamboo_25.jpg', price:395,  badge:''},
  // MISCELLANEOUS — বিবিধ (12)
  {id:'135', name:'Misc Item 1',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_1.jpg',  price:950,  badge:'hot'},
  {id:'136', name:'Misc Item 2',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_2.jpg',  price:1200, badge:''},
  {id:'137', name:'Misc Item 3',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_3.jpg',  price:780,  badge:'new'},
  {id:'138', name:'Misc Item 4',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_4.jpg',  price:1500, badge:''},
  {id:'139', name:'Misc Item 5',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_5.jpg',  price:880,  badge:''},
  {id:'140', name:'Misc Item 6',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_6.jpg',  price:1100, badge:'hot'},
  {id:'141', name:'Misc Item 7',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_7.jpg',  price:650,  badge:''},
  {id:'142', name:'Misc Item 8',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_8.jpg',  price:1350, badge:'new'},
  {id:'143', name:'Misc Item 9',  name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_9.jpg',  price:920,  badge:''},
  {id:'144', name:'Misc Item 10', name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_10.jpg', price:1050, badge:''},
  {id:'145', name:'Misc Item 11', name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_11.jpg', price:750,  badge:'hot'},
  {id:'146', name:'Misc Item 12', name_bn:'বিবিধ পণ্য', category:'Miscellaneous',  image_url:'images/misc/misc_12.jpg', price:1180, badge:'new'},
  // MINI AQUARIUM — মিনি একুরিয়াম (8)
  {id:'147', name:'Mini Aquarium 1', name_bn:'মিনি একুরিয়াম', category:'Mini Aquarium', image_url:'images/aquarium/aquarium_1.jpg', price:1800, badge:'hot'},
  {id:'148', name:'Mini Aquarium 2', name_bn:'মিনি একুরিয়াম', category:'Mini Aquarium', image_url:'images/aquarium/aquarium_2.jpg', price:2200, badge:''},
  {id:'149', name:'Mini Aquarium 3', name_bn:'মিনি একুরিয়াম', category:'Mini Aquarium', image_url:'images/aquarium/aquarium_3.jpg', price:1500, badge:'new'},
  {id:'150', name:'Mini Aquarium 4', name_bn:'মিনি একুরিয়াম', category:'Mini Aquarium', image_url:'images/aquarium/aquarium_4.jpg', price:2500, badge:''},
  {id:'151', name:'Mini Aquarium 5', name_bn:'মিনি একুরিয়াম', category:'Mini Aquarium', image_url:'images/aquarium/aquarium_5.jpg', price:1950, badge:''},
  {id:'152', name:'Mini Aquarium 6', name_bn:'মিনি একুরিয়াম', category:'Mini Aquarium', image_url:'images/aquarium/aquarium_6.jpg', price:2800, badge:'hot'},
  {id:'153', name:'Mini Aquarium 7', name_bn:'মিনি একুরিয়াম', category:'Mini Aquarium', image_url:'images/aquarium/aquarium_7.jpg', price:1650, badge:'new'},
  {id:'154', name:'Mini Aquarium 8', name_bn:'মিনি একুরিয়াম', category:'Mini Aquarium', image_url:'images/aquarium/aquarium_8.jpg', price:3000, badge:''},
];

module.exports = async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return fail(res, 405, 'Method not allowed');
  if (!checkAdminPassword(req)) return fail(res, 401, 'Unauthorized');

  try {
    const supabase = getSupabase();

    // Check if products already exist — skip if non-empty (idempotent)
    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true });
    if (count > 0) return ok(res, { skipped: true, message: `Already seeded (${count} products exist). Delete all products first to re-seed.` });

    const now = new Date().toISOString();
    const rows = SEED_PRODUCTS.map((p, i) => ({
      ...p,
      description: p.description || '',
      active:      true,
      sort_order:  i,
      created_at:  now,
      updated_at:  now,
    }));

    // Insert in batches of 50 to stay under Supabase request size limits
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase.from('products').insert(batch);
      if (error) throw error;
    }

    return ok(res, { inserted: rows.length, message: `Seeded ${rows.length} products successfully.` });
  } catch (e) {
    console.error('seed error:', e);
    return fail(res, 500, e.message);
  }
};
