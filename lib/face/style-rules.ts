/** Makeup / hair / clothing advice for the current face — the "not ready for surgery" path. */
import type { Bi } from '../i18n';
import type { FaceMetrics, FaceShape } from './measure';
import type { FaceReport } from './reading-rules';
import type { ProfileMetrics } from './profile';

export type StyleCategory = 'makeup' | 'hair' | 'clothing';
export type StyleTip = { title: Bi; text: Bi };

export const SHAPE_NAMES: Record<FaceShape, Bi> = {
  oval: { th: 'รูปไข่', en: 'Oval' },
  round: { th: 'กลม', en: 'Round' },
  square: { th: 'เหลี่ยม', en: 'Square' },
  heart: { th: 'หัวใจ', en: 'Heart' },
  long: { th: 'ยาว', en: 'Long' },
  diamond: { th: 'ข้าวหลามตัด', en: 'Diamond' },
};

export const SHAPE_SUMMARY: Record<FaceShape, Bi> = {
  oval: { th: 'โครงหน้าสมดุล เข้าได้กับแทบทุกสไตล์ เน้นรักษาความสมดุลไว้', en: 'A balanced outline that suits almost any style — focus on keeping that balance.' },
  round: { th: 'ความกว้างและความยาวใกล้เคียงกัน แก้มอิ่ม เน้นเพิ่มเส้นแนวตั้งให้หน้าดูยาวขึ้น', en: 'Width and length are similar with soft cheeks — add vertical lines to lengthen.' },
  square: { th: 'กรามชัด หน้าผากและกรามกว้างใกล้กัน เน้นลดความเหลี่ยมด้วยเส้นโค้ง', en: 'A defined jaw with forehead and jaw of similar width — soften angles with curves.' },
  heart: { th: 'หน้าผากกว้าง คางเรียว เน้นเพิ่มน้ำหนักที่ช่วงล่างของใบหน้า', en: 'A wider forehead and tapered chin — add weight to the lower face.' },
  long: { th: 'ใบหน้ายาวกว่ากว้าง เน้นเพิ่มเส้นแนวนอนให้หน้าดูสั้นและกว้างขึ้น', en: 'Longer than wide — add horizontal lines to shorten and widen.' },
  diamond: { th: 'โหนกแก้มกว้างที่สุด หน้าผากและคางเรียว เน้นเติมความกว้างที่หน้าผากและคาง', en: 'Cheekbones are widest with a narrow forehead and chin — add width at the forehead and chin.' },
};

const B = (th: string, en: string): Bi => ({ th, en });

