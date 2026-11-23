/**
 * Traditional face-reading (โหงวเฮ้ง) rules driven by mesh metrics.
 * Content is cultural belief, framed as such in the UI — not science or medical advice.
 * Shared by client (readings) and server (simulation prompts), so keep it free of browser APIs.
 */
import type { Bi } from '../i18n';
import type { FaceMetrics } from './measure';
import type { ProfileMetrics } from './profile';

export type Zone = 'forehead' | 'glabella' | 'brows' | 'eyes' | 'nose' | 'cheeks' | 'mouth' | 'chin' | 'balance';
export type Tone = 'strong' | 'neutral' | 'enhance';

export type Enhancement = {
  id: string;
  procedure: Bi;    // what is commonly done
  beliefGain: Bi;   // how tradition says it improves the reading
  nonSurgical: Bi;  // makeup / grooming alternative
  simPrompt: string; // English edit instruction for the image model
};

export type Reading = { id: string; zone: Zone; tone: Tone; title: Bi; text: Bi; severity: number; enhancement?: Enhancement; view?: 'side' };

export const ZONES: Record<Zone, { name: Bi; ages: Bi; area: Bi }> = {
  forehead: { name: { th: 'หน้าผาก', en: 'Forehead' }, ages: { th: 'วัย 15–30 ปี', en: 'Ages 15–30' }, area: { th: 'การงาน การเรียน ผู้ใหญ่อุปถัมภ์', en: 'Career, study, mentors' } },
  glabella: { name: { th: 'หว่างคิ้ว (อิ้นตึ๊ง)', en: 'Between the brows' }, ages: { th: 'วัย 28 ปี', en: 'Age 28' }, area: { th: 'โชคลาภ ความหวัง', en: 'Luck, hopes' } },
  brows: { name: { th: 'คิ้ว', en: 'Eyebrows' }, ages: { th: 'วัย 31–34 ปี', en: 'Ages 31–34' }, area: { th: 'พี่น้อง มิตรสหาย', en: 'Siblings, friends' } },
  eyes: { name: { th: 'ดวงตา', en: 'Eyes' }, ages: { th: 'วัย 35–40 ปี', en: 'Ages 35–40' }, area: { th: 'ความรัก เสน่ห์ การสื่อสาร', en: 'Love, charm, communication' } },
  nose: { name: { th: 'จมูก (วังทรัพย์)', en: 'Nose (wealth palace)' }, ages: { th: 'วัย 41–50 ปี', en: 'Ages 41–50' }, area: { th: 'การเงิน ความมั่นคง', en: 'Wealth, stability' } },
  cheeks: { name: { th: 'โหนกแก้ม', en: 'Cheekbones' }, ages: { th: 'วัย 46–47 ปี', en: 'Ages 46–47' }, area: { th: 'อำนาจ การยอมรับ', en: 'Authority, recognition' } },
  mouth: { name: { th: 'ปาก', en: 'Mouth' }, ages: { th: 'วัย 51–60 ปี', en: 'Ages 51–60' }, area: { th: 'คำพูด เสน่ห์ บริวาร', en: 'Speech, charm, supporters' } },
  chin: { name: { th: 'คางและกราม', en: 'Chin & jaw' }, ages: { th: 'วัย 61 ปีขึ้นไป', en: 'Ages 61+' }, area: { th: 'บั้นปลาย บ้าน บริวาร', en: 'Later life, home, family' } },
  balance: { name: { th: 'สามส่วนของใบหน้า', en: 'Three facial zones' }, ages: { th: 'ทั้งชีวิต', en: 'Whole life' }, area: { th: 'ความสมดุลของชีวิต', en: 'Life balance' } },
};

type Rule = Omit<Reading, 'severity'> & { when: (m: FaceMetrics) => number | false };
const sev = (v: number) => Math.min(1, Math.max(0.15, v));

