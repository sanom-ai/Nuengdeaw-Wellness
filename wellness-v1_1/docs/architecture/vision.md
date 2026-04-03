# Living Bio-Aura System Vision

Nuengdeaw Wellness v1.1 จะไม่ถูกมองเป็น dashboard ธรรมดาอีกต่อไป แต่จะเป็นระบบที่ตีความ biosignal เป็นสนามพลังงานเชิงความหมาย และแสดงผลออกมาเป็น aura, trace, และ layered reasoning ที่ผู้ใช้และผู้ดูแลเข้าใจได้

## Design Thesis

- Dashboard ต้องรู้สึกเหมือนสิ่งมีชีวิต ไม่ใช่เพียงหน้าจอแสดงตัวเลข
- Real-time signal flow ต้องถูก model เป็น stream ไม่ใช่ callback กระจัดกระจาย
- Assessment ต้องอธิบายได้ว่าทำไมถึงได้ผลแบบนั้น
- Thai / TAWAN spirit ต้องอยู่ใน visual language ไม่ใช่แค่ข้อความบนหัวจอ

## PR-2 Evolution

ในรอบนี้ระบบเริ่มมีองค์ประกอบที่ทำให้ architecture มี "ชีวิต":

- Aura field ถูก render แบบต่อเนื่องด้วย canvas
- State หลักถูกขับด้วย BioStream-aware orchestration
- Explainability panel แสดงทั้ง rationale, layer trace และ live event feed
- Signal mesh ถูก map จากหลายชั้นของระบบ ไม่ใช่แค่ metric cards
