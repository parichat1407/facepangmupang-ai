/**
 * Replace these mock providers with server-side integrations when ready.
 * Keep provider secrets in server environment variables; never expose them to the browser.
 */
export type FacialFeatures = { faceShape?: string; eyeSize?: string; eyeType?: string; brow?: string; nose?: string; lips?: string; chin?: string; forehead?: string };

export async function analyzeFaceMock() {
  return {
    faceShape: 'Oval', symmetry: 87,
    landmarks: [
      { name: 'leftEye', x: 0.35, y: 0.38 }, { name: 'rightEye', x: 0.65, y: 0.38 },
      { name: 'noseBridge', x: 0.5, y: 0.43 }, { name: 'noseTip', x: 0.5, y: 0.56 },
      { name: 'mouthLeft', x: 0.42, y: 0.65 }, { name: 'mouthRight', x: 0.58, y: 0.65 }, { name: 'chin', x: 0.5, y: 0.78 }
    ],
    proportions: { faceRatio: 1.42, eyeDistance: 0.31, noseWidth: 0.27, noseLength: 0.29, mouthWidth: 0.36, chinLength: 0.22 },
    recommendations: ['Eyes', 'Nose', 'Lips', 'Chin']
  };
}

export async function simulateFaceMock(changes: Record<string, string>) {
  return { mode: 'mock', image: null, message: 'Simulation provider is not configured. This response is a UI preview only.', changes, versions: ['Natural', 'Balanced', 'Defined'] };
}

export async function faceReadingMock(features: FacialFeatures) {
  const trait = (v?: string) => v || 'varied';
  return {
    mode: 'cultural-belief', disclaimer: 'การวิเคราะห์โหงวเฮ้งเป็นความเชื่อทางวัฒนธรรม ไม่ใช่หลักวิทยาศาสตร์ และไม่สามารถใช้ทำนายอนาคตหรือยืนยันบุคลิกของบุคคลได้',
    readings: [
      { area: 'personality', text: `ในบางตำรา ลักษณะดวงตาแบบ${trait(features.eyeSize)}ถูกตีความในแง่ของการแสดงออก ทั้งนี้ลักษณะใบหน้าไม่สามารถยืนยันบุคลิกได้` },
      { area: 'career', text: `ความเชื่อบางสำนักเชื่อมโยงหน้าผาก${trait(features.forehead)}กับการเรียนรู้ ซึ่งไม่ใช่ข้อบ่งชี้ความสามารถในการทำงาน` },
      { area: 'finance', text: `ลักษณะจมูก${trait(features.nose)}อาจมีคำตีความหลากหลายในแต่ละตำรา แต่ไม่สามารถทำนายฐานะการเงิน` },
      { area: 'relationship', text: `รูปปาก${trait(features.lips)}มีความหมายต่างกันตามวัฒนธรรม และไม่สามารถระบุรูปแบบความสัมพันธ์ได้` },
      { area: 'life', text: `รูปคาง${trait(features.chin)}อาจถูกเล่าในแง่มุมต่างกันตามความเชื่อ ไม่สามารถใช้ทำนายอนาคต` }
    ]
  };
}