const RULES: Rule[] = [
  // ---- Forehead ----
  {
    id: 'forehead-low', zone: 'forehead', tone: 'enhance',
    when: m => m.thirds.upper < 0.29 && sev((0.29 - m.thirds.upper) / 0.05),
    title: { th: 'หน้าผากค่อนข้างต่ำ', en: 'A lower forehead' },
    text: { th: 'ตำราถือหน้าผากเป็นวังการงานและช่วงวัยต้น หน้าผากที่ไม่สูงนักมักถูกตีความว่าช่วงแรกของชีวิตต้องพึ่งตัวเองมากกว่าพึ่งผู้ใหญ่ (ประเมินจากภาพ อาจคลาดเคลื่อนหากแนวไรผมไม่ชัด)', en: 'Tradition treats the forehead as the career palace of early life. A lower forehead is often read as relying on yourself more than on mentors early on (estimated from the photo; less accurate if the hairline is hidden).' },
    enhancement: {
      id: 'forehead',
      procedure: { th: 'ฟิลเลอร์หรือเติมไขมันหน้าผากให้โค้งมนเต็ม', en: 'Forehead filler or fat grafting for a fuller, rounded forehead' },
      beliefGain: { th: 'ตำราเชื่อว่าหน้าผากเต็ม มน สว่าง ช่วยเสริมดวงการงาน การเรียน และแรงสนับสนุนจากผู้ใหญ่', en: 'Tradition holds that a full, rounded, bright forehead supports career, study and help from mentors.' },
      nonSurgical: { th: 'เปิดหน้าผาก เลี่ยงหน้าม้าหนาทึบ ไฮไลต์กลางหน้าผาก และเพิ่มวอลุ่มที่โคนผม', en: 'Show your forehead, avoid heavy bangs, highlight its centre and add root volume.' },
      simPrompt: 'a taller, fuller forehead with a smooth, gently convex curve; move the hairline up so the forehead is visibly higher',
    },
  },
  {
    id: 'forehead-good', zone: 'forehead', tone: 'strong', when: () => 1,
    title: { th: 'หน้าผากได้สัดส่วน', en: 'A well-proportioned forehead' },
    text: { th: 'หน้าผากสูงได้สัดส่วนกับใบหน้า ตำราถือเป็นหน้าผากรับโชค เด่นเรื่องการเรียนรู้และได้ผู้ใหญ่อุปถัมภ์ในวัยต้น', en: 'Tradition sees a well-proportioned forehead as fortunate — linked with learning and support from mentors early in life.' },
  },
  // ---- Glabella ----
  {
    id: 'glabella-narrow', zone: 'glabella', tone: 'enhance',
    when: m => m.browGap < 1.0 && sev((1.0 - m.browGap) / 0.15),
    title: { th: 'หว่างคิ้วค่อนข้างแคบ', en: 'Brows set close together' },
    text: { th: 'หว่างคิ้วหรือ “อิ้นตึ๊ง” เป็นจุดรับโชคและความหวัง ตำรามักว่าหว่างคิ้วแคบเป็นคนคิดมาก เก็บความเครียด', en: 'The space between the brows is the “seal hall” of luck and hope. Tradition often reads a narrow gap as a tendency to overthink and hold stress.' },
    enhancement: {
      id: 'glabella',
      procedure: { th: 'กันหัวคิ้วหรือสักคิ้วให้หัวคิ้วห่างขึ้น และโบท็อกซ์ลดรอยขมวดหว่างคิ้ว', en: 'Reshape or tattoo the brow heads further apart; botox to smooth frown lines' },
      beliefGain: { th: 'ตำราเชื่อว่าหว่างคิ้วกว้างราวหนึ่งนิ้วมือ เรียบ สว่าง ช่วยเปิดรับโชคลาภและทำให้เรื่องติดขัดคลี่คลาย', en: 'A smooth, bright gap about one finger wide is believed to open the way for luck and ease obstacles.' },
      nonSurgical: { th: 'กันขนหัวคิ้วให้ห่างขึ้น ไฮไลต์หว่างคิ้วเบาๆ และเลี่ยงการขมวดคิ้ว', en: 'Tidy the brow heads further apart, lightly highlight between the brows and avoid frowning.' },
      simPrompt: 'a slightly wider, smooth, clear space between the eyebrows, with the brow heads a little further apart',
    },
  },
  {
    id: 'glabella-good', zone: 'glabella', tone: 'strong', when: () => 1,
    title: { th: 'หว่างคิ้วเปิดกว้าง', en: 'An open space between the brows' },
    text: { th: 'ตำราถือว่าหว่างคิ้วกว้างเปิดเป็นจุดรับโชคที่ดี สื่อถึงความใจกว้างและมองโลกในแง่ดี', en: 'An open, clear brow gap is considered a good “luck point”, associated with openness and optimism.' },
  },
  // ---- Brows ----
  {
    id: 'brows-short', zone: 'brows', tone: 'enhance',
    when: m => m.browLength < 1.46 && sev((1.46 - m.browLength) / 0.15),
    title: { th: 'คิ้วสั้นกว่าความยาวตา', en: 'Brows shorter than the eyes' },
    text: { th: 'คิ้วคือวังพี่น้องและมิตรสหาย คิ้วที่สั้นกว่าตาตำรามักตีความว่าต้องพึ่งตัวเองมากกว่าพึ่งเพื่อนพ้อง', en: 'Brows are the palace of siblings and friends. Brows shorter than the eyes are often read as relying on yourself more than on friends.' },
    enhancement: {
      id: 'brows-length',
      procedure: { th: 'สักคิ้วหรือปลูกคิ้วให้ยาวเลยหางตาเล็กน้อย', en: 'Brow tattooing or transplant to extend the brows just past the eye' },
      beliefGain: { th: 'ตำราเชื่อว่าคิ้วยาวเลยหางตา เส้นเรียงสวย ช่วยเสริมเรื่องมิตรสหาย พี่น้อง และคนคอยช่วยเหลือ', en: 'Brows that extend past the eye with neat hairs are believed to bring supportive friends and siblings.' },
      nonSurgical: { th: 'เขียนหางคิ้วให้ยาวเลยหางตา และใช้เจลคิ้วจัดเส้นให้เรียง', en: 'Pencil the tails past the outer eye corner and set the hairs with brow gel.' },
      simPrompt: 'slightly longer, fuller, neatly groomed eyebrows that extend just past the outer eye corners',
    },
  },
  {
    id: 'brows-low', zone: 'brows', tone: 'enhance',
    when: m => m.browToEye < 0.6 && sev((0.6 - m.browToEye) / 0.12),
    title: { th: 'คิ้วชิดตา', en: 'Brows sitting close to the eyes' },
    text: { th: 'ระยะคิ้วถึงตาคือ “วังที่ดิน” ตำราว่าคิ้วชิดตามากมักใจร้อนและตัดสินใจเร็ว', en: 'The brow-to-eye space is the “property palace”. Very low brows are traditionally read as quick-tempered and fast to decide.' },
    enhancement: {
      id: 'brows-lift',
      procedure: { th: 'ยกคิ้ว (browlift) หรือโบท็อกซ์ยกหางคิ้ว', en: 'Brow lift or botox to raise the brow tails' },
      beliefGain: { th: 'ตำราเชื่อว่าระยะคิ้วกับตาที่กว้างพอดีช่วยเสริมความใจเย็น เรื่องบ้าน ที่ดิน และทรัพย์สิน', en: 'A comfortable brow-to-eye space is believed to bring calm and stability in home and property.' },
      nonSurgical: { th: 'เขียนคิ้วเน้นขอบบน เก็บขนใต้คิ้ว และไฮไลต์ใต้หางคิ้ว', en: 'Draw along the top edge of the brow, tidy underneath and highlight below the tail.' },
      simPrompt: 'eyebrows lifted very slightly, leaving a bit more space between the brows and the upper eyelids',
    },
  },
  {
    id: 'brows-good', zone: 'brows', tone: 'strong', when: () => 1,
    title: { th: 'คิ้วยาวได้รูป', en: 'Well-shaped brows' },
    text: { th: 'คิ้วยาวพอดีกับตาและอยู่ในระยะสบาย ตำราว่าได้มิตรสหายและพี่น้องคอยสนับสนุน', en: 'Brows matching the eye length at a relaxed height are read as having supportive friends and siblings.' },
  },
  // ---- Eyes ----
  {
    id: 'eyes-narrow', zone: 'eyes', tone: 'enhance',
    when: m => m.eyeOpenness < 0.27 && sev((0.27 - m.eyeOpenness) / 0.07),
    title: { th: 'ดวงตาค่อนข้างเรียวเล็ก', en: 'Narrower eyes' },
    text: { th: 'ตาคือหน้าต่างของโหงวเฮ้ง ตาเรียวตำราว่าเป็นคนรอบคอบและเก็บความรู้สึก (การยิ้มทำให้ตาดูเล็กลงได้)', en: 'The eyes are the window of face reading. Narrow eyes are read as careful and reserved (smiling can make eyes look smaller).' },
    enhancement: {
      id: 'eyes-open',
      procedure: { th: 'ทำตาสองชั้น เปิดหัวตา หรือปรับกล้ามเนื้อตา', en: 'Double-eyelid surgery, epicanthoplasty or ptosis correction' },
      beliefGain: { th: 'ตำราเชื่อว่าดวงตาเปิดกว้าง ใส มีประกาย ช่วยเสริมเสน่ห์ ความรัก และการเจรจา', en: 'Open, clear, bright eyes are believed to enhance charm, love and negotiation.' },
      nonSurgical: { th: 'อายไลเนอร์เส้นบางชิดโคนขนตา ดัดขนตา เทปตาสองชั้น และอายแชโดว์สีอ่อนกลางเปลือกตา', en: 'Thin liner at the lash line, curled lashes, eyelid tape and a light shade on the centre of the lid.' },
      simPrompt: 'slightly larger, more open eyes with a natural, defined double-eyelid crease',
    },
  },
  {
    id: 'eyes-down', zone: 'eyes', tone: 'enhance',
    when: m => m.canthalTilt < 2 && sev((2 - m.canthalTilt) / 4),
    title: { th: 'หางตาตก', en: 'Down-turned outer corners' },
    text: { th: 'หางตาตกเล็กน้อยตำราว่าเป็นคนใจดี ขี้สงสาร แต่มักเหนื่อยเพื่อคนอื่น', en: 'Slightly down-turned eyes are read as kind and compassionate, often tiring yourself for others.' },
    enhancement: {
      id: 'eyes-tilt',
      procedure: { th: 'ปรับหางตา (canthoplasty) หรือร้อยไหมยกหางคิ้ว-หางตา', en: 'Canthoplasty or thread lift of the brow and outer eye' },
      beliefGain: { th: 'ตำราเชื่อว่าหางตาชี้ขึ้นเล็กน้อย (ตาหงส์) ช่วยเสริมความมั่นใจ ความสำเร็จ และเสน่ห์', en: 'Gently upturned “phoenix eyes” are believed to bring confidence, success and charm.' },
      nonSurgical: { th: 'อายไลเนอร์ลากหางชี้ขึ้น และอายแชโดว์เข้มที่หางตาด้านบน', en: 'Wing the liner upward and deepen the shadow on the upper outer corner.' },
      simPrompt: 'outer eye corners lifted very slightly for a gently upturned eye shape',
    },
  },
  {
    id: 'eyes-wide', zone: 'eyes', tone: 'neutral', when: m => m.eyeSpacing > 1.42 && 0.3,
    title: { th: 'ตาห่าง', en: 'Wide-set eyes' },
    text: { th: 'ตาห่างตำราว่าใจกว้าง ใจเย็น มองการณ์ไกล ไม่ใช่จุดที่ตำราแนะนำให้แก้', en: 'Wide-set eyes are read as open-minded, calm and far-sighted — not something tradition asks you to change.' },
  },
  {
    id: 'eyes-close', zone: 'eyes', tone: 'neutral', when: m => m.eyeSpacing < 1.1 && 0.3,
    title: { th: 'ตาชิด', en: 'Close-set eyes' },
    text: { th: 'ตาชิดตำราว่าเป็นคนละเอียด มีสมาธิ ทำงานเชิงลึกได้ดี', en: 'Close-set eyes are read as detail-oriented and focused, good at deep work.' },
  },
  {
    id: 'eyes-good', zone: 'eyes', tone: 'strong', when: () => 1,
    title: { th: 'ดวงตาได้สัดส่วน', en: 'Balanced eyes' },
    text: { th: 'ดวงตาเปิดได้สัดส่วน ตำราว่ามีเสน่ห์และสื่อสารเก่ง', en: 'Well-proportioned, open eyes are read as charming and communicative.' },
  },
  // ---- Nose ----
  {
    id: 'nose-bridge', zone: 'nose', tone: 'enhance',
    when: m => m.bridgeHeight < 0.118 && sev((0.118 - m.bridgeHeight) / 0.015),
    title: { th: 'สันจมูกค่อนข้างแบน', en: 'A lower nasal bridge' },
    text: { th: 'จมูกคือวังทรัพย์และวัย 41–50 ปี สันจมูกที่ไม่สูงตำรามักว่าเงินเข้ามาแล้วต้องระวังการรั่วไหล', en: 'The nose is the wealth palace for ages 41–50. A low bridge is traditionally read as money that comes in but needs guarding.' },
    enhancement: {
      id: 'nose-bridge',
      procedure: { th: 'เสริมจมูก (เสริมสัน) หรือฟิลเลอร์สันจมูก', en: 'Rhinoplasty (bridge augmentation) or nose-bridge filler' },
      beliefGain: { th: 'ตำราเชื่อว่าสันจมูกตรง สูงพอดี ไม่มีข้อปุ่ม เป็น “เสาค้ำทรัพย์” ช่วยเสริมการเงินและความมั่นคงช่วงวัยกลางคน', en: 'A straight, moderately high, smooth bridge is believed to be a “pillar of wealth” supporting mid-life finances.' },
      nonSurgical: { th: 'คอนทัวร์สองข้างสันจมูก และไฮไลต์กลางสันจมูกเป็นเส้นตรง', en: 'Contour both sides of the bridge and draw a straight highlight down the centre.' },
      simPrompt: 'a higher, straighter, narrower nasal bridge: one clean straight line from between the eyebrows down to the tip, with a light highlight along the bridge and soft shadow on both sides; keep the nose tip natural',
    },
  },
  {
    id: 'nose-short', zone: 'nose', tone: 'enhance',
    when: m => m.noseLength < 0.255 && sev((0.255 - m.noseLength) / 0.03),
    title: { th: 'จมูกค่อนข้างสั้น', en: 'A shorter nose' },
    text: { th: 'จมูกสั้นตำราว่าตัดสินใจเร็ว คล่องตัว แต่การเก็บออมต้องอาศัยวินัย', en: 'A shorter nose is read as quick and agile, with saving needing discipline.' },
    enhancement: {
      id: 'nose-tip',
      procedure: { th: 'เสริมปลายจมูกให้ยาวได้สัดส่วน', en: 'Tip-plasty to lengthen the nose in proportion' },
      beliefGain: { th: 'ตำราเชื่อว่าจมูกยาวได้สัดส่วน ปลายจมูกมีเนื้อ ช่วยเสริมความมั่นคงทางการเงินระยะยาว', en: 'A proportionate nose with a fleshy tip is believed to support long-term financial security.' },
      nonSurgical: { th: 'ลากไฮไลต์ถึงปลายจมูก และแรเงาใต้ปลายจมูกเบาๆ', en: 'Run the highlight to the tip and lightly shade under it.' },
      simPrompt: 'a slightly longer nose with a soft, rounded, gently defined tip',
    },
  },
  {
    id: 'nose-wide', zone: 'nose', tone: 'strong', when: m => m.noseWidth > 1.36 && 0.3,
    title: { th: 'ปีกจมูกกว้างอิ่ม', en: 'Full, wide nostrils' },
    text: { th: 'ปีกจมูกกว้างอิ่มตำราว่าเป็น “ถุงเก็บเงิน” เก็บทรัพย์ได้ดี หากอยากลดปีกจมูกเพื่อความงาม ตำราแนะนำไม่ให้ลดจนปีกบางเกินไป', en: 'Full nostril wings are the traditional “money pouches” that keep wealth. If you reduce them for aesthetics, tradition advises not making them too thin.' },
  },
  {
    id: 'nose-good', zone: 'nose', tone: 'strong', when: () => 1,
    title: { th: 'จมูกได้สัดส่วน', en: 'A balanced nose' },
    text: { th: 'จมูกสมส่วนกับใบหน้า ตำราว่าการเงินมั่นคง หาได้และเก็บได้', en: 'A nose in proportion with the face is read as stable finances — earning and keeping.' },
  },
  // ---- Cheekbones ----
  {
    id: 'cheeks-prominent', zone: 'cheeks', tone: 'enhance',
    when: m => m.foreheadToCheek < 0.845 && m.jawToCheek < 0.795 && 0.5,
    title: { th: 'โหนกแก้มเด่นกว่าหน้าผากและกราม', en: 'Cheekbones wider than forehead and jaw' },
    text: { th: 'โหนกแก้มเด่นตำราว่าเป็นผู้นำ มีพลัง แต่หากเด่นกว่าส่วนอื่นมาก ตำราว่าต้องลงแรงมากกว่าคนอื่น', en: 'Prominent cheekbones are read as leadership and drive; when much wider than the rest, tradition says success takes extra effort.' },
    enhancement: {
      id: 'temples',
      procedure: { th: 'ฟิลเลอร์ขมับและหน้าผากด้านข้าง ให้โครงหน้ากลมกลืน', en: 'Temple and lateral-forehead filler to soften the outline' },
      beliefGain: { th: 'ตำราเชื่อว่าโหนกแก้มที่กลมกลืนกับขมับและจมูก ช่วยให้อำนาจมาพร้อมคนสนับสนุน', en: 'Cheekbones that blend with the temples and nose are believed to bring authority together with support.' },
      nonSurgical: { th: 'ปัดบลัชเฉียงขึ้นใต้โหนกแก้ม ไฮไลต์ขมับ และเลือกทรงผมที่มีวอลุ่มบริเวณขมับ', en: 'Sweep blush up under the cheekbones, highlight the temples and choose hair with volume at the temples.' },
      simPrompt: 'slightly fuller temples so the cheekbones blend more smoothly into the forehead',
    },
  },
  {
    id: 'cheeks-good', zone: 'cheeks', tone: 'strong', when: () => 1,
    title: { th: 'โหนกแก้มกลมกลืน', en: 'Harmonious cheekbones' },
    text: { th: 'โหนกแก้มรับกับจมูกและโครงหน้า ตำราว่าได้รับการยอมรับและมีคนเกรงใจ', en: 'Cheekbones in harmony with the nose are read as being respected and recognised.' },
  },
  // ---- Mouth ----
  {
    id: 'lips-thin', zone: 'mouth', tone: 'enhance',
    when: m => m.lipRatio > 2.3 && sev((m.lipRatio - 2.3) / 0.6),
    title: { th: 'ริมฝีปากบนบาง', en: 'A thin upper lip' },
    text: { th: 'ปากดูเรื่องคำพูด เสน่ห์ และบริวาร ริมฝีปากบนบางตำราว่าพูดตรงและใช้เหตุผล', en: 'The mouth governs speech, charm and supporters. A thin upper lip is read as direct and rational.' },
    enhancement: {
      id: 'lips',
      procedure: { th: 'ฟิลเลอร์ริมฝีปากบน (ปริมาณน้อย)', en: 'A small amount of upper-lip filler' },
      beliefGain: { th: 'ตำราเชื่อว่าริมฝีปากอิ่มได้สัดส่วน ขอบปากชัด ช่วยเสริมเสน่ห์ทางคำพูด ความรัก และเมตตาจากผู้คน', en: 'Balanced, full lips with a clear outline are believed to enhance eloquence, love and goodwill.' },
      nonSurgical: { th: 'วาดลิปไลเนอร์เกินขอบปากบนเล็กน้อย และแตะกลอสกลางปาก', en: 'Overline the upper lip slightly and add gloss to the centre.' },
      simPrompt: 'a slightly fuller upper lip with a well-defined natural lip line',
    },
  },
  {
    id: 'mouth-down', zone: 'mouth', tone: 'enhance',
    when: m => m.mouthCornerLift < -0.005 && sev((-0.005 - m.mouthCornerLift) / 0.03),
    title: { th: 'มุมปากตก', en: 'Down-turned mouth corners' },
    text: { th: 'มุมปากตกตำราว่าทำให้ดูไม่สดชื่น และมักเหนื่อยกับเรื่องคนรอบตัว', en: 'Down-turned corners are read as looking tired and carrying the worries of others.' },
    enhancement: {
      id: 'mouth-corners',
      procedure: { th: 'โบท็อกซ์ปรับมุมปาก หรือฟิลเลอร์มุมปาก', en: 'Botox to the mouth-corner depressors or corner filler' },
      beliefGain: { th: 'ตำราเชื่อว่ามุมปากยกขึ้นเหมือนเรือหงาย (ปากกระจับ) ช่วยเสริมเสน่ห์ เมตตามหานิยม และความสุข', en: 'Corners lifted like a boat are believed to bring charm, goodwill and happiness.' },
      nonSurgical: { th: 'คอนซีลเลอร์ใต้มุมปาก ลิปไลเนอร์ยกมุมขึ้นเล็กน้อย และฝึกยิ้มมุมปาก', en: 'Conceal under the corners, lift them slightly with liner and practise a soft smile.' },
      simPrompt: 'both mouth corners turned up instead of down, so the closed lips form a gentle upward curve like a soft resting smile',
    },
  },
  {
    id: 'philtrum-long', zone: 'mouth', tone: 'strong', when: m => m.philtrum > 0.28 && 0.3,
    title: { th: 'ร่องเหนือปากยาวชัด', en: 'A long, defined philtrum' },
    text: { th: 'ตำราถือร่องเหนือปากยาวลึกชัดเป็นเครื่องหมายของสุขภาพดีและอายุยืน', en: 'A long, clear philtrum is traditionally a sign of good health and longevity.' },
  },
  {
    id: 'mouth-good', zone: 'mouth', tone: 'strong', when: () => 1,
    title: { th: 'ปากได้สัดส่วน', en: 'A balanced mouth' },
    text: { th: 'ปากรูปทรงสมดุล ตำราว่าพูดจาน่าฟังและมีเสน่ห์ทางวาจา', en: 'A balanced mouth is read as pleasant, persuasive speech.' },
  },
  // ---- Chin & jaw ----
  {
    id: 'chin-short', zone: 'chin', tone: 'enhance',
    when: m => m.chinLength < 0.42 && sev((0.42 - m.chinLength) / 0.06),
    title: { th: 'คางค่อนข้างสั้น', en: 'A shorter chin' },
    text: { th: 'คางคือวังบั้นปลาย คางสั้นตำราว่าควรวางแผนช่วงบั้นปลายให้ดี', en: 'The chin is the palace of later life. A short chin is read as a reminder to plan well for later years.' },
    enhancement: {
      id: 'chin',
      procedure: { th: 'ฟิลเลอร์คาง หรือเสริมคาง', en: 'Chin filler or chin implant' },
      beliefGain: { th: 'ตำราเชื่อว่าคางเต็ม มน ยื่นรับเล็กน้อย ช่วยเสริมความมั่นคงบั้นปลาย บ้าน ที่ดิน และบริวารคอยดูแล', en: 'A full, rounded, slightly projected chin is believed to secure later life, home and family support.' },
      nonSurgical: { th: 'ไฮไลต์ปลายคาง แรเงาใต้คาง และเลือกต่างหูยาวช่วยยืดโครงหน้า', en: 'Highlight the chin tip, shade underneath and wear longer earrings to lengthen the face.' },
      simPrompt: 'a slightly longer, softly rounded chin with gentle forward projection',
    },
  },
  {
    id: 'chin-receding', zone: 'chin', tone: 'enhance',
    when: m => m.chinProjection < -0.165 && sev((-0.165 - m.chinProjection) / 0.03),
    title: { th: 'คางค่อนข้างถอย', en: 'A receding chin' },
    text: { th: 'คางถอยตำราว่าบั้นปลายต้องพึ่งตัวเองมาก', en: 'A receding chin is traditionally read as relying mostly on yourself in later life.' },
    enhancement: {
      id: 'chin-projection',
      procedure: { th: 'ฟิลเลอร์คางหรือเสริมคางเพื่อเพิ่มการยื่น', en: 'Chin filler or implant for more projection' },
      beliefGain: { th: 'ตำราเชื่อว่าคางที่ยื่นรับกับปากและจมูก ช่วยเสริมความมั่นคงและคนสนับสนุนในบั้นปลาย', en: 'A chin projecting in balance with lips and nose is believed to bring stability and support in later life.' },
      nonSurgical: { th: 'ไฮไลต์ปลายคาง และเลือกคอเสื้อวีช่วยดึงสายตาลงล่าง', en: 'Highlight the chin tip and choose V-necks to draw the eye downward.' },
      simPrompt: 'a chin with slightly more forward projection, balanced with the lips and nose',
    },
  },
  {
    id: 'jaw-strong', zone: 'chin', tone: 'strong', when: m => m.jawToCheek >= 0.83 && 0.3,
    title: { th: 'กรามชัด', en: 'A defined jaw' },
    text: { th: 'กรามกว้างชัดตำราว่ามุ่งมั่น บั้นปลายมีหลักยึด หากต้องการลดกรามเพื่อความงาม ตำราแนะนำไม่ให้ลดจนคางแหลมเกินไป', en: 'A broad, defined jaw is read as determination and a solid later life. If slimming it for aesthetics, tradition advises against an overly pointed chin.' },
  },
  {
    id: 'chin-good', zone: 'chin', tone: 'strong', when: () => 1,
    title: { th: 'คางได้รูป', en: 'A well-formed chin' },
    text: { th: 'คางมนเต็มรับกับใบหน้า ตำราว่าบั้นปลายมั่นคงและมีบริวาร', en: 'A rounded chin in balance with the face is read as a secure later life with support around you.' },
  },
];