const BY_SHAPE: Record<FaceShape, Record<StyleCategory, StyleTip[]>> = {
  oval: {
    makeup: [
      { title: B('คอนทัวร์เบาๆ', 'Light contour'), text: B('แค่แรเงาใต้โหนกแก้มบางๆ เพื่อเพิ่มมิติ ไม่ต้องปรับโครงหน้า', 'Just a soft shade under the cheekbones for dimension — no reshaping needed.') },
      { title: B('ปัดแก้มกลางแก้ม', 'Blush on the apples'), text: B('ปัดบลัชวงกลมบนกระพุ้งแก้มให้หน้าดูสดใส', 'Round blush on the apples for a fresh look.') },
      { title: B('เลือกจุดเด่นจุดเดียว', 'One focal point'), text: B('เน้นตาหรือปากอย่างใดอย่างหนึ่งให้ลุคดูตั้งใจ', 'Emphasise either eyes or lips for an intentional look.') },
    ],
    hair: [
      { title: B('เกือบทุกทรง', 'Almost any cut'), text: B('ตั้งแต่ผมสั้นบ็อบถึงผมยาวเลเยอร์ เลือกตามไลฟ์สไตล์ได้เลย', 'From bobs to long layers — choose by lifestyle.') },
      { title: B('ลองแสกกลาง', 'Try a centre part'), text: B('ใบหน้าสมมาตรรับกับการแสกกลางได้ดี', 'A balanced face carries a centre part well.') },
      { title: B('หน้าม้าซีทรู', 'See-through bangs'), text: B('ช่วยให้ลุคนุ่มขึ้นโดยไม่บังโครงหน้า', 'Softens the look without hiding your outline.') },
    ],
    clothing: [
      { title: B('คอเสื้อได้ทุกแบบ', 'Any neckline'), text: B('คอวี คอกลม คอเหลี่ยม ใส่ได้ทั้งหมด', 'V, crew or square necks all work.') },
      { title: B('ต่างหูทรงหยดน้ำ', 'Teardrop earrings'), text: B('รับกับรูปหน้าและไม่รบกวนสัดส่วน', 'Echo the face shape without disturbing proportion.') },
      { title: B('แว่นทรงเหลี่ยมมน', 'Soft-square frames'), text: B('กรอบกว้างพอดีกับโหนกแก้มให้ลุคทันสมัย', 'Frames as wide as the cheekbones look modern.') },
    ],
  },
  round: {
    makeup: [
      { title: B('คอนทัวร์แนวตั้ง', 'Vertical contour'), text: B('แรเงาข้างแก้มจากขมับลงมาใต้โหนกแก้มเป็นแนวเฉียง และไฮไลต์กลางหน้าผากถึงปลายคาง', 'Shade from temple down under the cheekbone diagonally; highlight down the centre from forehead to chin.') },
      { title: B('บลัชเฉียงขึ้น', 'Lifted blush'), text: B('ปัดบลัชจากกลางแก้มเฉียงขึ้นหาขมับ เลี่ยงการปัดวงกลม', 'Sweep blush up toward the temples; avoid round circles.') },
      { title: B('คิ้วมีมุมยก', 'Angled brows'), text: B('เขียนคิ้วให้มีมุมยกเล็กน้อยช่วยเพิ่มความคม', 'A slight arch adds definition.') },
    ],
    hair: [
      { title: B('เพิ่มความสูงด้านบน', 'Height on top'), text: B('ทรงที่มีวอลุ่มโคนผมหรือเลเยอร์ยาวช่วยยืดใบหน้า', 'Root volume or long layers lengthen the face.') },
      { title: B('แสกข้าง', 'Side part'), text: B('แสกข้างสร้างเส้นเฉียงตัดความกลม', 'A side part creates diagonal lines that break the roundness.') },
      { title: B('ยาวเลยคาง', 'Past the chin'), text: B('ผมยาวเลยแนวคางลงไป เลี่ยงบ็อบสั้นระดับแก้ม', 'Keep length below the chin; avoid cheek-length bobs.') },
    ],
    clothing: [
      { title: B('คอวี', 'V-necks'), text: B('คอวีและคอลึกเพิ่มเส้นแนวตั้ง ทำให้หน้าดูเรียวยาว', 'V and deep necklines add vertical lines that slim the face.') },
      { title: B('ต่างหูยาว', 'Long earrings'), text: B('ต่างหูห้อยยาวช่วยยืดสัดส่วน เลี่ยงต่างหูกลมใหญ่', 'Long drops lengthen; avoid large round studs.') },
      { title: B('แว่นทรงเหลี่ยม', 'Angular frames'), text: B('กรอบเหลี่ยมหรือแคทอายเพิ่มมุมให้ใบหน้า', 'Rectangular or cat-eye frames add angles.') },
    ],
  },
  square: {
    makeup: [
      { title: B('ลดมุมกราม', 'Soften the jaw corners'), text: B('แรเงามุมกรามทั้งสองข้าง และไฮไลต์กลางคางให้ดูมนขึ้น', 'Shade the jaw corners and highlight the chin centre for a softer outline.') },
      { title: B('บลัชวงรี', 'Oval blush'), text: B('ปัดบลัชวงรีบนโหนกแก้มเพิ่มความนุ่มนวล', 'Oval blush on the cheekbones adds softness.') },
      { title: B('คิ้วโค้ง', 'Curved brows'), text: B('คิ้วโค้งมนรับกับกราม ช่วยลดความแข็ง', 'Rounded arches balance a strong jaw.') },
    ],
    hair: [
      { title: B('เลเยอร์รอบหน้า', 'Face-framing layers'), text: B('เลเยอร์หรือลอนนุ่มรอบกรามช่วยลดเส้นตรง', 'Soft layers or waves around the jaw break straight lines.') },
      { title: B('ยาวเลยไหล่', 'Below the shoulders'), text: B('เลี่ยงผมตรงระดับกรามพอดีซึ่งจะเน้นความเหลี่ยม', 'Avoid blunt jaw-length cuts that emphasise angles.') },
      { title: B('แสกข้างพร้อมลอน', 'Side part with waves'), text: B('แสกข้างและม้วนปลายช่วยเพิ่มความโค้ง', 'A side part with curled ends adds curves.') },
    ],
    clothing: [
      { title: B('คอยู คอสกู๊ป', 'Scoop and round necks'), text: B('คอเสื้อโค้งรับกับเส้นกราม', 'Curved necklines balance the jaw.') },
      { title: B('ต่างหูห่วงกลม', 'Round hoops'), text: B('ต่างหูทรงกลมหรือโค้งช่วยเพิ่มความนุ่ม', 'Round or curved earrings soften.') },
      { title: B('แว่นทรงกลมหรือรี', 'Round or oval frames'), text: B('กรอบกลมลดความเหลี่ยม เลี่ยงกรอบเหลี่ยมหนา', 'Round frames soften; avoid heavy square frames.') },
    ],
  },
  heart: {
    makeup: [
      { title: B('แรเงาขมับ', 'Shade the temples'), text: B('แรเงาด้านข้างหน้าผากเล็กน้อย และไฮไลต์ปลายคางให้ช่วงล่างดูเต็มขึ้น', 'Lightly shade the forehead sides; highlight the chin to fill the lower face.') },
      { title: B('บลัชต่ำลง', 'Lower blush'), text: B('ปัดบลัชต่ำกว่าโหนกแก้มเล็กน้อย เพิ่มน้ำหนักให้ครึ่งล่าง', 'Place blush slightly lower to add weight below.') },
      { title: B('เน้นปาก', 'Emphasise lips'), text: B('ลิปสีชัดช่วยดึงสายตาลงมาที่ครึ่งล่างของใบหน้า', 'A defined lip draws the eye to the lower face.') },
    ],
    hair: [
      { title: B('หน้าม้าเฉียง', 'Side-swept bangs'), text: B('หน้าม้าเฉียงช่วยลดความกว้างของหน้าผาก', 'Side bangs reduce forehead width.') },
      { title: B('วอลุ่มระดับคาง', 'Volume at the chin'), text: B('ทรงที่พองหรือมีลอนระดับคางเติมความกว้างช่วงล่าง', 'Volume or curls at chin level widen the lower face.') },
      { title: B('ลอบ / บ็อบยาว', 'Lob'), text: B('บ็อบยาวระดับไหล่รับกับคางเรียว', 'A shoulder-length lob suits a tapered chin.') },
    ],
    clothing: [
      { title: B('คอเรือ คอเหลี่ยม', 'Boat and square necks'), text: B('เพิ่มความกว้างช่วงล่างให้สมดุลกับหน้าผาก', 'Widen below to balance the forehead.') },
      { title: B('ต่างหูทรงสามเหลี่ยมคว่ำ', 'Wide-bottom earrings'), text: B('ต่างหูที่ฐานกว้างกว่าด้านบน เช่น ทรงพัด', 'Earrings wider at the bottom, like fans or chandeliers.') },
      { title: B('แว่นกรอบล่างหนา', 'Bottom-heavy frames'), text: B('กรอบที่ขอบล่างเด่นหรือทรงไร้ขอบบน', 'Frames with stronger lower rims.') },
    ],
  },
  long: {
    makeup: [
      { title: B('คอนทัวร์แนวนอน', 'Horizontal contour'), text: B('แรเงาแนวไรผมด้านบนและใต้ปลายคาง ช่วยลดความยาว', 'Shade at the top of the hairline and under the chin to shorten.') },
      { title: B('บลัชแนวนอน', 'Horizontal blush'), text: B('ปัดบลัชแนวนอนจากกลางแก้มออกด้านข้าง', 'Sweep blush horizontally outward from the apples.') },
      { title: B('คิ้วตรง', 'Straight brows'), text: B('คิ้วทรงตรงหรือโค้งน้อยช่วยเพิ่มเส้นแนวนอน', 'Straighter brows add horizontal lines.') },
    ],
    hair: [
      { title: B('หน้าม้า', 'Bangs'), text: B('หน้าม้าตรงหรือหน้าม้ายาวช่วยลดความยาวของหน้าผาก', 'Full or long bangs shorten the forehead.') },
      { title: B('วอลุ่มด้านข้าง', 'Side volume'), text: B('ลอนหรือวอลุ่มด้านข้างเพิ่มความกว้าง เลี่ยงผมตรงแนบยาวมาก', 'Side volume or waves widen; avoid very long, flat hair.') },
      { title: B('ความยาวระดับไหล่', 'Shoulder length'), text: B('ความยาวไม่เกินไหล่ช่วยให้สัดส่วนสมดุล', 'Shoulder length keeps proportions balanced.') },
    ],
    clothing: [
      { title: B('คอกลม คอเต่า', 'Crew and turtle necks'), text: B('คอเสื้อสูงหรือกลมช่วยตัดความยาว', 'High or round necklines break length.') },
      { title: B('ต่างหูกลมหรือห่วง', 'Studs and hoops'), text: B('ต่างหูทรงกว้างเพิ่มความกว้าง เลี่ยงต่างหูห้อยยาว', 'Wide earrings add width; avoid long drops.') },
      { title: B('แว่นกรอบใหญ่', 'Oversized frames'), text: B('กรอบลึกและกว้างช่วยลดความยาวใบหน้า', 'Deep, wide frames shorten the face.') },
    ],
  },
  diamond: {
    makeup: [
      { title: B('แรเงาโหนกแก้ม', 'Soften the cheekbones'), text: B('แรเงาจุดสูงสุดของโหนกแก้มเบาๆ และไฮไลต์หน้าผากกับคาง', 'Lightly shade the widest cheek point; highlight forehead and chin.') },
      { title: B('บลัชใต้โหนกแก้ม', 'Blush below the cheekbone'), text: B('ปัดบลัชต่ำกว่าโหนกแก้มเพื่อไม่ให้เน้นความกว้าง', 'Keep blush below the cheekbone to avoid adding width.') },
      { title: B('คิ้วโค้งยาว', 'Long soft arches'), text: B('คิ้วยาวโค้งนุ่มช่วยขยายช่วงหน้าผาก', 'Longer soft brows widen the upper face.') },
    ],
    hair: [
      { title: B('หน้าม้ายาว', 'Long bangs'), text: B('หน้าม้ายาวหรือปัดข้างเติมความกว้างหน้าผาก', 'Long or side bangs add forehead width.') },
      { title: B('วอลุ่มที่ขมับและคาง', 'Volume at temples and chin'), text: B('ทรงที่มีวอลุ่มช่วงขมับและปลายผมระดับคาง', 'Volume at the temples and ends at chin level.') },
      { title: B('ทัดหู', 'Tuck behind the ears'), text: B('ทัดผมหลังหูช่วยเผยโหนกแก้มอย่างสมดุล', 'Tucking behind the ears shows cheekbones in balance.') },
    ],
    clothing: [
      { title: B('คอวีหรือคอสกู๊ป', 'V or scoop necks'), text: B('ช่วยเพิ่มสัดส่วนช่วงล่าง', 'Add proportion below.') },
      { title: B('ต่างหูหยดน้ำ', 'Teardrop earrings'), text: B('ต่างหูฐานกว้างเติมช่วงคาง', 'Wider-bottom earrings fill the chin area.') },
      { title: B('แว่นขอบบนเด่น', 'Top-heavy frames'), text: B('กรอบทรงบราวไลน์หรือแคทอายเติมช่วงบน', 'Browline or cat-eye frames widen the top.') },
    ],
  },
};

