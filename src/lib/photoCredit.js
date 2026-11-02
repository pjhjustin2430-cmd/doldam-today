// 사진 출처 문구: "사진: 작성자 · 라이선스 · 출처" (CC BY-SA 등은 작성자와 라이선스 표시가 이용 조건)
export const creditText = (p) => `사진: ${p.credit}${p.license ? ` · ${p.license}` : ''}${p.source ? ` · ${p.source}` : ''}`
