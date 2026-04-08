# Nuengdeaw Wellness

Nuengdeaw Wellness เป็นแพลตฟอร์มด้าน biometric wellness, biofeedback, และ aura visualization สำหรับงานสาธิต งานวิจัย งานพัฒนาเชิงผลิตภัณฑ์ และการต่อยอดเชิงพาณิชย์ โดยรวมทั้งส่วนประมวลผลสัญญาณ, หน้าแสดงผล, ชุดคู่มือ, และ asset ประกอบการใช้งานไว้ใน repository เดียว

## คู่มือการใช้งาน

คู่มือ HTML:

- [manual_package/Nuengdeaw_Wellness_Manual.html](./manual_package/Nuengdeaw_Wellness_Manual.html)

คู่มือ Markdown:

- [คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md](./คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md)

## เริ่มต้นใช้งาน

สำหรับการทดลองใช้งานเบื้องต้น สามารถเปิดไฟล์ต่อไปนี้ผ่าน browser ได้โดยตรง:

- [Nuengdeaw_Wellness.html](./Nuengdeaw_Wellness.html)

สำหรับสถาปัตยกรรมรุ่นใหม่และ release candidate:

- [wellness-v1_1/README.md](./wellness-v1_1/README.md)

หมายเหตุ:
- ในค่าตั้งต้นปัจจุบัน ระบบหลักยังตั้งอุปกรณ์ไว้เป็น `mock` สำหรับการทดลองและสาธิต
- หากต้องการใช้งานร่วมกับอุปกรณ์จริง ต้องปรับชนิดอุปกรณ์และ connector ให้ตรงกับ hardware ที่ใช้

## โครงสร้างโปรเจกต์

```text
Nuengdeaw-Wellness/
|- Nuengdeaw_Wellness.html                     หน้าเว็บหลักของระบบ
|- NuengdeawWellnessCore.js                    แกนประมวลผลและประเมินผล
|- NuengdeawInput.js                           ชั้นรับข้อมูลจาก simulation / wearable
|- NuengdeawAura.js                            ส่วนแสดงผล Assessment
|- NuengdeawBaseline.js                        จัดการ baseline ส่วนบุคคล
|- NuengdeawClinicStandard.js                  เกณฑ์มาตรฐานสำหรับงานคลินิก
|- NuengdeawProfileResolver.js                 จัดการ profile mode และ threshold
|- NuengdeawStore.js                           เก็บประวัติ scan และ export CSV
|- NuengdeawDevTools.js                        เครื่องมือช่วยตรวจ artifact / debug
|- Nuengdeaw_Sim_Human1.js                     ชุดจำลองสัญญาณมนุษย์
|- Nuengdeaw_Sim_Human2.js                     ชุดจำลองสัญญาณมนุษย์เพิ่มเติม
|- phasa-tawan-foundation.json                 ข้อมูล foundation ที่เกี่ยวข้องกับระบบ
|- manual_assets/                              ภาพประกอบหน้าจอ
|- manual_package/                             ชุดคู่มือ HTML พร้อม asset
|- tools/                                      สคริปต์สนับสนุน
|- wellness-v1_1/                              สถาปัตยกรรมรุ่นใหม่แบบ Svelte 5 + Vite
|- COMMERCIAL_LICENSE.md                       แนวทางสิทธิ์ใช้งานเชิงพาณิชย์
|- SALES_OVERVIEW.md                           เอกสารภาพรวมการนำเสนอเชิงพาณิชย์
\- คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md   คู่มือฉบับ Markdown
```

## องค์ประกอบหลักของระบบ

- `Sim Mode` สำหรับทดลองและสาธิตการทำงานโดยไม่ต้องใช้อุปกรณ์จริง
- `Wearable Mode` สำหรับเชื่อมต่ออุปกรณ์จริง เช่น Polar, Empatica, Muse หรืออุปกรณ์ที่พัฒนา connector เพิ่มเติม
- `Personal Profile` สำหรับการใช้งานที่อิง baseline ส่วนบุคคล
- `Clinic Profile` สำหรับการใช้งานในรูปแบบมาตรฐานคลินิก พร้อมความสามารถด้าน report และ handoff
- `wellness-v1_1` สำหรับสถาปัตยกรรมรุ่นใหม่ที่รองรับ diagnostics, replay/export, telemetry, และ handoff viewer

## การใช้งานและสิทธิ์เชิงพาณิชย์

Repository นี้เปิดให้:

- ทดลองใช้งาน
- ศึกษาโค้ด
- สาธิตระบบ
- ประเมินความเหมาะสมก่อนซื้อหรือร่วมพัฒนา
- เจรจาเพื่อนำไปใช้งานเชิงพาณิชย์

การใช้งานเชิงพาณิชย์, การขายต่อ, การให้บริการลูกค้า, การติดตั้งในองค์กร, หรือการดัดแปลงเพื่อใช้งานทางธุรกิจ จะต้องอยู่ภายใต้ข้อตกลงเชิงพาณิชย์จาก TAWAN

รายละเอียดเพิ่มเติม:

- [COMMERCIAL_LICENSE.md](./COMMERCIAL_LICENSE.md)
- [SALES_OVERVIEW.md](./SALES_OVERVIEW.md)

## โมเดลการขายที่รองรับ

Nuengdeaw Wellness สามารถนำเสนอเชิงพาณิชย์ได้หลายรูปแบบ เช่น:

- One-time source code license
- White-label / branded deployment
- Installation and customization service
- Support and maintenance agreement
- SaaS / hosted deployment ในอนาคต

## ติดต่อ TAWAN

สำหรับการสั่งซื้อ การขอใช้งานเชิงพาณิชย์ การติดตั้ง การปรับแต่ง หรือการใช้งานในองค์กร กรุณาติดต่อ:

- Tawan
- Email: sanomaiarch@gmail.com
- Phone: 0824175565
- Additional contact: pcskla

หากต้องการใบเสนอราคา, demo, proposal, หรือเงื่อนไข license กรุณาติดต่อโดยตรง

## หมายเหตุสำคัญ

โครงการนี้เป็นแพลตฟอร์มและต้นแบบเชิงระบบ ไม่ใช่อุปกรณ์วินิจฉัยทางการแพทย์โดยตรง การนำผลไปใช้งานจริงควรอยู่ภายใต้การพิจารณาของผู้เชี่ยวชาญที่เกี่ยวข้อง และภายใต้ข้อกำหนดทางกฎหมายหรือมาตรฐานของหน่วยงานที่นำไปใช้งาน