export function styleAdvice(m: FaceMetrics, report: FaceReport, side?: ProfileMetrics | null): Record<StyleCategory, StyleTip[]> {
  const base = BY_SHAPE[m.faceShape];
  const makeup = [...base.makeup];
  const hair = [...base.hair];
  const clothing = [...base.clothing];
  // Feature-based alternatives for each enhancement point (non-surgical version of the suggestion).
  for (const r of report.enhancements) {
    makeup.push({ title: { th: `ไม่ต้องศัลยกรรม: ${r.title.th}`, en: `No surgery: ${r.title.en}` }, text: r.enhancement.nonSurgical });
  }
  if (m.eyeSpacing > 1.42) makeup.push({ title: B('ตาห่าง', 'Wide-set eyes'), text: B('เน้นอายแชโดว์เข้มที่หัวตาและอายไลเนอร์ช่วงใน', 'Deepen shadow at the inner corners and line the inner half.') });
  if (m.eyeSpacing < 1.1) makeup.push({ title: B('ตาชิด', 'Close-set eyes'), text: B('ไฮไลต์หัวตา และเน้นสีเข้มที่หางตา', 'Highlight the inner corners and deepen the outer corners.') });

  if (side) {
    if (side.convexity < 163) {
      hair.push({ title: B('บาลานซ์คางด้านข้าง', 'Balance the chin in profile'), text: B('ผมยาวระดับคางหรือต่ำกว่าและมีวอลุ่มช่วงล่าง ช่วยให้โปรไฟล์ด้านข้างดูสมดุล เลี่ยงผมรวบตึงที่เผยเส้นคางเต็มๆ', 'Chin-length or longer hair with volume low down balances the profile; avoid very tight updos that expose the whole jawline.') });
      clothing.push({ title: B('คอวีลึก', 'Deep V-necks'), text: B('คอวีหรือสร้อยยาวช่วยดึงสายตาลงและยืดเส้นคาง', 'V-necks and long necklaces draw the eye down and lengthen the chin line.') });
    }
    if (side.foreheadSlope > 26) {
      hair.push({ title: B('เติมหน้าผากด้านข้าง', 'Fill the forehead in profile'), text: B('หน้าม้าบางหรือเซ็ตผมให้มีวอลุ่มที่โคนด้านหน้า ช่วยให้หน้าผากดูโค้งเต็มเมื่อมองด้านข้าง', 'Light bangs or front root volume make the forehead look fuller in profile.') });
    }
    if (side.nasofrontal > 140) {
      clothing.push({ title: B('แว่นแป้นรองจมูกสูง', 'High nose-pad glasses'), text: B('เลือกกรอบแว่นที่มีแป้นรองจมูกปรับได้หรือแบบสูง แว่นจะไม่ไหลและช่วยให้ดั้งดูมีมิติ', 'Frames with adjustable or raised nose pads sit better and give the bridge more definition.') });
    }
    if (side.upperLipE > 0.02 || side.lowerLipE > 0.03) {
      makeup.push({ title: B('ลิปโทนนุ่ม', 'Softer lip colour'), text: B('ลิปสีนู้ดหรือเนื้อแมตต์ ลดการเน้นริมฝีปากเมื่อมองด้านข้าง และเน้นตาแทน', 'Nude or matte lips reduce lip emphasis in profile; put the focus on the eyes.') });
    }
  }
  return { makeup, hair, clothing };
}