function balanceReading(m: FaceMetrics): Reading {
  const { upper, middle, lower } = m.thirds;
  const spread = Math.max(upper, middle, lower) - Math.min(upper, middle, lower);
  if (spread < 0.06) return {
    id: 'thirds-even', zone: 'balance', tone: 'strong', severity: 0,
    title: { th: 'สามส่วนสมดุล', en: 'Even facial thirds' },
    text: { th: 'ใบหน้าสามส่วน (บน กลาง ล่าง) ใกล้เคียงกัน ตำราถือว่าชีวิตสมดุลทั้งวัยต้น วัยกลาง และบั้นปลาย', en: 'Upper, middle and lower thirds are close — tradition reads this as balance across early, middle and later life.' },
  };
  const top = middle >= upper && middle >= lower ? 'middle' : lower >= upper ? 'lower' : 'upper';
  const t = {
    upper: { th: 'ส่วนบนเด่น ตำราว่าวัยต้นเด่น ได้การศึกษาและผู้ใหญ่ช่วยเหลือ', en: 'A dominant upper third is read as a strong early life with education and mentors.' },
    middle: { th: 'ส่วนกลางเด่น ตำราว่าวัยทำงานเป็นช่วงสร้างตัว มีแรงขับเคลื่อนสูง', en: 'A dominant middle third is read as drive and building yourself during working years.' },
    lower: { th: 'ส่วนล่างเด่น ตำราว่าบั้นปลายมั่นคง มีบ้านและบริวาร', en: 'A dominant lower third is read as a secure later life with home and family.' },
  }[top];
  return { id: `thirds-${top}`, zone: 'balance', tone: 'neutral', severity: 0, title: { th: 'สามส่วนไม่เท่ากัน', en: 'Uneven facial thirds' }, text: t };
}

