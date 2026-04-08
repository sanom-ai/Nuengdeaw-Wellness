# Nuengdeaw Wellness

[![Commercial Inquiry Available](https://img.shields.io/badge/Commercial-Inquiry%20Available-0f766e?style=for-the-badge)](mailto:sanomaiarch@gmail.com)
[![Release](https://img.shields.io/badge/Release-v1.1.0--rc1-1d4ed8?style=for-the-badge)](https://github.com/sanom-ai/Nuengdeaw-Wellness/releases/tag/v1.1.0-rc1)
[![Contact TAWAN](https://img.shields.io/badge/Contact-TAWAN-f59e0b?style=for-the-badge)](mailto:sanomaiarch@gmail.com)

Nuengdeaw Wellness is a biometric wellness, biofeedback, and aura visualization platform designed for demonstration, research workflows, commercialization, and future wearable-connected deployment.

ระบบนี้รวมทั้งส่วนประมวลผลสัญญาณชีวภาพ, การแสดงผลแบบ aura, diagnostics สำหรับงานวิจัย, replay/export workflow, คู่มือการใช้งาน, และสถาปัตยกรรมรุ่นใหม่สำหรับการต่อยอดเชิงผลิตภัณฑ์ไว้ใน repository เดียว

## Why Nuengdeaw Wellness

- มีเอกลักษณ์ด้าน `aura visualization` และ `bio-aura` presentation layer
- รองรับ `simulation`, `diagnostics`, `export`, `replay`, และ `handoff workflow`
- มีเส้นทางต่อยอดสู่ `wearable integration` และ deployment เชิงองค์กร
- มีสถาปัตยกรรม `wellness-v1_1` ที่ทันสมัยและพร้อมขยายต่อ
- เหมาะสำหรับทั้งการสาธิต, proof of concept, งานวิจัย, และการใช้งานเชิงพาณิชย์

## Use Cases

Nuengdeaw Wellness เหมาะสำหรับงานประเภทต่อไปนี้:

- คลินิกหรือศูนย์สุขภาพที่ต้องการระบบแสดงผล biofeedback เชิงภาพ
- wellness studio หรือผู้ให้บริการด้าน self-regulation / relaxation / performance support
- ทีมวิจัยที่ต้องการ raw signal diagnostics, replay, และ handoff workflow
- องค์กรที่ต้องการ white-label wellness platform
- ทีมผลิตภัณฑ์ที่ต้องการใช้เป็นฐานสำหรับสร้างระบบ biometric experience ใหม่

## What Is Included

ภายใน repository นี้มี:

- ระบบเว็บรุ่นปัจจุบันบน `HTML + JavaScript`
- ชุดคู่มือ HTML และ Markdown
- ภาพประกอบหน้าจอและเครื่องมือช่วยเตรียมเอกสาร
- โค้ดสำหรับ simulation, baseline, clinic logic, profile resolver, และ aura display
- โฟลเดอร์ `wellness-v1_1` สำหรับสถาปัตยกรรมรุ่นใหม่แบบ `Svelte 5 + Vite`

## Commercial Options

Nuengdeaw Wellness สามารถนำเสนอเชิงพาณิชย์ได้หลายรูปแบบ เช่น:

- `One-time source code license`
- `White-label deployment`
- `Installation and customization service`
- `Support and maintenance agreement`
- `Future SaaS / hosted deployment`

## Starting Price Guide

ราคาเริ่มต้นแนะนำสำหรับการขายเชิงพาณิชย์:

- `Pilot / Demo Package` เริ่มต้น `149,000 บาท`
- `Commercial Source Code License` เริ่มต้น `490,000 บาท`
- `White-label / Custom Deployment` เริ่มต้น `790,000 บาท`
- `Annual Support / Maintenance` เริ่มต้น `15% ต่อปี` ของมูลค่างาน
- `Wearable Integration` เริ่มต้น `120,000 บาท` ต่ออุปกรณ์

หมายเหตุ:
- ราคาจริงขึ้นอยู่กับขอบเขตงาน, ระดับการปรับแต่ง, deployment model, และ integration ที่ลูกค้าต้องการ
- สำหรับโปรเจกต์องค์กรหรือ white-label เต็มรูปแบบ แนะนำให้ใช้วิธีเสนอราคาเป็นกรณี

รายละเอียดเพิ่มเติม:

- [COMMERCIAL_LICENSE.md](./COMMERCIAL_LICENSE.md)
- [SALES_OVERVIEW.md](./SALES_OVERVIEW.md)
- [PRICING_QUOTATION_TEMPLATE.md](./PRICING_QUOTATION_TEMPLATE.md)
- [ONE_PAGE_PROPOSAL.md](./ONE_PAGE_PROPOSAL.md)

## Quick Start

สำหรับการทดลองใช้งานเบื้องต้น:

- [Nuengdeaw_Wellness.html](./Nuengdeaw_Wellness.html)

สำหรับสถาปัตยกรรมรุ่นใหม่และ release candidate:

- [wellness-v1_1/README.md](./wellness-v1_1/README.md)

คู่มือการใช้งาน:

- [manual_package/Nuengdeaw_Wellness_Manual.html](./manual_package/Nuengdeaw_Wellness_Manual.html)
- [คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md](./คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md)

หมายเหตุ:
- ค่าตั้งต้นปัจจุบันของระบบหลักยังใช้ `mock` สำหรับการทดลองและสาธิต
- หากต้องการใช้งานร่วมกับอุปกรณ์จริง ต้องปรับชนิดอุปกรณ์และ connector ให้ตรงกับ hardware ที่ใช้

## Project Structure

```text
Nuengdeaw-Wellness/
|- Nuengdeaw_Wellness.html
|- NuengdeawWellnessCore.js
|- NuengdeawInput.js
|- NuengdeawAura.js
|- NuengdeawBaseline.js
|- NuengdeawClinicStandard.js
|- NuengdeawProfileResolver.js
|- NuengdeawStore.js
|- NuengdeawDevTools.js
|- Nuengdeaw_Sim_Human1.js
|- Nuengdeaw_Sim_Human2.js
|- phasa-tawan-foundation.json
|- manual_assets/
|- manual_package/
|- tools/
|- wellness-v1_1/
|- COMMERCIAL_LICENSE.md
|- SALES_OVERVIEW.md
|- PRICING_QUOTATION_TEMPLATE.md
|- ONE_PAGE_PROPOSAL.md
\- คู่มือระบบ_Nuengdeaw_Wellness_Monitor.md
```

## Buying Readiness

Repository นี้เปิดให้:

- ทดลองใช้งาน
- ศึกษาโค้ด
- ประเมินความเหมาะสมก่อนซื้อ
- ใช้เป็น technical showcase ระหว่างการเจรจา
- ติดต่อเพื่อขอ demo, proposal, quotation, และ commercial agreement

การใช้งานเชิงพาณิชย์, การขายต่อ, การให้บริการลูกค้า, การติดตั้งในองค์กร, หรือการดัดแปลงเพื่อใช้ทางธุรกิจ จะต้องอยู่ภายใต้ข้อตกลงเชิงพาณิชย์จาก TAWAN

## Contact TAWAN

สำหรับการสั่งซื้อ การขอใช้งานเชิงพาณิชย์ การติดตั้ง การปรับแต่ง หรือการใช้งานในองค์กร กรุณาติดต่อ:

- Tawan
- Email: sanomaiarch@gmail.com
- Phone: 0824175565
- Additional contact: pcskla

หากต้องการใบเสนอราคา, demo, proposal, หรือเงื่อนไข license กรุณาติดต่อโดยตรง

## Important Note

โครงการนี้เป็นแพลตฟอร์มและต้นแบบเชิงระบบ ไม่ใช่อุปกรณ์วินิจฉัยทางการแพทย์โดยตรง การนำผลไปใช้งานจริงควรอยู่ภายใต้การพิจารณาของผู้เชี่ยวชาญที่เกี่ยวข้อง และภายใต้ข้อกำหนดทางกฎหมายหรือมาตรฐานของหน่วยงานที่นำไปใช้งาน