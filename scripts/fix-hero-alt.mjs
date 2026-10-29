/**
 * 第五轮 · 首图专项
 *
 * Pest Control 的 Insect 文章原先共用一个子栏目插画，featuredImageAlt 里却写着
 * 「手电筒照床垫缝」「黄蜂巢在屋檐下」这类根本不存在的场景。
 * 现在每篇都配了独立首图，alt 必须如实描述那张图。
 *
 * 用法：node scripts/fix-hero-alt.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';

const ALT = {
  'cockroaches-in-an-apartment':
    'Flat illustration of a brown cockroach crossing a tiled floor past scattered crumbs and a sage green bowl',
  'bed-bugs-or-something-else':
    'Flat illustration of a reddish-brown bed bug seen from above beside a white sheet folded into soft curves',
  'boxelder-bugs-fall-invasion':
    'Flat illustration of three black and red-orange boxelder bugs clustered together on a plain cream surface',
  'carpet-beetles-in-house':
    'Flat illustration of a mottled brown carpet beetle beside the rolled edge of a beige wool rug',
  'clothes-moths-vs-pantry-moths':
    'Flat illustration of a pale clothes moth resting on a stack of folded wool sweaters beside a tuft of wool fibre',
  'cluster-flies-in-the-attic':
    'Flat illustration of three dark grey cluster flies resting in a row on a pale wooden board',
  'drain-flies-in-the-bathroom':
    'Flat illustration of a fuzzy-winged drain fly resting on a pale tile beside a round metal drain cover',
  'earwigs-in-the-house':
    'Flat illustration of a dark brown earwig with rear pincers standing on a folded sage green cloth',
  'fleas-without-pets':
    'Flat illustration of a small dark flea beside a fine-toothed metal flea comb',
  'fruit-flies-keep-coming-back':
    'Flat illustration of fruit flies hovering above a glass jar of amber liquid beside a ripe peach',
  'get-rid-of-ants-in-the-kitchen':
    'Flat illustration of a line of black ants walking along the rim of a spoon filled with sugar',
  'house-centipedes':
    'Flat illustration of a pale yellow house centipede with long banded legs on a cream floor beside a small grey stone',
  'pantry-moths-vs-fruit-flies':
    'Flat illustration of a greyish moth perched on the rim of a glass jar filled with grain',
  'silverfish-what-they-eat':
    'Flat illustration of a silver-grey silverfish with long antennae beside a stack of two old books',
  'spiders-in-the-basement':
    'Flat illustration of a pale cellar spider with very long thin legs beside a small open cardboard box',
  'springtails-in-house':
    'Flat illustration of tiny pale springtails gathered on a damp patch beside a potted fern',
  'stink-bugs-in-the-house':
    'Flat illustration of a brown shield-shaped stink bug on a windowsill beside a single green leaf',
  'wasp-nest-when-to-call-a-professional':
    'Flat illustration of a paper wasp nest with open cells hanging from a wooden beam beside two wasps',
  'squirrels-in-the-attic':
    'Flat illustration of a grey squirrel sitting upright beside a small pile of acorns and a cut tree stump',
};

let changed = 0;
for (const [slug, alt] of Object.entries(ALT)) {
  const file = path.join(DIR, `${slug}.md`);
  if (!fs.existsSync(file)) {
    console.log(`跳过（文件不存在）: ${slug}`);
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  if (!/^featuredImageAlt:.*$/m.test(src)) {
    console.log(`跳过（无 featuredImageAlt 行）: ${slug}`);
    continue;
  }
  const next = src.replace(/^featuredImageAlt:.*$/m, `featuredImageAlt: "${alt}"`);
  if (next !== src) {
    fs.writeFileSync(file, next);
    changed++;
    console.log(`✓ ${slug}`);
  }
}
console.log(`\n共更新 ${changed} 篇`);