// ---------------- Side-profile rules ----------------
type SideRule = Omit<Reading, 'severity'> & { when: (p: ProfileMetrics) => number | false; fallback?: boolean };
const enh = (id: string) => RULES.find(r => r.enhancement?.id === id)!.enhancement!;

const SIDE_RULES: SideRule[] = [
  {
    id: 'side-forehead-sloped', zone: 'forehead', tone: 'enhance', view: 'side',
    when: p => p.foreheadSlope > 26 && sev((p.foreheadSlope - 26) / 12),
    title: { th: 'หน้าผากลาดเมื่อมองด้านข้าง', en: 'A sloping forehead in profile' },
    text: { th: 'ตำรานิยมหน้าผากโหนกมนเต็มเมื่อมองด้านข้าง หน้าผากที่ลาดไปด้านหลังมักถูกตีความว่าต้องสร้างเนื้อสร้างตัวเองในวัยต้น', en: 'Tradition favours a full, rounded forehead in profile; a backward slope is read as building your own way early in life.' },
    enhancement: enh('forehead'),
  },
  {
    id: 'side-forehead-good', zone: 'forehead', tone: 'strong', view: 'side', fallback: true, when: () => 1,
    title: { th: 'หน้าผากด้านข้างโค้งมน', en: 'A rounded forehead in profile' },
    text: { th: 'มองด้านข้างหน้าผากโค้งรับกับคิ้ว ตำราถือว่าเป็นหน้าผากที่รับโชคเรื่องการงาน', en: 'In profile the forehead curves nicely into the brow — read as good fortune for career.' },
  },
  {
    id: 'side-nose-low', zone: 'nose', tone: 'enhance', view: 'side',
    when: p => p.nasofrontal > 140 && sev((p.nasofrontal - 140) / 15),
    title: { th: 'ร่องดั้งตื้น สันจมูกไม่โด่ง', en: 'A shallow nasion and low bridge in profile' },
    text: { th: 'มองด้านข้างมุมระหว่างหน้าผากกับดั้งจมูกกว้าง สันจมูกจึงดูต่ำ ตำราถือสันจมูกเป็นเสาค้ำทรัพย์ช่วงวัยกลางคน', en: 'In profile the forehead–nose angle is wide, so the bridge looks low. Tradition sees the bridge as the pillar of mid-life wealth.' },
    enhancement: enh('nose-bridge'),
  },
  {
    id: 'side-tip-low', zone: 'nose', tone: 'enhance', view: 'side',
    when: p => p.tipProjection < 0.22 && sev((0.22 - p.tipProjection) / 0.08),
    title: { th: 'ปลายจมูกยื่นน้อย', en: 'A less projected nose tip' },
    text: { th: 'ปลายจมูกที่ยื่นน้อยเมื่อมองด้านข้าง ตำรามักว่าการเก็บออมต้องอาศัยวินัยมากขึ้น', en: 'A tip with little projection is traditionally read as saving taking more discipline.' },
    enhancement: enh('nose-tip'),
  },
  {
    id: 'side-tip-droop', zone: 'nose', tone: 'enhance', view: 'side',
    when: p => p.nasolabial < 88 && sev((88 - p.nasolabial) / 15),
    title: { th: 'ปลายจมูกงุ้มลง', en: 'A downward-pointing tip' },
    text: { th: 'มุมระหว่างจมูกกับริมฝีปากแคบ ปลายจมูกจึงงุ้ม ตำรามักว่าคิดรอบคอบเรื่องเงิน แต่ภาพลักษณ์อาจดูเข้มงวด', en: 'A narrow nose–lip angle makes the tip point down; tradition reads careful money sense but a sterner image.' },
    enhancement: {
      id: 'nose-rotation',
      procedure: { th: 'เสริมจมูกปรับองศาปลายจมูกให้ยกขึ้นเล็กน้อย', en: 'Rhinoplasty to rotate the tip slightly upward' },
      beliefGain: { th: 'ตำราเชื่อว่าปลายจมูกกลมมน ไม่งุ้มไม่เชิด ช่วยให้การเงินมั่นคงและภาพลักษณ์ดูใจดี', en: 'A rounded tip that neither droops nor lifts is believed to steady finances and soften your image.' },
      nonSurgical: { th: 'ไฮไลต์จุดเล็กๆ ที่ปลายจมูก และแรเงาใต้ปลายจมูกให้ดูยกขึ้น', en: 'Dot highlight on the tip and shade beneath it to lift it visually.' },
      simPrompt: 'the nose tip rotated very slightly upward, giving a softer angle between the nose and upper lip',
    },
  },
  {
    id: 'side-tip-up', zone: 'nose', tone: 'enhance', view: 'side',
    when: p => p.nasolabial > 118 && sev((p.nasolabial - 118) / 15),
    title: { th: 'ปลายจมูกเชิด', en: 'An upturned tip' },
    text: { th: 'มุมจมูกกับริมฝีปากกว้าง ปลายจมูกเชิดจนเห็นรูจมูก ตำราเชื่อว่ารูจมูกที่เห็นชัดทำให้เงินรั่วไหลง่าย', en: 'A wide nose–lip angle shows the nostrils; tradition believes visible nostrils let money slip away.' },
    enhancement: {
      id: 'nose-derotation',
      procedure: { th: 'เสริมจมูกปรับองศาปลายจมูกลงเล็กน้อย', en: 'Rhinoplasty to rotate the tip slightly down' },
      beliefGain: { th: 'ตำราเชื่อว่าปลายจมูกที่บังรูจมูกเมื่อมองตรงช่วยเก็บทรัพย์ไม่ให้รั่วไหล', en: 'A tip that hides the nostrils from the front is believed to keep wealth from leaking.' },
      nonSurgical: { th: 'แรเงาใต้ปลายจมูกและรอบรูจมูกเบาๆ ให้ปลายจมูกดูต่ำลง', en: 'Lightly shade under the tip and around the nostrils so the tip reads lower.' },
      simPrompt: 'the nose tip rotated very slightly downward so the nostrils are less visible',
    },
  },
  {
    id: 'side-nose-good', zone: 'nose', tone: 'strong', view: 'side', fallback: true, when: () => 1,
    title: { th: 'จมูกด้านข้างได้รูป', en: 'A well-shaped nose in profile' },
    text: { th: 'สันจมูกและปลายจมูกด้านข้างได้สัดส่วน ตำราว่าเป็นจมูกเก็บทรัพย์ การเงินมั่นคง', en: 'Bridge and tip are in proportion in profile — read as a nose that keeps wealth.' },
  },
  {
    id: 'side-lips-retruded', zone: 'mouth', tone: 'enhance', view: 'side',
    when: p => p.upperLipE < -0.12 && sev((-0.12 - p.upperLipE) / 0.06),
    title: { th: 'ริมฝีปากยุบเมื่อมองด้านข้าง', en: 'Lips set back in profile' },
    text: { th: 'ริมฝีปากอยู่ลึกหลังเส้น E-line มาก ตำรามักว่าเก็บคำพูด ไม่ค่อยแสดงความรู้สึก', en: 'Lips sit well behind the E-line; tradition reads a reserved way of speaking.' },
    enhancement: enh('lips'),
  },
  {
    id: 'side-lips-forward', zone: 'mouth', tone: 'neutral', view: 'side',
    when: p => (p.upperLipE > 0.02 || p.lowerLipE > 0.03) && 0.3,
    title: { th: 'ริมฝีปากยื่นเลยเส้น E-line', en: 'Lips ahead of the E-line' },
    text: { th: 'ริมฝีปากยื่นเลยเส้นจากปลายจมูกถึงปลายคาง ตำราว่าพูดเก่ง กล้าแสดงออก ไม่ใช่จุดที่ตำราแนะนำให้แก้', en: 'Lips extend past the nose-to-chin line — read as expressive and outspoken, not something tradition asks you to change.' },
  },
  {
    id: 'side-chin-retruded', zone: 'chin', tone: 'enhance', view: 'side',
    when: p => p.convexity < 163 && sev((163 - p.convexity) / 12),
    title: { th: 'คางถอยเมื่อมองด้านข้าง', en: 'A receding chin in profile' },
    text: { th: 'โปรไฟล์ด้านข้างโค้งนูนมาก คางอยู่ค่อนไปด้านหลัง ตำราว่าบั้นปลายต้องพึ่งตัวเองมาก', en: 'The profile is quite convex with the chin set back — read as relying on yourself in later life.' },
    enhancement: enh('chin-projection'),
  },
  {
    id: 'side-chin-forward', zone: 'chin', tone: 'neutral', view: 'side',
    when: p => p.convexity > 182 && 0.3,
    title: { th: 'คางยื่นเมื่อมองด้านข้าง', en: 'A forward chin in profile' },
    text: { th: 'คางยื่นนำหน้าเส้นใบหน้า ตำราว่าบั้นปลายมั่นคง มีหลักยึด หากต้องการปรับเพื่อความงาม ตำราแนะนำไม่ให้ลดจนคางถอย', en: 'The chin leads the profile — read as a secure later life. If adjusting for aesthetics, tradition advises against making it recede.' },
  },
  {
    id: 'side-chin-good', zone: 'chin', tone: 'strong', view: 'side', fallback: true, when: () => 1,
    title: { th: 'คางด้านข้างรับกับใบหน้า', en: 'A balanced chin in profile' },
    text: { th: 'มองด้านข้างคางรับกับริมฝีปากและจมูก ตำราว่าบั้นปลายมั่นคงและมีบริวาร', en: 'In profile the chin balances lips and nose — read as a secure later life with support.' },
  },
];

