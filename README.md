# Nuengdeaw Wellness

Nuengdeaw Wellness เป็นชุดระบบต้นแบบสำหรับติดตามสัญญาณชีวภาพและประเมินภาวะผู้ใช้งานผ่านหน้าเว็บ โดยรวมทั้งส่วนประมวลผลสัญญาณ, หน้าแสดงผล, ชุดคู่มือ, และ asset ประกอบการใช้งานไว้ใน repository เดียว

## คู่มือการใช้งาน

เปิดอ่านคู่มือ HTML ได้ที่:

- [manual_package/Nuengdeaw_Wellness_Manual.html](./manual_package/Nuengdeaw_Wellness_Manual.html)

คู่มือ Markdown:

- [คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md](./คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md)

## เริ่มต้นใช้งาน

สำหรับการทดลองใช้งานเบื้องต้น สามารถเปิดไฟล์ต่อไปนี้ผ่าน browser ได้โดยตรง:

- [Nuengdeaw_Wellness.html](./Nuengdeaw_Wellness.html)

หมายเหตุ:
- ในค่าตั้งต้นปัจจุบัน ระบบยังตั้งอุปกรณ์ไว้เป็น `mock` สำหรับการทดลองและสาธิต
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
|  |- Nuengdeaw_Wellness_Manual.html           คู่มือ HTML
|  \- assets/                                 รูปภาพประกอบในคู่มือ
|- tools/
|  \- capture_wellness_screens.ps1            สคริปต์สร้างภาพหน้าจอประกอบ
\- คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md   คู่มือฉบับ Markdown
```

## องค์ประกอบหลักของระบบ

- `Sim Mode` สำหรับทดลองและสาธิตการทำงานโดยไม่ต้องใช้อุปกรณ์จริง
- `Wearable Mode` สำหรับเชื่อมต่ออุปกรณ์จริง เช่น Polar, Empatica, Muse หรืออุปกรณ์ที่พัฒนา connector เพิ่มเติม
- `Personal Profile` สำหรับการใช้งานที่อิง baseline ส่วนบุคคล
- `Clinic Profile` สำหรับการใช้งานในรูปแบบมาตรฐานคลินิก พร้อมความสามารถด้าน report และ handoff

## การใช้งานที่อนุญาต

อนุญาตให้ใช้ repository นี้เพื่อ:

- ทดลองใช้งาน
- ศึกษาโค้ด
- สาธิตแนวคิดของระบบ
- ใช้ประกอบการพัฒนาและทดสอบภายใน

## ข้อจำกัดการใช้งาน

ห้ามนำไปใช้เชิงพาณิชย์โดยไม่ได้รับอนุญาต

หากต้องการ:

- ใช้งานเชิงพาณิชย์
- นำไปขายต่อ
- นำไปให้บริการลูกค้า
- นำไปดัดแปลงเพื่อใช้งานทางธุรกิจ

กรุณาติดต่อ TAWAN ก่อนทุกกรณี

## ติดต่อ TAWAN

สำหรับการขออนุญาตใช้งานเชิงพาณิชย์ การร่วมพัฒนา หรือการใช้งานในองค์กร กรุณาติดต่อ TAWAN โดยตรง

สามารถปรับส่วนนี้เพิ่มเติมในภายหลังเพื่อใส่:

- ชื่อผู้ติดต่อ
- อีเมล
- เบอร์โทรศัพท์
- Line / เว็บไซต์ / ช่องทางทางการอื่น

## หมายเหตุสำคัญ

โครงการนี้เป็นต้นแบบและเอกสารประกอบระบบ ไม่ใช่อุปกรณ์วินิจฉัยทางการแพทย์โดยตรง การนำผลไปใช้งานจริงควรอยู่ภายใต้การพิจารณาของผู้เชี่ยวชาญที่เกี่ยวข้อง
