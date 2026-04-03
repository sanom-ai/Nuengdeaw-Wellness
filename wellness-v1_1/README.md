# wellness-v1_1

Nuengdeaw Wellness v1.1 คือ architecture uplift track ของระบบเดิม โดยยังไม่ทุบ v1 เดิมทิ้ง แต่สร้างฐานใหม่สำหรับการเติบโตไปสู่ Living Bio-Aura System อย่างจริงจัง

## Release Candidate Highlights

- Svelte 5 + Vite architecture base พร้อม shell ใหม่
- Layered Consciousness runtime และ BioStream-centered orchestration
- WebGL bio-aura scene + explainability surface
- Research diagnostics พร้อม raw channels, artifact watch, confidence map, waveform strip chart
- Session export / replay สำหรับ research handoff
- Device Console พร้อม readiness, telemetry, permission posture, battery, signal strength, transport health
- Wearable adapter contracts + Polar H10 real-integration skeleton
- Research Handoff Viewer สำหรับสรุป baseline, priority, recommendation และ release-ready session summary

## โครงสร้างหลัก

```text
wellness-v1_1/
├── src/
│   ├── core/                 # contracts + BioStream
│   ├── layers/               # sensory/perception/cognition/expression/memory
│   ├── stores/               # live orchestration state
│   ├── ui/                   # shell + futuristic panels
│   └── lib/                  # theme tokens
├── docs/architecture/
├── package.json
└── vite.config.ts
```

## สิ่งที่เริ่มเป็นรูปธรรมแล้ว

- `Conscious Signal Mesh` ผ่าน state กลางและ event feed
- `Living Bio-Aura Field` แบบ real-time visualization
- `Explainable by Design` ผ่าน rationale, layer trace, confidence composition, และ handoff summary
- `Research Runtime` ที่เชื่อม diagnostics, replay, export, และ device telemetry เข้าด้วยกัน
- `Thai Futuristic Minimalism` ใน shell และโทน visual หลัก

## Verification

- `npm run check`
- `npm run build`

## สถานะ

ตอนนี้ v1.1 อยู่ในโซน `release candidate prototype` คือสถาปัตย์, UI, diagnostics, replay, และ handoff flow เชื่อมกันครบและรันผ่าน build/check จริงแล้ว

สิ่งที่ยังเหลือหลัง release นี้:

- ทดสอบ `Polar H10` กับอุปกรณ์จริง
- ทำ `Muse / Empatica` ให้ถึง telemetry parity
- เพิ่ม persistence / report print / test coverage ให้ลึกขึ้น
- เตรียม deployment story และ release docs ระดับ production