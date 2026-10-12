export const rods=[
 {name:'港の船竿セット',depth:12,price:0,fish:['イワシ','サバ'],detail:'軽い竿と小型リール。港沖の群れを狙う。'},
 {name:'沖のライトセット',depth:30,price:180,fish:['サバ','カツオ'],detail:'30mの潮へ。横切るカツオの群れが新しい目標。'},
 {name:'外洋の船竿セット',depth:60,price:650,fish:['カツオ','ビンチョウ'],detail:'切り身仕掛けと合わせ、外洋のビンチョウを狙う。'},
 {name:'回遊の大物セット',depth:100,price:1600,fish:['キハダ','クロマグロ'],detail:'活きエサ仕掛けと合わせ、浅めの回遊マグロを狙う。'},
 {name:'深場の電動セット',depth:150,price:3400,fish:['メバチ','大型クロマグロ'],detail:'深場の大物仕掛けでメバチへ。重量上限も伸びる。'},
 {name:'遠征の夢追いセット',depth:200,price:6200,fish:['巨大クロマグロ'],detail:'特選仕掛けと金色の投入で、240kgの夢の記録へ。'}
];
export const baits=[
 {name:'基本のサビキ',capacity:3,price:0,fish:['イワシ','サバ','カツオ'],detail:'群れを選んで3尾。小魚を避けて大物の枠を残せる。',attract:.006},
 {name:'寄せエサ仕掛け',capacity:4,price:140,fish:['イワシ','サバ','カツオ'],detail:'保持4尾。群れが少し寄り、狙った一尾に合わせやすい。',attract:.014},
 {name:'沖の切り身仕掛け',capacity:5,price:480,fish:['ビンチョウ'],detail:'外洋の竿と合わせて解放。25〜90mの回遊を狙う。',attract:.022},
 {name:'大物の活きエサ仕掛け',capacity:6,price:1100,fish:['キハダ','クロマグロ'],detail:'回遊の大物竿で解放。18〜85mにもマグロが現れる。',attract:.03},
 {name:'深場の大物仕掛け',capacity:7,price:2300,fish:['メバチ','大型クロマグロ'],detail:'深場の電動竿で解放。メバチと200kgまでの記録を狙う。',attract:.038},
 {name:'遠征の特選仕掛け',capacity:8,price:4000,fish:['巨大クロマグロ'],detail:'遠征の夢追いセットで、投入をぴたりと合わせ深い棚の巨大魚を狙う。',attract:.046}
];
export const habitats=[
 {rod:0,bait:0,from:1,to:18,school:4,motion:'school'},
 {rod:0,bait:0,from:3,to:35,school:3,motion:'school'},
 {rod:1,bait:0,from:10,to:42,school:2,motion:'dash'},
 {rod:2,bait:2,from:25,to:90,school:2,motion:'cruise'},
 {rod:4,bait:4,from:80,to:180,school:1,motion:'slow'},
 {rod:3,bait:3,from:18,to:85,school:1,motion:'dash'},
 {rod:3,bait:3,from:25,to:95,school:1,motion:'power'}
];
export const bands=[{name:'陽ざしの海',from:0,to:20,color:'#27acac'},{name:'青の潮',from:20,to:60,color:'#167b91'},{name:'群青の沖',from:60,to:120,color:'#174962'},{name:'深い黒潮',from:120,to:200,color:'#10293f'}];
export const hints=['1〜18mの細い群れ。基本装備で出会える。','3〜35mをまとまって泳ぐ。背の縞が目印。','沖のライトセットで解放。10〜42mを素早く横切る。','外洋の船竿＋切り身仕掛け。25〜90mのゆったりした回遊。','深場の電動竿＋深場の大物仕掛け。80〜180mを探す。','回遊の大物竿＋活きエサ。18〜85mの明るい潮にも現れる。','回遊の大物竿＋活きエサ。25〜95mの太い魚影。遠征の夢追いセットと遠征の特選仕掛けをそろえ、投入をぴたりと合わせて深い棚を探ろう。'];
export const ecology=['細い銀色の体で群れて泳ぐ。','青い背の模様が目印。','紡錘形の体と腹の縞が目印。','長い胸びれが特徴のマグロ。','大きな目が名前の由来のマグロ。','黄色いひれが印象的なマグロ。','太い体と強い尾をもつマグロ。'];
export const channelVideos={5:{url:'https://www.youtube.com/watch?v=CQHhatY9ieI',label:'キハダの実釣動画を見る'},6:{url:'https://www.youtube.com/watch?v=wOjp42P2mKU',label:'クロマグロの実釣動画を見る'}};