export type FaceReport = {
  readings: Reading[];
  zoneScores: Record<Zone, number>;
  enhancements: (Reading & { enhancement: Enhancement })[];
};

function stripRule(rule: Rule | SideRule, severity: number): Reading {
  const { when: _when, ...rest } = rule;
  const { fallback: _fallback, ...reading } = rest as Omit<SideRule, 'when'>;
  return { ...reading, severity };
}

export function readFace(m: FaceMetrics, side?: ProfileMetrics | null): FaceReport {
  const readings: Reading[] = [];
  const zoneScores = {} as Record<Zone, number>;
  for (const zone of Object.keys(ZONES) as Zone[]) {
    if (zone === 'balance') continue;
    const zoneRules = RULES.filter(r => r.zone === zone);
    const matched: Reading[] = [];
    for (const r of zoneRules.slice(0, -1)) { // last rule per zone is the default
      const s = r.when(m);
      if (s !== false) matched.push(stripRule(r, s));
    }
    const list = matched.length ? matched : [stripRule(zoneRules[zoneRules.length - 1], 0)];
    if (side) {
      const sideRules = SIDE_RULES.filter(r => r.zone === zone);
      const sideMatched: Reading[] = [];
      for (const r of sideRules) {
        if (r.fallback) continue;
        const s = r.when(side);
        if (s !== false) sideMatched.push(stripRule(r, s));
      }
      const fb = sideRules.find(r => r.fallback);
      list.push(...(sideMatched.length ? sideMatched : fb ? [stripRule(fb, 0)] : []));
    }
    readings.push(...list);
    const worst = Math.max(0, ...list.filter(r => r.tone === 'enhance').map(r => r.severity));
    zoneScores[zone] = Math.round(list.some(r => r.tone === 'enhance') ? 76 - worst * 14 : list.some(r => r.tone === 'neutral') ? 82 : 90);
  }
  const balance = balanceReading(m);
  readings.push(balance);
  zoneScores.balance = balance.tone === 'strong' ? 90 : 80;
  // One card per enhancement id; when front and side both suggest it, keep the stronger signal.
  const byId = new Map<string, Reading & { enhancement: Enhancement }>();
  for (const r of readings) {
    if (!r.enhancement) continue;
    const prev = byId.get(r.enhancement.id);
    if (!prev || r.severity > prev.severity) byId.set(r.enhancement.id, r as Reading & { enhancement: Enhancement });
  }
  const enhancements = [...byId.values()].sort((a, b) => b.severity - a.severity);
  return { readings, zoneScores, enhancements };
}

const ALL_RULES: (Rule | SideRule)[] = [...RULES, ...SIDE_RULES];

/** Server-side lookup: enhancement id → image-edit instruction. */
export const SIM_PROMPTS: Record<string, string> = Object.fromEntries(
  ALL_RULES.filter(r => r.enhancement).map(r => [r.enhancement!.id, r.enhancement!.simPrompt]),
);

/** id → rule content (without matcher), for server-side lookups. */
export const RULE_CATALOG: Map<string, Reading> = new Map(ALL_RULES.map(r => [r.id, stripRule(r, 0)]));
